import { useEffect, useState } from "react";
import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Login del estudiante, ajusta el endpoint si tu backend usa otro
export async function login(username: string, password: string) {
  const res = await axios.post(`${API_URL}/token/`, { username, password });
  // Se espera que el backend envíe el token y datos del usuario
  return res.data;
}
export interface User {
  id: number;
  username: string;
  rol: string;
  beneficiario: boolean;
  token: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return { user };
}