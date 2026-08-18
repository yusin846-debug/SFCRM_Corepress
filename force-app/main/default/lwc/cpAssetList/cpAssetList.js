import { LightningElement, api } from "lwc";
import logo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import cp100 from "@salesforce/resourceUrl/CorePressCP100";
import cp2100 from "@salesforce/resourceUrl/CorePressCP2100";
import cp7100 from "@salesforce/resourceUrl/CorePressCP7100";
import locationIcon from "@salesforce/resourceUrl/CorePressLocationIcon";
import operatingIcon from "@salesforce/resourceUrl/CorePressOperatingIcon";
import warningIcon from "@salesforce/resourceUrl/CorePressWarningIcon";
import logoutIcon from "@salesforce/resourceUrl/CorePressLogoutIcon";

const ASSETS = [
  {
    id: "1",
    model: "CP7100+",
    name: "터보압축기 #1",
    serial: "CP-2024-0847",
    location: "여수 제2공장 A동",
    status: "운전 중",
    statusClass: "status running",
    statusIcon: operatingIcon,
    imageUrl: cp7100,
    installDate: "2024.06.15",
  },
  {
    id: "2",
    model: "CP2100",
    name: "압축기 #2",
    serial: "CP-2024-0632",
    location: "울산 공장 B동",
    status: "운전 중",
    statusClass: "status running",
    statusIcon: operatingIcon,
    imageUrl: cp2100,
    installDate: "2024.03.28",
  },
  {
    id: "3",
    model: "CP100 Pro",
    name: "압축기 #3",
    serial: "CP-2024-0519",
    location: "대산 공장 C동",
    status: "운전 중",
    statusClass: "status running",
    statusIcon: operatingIcon,
    imageUrl: cp100,
    installDate: "2024.02.10",
  },
  {
    id: "4",
    model: "CP2100",
    name: "압축기 #4",
    serial: "CP-2024-0398",
    location: "여수 제1공장 D동",
    status: "운전 중",
    statusClass: "status running",
    statusIcon: operatingIcon,
    imageUrl: cp2100,
    installDate: "2024.01.18",
  },
  {
    id: "5",
    model: "CP7100+",
    name: "압축기 #5",
    serial: "CP-2024-0281",
    location: "울산 공장 E동",
    status: "점검 필요",
    statusClass: "status attention",
    statusIcon: warningIcon,
    imageUrl: cp7100,
    installDate: "2023.11.30",
  },
];

export default class CpAssetList extends LightningElement {
  @api detailUrl = "asset-detail";
  logoUrl = logo;
  locationIconUrl = locationIcon;
  logoutIconUrl = logoutIcon;
  searchTerm = "";
  activeFilter = "전체";
  viewMode = "grid";

  get filteredAssets() {
    const term = this.searchTerm.trim().toLowerCase();
    return ASSETS.filter((asset) => {
      const matchesFilter =
        this.activeFilter === "전체" || asset.status === this.activeFilter;
      const matchesTerm =
        !term ||
        `${asset.name} ${asset.serial} ${asset.model}`
          .toLowerCase()
          .includes(term);
      return matchesFilter && matchesTerm;
    });
  }

  get resultsLabel() {
    return `총 ${this.filteredAssets.length}건`;
  }
  get gridClass() {
    return this.viewMode === "grid" ? "asset-grid" : "asset-grid list-view";
  }
  get allFilterClass() {
    return this.activeFilter === "전체" ? "filter active" : "filter";
  }
  get runningFilterClass() {
    return this.activeFilter === "운전 중" ? "filter active" : "filter";
  }
  get attentionFilterClass() {
    return this.activeFilter === "점검 필요" ? "filter active" : "filter";
  }
  get gridButtonClass() {
    return this.viewMode === "grid" ? "view-button active" : "view-button";
  }
  get listButtonClass() {
    return this.viewMode === "list" ? "view-button active" : "view-button";
  }

  handleSearch(event) {
    this.searchTerm = event.target.value;
  }
  showAll() {
    this.activeFilter = "전체";
  }
  showRunning() {
    this.activeFilter = "운전 중";
  }
  showAttention() {
    this.activeFilter = "점검 필요";
  }
  showGrid() {
    this.viewMode = "grid";
  }
  showList() {
    this.viewMode = "list";
  }
}
