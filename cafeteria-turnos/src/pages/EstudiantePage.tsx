import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { QrReader } from "react-qr-reader";

const API_URL = "http://localhost:8000/api";

type Perfil = {
  username: string;
  rol: string;
  codigo_estudiantil: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

type Notificacion = {
  id: number;
  mensaje: string;
  leida: boolean;
  fecha: string;
};

type Turno = {
  id: number;
  fecha: string;
  estado: string;
  cafeteria: {
    id: number;
    nombre: string;
    estado: string; // "abierto" | "cerrado" | etc.
  };
};

const EstudiantePage: React.FC = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // QR y Turno
  const [scanning, setScanning] = useState(false);
  const [turnoMsg, setTurnoMsg] = useState<string | null>(null);
  const [generandoTurno, setGenerandoTurno] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Estado de turno y cafeteria
  const [turnoHoy, setTurnoHoy] = useState<Turno | null>(null);
  const [cafeteriaEstado, setCafeteriaEstado] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const headers = { Authorization: `Bearer ${auth?.access}` };
        // Obtener perfil
        const perfilRes = await axios.get(`${API_URL}/usuarios/perfil/`, { headers });
        setPerfil(perfilRes.data);

        // Obtener notificaciones
        const notifRes = await axios.get(`${API_URL}/notificaciones/mias/`, { headers });
        setNotificaciones(notifRes.data);

        // Obtener turno del día (el primero si hay más de uno)
        const turnosRes = await axios.get(`${API_URL}/turnos/mios/`, { headers });
        const hoy = new Date().toISOString().slice(0, 10);
        const turnoHoyData = turnosRes.data.find((t: Turno) => t.fecha === hoy);
        setTurnoHoy(turnoHoyData || null);

        // Estado de la cafeteria (del turno de hoy o la primera, si no hay turno)
        if (turnoHoyData && turnoHoyData.cafeteria) {
          setCafeteriaEstado(turnoHoyData.cafeteria.estado);
        } else if (turnosRes.data.length > 0 && turnosRes.data[0].cafeteria) {
          setCafeteriaEstado(turnosRes.data[0].cafeteria.estado);
        } else {
          setCafeteriaEstado(null);
        }
      } catch (err: any) {
        setError("Error cargando datos.");
        if (err.response && err.response.status === 401) {
          logout();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Actualizar turno y estado de cafeteria tras crear turno
  const refreshTurno = async () => {
    try {
      const headers = { Authorization: `Bearer ${auth?.access}` };
      const turnosRes = await axios.get(`${API_URL}/turnos/mios/`, { headers });
      const hoy = new Date().toISOString().slice(0, 10);
      const turnoHoyData = turnosRes.data.find((t: Turno) => t.fecha === hoy);
      setTurnoHoy(turnoHoyData || null);
      if (turnoHoyData && turnoHoyData.cafeteria) {
        setCafeteriaEstado(turnoHoyData.cafeteria.estado);
      }
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const marcarLeida = async (id: number) => {
    try {
      const headers = { Authorization: `Bearer ${auth?.access}` };
      await axios.patch(`${API_URL}/notificaciones/marcar_leida/${id}/`, { leida: true }, { headers });
      setNotificaciones(nots =>
        nots.map(n => (n.id === id ? { ...n, leida: true } : n))
      );
    } catch {
      // error silencioso
    }
  };

  // Inicia el escaneo y genera turno en 5 segundos, sin importar el QR
  useEffect(() => {
    if (scanning) {
      setTurnoMsg("Abriendo cámara. Generando turno en 5 segundos...");
      setGenerandoTurno(true);
      timeoutRef.current = setTimeout(async () => {
        try {
          const headers = { Authorization: `Bearer ${auth?.access}` };
          const res = await axios.post(`${API_URL}/turnos/crear/`, { qr: "simulado" }, { headers });
          setTurnoMsg(res.data.detalle || res.data.mensaje || "¡Turno generado con éxito!");
          await refreshTurno();
        } catch (err: any) {
          setTurnoMsg(
            err.response?.data?.detalle ||
            err.response?.data?.mensaje ||
            "Error generando turno"
          );
        } finally {
          setGenerandoTurno(false);
          setScanning(false);
        }
      }, 5000);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
    // eslint-disable-next-line
  }, [scanning, auth]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 24, background: "#f9f9f9", borderRadius: 12 }}>
      <button onClick={handleLogout} style={{ float: "right" }}>Cerrar sesión</button>
      <h2>Bienvenido estudiante</h2>
      {perfil && (
        <div style={{ marginBottom: 24 }}>
          <h3>Datos personales</h3>
          <ul>
            <li><b>Usuario:</b> {perfil.username}</li>
            <li><b>Nombre:</b> {perfil.first_name} {perfil.last_name}</li>
            <li><b>Código estudiantil:</b> {perfil.codigo_estudiantil}</li>
            <li><b>Rol:</b> {perfil.rol}</li>
            <li><b>Email:</b> {perfil.email || "-"}</li>
          </ul>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h3>Notificaciones</h3>
        {notificaciones.length === 0 && <div>No tienes notificaciones</div>}
        <ul>
          {notificaciones.map(n => (
            <li
              key={n.id}
              style={{
                background: n.leida ? "#e0e0e0" : "#d0f6e0",
                padding: "8px 12px",
                borderRadius: 8,
                marginBottom: 8,
                cursor: n.leida ? "default" : "pointer",
              }}
              onClick={() => !n.leida && marcarLeida(n.id)}
            >
              <b>{n.mensaje}</b> <br />
              <small>{new Date(n.fecha).toLocaleString()}</small>
              {!n.leida && <span style={{ color: "green", marginLeft: 12 }}>● Nueva</span>}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3>Mi turno de hoy</h3>
        {turnoHoy ? (
          <div style={{ padding: 12, borderRadius: 8, background: "#f5f7fa", marginBottom: 10 }}>
            <div><b>Cafetería:</b> {turnoHoy.cafeteria?.nombre || "-"}</div>
            <div><b>Estado cafetería:</b> <span style={{
              color: turnoHoy.cafeteria?.estado === "abierto" ? "green" : "red",
              fontWeight: "bold"
            }}>{turnoHoy.cafeteria?.estado?.toUpperCase() || "-"}</span></div>
            <div><b>Fecha:</b> {turnoHoy.fecha}</div>
            <div><b>Estado turno:</b> <span style={{
              color: turnoHoy.estado === "pendiente" ? "#0077cc" : "#999",
              fontWeight: "bold"
            }}>{turnoHoy.estado?.toUpperCase()}</span></div>
          </div>
        ) : (
          <div>No tienes turno para hoy.</div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3>Escanear QR para generar turno</h3>
        {!scanning && (
          <button
            onClick={() => {
              setScanning(true);
              setTurnoMsg(null);
            }}
            disabled={generandoTurno}
          >
            Iniciar escaneo (simulado)
          </button>
        )}
        {scanning && (
          <div style={{ maxWidth: 350, margin: "18px auto" }}>
            <QrReader
              constraints={{ facingMode: "environment" }}
              onResult={() => {}}
              style={{ width: "100%" }}
            />
            <button onClick={() => {
              setScanning(false);
              setGenerandoTurno(false);
              setTurnoMsg(null);
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }} style={{ marginTop: 10 }}>
              Cancelar
            </button>
            <div style={{ marginTop: 12 }}>{turnoMsg}</div>
          </div>
        )}
        {!scanning && turnoMsg && (
          <div style={{ marginTop: 12, fontWeight: "bold" }}>{turnoMsg}</div>
        )}
      </div>
    </div>
  );
};

export default EstudiantePage;