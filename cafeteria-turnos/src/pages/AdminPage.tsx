import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5173/api";

type Turno = {
  id: number;
  codigo_turno: string;
  fecha: string;
  estado: string;
  generado_en: string;
  reclamado_en: string | null;
  usuario: string;
  cafeteria: {
    id: number;
    nombre: string;
    estado: string;
  };
};

type Cafeteria = {
  id: number;
  nombre: string;
  estado: string;
  horario_apertura?: string;
  horario_cierre?: string;
  updated_at?: string;
};

const ESTADOS_CAFETERIA = [
  { value: "abierto", label: "Abierto" },
  { value: "cerrado", label: "Cerrado" },
  { value: "reabasteciendo", label: "Reabasteciendo" },
];

const TIEMPO_LIMITE_SEGUNDOS = 30;

const AdminPage: React.FC = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([]);
  const [selectedCafeteria, setSelectedCafeteria] = useState<number | null>(null);
  const [estadoCafeteria, setEstadoCafeteria] = useState<string>("");
  const [archivoEstudiantes, setArchivoEstudiantes] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [botonesDesactivados, setBotonesDesactivados] = useState<{ [key: number]: boolean }>({});

  const [menu, setMenu] = useState<"inicio" | "turnos" | "subir">("inicio");
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line
  }, []);

  // Refresca tiempos visuales cada segundo
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Refresca datos cada 3s para cambios backend
  useEffect(() => {
    const intv = setInterval(() => cargarDatos(), 3000);
    return () => clearInterval(intv);
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${auth?.access}` };
      const turnosRes = await axios.get(`${API_URL}/turnos/admin/listar/`, { headers });
      setTurnos(turnosRes.data);
      const cafeteriasRes = await axios.get(`${API_URL}/cafeteria/`, { headers });
      setCafeterias(cafeteriasRes.data);
      if (cafeteriasRes.data.length > 0) {
        setSelectedCafeteria(cafeteriasRes.data[0].id);
        setEstadoCafeteria(cafeteriasRes.data[0].estado);
      }
      setBotonesDesactivados({});
    } catch (error) {
      setMensaje("Error cargando datos.");
    }
    setLoading(false);
  };

  // Calcula el tiempo restante SOLO para el turno actual
  const getTiempoRestante = (generado_en: string): number => {
    const generado = new Date(generado_en).getTime();
    const ahora = now.getTime();
    const diff = Math.floor((ahora - generado) / 1000);
    return Math.max(0, TIEMPO_LIMITE_SEGUNDOS - diff);
  };

  const formatTiempo = (segundos: number): string => {
    if (segundos <= 0) return "Expirado";
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return (m > 0 ? `${m}m ` : "") + `${s}s`;
  };

  // Turno actual pendiente más antiguo
  const turnoActual = turnos
    .filter((t) => t.estado === "pendiente")
    .sort((a, b) => new Date(a.generado_en).getTime() - new Date(b.generado_en).getTime())[0] || null;

  // Los turnos pendientes restantes
  const turnosRestantes = turnos
    .filter((t) => t.estado === "pendiente" && t.id !== turnoActual?.id)
    .sort((a, b) => new Date(a.generado_en).getTime() - new Date(b.generado_en).getTime());

  // Penalizados
  const turnosPenalizados = turnos
    .filter((t) => t.estado === "penalizado")
    .sort((a, b) => new Date(b.generado_en).getTime() - new Date(a.generado_en).getTime());

  const handlePasarTurno = async (turnoId: number) => {
    try {
      setMensaje("Procesando turno...");
      const headers = { Authorization: `Bearer ${auth?.access}` };
      await axios.post(`${API_URL}/turnos/admin/pasar/${turnoId}/`, {}, { headers });
      setMensaje("Turno pasado correctamente.");
      await cargarDatos();
    } catch (error: any) {
      setMensaje(error.response?.data?.mensaje || "Error al pasar turno.");
    }
  };

  const handleEntregarTurno = async (turnoId: number) => {
    try {
      setMensaje("Procesando entrega...");
      const headers = { Authorization: `Bearer ${auth?.access}` };
      await axios.post(`${API_URL}/turnos/admin/entregar/${turnoId}/`, {}, { headers });
      setMensaje("Turno entregado correctamente.");
      await cargarDatos();
    } catch (error: any) {
      setMensaje(error.response?.data?.mensaje || "Error al entregar turno.");
    }
  };

  const handleDespenalizarTurno = async (turnoId: number) => {
    setBotonesDesactivados(prev => ({ ...prev, [turnoId]: true }));
    try {
      setMensaje("Despenalizando usuario...");
      const headers = { Authorization: `Bearer ${auth?.access}` };
      await axios.post(`${API_URL}/turnos/admin/despenalizar/${turnoId}/`, {}, { headers });
      setMensaje("Penalización eliminada y turno restaurado correctamente.");
      await cargarDatos();
    } catch (error: any) {
      setMensaje(error.response?.data?.mensaje || "Error al despenalizar.");
      setBotonesDesactivados(prev => ({ ...prev, [turnoId]: false }));
    }
  };

  const handleCafeteriaChange = (cafeteriaId: number) => {
    setSelectedCafeteria(cafeteriaId);
    const caf = cafeterias.find((c) => c.id === cafeteriaId);
    if (caf) setEstadoCafeteria(caf.estado);
  };

  const handleEstadoCafeteria = async () => {
    if (!selectedCafeteria) return;
    try {
      setMensaje("Cambiando estado...");
      const headers = { Authorization: `Bearer ${auth?.access}` };
      await axios.patch(
        `${API_URL}/cafeteria/actualizar/${selectedCafeteria}/`,
        { estado: estadoCafeteria },
        { headers }
      );
      setMensaje("Estado de cafetería actualizado.");
      await cargarDatos();
    } catch (error: any) {
      setMensaje(JSON.stringify(error.response?.data) || "Error al cambiar estado.");
      console.log(error.response?.data);
    }
  };

  const handleArchivoEstudiantes = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoEstudiantes(e.target.files[0]);
    }
  };

  const handleSubirEstudiantes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoEstudiantes) {
      setMensaje("Selecciona un archivo.");
      return;
    }
    try {
      setMensaje("Subiendo base de datos...");
      const headers = {
        Authorization: `Bearer ${auth?.access}`,
        "Content-Type": "multipart/form-data",
      };
      const formData = new FormData();
      formData.append("archivo", archivoEstudiantes);
      await axios.post(`${API_URL}/usuarios/subir_base/`, formData, { headers });
      setMensaje("Base de datos de estudiantes subida correctamente.");
    } catch (error: any) {
      setMensaje(error.response?.data?.mensaje || "Error al subir la base.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#f2f7fd 0%,#e3ffe8 100%)",
        fontFamily: "'Segoe UI', 'Roboto', Arial, sans-serif",
        width: "100vw",
        overflowX: "auto"
      }}
    >
      <header
        style={{
          width: "100%",
          maxWidth: 1600,
          margin: "0 auto",
          height: 100,
          background: "#fff",
          boxShadow: "0 2px 18px #b4e0e433",
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 32, color: "#178041" }}>
            Bienvenido, {auth?.username || "Administrador"}
          </div>
          <div style={{ color: "#20793e", fontSize: 20, marginTop: -3 }}>
            Panel de control de la cafetería
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "#fa5252",
            color: "#fff",
            fontWeight: 700,
            border: "none",
            borderRadius: 15,
            padding: "15px 32px",
            fontSize: 20,
            boxShadow: "0 2px 12px #fa525233",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </header>

      <div
        style={{
          display: "flex",
          maxWidth: 1600,
          margin: "48px auto 0 auto",
          borderRadius: 22,
          background: "#fff",
          boxShadow: "0 2px 32px #b4e0e444",
          minHeight: 700,
        }}
      >
        {/* Menú lateral */}
        <aside
          style={{
            width: 250,
            background: "#f6fbf6",
            borderTopLeftRadius: 22,
            borderBottomLeftRadius: 22,
            padding: "50px 14px 18px 30px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            borderRight: "1px solid #e0e0e0",
          }}
        >
          <button
            onClick={() => setMenu("inicio")}
            style={{
              padding: "18px 0",
              background: menu === "inicio" ? "#e0f7fa" : "#fff",
              border: "none",
              borderRadius: 13,
              fontWeight: 700,
              color: "#20793e",
              fontSize: 22,
              boxShadow: menu === "inicio" ? "0 2px 10px #b4e0e433" : "none",
              cursor: "pointer",
            }}
          >
            Inicio
          </button>
          <button
            onClick={() => setMenu("turnos")}
            style={{
              padding: "18px 0",
              background: menu === "turnos" ? "#e0f7fa" : "#fff",
              border: "none",
              borderRadius: 13,
              fontWeight: 700,
              color: "#20793e",
              fontSize: 22,
              boxShadow: menu === "turnos" ? "0 2px 10px #b4e0e433" : "none",
              cursor: "pointer",
            }}
          >
            Ver todos los turnos
          </button>
          <button
            onClick={() => setMenu("subir")}
            style={{
              padding: "18px 0",
              background: menu === "subir" ? "#e0f7fa" : "#fff",
              border: "none",
              borderRadius: 13,
              fontWeight: 700,
              color: "#20793e",
              fontSize: 22,
              boxShadow: menu === "subir" ? "0 2px 10px #b4e0e433" : "none",
              cursor: "pointer",
              marginBottom: 32,
            }}
          >
            Subir base de estudiantes
          </button>
          {/* Estado cafeteria abajo */}
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 13,
              paddingBottom: 26,
            }}
          >
            <div style={{ fontSize: 18, color: "#888", fontWeight: 600 }}>Cafetería</div>
            <select
              value={selectedCafeteria || ""}
              onChange={e => handleCafeteriaChange(Number(e.target.value))}
              style={{
                padding: "11px 18px",
                borderRadius: 12,
                border: "1.6px solid #d0ece7",
                fontSize: 18,
                marginBottom: 8,
                background: "#f8fafd",
                color: "#20793e",
                fontWeight: 600,
              }}
            >
              {cafeterias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <select
                value={estadoCafeteria}
                onChange={e => setEstadoCafeteria(e.target.value)}
                style={{
                  padding: "11px 20px",
                  borderRadius: 11,
                  border: "1.6px solid #d0ece7",
                  fontSize: 18,
                  background: "#f8fafd",
                  color: "#20793e",
                  fontWeight: 600,
                }}
              >
                {ESTADOS_CAFETERIA.map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
              <button
                onClick={handleEstadoCafeteria}
                style={{
                  padding: "11px 22px",
                  borderRadius: 11,
                  background: "#178041",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 18,
                  boxShadow: "0 1px 8px #b4e0e422",
                  cursor: "pointer",
                }}
              >
                Cambiar
              </button>
            </div>
          </div>
        </aside>
        {/* Contenido principal */}
        <main
          style={{
            flex: 1,
            padding: "48px 66px",
            minHeight: 600,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflowX: "auto"
          }}
        >
          {mensaje && (
            <div
              style={{
                position: "absolute",
                top: 20,
                right: 55,
                background: "#33d17a",
                color: "#fff",
                fontWeight: 700,
                fontSize: 20,
                padding: "16px 36px",
                borderRadius: 18,
                boxShadow: "0 2px 10px #20793e44",
                zIndex: 100,
                letterSpacing: 1,
                minWidth: 260,
                textAlign: "center",
              }}
            >
              {mensaje}
            </div>
          )}
          {menu === "inicio" && (
            <>
              <h2 style={{ fontWeight: 700, color: "#178041", marginTop: 0, fontSize: 34 }}>Turno actual</h2>
              {loading ? (
                <div style={{ fontSize: 20 }}>Cargando...</div>
              ) : turnoActual ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#f6fbf6",
                    borderRadius: 22,
                    boxShadow: "0 2px 10px #c8f2e455",
                    padding: "32px 38px",
                    marginBottom: 40,
                    justifyContent: "space-between",
                    gap: 38,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 500, color: "#777" }}>
                      Código de turno:
                    </div>
                    <div style={{ fontSize: 42, fontWeight: 900, color: "#178041", letterSpacing: 1 }}>
                      {turnoActual.codigo_turno}
                    </div>
                    <div style={{ fontSize: 25, fontWeight: 500, color: "#777", marginTop: 8 }}>
                      Estudiante:
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#20793e" }}>
                      {turnoActual.usuario}
                    </div>
                    <div style={{ fontSize: 19, color: "#888", marginTop: 12 }}>
                      Cafetería: <b>{turnoActual.cafeteria.nombre}</b>
                    </div>
                    <div style={{ fontSize: 18, color: "#aaa", marginTop: 10 }}>
                      Generado: {new Date(turnoActual.generado_en).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 20, color: "#888", marginTop: 13 }}>
                      Tiempo restante: <b style={{ color: "#e67e22" }}>{formatTiempo(getTiempoRestante(turnoActual.generado_en))}</b>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 22, marginLeft: 46 }}>
                    <button
                      onClick={() => handlePasarTurno(turnoActual.id)}
                      style={{
                        padding: "23px 42px",
                        fontSize: 26,
                        fontWeight: 900,
                        borderRadius: 15,
                        background: "#0077cc",
                        color: "#fff",
                        border: "none",
                        marginBottom: 0,
                        marginRight: 0,
                        boxShadow: "0 2px 18px #0077cc33",
                        cursor: "pointer",
                        marginTop: 7,
                        width: 280,
                        letterSpacing: 1.2,
                        transition: "background 0.2s",
                      }}
                    >
                      Pasar al siguiente turno
                    </button>
                    <button
                      onClick={() => handleEntregarTurno(turnoActual.id)}
                      style={{
                        padding: "17px 42px",
                        fontSize: 23,
                        fontWeight: 700,
                        borderRadius: 15,
                        background: "#33d17a",
                        color: "#fff",
                        border: "none",
                        marginTop: 0,
                        boxShadow: "0 2px 12px #33d17a44",
                        cursor: "pointer",
                        width: 280,
                        letterSpacing: 1,
                        transition: "background 0.2s",
                      }}
                    >
                      Marcar como entregado
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "#fff5f5",
                    border: "1px solid #e0e0e0",
                    borderRadius: 18,
                    padding: "34px 16px",
                    color: "#e74c3c",
                    fontWeight: 700,
                    textAlign: "center",
                    fontSize: 26,
                  }}
                >
                  No hay turno pendiente actualmente.
                </div>
              )}
              {/* Mostrar los siguientes turnos pendientes */}
              <div style={{ marginTop: 25 }}>
                <h3 style={{ color: "#178041", marginBottom: 15, fontWeight: 700, fontSize: 26 }}>Turnos pendientes siguientes</h3>
                {turnosRestantes.length === 0 ? (
                  <div style={{ color: "#999", fontWeight: 500, padding: "12px 0", fontSize: 18 }}>
                    No hay más turnos pendientes.
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", background: "#f8fafd", borderRadius: 10, fontSize: 19 }}>
                    <thead>
                      <tr style={{ background: "#e0e0e0" }}>
                        <th style={{ padding: 10 }}>Código</th>
                        <th style={{ padding: 10 }}>Estudiante</th>
                        <th style={{ padding: 10 }}>Cafetería</th>
                        <th style={{ padding: 10 }}>Generado</th>
                        <th style={{ padding: 10 }}>Tiempo restante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turnosRestantes.map(turno => (
                        <tr key={turno.id}>
                          <td style={{ textAlign: "center" }}>{turno.codigo_turno}</td>
                          <td style={{ textAlign: "center" }}>{turno.usuario}</td>
                          <td style={{ textAlign: "center" }}>{turno.cafeteria.nombre}</td>
                          <td style={{ textAlign: "center" }}>{new Date(turno.generado_en).toLocaleString()}</td>
                          <td style={{ textAlign: "center", color: "#e67e22" }}>
                            {/* Solo mostrar tiempo para el turno actual, los demás "-" */}
                            {"-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {/* Tabla de penalizados */}
              <div style={{ marginTop: 50 }}>
                <h3 style={{ color: "#c0392b", marginBottom: 15, fontWeight: 700, fontSize: 26 }}>Turnos penalizados</h3>
                {turnosPenalizados.length === 0 ? (
                  <div style={{ color: "#999", fontWeight: 500, padding: "12px 0", fontSize: 18 }}>
                    No hay turnos penalizados.
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff5f5", borderRadius: 10, fontSize: 19 }}>
                    <thead>
                      <tr style={{ background: "#f9d6d5" }}>
                        <th style={{ padding: 10 }}>Código</th>
                        <th style={{ padding: 10 }}>Estudiante</th>
                        <th style={{ padding: 10 }}>Cafetería</th>
                        <th style={{ padding: 10 }}>Generado</th>
                        <th style={{ padding: 10 }}>Penalizado desde</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turnosPenalizados.map(turno => (
                        <tr key={turno.id}>
                          <td style={{ textAlign: "center", color: "#c0392b", fontWeight: 700 }}>{turno.codigo_turno}</td>
                          <td style={{ textAlign: "center" }}>{turno.usuario}</td>
                          <td style={{ textAlign: "center" }}>{turno.cafeteria.nombre}</td>
                          <td style={{ textAlign: "center" }}>{new Date(turno.generado_en).toLocaleString()}</td>
                          <td style={{ textAlign: "center" }}>{new Date(turno.generado_en).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
          {menu === "turnos" && (
            <>
              <h2 style={{ fontWeight: 700, color: "#178041", marginTop: 0, marginBottom: 28, fontSize: 34 }}>Todos los turnos</h2>
              {loading ? (
                <div style={{ fontSize: 20 }}>Cargando turnos...</div>
              ) : (
                <div
                  style={{
                    maxHeight: 800,
                    overflowY: "auto",
                    overflowX: "auto",
                    border: "1px solid #e0e0e0",
                    borderRadius: 16,
                    minWidth: 900
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 20 }}>
                    <thead>
                      <tr style={{ background: "#e0e0e0" }}>
                        <th style={{ padding: 11 }}>#</th>
                        <th style={{ padding: 11 }}>Código</th>
                        <th style={{ padding: 11 }}>Estado</th>
                        <th style={{ padding: 11 }}>Estudiante</th>
                        <th style={{ padding: 11 }}>Cafetería</th>
                        <th style={{ padding: 11 }}>Generado</th>
                        <th style={{ padding: 11 }}>Reclamado</th>
                        <th style={{ padding: 11 }}>Tiempo restante</th>
                        <th style={{ padding: 11 }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turnos.length === 0 && (
                        <tr>
                          <td colSpan={9} style={{ textAlign: "center", color: "#888", fontSize: 22 }}>No hay turnos registrados.</td>
                        </tr>
                      )}
                      {turnos.map(turno => (
                        <tr key={turno.id} style={{
                          background: turno.estado === "pendiente" ? "#fafde4" : (turno.estado === "penalizado" ? "#ffe4e4" : "inherit")
                        }}>
                          <td style={{ textAlign: "center", fontSize: 22 }}>{turno.id}</td>
                          <td style={{ textAlign: "center", fontSize: 22 }}>{turno.codigo_turno}</td>
                          <td style={{ color: turno.estado === "pendiente" ? "#0077cc" : (turno.estado === "penalizado" ? "#c0392b" : "#999"), textAlign: "center", fontWeight: turno.estado === "penalizado" ? 700 : undefined, fontSize: 22 }}>
                            {turno.estado.toUpperCase()}
                          </td>
                          <td style={{ textAlign: "center", fontSize: 22 }}>{turno.usuario}</td>
                          <td style={{ textAlign: "center", fontSize: 22 }}>{turno.cafeteria.nombre}</td>
                          <td style={{ textAlign: "center", fontSize: 22 }}>{new Date(turno.generado_en).toLocaleString()}</td>
                          <td style={{ textAlign: "center", fontSize: 22 }}>
                            {turno.reclamado_en ? new Date(turno.reclamado_en).toLocaleString() : "-"}
                          </td>
                          <td style={{ textAlign: "center", fontSize: 22, color: turno.estado === "pendiente" ? "#e67e22" : "#888" }}>
                            {/* Solo mostrar tiempo restante si es el turno actual */}
                            {turno.estado === "pendiente" && turno.id === turnoActual?.id
                              ? formatTiempo(getTiempoRestante(turno.generado_en))
                              : (turno.estado === "penalizado" ? "Penalizado" : "-")}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {turno.estado === "penalizado" && (
                              <button
                                onClick={() => handleDespenalizarTurno(turno.id)}
                                disabled={!!botonesDesactivados[turno.id]}
                                style={{
                                  background: "#33d17a",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 11,
                                  padding: "12px 22px",
                                  fontWeight: 700,
                                  fontSize: 20,
                                  cursor: botonesDesactivados[turno.id] ? "not-allowed" : "pointer",
                                  opacity: botonesDesactivados[turno.id] ? 0.6 : 1
                                }}
                              >
                                Despenalizar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          {menu === "subir" && (
            <>
              <h2 style={{ fontWeight: 700, color: "#178041", marginTop: 0, marginBottom: 32, fontSize: 34 }}>Subir base de estudiantes</h2>
              <form onSubmit={handleSubirEstudiantes} style={{ display: "flex", flexDirection: "column", gap: 25, maxWidth: 500 }}>
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleArchivoEstudiantes}
                  style={{
                    padding: 12,
                    fontSize: 19,
                    border: "1.6px solid #d0ece7",
                    borderRadius: 12,
                    background: "#f8fafd",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "19px 0",
                    background: "#178041",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 22,
                    cursor: "pointer",
                    marginTop: 10,
                    boxShadow: "0 2px 10px #d0ece755",
                  }}
                >
                  Subir
                </button>
              </form>
              <div style={{ color: "#888", fontSize: 18, marginTop: 23, lineHeight: 1.38, maxWidth: 520 }}>
                El archivo debe ser formato <b>.csv</b> o <b>Excel</b> válido con los campos requeridos para estudiantes.
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;