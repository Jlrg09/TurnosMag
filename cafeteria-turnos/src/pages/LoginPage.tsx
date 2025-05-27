import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const logoUrl = "/logo192.png"; 

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(username, password);
      if (data.rol === "admin") {
        navigate("/admin");
      } else if (data.rol === "estudiante") {
        navigate("/estudiante");
      } else {
        navigate("/vista");
      }
    } catch (err) {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #e9f7ef 0%, #e3f6fd 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Segoe UI', 'Roboto', Arial, sans-serif",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 4px 32px #b4e0e422",
          maxWidth: 370,
          width: "100%",
          padding: "38px 26px 24px 26px",
          marginTop: 32,
          marginBottom: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Encabezado de la app */}
        <img
          src={logoUrl}
          alt="Logo Unimag"
          style={{
            height: 68,
            width: 68,
            borderRadius: 18,
            objectFit: "cover",
            marginBottom: 13,
            boxShadow: "0 2px 10px #b4e0e444",
          }}
        />
        <h1
          style={{
            color: "#178041",
            fontWeight: 800,
            fontSize: 25,
            letterSpacing: 1.5,
            marginBottom: 6,
            marginTop: 0,
            textAlign: "center",
          }}
        >
          Sistema de Turnos
        </h1>
        <div
          style={{
            marginBottom: 28,
            color: "#20793e",
            fontWeight: 500,
            fontSize: 16,
            textAlign: "center",
            lineHeight: 1.25,
          }}
        >
          Bienvenido al sistema de turnos para estudiantes y personal de Unimagdalena. <br />
          Ingresa con tus credenciales institucionales para continuar.
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            marginBottom: 10,
          }}
        >
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Usuario"
            autoFocus
            style={{
              padding: "13px 16px",
              borderRadius: 9,
              border: "1.5px solid #d0ece7",
              fontSize: 16,
              marginBottom: 4,
              outline: "none",
              background: "#f8fafd",
              transition: "border 0.2s",
            }}
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            placeholder="Contraseña"
            style={{
              padding: "13px 16px",
              borderRadius: 9,
              border: "1.5px solid #d0ece7",
              fontSize: 16,
              outline: "none",
              background: "#f8fafd",
              transition: "border 0.2s",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "13px 0",
              background: "#178041",
              color: "#fff",
              border: "none",
              borderRadius: 9,
              fontWeight: 700,
              fontSize: 18,
              cursor: "pointer",
              marginTop: 6,
              boxShadow: "0 2px 8px #d0ece755",
              transition: "background 0.2s",
            }}
          >
            Iniciar sesión
          </button>
          {error && (
            <div
              style={{
                color: "#e74c3c",
                fontWeight: 600,
                textAlign: "center",
                marginTop: 8,
                fontSize: 15,
              }}
            >
              {error}
            </div>
          )}
        </form>
      </div>
      {/* Pie de página descriptivo */}
      <div
        style={{
          fontSize: 15,
          color: "#20793e",
          textAlign: "center",
          maxWidth: 360,
          marginTop: 18,
          marginBottom: 28,
          lineHeight: 1.38,
          fontWeight: 600,
          letterSpacing: 0.1,
          background: "rgba(255,255,255,0.8)",
          borderRadius: 14,
          padding: "18px 10px 14px 10px",
          boxShadow: "0 1px 10px #b4e0e422",
        }}
      >
        SISTEMA DE TURNOS PARA LA ENTREGA DE ALMUERZOS Y REFRIGERIOS DE CAFETERIA DE LA <br />
        <span style={{ color: "#178041", fontWeight: 700 }}>UNIVERSIDAD DEL MAGDALENA</span>
      </div>
    </div>
  );
}