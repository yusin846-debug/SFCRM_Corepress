import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import EquipmentListPage from "./pages/EquipmentListPage.jsx";
import EquipmentDetailPage from "./pages/EquipmentDetailPage.jsx";
import ServiceRequestPage from "./pages/ServiceRequestPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/portal" element={<DashboardPage />} />
      <Route path="/portal/equipment" element={<EquipmentListPage />} />
      <Route path="/portal/equipment/:equipmentId" element={<EquipmentDetailPage />} />
      <Route path="/portal/service-request" element={<ServiceRequestPage />} />
    </Routes>
  );
}
