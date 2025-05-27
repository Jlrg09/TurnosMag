import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import EstudiantePage from "./pages/EstudiantePage";
import AdminPage from "./pages/AdminPage";
import VistaPage from "./pages/VistaPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import QRPage from "./pages/QrPage";

// Ruta protegida: solo deja pasar si hay usuario autenticado
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth } = useAuth();
  // El token puede llamarse 'access' según tu AuthContext, ajusta si es necesario
  return auth && auth.access ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/estudiante"
            element={
              <PrivateRoute>
                <EstudiantePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
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
          <Route
            path="/qr"
            element={
              <PrivateRoute>
                <QRPage />
              </PrivateRoute>
            }
          />
          {/* Ruta comodín para cualquier ruta no definida */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;