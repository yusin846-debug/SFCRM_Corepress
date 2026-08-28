"""Generate CorePress demo knowledge PDFs from Product2 records in Salesforce.

The output is intentionally demo-only. Product2 fields are treated as confirmed
facts; all explanatory troubleshooting content is clearly labelled as fictional.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


DISCLAIMER = (
    "교육·시연용 가상 정보입니다. 실제 제조사 매뉴얼, 안전 절차 또는 현장 정비 지침이 아닙니다. "
    "고압·고온·전기·회전체 작업은 장비를 임의로 분해하지 말고 자격을 갖춘 CorePress 기술 담당자에게 문의하십시오."
)
TOPICS = (
    ("01_overview_specs", "제품 개요 및 사양"),
    ("02_install_operation", "설치 및 운영 안내"),
    ("03_troubleshooting", "오류 코드 및 문제 해결"),
    ("04_parts_maintenance", "부품 및 예방정비"),
    ("05_service_support", "서비스 및 상담 안내"),
)


@dataclass(frozen=True)
class Product:
    id: str
    name: str
    code: str
    family: str
    description: str
    expected_life: float | None
    overhaul_hours: float | None
    consumable: bool

    @property
    def prefix(self) -> str:
        return self.code.split("-", 1)[0]


def cli_json(command: list[str]) -> dict:
    completed = subprocess.run(command, check=True, capture_output=True, text=True, encoding="utf-8")
    return json.loads(completed.stdout)


def fetch_products(target_org: str) -> list[Product]:
    query = (
        "SELECT Id, Name, ProductCode, Family, Description, Expected_Life_Years__c, "
        "Overhaul_Interval_Hours__c, Is_Consumable__c FROM Product2 WHERE IsActive = true ORDER BY Name"
    )
    payload = cli_json(["sf", "data", "query", "--target-org", target_org, "--query", query, "--json"])
    result = []
    for row in payload["result"]["records"]:
        name = row.get("Name") or ""
        code = row.get("ProductCode") or ""
        if re.search(r"(^|[_ -])test([_ -]|$)|MOB", f"{name} {code}", re.IGNORECASE):
            continue
        result.append(
            Product(
                id=row["Id"],
                name=name,
                code=code,
                family=row.get("Family") or "미분류",
                description=row.get("Description") or "등록된 설명 없음",
                expected_life=row.get("Expected_Life_Years__c"),
                overhaul_hours=row.get("Overhaul_Interval_Hours__c"),
                consumable=bool(row.get("Is_Consumable__c")),
            )
        )
    return result


def equipment_products(products: Iterable[Product]) -> list[Product]:
    equipment = []
    for product in products:
        if product.family == "압축기" and product.code.endswith(("-PKG", "-STD")):
            equipment.append(product)
        elif product.family == "드라이어" and re.fullmatch(r"CD\d+-(HL|BP|HOC|DP)", product.code):
            equipment.append(product)
    return sorted(equipment, key=lambda item: item.name)


def related_products(equipment: Product, products: Iterable[Product]) -> tuple[list[Product], list[Product]]:
    related = [item for item in products if item.id != equipment.id and item.code.startswith(equipment.prefix + "-")]
    parts = [item for item in related if item.family in {"필터·부품", "드라이어"} and item.family != "서비스"]
    services = [item for item in related if item.family == "서비스"]
    return parts, services


def register_font() -> str:
    candidates = (
        Path("C:/Windows/Fonts/malgun.ttf"),
        Path("C:/Windows/Fonts/NotoSansKR-Regular.ttf"),
    )
    for candidate in candidates:
        if candidate.exists():
            pdfmetrics.registerFont(TTFont("CorePressKorean", str(candidate)))
            bold = Path("C:/Windows/Fonts/malgunbd.ttf")
            if bold.exists():
                pdfmetrics.registerFont(TTFont("CorePressKoreanBold", str(bold)))
            else:
                pdfmetrics.registerFont(TTFont("CorePressKoreanBold", str(candidate)))
            return "CorePressKorean"
    raise RuntimeError("Korean TrueType font not found")


def styles(font: str) -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("TitleKR", parent=base["Title"], fontName="CorePressKoreanBold", fontSize=21, leading=28, textColor=colors.HexColor("#123B5D"), alignment=TA_CENTER, spaceAfter=10 * mm),
        "h1": ParagraphStyle("H1KR", parent=base["Heading1"], fontName="CorePressKoreanBold", fontSize=14, leading=19, textColor=colors.HexColor("#0B6E75"), spaceBefore=5 * mm, spaceAfter=2.5 * mm),
        "body": ParagraphStyle("BodyKR", parent=base["BodyText"], fontName=font, fontSize=9.5, leading=15, textColor=colors.HexColor("#243746"), spaceAfter=2.5 * mm),
        "small": ParagraphStyle("SmallKR", parent=base["BodyText"], fontName=font, fontSize=8, leading=12, textColor=colors.HexColor("#526575")),
        "warning": ParagraphStyle("WarningKR", parent=base["BodyText"], fontName=font, fontSize=8.5, leading=13, textColor=colors.HexColor("#7A3E00"), backColor=colors.HexColor("#FFF4DE"), borderColor=colors.HexColor("#E6A23C"), borderWidth=0.6, borderPadding=7, spaceAfter=5 * mm),
    }


def esc(value: object) -> str:
    return str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def bullet_list(items: Iterable[str], style: ParagraphStyle) -> list[Paragraph]:
    return [Paragraph(f"• {esc(item)}", style) for item in items]


def fact_table(equipment: Product, st: dict[str, ParagraphStyle]) -> Table:
    rows = [
        ["모델명", equipment.name],
        ["Product Code", equipment.code],
        ["제품군", equipment.family],
        ["Product 설명", equipment.description],
        ["예상 수명", f"{equipment.expected_life:g}년" if equipment.expected_life is not None else "Product에 등록되지 않음"],
        ["오버홀 주기", f"{equipment.overhaul_hours:g}시간" if equipment.overhaul_hours is not None else "Product에 등록되지 않음"],
    ]
    table = Table([[Paragraph(f"<b>{esc(k)}</b>", st["body"]), Paragraph(esc(v), st["body"])] for k, v in rows], colWidths=[34 * mm, 126 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E8F3F5")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B9CBD2")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def topic_story(topic_key: str, equipment: Product, parts: list[Product], services: list[Product], st: dict[str, ParagraphStyle]) -> list:
    story: list = [Paragraph(DISCLAIMER, st["warning"])]
    if topic_key == "01_overview_specs":
        story += [Paragraph("확정 정보", st["h1"]), fact_table(equipment, st)]
        story += [Paragraph("문의 응답 원칙", st["h1"])]
        story += bullet_list([
            "용량, 출력, 압력, 크기 등 수치는 위 Product 설명에 명시된 값만 그대로 안내합니다.",
            "Product에 없는 수치나 옵션은 추정하지 않고 기술 담당자 확인이 필요하다고 답합니다.",
            f"검색 별칭: {equipment.name}, {equipment.code}, {equipment.prefix}",
        ], st["body"])
    elif topic_key == "02_install_operation":
        story += [Paragraph("설치 전 확인 - 데모 가정", st["h1"])]
        story += bullet_list([
            "명판의 모델명과 Product Code가 주문·Asset 정보와 일치하는지 확인합니다.",
            "설치 공간, 환기, 배관·전원 조건은 승인된 프로젝트 도면과 현장 안전 기준으로 확인합니다.",
            "운전 전 보호장치와 비상 정지 기능은 자격을 갖춘 담당자가 점검합니다.",
        ], st["body"])
        story += [Paragraph("운영 중 확인 - 데모 가정", st["h1"])]
        story += bullet_list([
            "압력, 온도, 진동 추세가 평상시 범위를 벗어나는지 모니터링합니다.",
            "비정상 소음·냄새·누유 또는 반복 알람이 있으면 운전을 임의로 지속하지 않습니다.",
            "정확한 기동·정지 순서는 실제 현장 절차서와 제조사 승인 자료를 따릅니다.",
        ], st["body"])
    elif topic_key == "03_troubleshooting":
        codes = [
            ("AIR-101", "흡입 공기 흐름 점검 필요", "외부 흡입구 막힘과 필터 상태를 육안 확인하고, 분해하지 말고 서비스 담당자에게 문의합니다."),
            ("TMP-201", "온도 추세 이상", "환기 상태와 표시값을 확인하고, 고온부에 접촉하지 않은 채 기술 지원을 요청합니다."),
            ("PRS-301", "압력 추세 이상", "표시값과 발생 시점을 기록하고, 압력 계통을 임의 조절하거나 분해하지 않습니다."),
            ("VIB-401", "진동 또는 비정상 소음", "운전 조건과 발생 시점을 기록하고, 반복되면 안전 절차에 따라 정지 후 점검을 요청합니다."),
            (("DRY-501" if equipment.family == "드라이어" else "MTR-501"), ("노점 성능 확인 필요" if equipment.family == "드라이어" else "모터 상태 확인 필요"), "알람 화면과 운전 이력을 보존하고 자격을 갖춘 기술 담당자에게 전달합니다."),
            ("SYS-901", "제어 또는 통신 상태 확인", "표시 메시지와 시간을 기록하고, 승인되지 않은 초기화·펌웨어 변경은 수행하지 않습니다."),
        ]
        story += [Paragraph("PoC용 가상 오류 코드", st["h1"])]
        rows = [[Paragraph("코드", st["small"]), Paragraph("의미", st["small"]), Paragraph("안전한 1차 대응", st["small"])]]
        rows += [[Paragraph(esc(code), st["small"]), Paragraph(esc(label), st["small"]), Paragraph(esc(action), st["small"])] for code, label, action in codes]
        table = Table(rows, colWidths=[22 * mm, 45 * mm, 93 * mm], repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#123B5D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B9CBD2")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F8FA")]),
            ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(table)
    elif topic_key == "04_parts_maintenance":
        story += [Paragraph("등록된 관련 부품", st["h1"])]
        if parts:
            story += bullet_list([f"{item.name} ({item.code}) - {item.description}" for item in parts], st["body"])
        else:
            story.append(Paragraph("현재 Product에서 이 모델 전용 부품을 확인할 수 없습니다.", st["body"]))
        story += [Paragraph("예방정비 원칙 - 데모 가정", st["h1"])]
        story += bullet_list([
            "부품 호환성은 모델명만으로 단정하지 않고 Product Code와 Asset 정보를 함께 확인합니다.",
            "교체 주기는 Product에 등록된 값 또는 승인된 서비스 계획만 안내합니다.",
            "소모품 상태, 운전시간, 최근 서비스 이력을 함께 확인한 뒤 정비를 요청합니다.",
        ], st["body"])
    elif topic_key == "05_service_support":
        story += [Paragraph("등록된 서비스", st["h1"])]
        if services:
            story += bullet_list([f"{item.name} ({item.code}) - {item.description}" for item in services], st["body"])
        else:
            story.append(Paragraph("현재 Product에서 이 모델 전용 서비스를 확인할 수 없습니다. 일반 상담으로 연결합니다.", st["body"]))
        story += [Paragraph("상담 시 준비 정보", st["h1"])]
        story += bullet_list([
            f"장비 모델: {equipment.name} / Product Code: {equipment.code}",
            "Asset 시리얼 번호와 설치 위치",
            "발생 시각, 운전 조건, 표시된 알람 또는 증상",
            "최근 정비일과 교체한 부품",
        ], st["body"])
        story += [Paragraph("에스컬레이션 기준", st["h1"])]
        story += bullet_list([
            "자료에 근거가 없거나 장비 식별이 불확실하면 추론하지 않고 상담원 연결을 제안합니다.",
            "안전 위험, 반복 정지, 심한 진동·과열·누출 징후는 즉시 전문 기술 지원 대상으로 분류합니다.",
        ], st["body"])
    return story


def build_pdf(path: Path, equipment: Product, topic_key: str, topic_label: str, parts: list[Product], services: list[Product], st: dict[str, ParagraphStyle]) -> None:
    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("CorePressKorean", 7.5)
        canvas.setFillColor(colors.HexColor("#6B7C89"))
        canvas.drawString(20 * mm, 12 * mm, f"CorePress Product 기반 데모 지식 | 기준일 {date.today().isoformat()}")
        canvas.drawRightString(190 * mm, 12 * mm, f"{doc.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=20 * mm, leftMargin=20 * mm, topMargin=18 * mm, bottomMargin=20 * mm, title=f"{equipment.name} - {topic_label}", author="CorePress Demo Team")
    story = [
        Paragraph("COREPRESS DEMO KNOWLEDGE", st["small"]),
        Spacer(1, 2 * mm),
        Paragraph(f"{esc(equipment.name)}<br/><font size='13'>{esc(topic_label)}</font>", st["title"]),
        Paragraph(f"모델 별칭: {esc(equipment.name)} · {esc(equipment.code)} · {esc(equipment.prefix)}", st["small"]),
        Spacer(1, 5 * mm),
    ]
    story.extend(topic_story(topic_key, equipment, parts, services, st))
    story += [Spacer(1, 8 * mm), Paragraph("정보 출처: Salesforce Product2 레코드와 CorePress 팀 프로젝트용 데모 가정", st["small"])]
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target-org", default="trail-org")
    parser.add_argument("--output-dir", default="output/pdf/agentforce-demo-knowledge")
    parser.add_argument("--snapshot", default="output/knowledge/corepress-product-snapshot.json")
    args = parser.parse_args()

    products = fetch_products(args.target_org)
    equipment = equipment_products(products)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    snapshot = Path(args.snapshot)
    snapshot.parent.mkdir(parents=True, exist_ok=True)
    snapshot.write_text(json.dumps([item.__dict__ for item in products], ensure_ascii=False, indent=2), encoding="utf-8")

    font = register_font()
    st = styles(font)
    manifest = []
    for item in equipment:
        parts, services = related_products(item, products)
        safe_model = re.sub(r"[^A-Za-z0-9]+", "_", item.name).strip("_")
        for topic_key, topic_label in TOPICS:
            path = output_dir / f"{safe_model}__{topic_key}.pdf"
            build_pdf(path, item, topic_key, topic_label, parts, services, st)
            manifest.append({"file": path.name, "model": item.name, "productCode": item.code, "topic": topic_label, "parts": len(parts), "services": len(services)})

    (output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"products": len(products), "equipment": len(equipment), "pdfs": len(manifest), "outputDir": str(output_dir)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
