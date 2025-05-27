import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminPage from "../pages/AdminPage";
import EstudiantePage from "../pages/EstudiantePage";
import VistaPage from "../pages/VistaPage";
import LoginPage from "../pages/LoginPage"; // Opcional: agrega tu pantalla de login si existe
import QRPage from "../pages/QrPage";

const AppRouter = () => (
  <Router>
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/estudiante" element={<EstudiantePage />} />
      <Route path="/vista" element={<VistaPage />} />
      <Route path="/qr" element={<QRPage />} />
      {/* Ruta de login opcional */}
      <Route path="/login" element={<LoginPage />} />
      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  </Router>
);

export default AppRouter;