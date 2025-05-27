import axios from "axios";

// Ahora usamos una ruta relativa que será redirigida por Vite a localhost:8000
const API_URL = "/api/usuarios/login/";

export const login = async (username: string, password: string) => {
  const response = await axios.post(API_URL, { username, password });
  // response.data debe contener { access, refresh, rol, username, codigo_estudiantil, ... }
  return response.data;
};
