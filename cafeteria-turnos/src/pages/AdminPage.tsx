import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000/api";

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

  // UI: menú
  const [menu, setMenu] = useState<"inicio" | "turnos" | "subir">("inicio");

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${auth?.access}` };
      // Turnos (AJUSTA LA URL a admin/listar)
      const turnosRes = await axios.get(`${API_URL}/turnos/admin/listar/`, { headers });
      setTurnos(turnosRes.data);
      // Cafeterías (AJUSTA LA URL a cafeteria en singular)
      const cafeteriasRes = await axios.get(`${API_URL}/cafeteria/`, { headers });
      setCafeterias(cafeteriasRes.data);
      if (cafeteriasRes.data.length > 0) {
        setSelectedCafeteria(cafeteriasRes.data[0].id);
        setEstadoCafeteria(cafeteriasRes.data[0].estado);
      }
    } catch (error) {
      setMensaje("Error cargando datos.");
    }
    setLoading(false);
  };

  // El turno actual es el pendiente más antiguo (el primero del día en estado pendiente)
  const turnoActual = turnos
    .filter((t) => t.estado === "pendiente")
    .sort((a, b) => new Date(a.generado_en).getTime() - new Date(b.generado_en).getTime())[0] || null;

  const turnosRestantes = turnos
    .filter((t) => t.estado === "pendiente" && t.id !== turnoActual?.id)
    .sort((a, b) => new Date(a.generado_en).getTime() - new Date(b.generado_en).getTime());

  const handlePasarTurno = async (turnoId: number) => {
    try {
      setMensaje("Procesando turno...");
      const headers = { Authorization: `Bearer ${auth?.access}` };
      // AJUSTA LA URL a admin/pasar
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
      // AJUSTA LA URL a admin/entregar
      await axios.post(`${API_URL}/turnos/admin/entregar/${turnoId}/`, {}, { headers });
      setMensaje("Turno entregado correctamente.");
      await cargarDatos();
    } catch (error: any) {
      setMensaje(error.response?.data?.mensaje || "Error al entregar turno.");
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

  // Estética y layout
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#f2f7fd 0%,#e3ffe8 100%)",
        fontFamily: "'Segoe UI', 'Roboto', Arial, sans-serif",
        padding: 0,
      }}
    >
      {/* Barra superior */}
      <header
        style={{
          width: "100%",
          maxWidth: 1000,
          margin: "0 auto",
          height: 72,
          background: "#fff",
          boxShadow: "0 2px 14px #b4e0e433",
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 25, color: "#178041" }}>
            Bienvenido, {auth?.username || "Administrador"}
          </div>
          <div style={{ color: "#20793e", fontSize: 15, marginTop: -3 }}>
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
            borderRadius: 13,
            padding: "11px 22px",
            fontSize: 16,
            boxShadow: "0 2px 8px #fa525233",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </header>

      <div
        style={{
          display: "flex",
          maxWidth: 1000,
          margin: "38px auto 0 auto",
          borderRadius: 18,
          background: "#fff",
          boxShadow: "0 2px 24px #b4e0e444",
          minHeight: 600,
        }}
      >
        {/* Menú lateral */}
        <aside
          style={{
            width: 210,
            background: "#f6fbf6",
            borderTopLeftRadius: 18,
            borderBottomLeftRadius: 18,
            padding: "36px 10px 18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderRight: "1px solid #e0e0e0",
          }}
        >
          <button
            onClick={() => setMenu("inicio")}
            style={{
              padding: "12px 0",
              background: menu === "inicio" ? "#e0f7fa" : "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              color: "#20793e",
              fontSize: 17,
              boxShadow: menu === "inicio" ? "0 2px 10px #b4e0e433" : "none",
              cursor: "pointer",
            }}
          >
            Inicio
          </button>
          <button
            onClick={() => setMenu("turnos")}
            style={{
              padding: "12px 0",
              background: menu === "turnos" ? "#e0f7fa" : "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              color: "#20793e",
              fontSize: 17,
              boxShadow: menu === "turnos" ? "0 2px 10px #b4e0e433" : "none",
              cursor: "pointer",
            }}
          >
            Ver todos los turnos
          </button>
          <button
            onClick={() => setMenu("subir")}
            style={{
              padding: "12px 0",
              background: menu === "subir" ? "#e0f7fa" : "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              color: "#20793e",
              fontSize: 17,
              boxShadow: menu === "subir" ? "0 2px 10px #b4e0e433" : "none",
              cursor: "pointer",
              marginBottom: 25,
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
              gap: 8,
              paddingBottom: 20,
            }}
          >
            <div style={{ fontSize: 15, color: "#888", fontWeight: 600 }}>Cafetería</div>
            <select
              value={selectedCafeteria || ""}
              onChange={e => handleCafeteriaChange(Number(e.target.value))}
              style={{
                padding: "7px 10px",
                borderRadius: 9,
                border: "1.2px solid #d0ece7",
                fontSize: 15,
                marginBottom: 6,
                background: "#f8fafd",
                color: "#20793e",
                fontWeight: 600,
              }}
            >
              {cafeterias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select
                value={estadoCafeteria}
                onChange={e => setEstadoCafeteria(e.target.value)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1.2px solid #d0ece7",
                  fontSize: 15,
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
                  padding: "7px 15px",
                  borderRadius: 8,
                  background: "#178041",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 15,
                  boxShadow: "0 1px 5px #b4e0e422",
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
            padding: "34px 45px",
            minHeight: 500,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {mensaje && (
            <div
              style={{
                position: "absolute",
                top: 18,
                right: 40,
                background: "#33d17a",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                padding: "10px 24px",
                borderRadius: 14,
                boxShadow: "0 2px 8px #20793e44",
                zIndex: 100,
                letterSpacing: 1,
                minWidth: 220,
                textAlign: "center",
              }}
            >
              {mensaje}
            </div>
          )}
          {menu === "inicio" && (
            <>
              <h2 style={{ fontWeight: 700, color: "#178041", marginTop: 0 }}>Turno actual</h2>
              {loading ? (
                <div>Cargando...</div>
              ) : turnoActual ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#f6fbf6",
                    borderRadius: 16,
                    boxShadow: "0 2px 8px #c8f2e455",
                    padding: "22px 28px",
                    marginBottom: 30,
                    justifyContent: "space-between",
                    gap: 24,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 500, color: "#777" }}>
                      Código de turno:
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#178041", letterSpacing: 1 }}>
                      {turnoActual.codigo_turno}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 500, color: "#777", marginTop: 6 }}>
                      Estudiante:
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#20793e" }}>
                      {turnoActual.usuario}
                    </div>
                    <div style={{ fontSize: 16, color: "#888", marginTop: 8 }}>
                      Cafetería: <b>{turnoActual.cafeteria.nombre}</b>
                    </div>
                    <div style={{ fontSize: 15, color: "#aaa", marginTop: 6 }}>
                      Generado: {new Date(turnoActual.generado_en).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 15, marginLeft: 32 }}>
                    <button
                      onClick={() => handlePasarTurno(turnoActual.id)}
                      style={{
                        padding: "19px 30px",
                        fontSize: 20,
                        fontWeight: 900,
                        borderRadius: 13,
                        background: "#0077cc",
                        color: "#fff",
                        border: "none",
                        marginBottom: 0,
                        marginRight: 0,
                        boxShadow: "0 2px 12px #0077cc33",
                        cursor: "pointer",
                        marginTop: 5,
                        width: 220,
                        letterSpacing: 1.2,
                        transition: "background 0.2s",
                      }}
                    >
                      Pasar al siguiente turno
                    </button>
                    <button
                      onClick={() => handleEntregarTurno(turnoActual.id)}
                      style={{
                        padding: "13px 30px",
                        fontSize: 18,
                        fontWeight: 700,
                        borderRadius: 13,
                        background: "#33d17a",
                        color: "#fff",
                        border: "none",
                        marginTop: 0,
                        boxShadow: "0 2px 8px #33d17a44",
                        cursor: "pointer",
                        width: 220,
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
                    borderRadius: 16,
                    padding: "24px 12px",
                    color: "#e74c3c",
                    fontWeight: 700,
                    textAlign: "center",
                    fontSize: 20,
                  }}
                >
                  No hay turno pendiente actualmente.
                </div>
              )}
              {/* Mostrar los siguientes turnos pendientes */}
              <div style={{ marginTop: 18 }}>
                <h3 style={{ color: "#178041", marginBottom: 10, fontWeight: 700 }}>Turnos pendientes siguientes</h3>
                {turnosRestantes.length === 0 ? (
                  <div style={{ color: "#999", fontWeight: 500, padding: "8px 0" }}>
                    No hay más turnos pendientes.
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", background: "#f8fafd", borderRadius: 8 }}>
                    <thead>
                      <tr style={{ background: "#e0e0e0" }}>
                        <th style={{ padding: 7 }}>Código</th>
                        <th style={{ padding: 7 }}>Estudiante</th>
                        <th style={{ padding: 7 }}>Cafetería</th>
                        <th style={{ padding: 7 }}>Generado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turnosRestantes.map(turno => (
                        <tr key={turno.id}>
                          <td style={{ textAlign: "center" }}>{turno.codigo_turno}</td>
                          <td style={{ textAlign: "center" }}>{turno.usuario}</td>
                          <td style={{ textAlign: "center" }}>{turno.cafeteria.nombre}</td>
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
              <h2 style={{ fontWeight: 700, color: "#178041", marginTop: 0, marginBottom: 20 }}>Todos los turnos</h2>
              {loading ? (
                <div>Cargando turnos...</div>
              ) : (
                <div
                  style={{
                    maxHeight: 510,
                    overflowY: "auto",
                    border: "1px solid #e0e0e0",
                    borderRadius: 12,
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16 }}>
                    <thead>
                      <tr style={{ background: "#e0e0e0" }}>
                        <th style={{ padding: 7 }}>#</th>
                        <th style={{ padding: 7 }}>Código</th>
                        <th style={{ padding: 7 }}>Estado</th>
                        <th style={{ padding: 7 }}>Estudiante</th>
                        <th style={{ padding: 7 }}>Cafetería</th>
                        <th style={{ padding: 7 }}>Generado</th>
                        <th style={{ padding: 7 }}>Reclamado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turnos.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", color: "#888" }}>No hay turnos registrados.</td>
                        </tr>
                      )}
                      {turnos.map(turno => (
                        <tr key={turno.id} style={{
                          background: turno.estado === "pendiente" ? "#fafde4" : "inherit"
                        }}>
                          <td style={{ textAlign: "center" }}>{turno.id}</td>
                          <td style={{ textAlign: "center" }}>{turno.codigo_turno}</td>
                          <td style={{ color: turno.estado === "pendiente" ? "#0077cc" : "#999", textAlign: "center" }}>
                            {turno.estado.toUpperCase()}
                          </td>
                          <td style={{ textAlign: "center" }}>{turno.usuario}</td>
                          <td style={{ textAlign: "center" }}>{turno.cafeteria.nombre}</td>
                          <td style={{ textAlign: "center" }}>{new Date(turno.generado_en).toLocaleString()}</td>
                          <td style={{ textAlign: "center" }}>
                            {turno.reclamado_en ? new Date(turno.reclamado_en).toLocaleString() : "-"}
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
              <h2 style={{ fontWeight: 700, color: "#178041", marginTop: 0, marginBottom: 24 }}>Subir base de estudiantes</h2>
              <form onSubmit={handleSubirEstudiantes} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400 }}>
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleArchivoEstudiantes}
                  style={{
                    padding: 8,
                    fontSize: 16,
                    border: "1.2px solid #d0ece7",
                    borderRadius: 9,
                    background: "#f8fafd",
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
                  }}
                >
                  Subir
                </button>
              </form>
              <div style={{ color: "#888", fontSize: 15, marginTop: 18, lineHeight: 1.38, maxWidth: 420 }}>
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