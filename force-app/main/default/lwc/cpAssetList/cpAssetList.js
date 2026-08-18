import { LightningElement, api } from "lwc";
import logo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import cp100 from "@salesforce/resourceUrl/CorePressCP100";
import cp2100 from "@salesforce/resourceUrl/CorePressCP2100";
import cp7100 from "@salesforce/resourceUrl/CorePressCP7100";
import locationIcon from "@salesforce/resourceUrl/CorePressLocationIcon";
import operatingIcon from "@salesforce/resourceUrl/CorePressSummaryOperatingIcon";
import warningIcon from "@salesforce/resourceUrl/CorePressSummaryWarningIcon";
import logoutIcon from "@salesforce/resourceUrl/CorePressLogoutWhiteIcon";
import registeredIcon from "@salesforce/resourceUrl/CorePressRegisteredIcon";
import searchIcon from "@salesforce/resourceUrl/CorePressSearchIcon";
import gridIconActive from "@salesforce/resourceUrl/CorePressGridIconActive";
import gridIconInactive from "@salesforce/resourceUrl/CorePressGridIconInactive";
import listIconActive from "@salesforce/resourceUrl/CorePressListIconActive";
import listIconInactive from "@salesforce/resourceUrl/CorePressListIconInactive";

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
  registeredIconUrl = registeredIcon;
  summaryOperatingIconUrl = operatingIcon;
  summaryWarningIconUrl = warningIcon;
  searchIconUrl = searchIcon;
  searchTerm = "";
  activeFilter = "전체";
  viewMode = "grid";
  currentPage = 1;
  pageSize = 6;

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
  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredAssets.length / this.pageSize));
  }
  get paginatedAssets() {
    const safePage = Math.min(this.currentPage, this.totalPages);
    const start = (safePage - 1) * this.pageSize;
    return this.filteredAssets.slice(start, start + this.pageSize);
  }
  get gridClass() {
    return this.viewMode === "grid" ? "asset-grid" : "asset-grid list-view";
  }
  get isGridView() {
    return this.viewMode === "grid";
  }
  get isListView() {
    return this.viewMode === "list";
  }
  get currentGridIconUrl() {
    return this.isGridView ? gridIconActive : gridIconInactive;
  }
  get currentListIconUrl() {
    return this.isListView ? listIconActive : listIconInactive;
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
    this.currentPage = 1;
  }
  handlePageChange(event) {
    const requestedPage = Number.parseInt(event.target.value, 10);
    this.currentPage = Number.isFinite(requestedPage)
      ? Math.min(Math.max(requestedPage, 1), this.totalPages)
      : 1;
    event.target.value = this.currentPage;
  }
  showAll() {
    this.activeFilter = "전체";
    this.currentPage = 1;
  }
  showRunning() {
    this.activeFilter = "운전 중";
    this.currentPage = 1;
  }
  showAttention() {
    this.activeFilter = "점검 필요";
    this.currentPage = 1;
  }
  showGrid() {
    this.viewMode = "grid";
  }
  showList() {
    this.viewMode = "list";
  }
  handleLogout() {
    const returnUrl = encodeURIComponent("/corepressvforcesite/s/");
    window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`);
  }
}
