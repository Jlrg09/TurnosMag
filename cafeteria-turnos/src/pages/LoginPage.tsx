import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
      await login(username, password);
      navigate("/estudiante"); // O la ruta que corresponda según el rol
    } catch (err) {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuario" />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Contraseña" />
      <button type="submit">Iniciar sesión</button>
      {error && <div style={{color: "red"}}>{error}</div>}
    </form>
  );
}