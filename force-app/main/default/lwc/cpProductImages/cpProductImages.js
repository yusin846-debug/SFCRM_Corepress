// Shared product-image resolver used by cpProductList and cpProductDetail.
// Given a Product2 name it picks the best matching static resource, in order:
//   1) Exact-name match on real compressor/dryer body photos
//   2) Keyword match on part name (Motor, Bearing, Filter, Gasket, …)
//   3) Family fallback (compressor → impeller silhouette)
//   4) null → caller renders a gradient placeholder

import cp100Pro from "@salesforce/resourceUrl/CorePressCP100Pro";
import cp2100Body from "@salesforce/resourceUrl/CorePressCP2100Body";
import cp3000 from "@salesforce/resourceUrl/CorePressCP3000";
import cp3100Pro from "@salesforce/resourceUrl/CorePressCP3100Pro";
import cp4000 from "@salesforce/resourceUrl/CorePressCP4000";
import cp4100Pro from "@salesforce/resourceUrl/CorePressCP4100Pro";
import cp5000 from "@salesforce/resourceUrl/CorePressCP5000";
import cp5100Pro from "@salesforce/resourceUrl/CorePressCP5100Pro";
import cp6000Body from "@salesforce/resourceUrl/CorePressCP6000Body";
import cp6100Pro from "@salesforce/resourceUrl/CorePressCP6100Pro";
import cp7100Pro from "@salesforce/resourceUrl/CorePressCP7100ProBody";
import cp7100Plus from "@salesforce/resourceUrl/CorePressCP7100PlusBody";
import cpa2100 from "@salesforce/resourceUrl/CorePressCPA2100";
import cpa3100 from "@salesforce/resourceUrl/CorePressCPA3100";
import cd7000Body from "@salesforce/resourceUrl/CorePressCD7000Body";

import partImpeller from "@salesforce/resourceUrl/CorePressPartImpeller";
import partGearbox from "@salesforce/resourceUrl/CorePressPartGearbox";
import partMotor from "@salesforce/resourceUrl/CorePressPartMotor";
import partBearing from "@salesforce/resourceUrl/CorePressPartBearing";
import partCooler from "@salesforce/resourceUrl/CorePressPartCooler";
import partSeal from "@salesforce/resourceUrl/CorePressPartSeal";
import partValve from "@salesforce/resourceUrl/CorePressPartValve";
import partSensor from "@salesforce/resourceUrl/CorePressPartSensor";
import partOilFilter from "@salesforce/resourceUrl/CorePressPartOilFilter";
import partAirFilter from "@salesforce/resourceUrl/CorePressPartAirFilter";
import partSeparator from "@salesforce/resourceUrl/CorePressPartSeparator";
import partOil from "@salesforce/resourceUrl/CorePressPartOil";
import partGasketOring from "@salesforce/resourceUrl/CorePressPartGasketOring";
import partBelt from "@salesforce/resourceUrl/CorePressPartBelt";
import partBolt from "@salesforce/resourceUrl/CorePressPartBolt";
import partGrease from "@salesforce/resourceUrl/CorePressPartGrease";
import partDiagKit from "@salesforce/resourceUrl/CorePressPartDiagKit";
import partHMI from "@salesforce/resourceUrl/CorePressPartHMI";
import partControlPanel from "@salesforce/resourceUrl/CorePressPartControlPanel";
import partHose from "@salesforce/resourceUrl/CorePressPartHose";
import partVibrationPad from "@salesforce/resourceUrl/CorePressPartVibrationPad";
import partFlexJoint from "@salesforce/resourceUrl/CorePressPartFlexJoint";
import partPressureGauge from "@salesforce/resourceUrl/CorePressPartPressureGauge";
import partCheckValve from "@salesforce/resourceUrl/CorePressPartCheckValve";

const BODY_BY_MODEL = {
  CP100: cp100Pro,
  "CP100 PRO": cp100Pro,
  CP2100: cp2100Body,
  CP3000: cp3000,
  "CP3100 PRO": cp3100Pro,
  CP4000: cp4000,
  "CP4100 PRO": cp4100Pro,
  CP5000: cp5000,
  "CP5100 PRO": cp5100Pro,
  CP6000: cp6000Body,
  "CP6100 PRO": cp6100Pro,
  CD7000: cd7000Body,
  "CP7100 PRO": cp7100Pro,
  "CP7100+": cp7100Plus,
  CPA2100: cpa2100,
  CPA3100: cpa3100
};

const PART_RULES = [
  { match: (n) => /Vibration Sensor/i.test(n), src: partSensor },
  { match: (n) => /Vibration Pad|진동 패드/i.test(n), src: partVibrationPad },
  { match: (n) => /Motor/i.test(n), src: partMotor },
  { match: (n) => /Tilting Pad Bearing|Bearing/i.test(n), src: partBearing },
  { match: (n) => /Shaft Seal|Seal Kit|Seal/i.test(n), src: partSeal },
  { match: (n) => /Shaft/i.test(n), src: partGearbox },
  {
    match: (n) => /Gearbox|Gear/i.test(n) && /Filter/i.test(n),
    src: partOilFilter
  },
  { match: (n) => /Gearbox|Gear/i.test(n), src: partGearbox },
  { match: (n) => /Oil Filter/i.test(n), src: partOilFilter },
  { match: (n) => /Inlet Air Filter|Air Filter/i.test(n), src: partAirFilter },
  {
    match: (n) => /After-Filter|Pre-Filter|Filter Element/i.test(n),
    src: partAirFilter
  },
  { match: (n) => /Desiccant/i.test(n), src: partSeparator },
  { match: (n) => /Separator|세퍼레이터/i.test(n), src: partSeparator },
  { match: (n) => /Gasket|O-Ring|오링|가스켓/i.test(n), src: partGasketOring },
  { match: (n) => /Switching Valve/i.test(n), src: partValve },
  { match: (n) => /Check Valve|체크\s*밸브/i.test(n), src: partCheckValve },
  { match: (n) => /Valve|밸브/i.test(n), src: partValve },
  { match: (n) => /Impeller|임펠러/i.test(n), src: partImpeller },
  { match: (n) => /Cooler|쿨러|열교환/i.test(n), src: partCooler },
  { match: (n) => /Belt|벨트/i.test(n), src: partBelt },
  { match: (n) => /Bolt|Nut|볼트|너트/i.test(n), src: partBolt },
  { match: (n) => /Grease|그리스/i.test(n), src: partGrease },
  { match: (n) => /Oil\b|오일/i.test(n), src: partOil },
  { match: (n) => /Hose|Pipe|호스|배관/i.test(n), src: partHose },
  { match: (n) => /Flex(ible)? Joint|플렉시블/i.test(n), src: partFlexJoint },
  {
    match: (n) => /Pressure Gauge|압력\s*게이지/i.test(n),
    src: partPressureGauge
  },
  { match: (n) => /Diagnostic|진단 키트|진단키트/i.test(n), src: partDiagKit },
  { match: (n) => /HMI|모니터링/i.test(n), src: partHMI },
  {
    match: (n) => /토탈솔루션|Control Panel|컨트롤 패널/i.test(n),
    src: partControlPanel
  },
  { match: (n) => /유지보수|주기정비|부품 공급/i.test(n), src: partDiagKit }
];

function bodyForModel(nameUpper) {
  const key = nameUpper.replace(/\s+/g, " ").trim();
  if (BODY_BY_MODEL[key]) return BODY_BY_MODEL[key];
  // Any CD-series model is a refrigerated air dryer.
  if (/^CD\d/.test(key)) return cd7000Body;
  return null;
}

function partFor(name) {
  for (const rule of PART_RULES) {
    if (rule.match(name)) return rule.src;
  }
  return null;
}

// Given a product name and (optionally) family, return {type, src}.
// type is 'image' when we resolved a real photo; 'placeholder' when the caller
// should render its own gradient/text placeholder.
export function resolveProductImage(name, family) {
  const raw = (name || "").trim();
  if (!raw) return { type: "placeholder", src: null };
  const upper = raw.toUpperCase();

  // 1. Exact body-photo match (compressor)
  const body = bodyForModel(upper);
  if (body) return { type: "image", src: body };

  // 2. Part keyword match
  const part = partFor(raw);
  if (part) return { type: "image", src: part };

  // 3. Dryer family fallback
  if (family === "드라이어" || /^CD/i.test(raw)) {
    return { type: "image", src: cd7000Body };
  }

  // 4. Placeholder — an unmatched compressor shows the caller's gradient
  //    placeholder with the model name, never a random part photo.
  return { type: "placeholder", src: null };
}
