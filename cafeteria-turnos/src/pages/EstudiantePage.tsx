import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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

type Turno = {
  id: number;
  codigo_turno: string;
  fecha: string;
  estado: string;
  cafeteria: {
    id: number;
    nombre: string;
    estado: string;
  };
  generado_en?: string;
  reclamado_en?: string | null;
};

type Cafeteria = {
  id: number;
  nombre: string;
  estado: string;
};

type Penalizacion = {
  id: number;
  fecha: string;
  motivo: string;
  activa: boolean;
  creada_en: string;
};

const capitalize = (str?: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "-";

function getCafeteriaColor(estado?: string) {
  switch (estado) {
    case "abierto":
    case "abierta":
      return "#33d17a";
    case "reabastecimiento":
      return "#FFD600";
    case "cerrado":
    case "cerrada":
      return "#fa5252";
    default:
      return "#e67e22";
  }
}

// Penalización: segundos restantes de 15 minutos
function getPenalizacionRestante(creada_en: string) {
  const PENALIZACION_SEGUNDOS = 15 * 60;
  const creada = new Date(creada_en).getTime();
  const ahora = new Date().getTime();
  const transcurrido = Math.floor((ahora - creada) / 1000);
  return Math.max(0, PENALIZACION_SEGUNDOS - transcurrido);
}

function formatTiempo(segundos: number): string {
  if (segundos <= 0) return "Expirado";
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return (m > 0 ? `${m}m ` : "") + `${s.toString().padStart(2, "0")}s`;
}

const EstudiantePage: React.FC = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null);
  const [menu, setMenu] = useState<"perfil" | "turno">("perfil");
  const [submenu, setSubmenu] = useState<"actual" | "anteriores">("actual");

  // Penalizaciones
  const [penalizacion, setPenalizacion] = useState<Penalizacion | null>(null);
  const [penalizacionRestante, setPenalizacionRestante] = useState<number>(0);

  // Turnos
  const [turnoHoy, setTurnoHoy] = useState<Turno | null>(null);
  const [turnosAnteriores, setTurnosAnteriores] = useState<Turno[]>([]);

  // Turno y QR
  const [scanning, setScanning] = useState(false);
  const [generandoTurno, setGenerandoTurno] = useState(false);
  const [turnoMsg, setTurnoMsg] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [notificacion, setNotificacion] = useState<string | null>(null);
  // Para evitar parpadeos al generar turno
  const [ultimoTurnoGenerado, setUltimoTurnoGenerado] = useState<Turno | null>(null);
  const [mostrandoTurnoNuevo, setMostrandoTurnoNuevo] = useState(false);

  // Para saber si ya reclamó turno hoy
  const [turnoReclamadoHoy, setTurnoReclamadoHoy] = useState<Turno | null>(null);

  // Para QR escaneado (simulado)
  const lastQrValue = useRef<string | null>(null);

  // Cargar perfil solo 1 vez
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const headers = { Authorization: `Bearer ${auth?.access}` };
        const perfilRes = await axios.get(`${API_URL}/usuarios/perfil/`, { headers });
        setPerfil(perfilRes.data);
      } catch (err: any) {
        if (err.response && err.response.status === 401) {
          logout();
          navigate("/login");
        }
      }
    };
    fetchPerfil();
    // eslint-disable-next-line
  }, []);

  // Cargar penalización, turno actual, turnos anteriores y reclamado cada 2s
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchAll = async () => {
      try {
        const headers = { Authorization: `Bearer ${auth?.access}` };
        // Penalización actual
        const penRes = await axios.get(`${API_URL}/turnos/penalizaciones/`, { headers });
        if (Array.isArray(penRes.data) && penRes.data.length > 0) {
          setPenalizacion(penRes.data[0]);
          setPenalizacionRestante(getPenalizacionRestante(penRes.data[0].creada_en));
        } else {
          setPenalizacion(null);
          setPenalizacionRestante(0);
        }
        // Turnos del usuario (hoy y anteriores)
        const turnosRes = await axios.get(`${API_URL}/turnos/mios/`, { headers });
        const hoy = new Date().toISOString().slice(0, 10);
        const turnosPendientesHoy = turnosRes.data
          .filter((t: Turno) => t.fecha === hoy && t.estado === "pendiente")
          .sort((a: Turno, b: Turno) =>
            new Date(a.generado_en || a.fecha).getTime() -
            new Date(b.generado_en || b.fecha).getTime()
          );
        if (mostrandoTurnoNuevo && ultimoTurnoGenerado) {
          setTurnoHoy(ultimoTurnoGenerado);
        } else {
          setTurnoHoy(turnosPendientesHoy.length > 0 ? turnosPendientesHoy[0] : null);
        }
        // ¿Ya reclamó algún turno hoy?
        const turnoReclamado = turnosRes.data.find(
          (t: Turno) => t.fecha === hoy && t.estado === "reclamado"
        );
        setTurnoReclamadoHoy(turnoReclamado ?? null);
        // Todos los turnos anteriores (excluye el turno actual pendiente)
        setTurnosAnteriores(
          turnosRes.data
            .filter(
              (t: Turno) =>
                !(turnosPendientesHoy.length > 0 && t.id === turnosPendientesHoy[0].id)
            )
            .sort(
              (a: Turno, b: Turno) =>
                new Date(b.generado_en || b.fecha).getTime() -
                new Date(a.generado_en || a.fecha).getTime()
            )
        );
      } catch (err: any) {
        setTurnoHoy(null);
        setTurnosAnteriores([]);
        setTurnoReclamadoHoy(null);
      }
      try {
        // Estado cafeteria (pública)
        const cafeteriaRes = await axios.get(`${API_URL}/cafeteria/`);
        if (Array.isArray(cafeteriaRes.data) && cafeteriaRes.data.length > 0)
          setCafeteria(cafeteriaRes.data[0]);
        else if (cafeteriaRes.data && cafeteriaRes.data.id)
          setCafeteria(cafeteriaRes.data);
      } catch {
        setCafeteria(null);
      }
    };

    fetchAll();
    interval = setInterval(fetchAll, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [auth, mostrandoTurnoNuevo, ultimoTurnoGenerado]);

  // Penalización: cuenta regresiva (solo si hay penalización)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (penalizacion) {
      timer = setInterval(() => {
        setPenalizacionRestante(getPenalizacionRestante(penalizacion.creada_en));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [penalizacion]);

  // Lógica de validación para generación de turno
  function getNoTurnoReason(): string | null {
    if (
      cafeteria &&
      ["cerrado", "cerrada"].includes((cafeteria.estado || "").toLowerCase())
    ) {
      return "La cafetería está cerrada";
    }
    if (penalizacion && penalizacionRestante > 0) {
      return "No puedes generar turno porque tienes una penalización activa";
    }
    if (turnoHoy) {
      return "No puedes generar turno porque ya tienes un turno pendiente";
    }
    if (turnoReclamadoHoy) {
      return "No puedes generar un nuevo turno porque ya reclamaste uno hoy";
    }
    return null;
  }

  // GENERAR TURNO - SIMULADO
  const handleSimularQr = async () => {
    setGenerandoTurno(true);
    setTurnoMsg("Generando turno...");
    const motivo = getNoTurnoReason();
    if (motivo) {
      setTurnoMsg(motivo);
      setGenerandoTurno(false);
      setTimeout(() => setTurnoMsg(null), 4000);
      setScanning(false);
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${auth?.access}` };
      const res = await axios.post(`${API_URL}/turnos/crear/`, { qr: "simulado" }, { headers });
      setTurnoMsg(null);
      setNotificacion("¡Turno generado con éxito!");
      setUltimoTurnoGenerado({
        id: res.data.id,
        codigo_turno: res.data.codigo_turno,
        fecha: res.data.fecha,
        estado: res.data.estado,
        cafeteria: res.data.cafeteria,
        generado_en: res.data.generado_en,
        reclamado_en: res.data.reclamado_en,
      });
      setMostrandoTurnoNuevo(true);
      setTurnoHoy({
        id: res.data.id,
        codigo_turno: res.data.codigo_turno,
        fecha: res.data.fecha,
        estado: res.data.estado,
        cafeteria: res.data.cafeteria,
        generado_en: res.data.generado_en,
        reclamado_en: res.data.reclamado_en,
      });
      setTimeout(() => {
        setUltimoTurnoGenerado(null);
        setMostrandoTurnoNuevo(false);
      }, 4000);
    } catch (err: any) {
      setTurnoMsg(
        err.response?.data?.mensaje ||
          "Error generando turno. Intenta de nuevo."
      );
    } finally {
      setGenerandoTurno(false);
      setScanning(false);
    }
  };

  // Ocultar notificación después de 3 segundos
  useEffect(() => {
    if (notificacion) {
      const timer = setTimeout(() => setNotificacion(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notificacion]);

  // Logo
  const logoUrl = "/logo192.png";

  // Mobile-like styles
  const mobileCard = {
    background: "#fff",
    borderRadius: 22,
    boxShadow: "0 1px 14px #b4e0e455",
    padding: "24px 20px",
    marginBottom: 22,
    width: "100%",
    maxWidth: 380,
    marginLeft: "auto",
    marginRight: "auto",
    fontSize: 18,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f2f7fd 0%, #e3ffe8 100%)",
        fontFamily: "'Segoe UI', 'Roboto', Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 0,
        position: "relative",
      }}
    >
      {/* Navbar superior estilo móvil */}
      <header
        style={{
          width: "100%",
          maxWidth: 440,
          height: 70,
          background: "#fff",
          boxShadow: "0 2px 14px #b4e0e433",
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 22, color: "#36bb81", letterSpacing: 1 }}>
          Mi Cafetería
        </div>
        <img
          src={logoUrl}
          alt="Logo"
          style={{
            height: 45,
            width: 45,
            borderRadius: 14,
            objectFit: "cover",
            background: "#fff",
            marginLeft: 16,
          }}
        />
      </header>

      {/* Contenido principal */}
      <main
        style={{
          width: "100vw",
          maxWidth: 440,
          flex: 1,
          marginTop: 85,
          marginBottom: 90,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "transparent",
        }}
      >
        {/* Menú mobile-style */}
        <nav
          style={{
            display: "flex",
            width: "100%",
            maxWidth: 380,
            justifyContent: "center",
            marginBottom: 18,
            gap: 16,
          }}
        >
          <button
            style={{
              flex: 1,
              padding: "13px 0",
              background: menu === "perfil" ? "#e0f7fa" : "#fff",
              border: "none",
              fontSize: 18,
              fontWeight: 700,
              color: "#36bb81",
              borderRadius: 13,
              boxShadow: menu === "perfil" ? "0 2px 8px #b4e0e433" : "none",
              transition: "background 0.2s",
              cursor: "pointer",
            }}
            onClick={() => setMenu("perfil")}
          >
            Datos
          </button>
          <button
            style={{
              flex: 1,
              padding: "13px 0",
              background: menu === "turno" ? "#e0f7fa" : "#fff",
              border: "none",
              fontSize: 18,
              fontWeight: 700,
              color: "#36bb81",
              borderRadius: 13,
              boxShadow: menu === "turno" ? "0 2px 8px #b4e0e433" : "none",
              transition: "background 0.2s",
              cursor: "pointer",
            }}
            onClick={() => setMenu("turno")}
          >
            Turno
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            style={{
              flex: 0.7,
              background: "#fa5252",
              color: "#fff",
              fontWeight: 700,
              border: "none",
              borderRadius: 13,
              padding: "13px 0",
              fontSize: 16,
              marginLeft: 12,
              boxShadow: "0 2px 8px #fa525233",
              cursor: "pointer",
            }}
          >
            Salir
          </button>
        </nav>

        {/* Notificación de turno generado */}
        {notificacion && (
          <div
            style={{
              position: "fixed",
              top: 90,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#33d17a",
              color: "#fff",
              fontWeight: 700,
              fontSize: 17,
              padding: "14px 32px",
              borderRadius: 16,
              boxShadow: "0 3px 14px #20793e44",
              zIndex: 9999,
              letterSpacing: 1,
              transition: "opacity 0.4s",
              opacity: notificacion ? 1 : 0,
            }}
          >
            {notificacion}
          </div>
        )}

        {/* Datos personales */}
        {menu === "perfil" && (
          <section style={mobileCard}>
            <h2
              style={{
                marginTop: 0,
                fontSize: 22,
                marginBottom: 16,
                color: "#36bb81",
                fontWeight: 900,
                letterSpacing: 1,
                textAlign: "center",
              }}
            >
              Datos personales
            </h2>
            {perfil ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 17 }}>
                <li>
                  <b>Usuario:</b> {perfil.username}
                </li>
                <li>
                  <b>Nombre:</b> {perfil.first_name} {perfil.last_name}
                </li>
                <li>
                  <b>Código estudiantil:</b> {perfil.codigo_estudiantil}
                </li>
                <li>
                  <b>Rol:</b> {perfil.rol}
                </li>
                <li>
                  <b>Email:</b> {perfil.email || "-"}
                </li>
              </ul>
            ) : (
              <div
                style={{
                  background: "#fff5f5",
                  border: "1px solid #e0e0e0",
                  borderRadius: 12,
                  padding: "18px 8px",
                  color: "#e74c3c",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                No se pudo cargar el perfil.
              </div>
            )}
          </section>
        )}

        {/* Pantalla de generar turno */}
        {menu === "turno" && (
          <section style={mobileCard}>
            <h2
              style={{
                fontSize: 22,
                marginBottom: 10,
                color: "#178041",
                fontWeight: 900,
                letterSpacing: 1,
                textAlign: "center",
              }}
            >
              Mi turno de hoy
            </h2>
            {/* Mostrar turno actual */}
            {turnoHoy ? (
              <div
                style={{
                  background: "#f6fbf6",
                  borderRadius: 14,
                  padding: "18px 10px",
                  marginBottom: 18,
                  fontSize: 19,
                  textAlign: "center",
                  boxShadow: "0 2px 8px #c8f2e455",
                }}
              >
                <div>
                  <b>Número de turno:</b> <span style={{ fontSize: 24, color: "#178041", fontWeight: 700 }}>{turnoHoy.codigo_turno}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <b>Estado:</b>
                  <span
                    style={{
                      color: turnoHoy.estado === "pendiente" ? "#0077cc" : "#999",
                      fontWeight: "bold",
                      marginLeft: 8,
                      fontSize: 19,
                    }}
                  >
                    {turnoHoy.estado?.toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "#fff5f5",
                  border: "1px solid #e0e0e0",
                  borderRadius: 12,
                  padding: "12px 8px",
                  color: "#e74c3c",
                  fontWeight: 600,
                  textAlign: "center",
                  marginBottom: 18,
                }}
              >
                No tienes turno para hoy.
              </div>
            )}
            {/* Generar turno */}
            {!scanning && (
              <button
                onClick={() => {
                  setScanning(true);
                  setTurnoMsg(null);
                  setGenerandoTurno(false);
                  setTimeout(handleSimularQr, 5000); // Simula escaneo en 5 segundos
                }}
                disabled={generandoTurno}
                style={{
                  padding: "13px 28px",
                  background: "#178041",
                  color: "#fff",
                  border: "none",
                  borderRadius: 13,
                  fontWeight: 700,
                  fontSize: 18,
                  cursor: "pointer",
                  width: "100%",
                  marginTop: 8,
                  marginBottom: 8,
                  boxShadow: "0 2px 8px #b4e0e433",
                }}
              >
                Generar nuevo turno
              </button>
            )}
            {scanning && (
              <div style={{ maxWidth: 320, margin: "18px auto" }}>
                <div style={{
                  width: "100%",
                  height: 200,
                  background: "#e9f5e8",
                  borderRadius: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#20793e",
                  fontWeight: 700,
                  fontSize: 20
                }}>
                  {turnoMsg ? turnoMsg : "Abriendo cámara..."}
                </div>
                <button
                  onClick={() => {
                    setScanning(false);
                    setGenerandoTurno(false);
                    setTurnoMsg(null);
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  }}
                  style={{
                    marginTop: 10,
                    padding: "10px 22px",
                    background: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
            {!scanning && turnoMsg && (
              <div style={{ marginTop: 12, fontWeight: "bold", color: "#e74c3c" }}>{turnoMsg}</div>
            )}
          </section>
        )}
      </main>

      {/* Estado cafetería abajo a la derecha, estilo flotante móvil */}
      <div
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 10px #b4e0e440",
          display: "flex",
          alignItems: "center",
          padding: "14px 23px",
          fontSize: 20,
          fontWeight: 700,
          color: getCafeteriaColor(cafeteria?.estado),
          zIndex: 999,
          minWidth: 210,
          justifyContent: "center",
        }}
      >
        <span style={{ marginRight: 12 }}>Cafetería:</span>
        <span style={{ marginRight: 10 }}>
          {capitalize(cafeteria?.estado)}
        </span>
        <span
          style={{
            display: "inline-block",
            width: 20,
            height: 20,
            backgroundColor: getCafeteriaColor(cafeteria?.estado),
            borderRadius: "50%",
            border: "2px solid #eee",
            boxShadow: "0 1px 4px #43e97b33",
            transition: "background-color 0.3s",
          }}
        ></span>
      </div>
    </div>
  );
};

export default EstudiantePage;