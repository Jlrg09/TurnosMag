import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import EstudiantePage from "./pages/EstudiantePage";
import AdminPage from "./pages/AdminPage";
import VistaPage from "./pages/VistaPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import QRPage from "./pages/QrPage";
import TurnoActual from "./pages/TurnoActual";

const PrivateRoute: React.FC<{ children: React.ReactNode; role?: string }> = ({ children, role }) => {
  const { auth, loading } = useAuth();
  if (loading) return null; 
  if (!(auth && auth.access)) {
    return <Navigate to="/login" replace />;
  }
  if (role && auth.rol !== role) {
    if (auth.rol === "estudiante") return <Navigate to="/estudiante" replace />;
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/turno-actual" element={<TurnoActual />} />
          <Route path="/qr" element={<QRPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas privadas */}
          <Route
            path="/estudiante"
            element={
              <PrivateRoute role="estudiante">
                <EstudiantePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <AdminPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/vista"
            element={
              <PrivateRoute>
                <VistaPage />
              </PrivateRoute>
            }
          />
          {/* Ruta por defecto y comodín: siempre al login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;