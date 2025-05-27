import axios from "axios";

const API_URL = "http://localhost:8000/api/usuarios/login/";

export const login = async (username: string, password: string) => {
  const res = await axios.post(API_URL, { username, password });
  // res.data tendrá: { access, refresh, ...otros }
  return res.data;
};