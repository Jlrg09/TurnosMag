import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function getCafeteriaStatus(cafeteriaId: number, token: string) {
  // GET /api/cafeterias/<id>/
  const res = await axios.get(`${API_URL}/cafeterias/${cafeteriaId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function generarTurno(cafeteriaId: number, codigoQR: string, token: string) {
  // POST /api/turnos/  { cafeteria_id, codigo_qr }
  const res = await axios.post(
    `${API_URL}/turnos/`,
    { cafeteria_id: cafeteriaId, codigo_qr: codigoQR },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function getTurnoActual(token: string) {
  // GET /api/turnos/mio/
  const res = await axios.get(`${API_URL}/turnos/mio/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getTurnosRestantes(cafeteriaId: number, token: string) {
  // GET /api/turnos/faltantes/?cafeteria_id=<id>
  const res = await axios.get(`${API_URL}/turnos/faltantes/?cafeteria_id=${cafeteriaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}