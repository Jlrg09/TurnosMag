import React, { createContext, useContext, useState, useEffect } from "react";
import { login as loginService } from "../services/authService";

type Auth = {
  access: string;
  refresh: string;
  username: string;
  rol: string;
  codigo_estudiantil?: string;
} | null;

type AuthContextType = {
  auth: Auth;
  loading: boolean;
  login: (username: string, password: string) => Promise<NonNullable<Auth>>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<Auth>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("authData");
    if (stored) setAuth(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const data = await loginService(username, password);
    setAuth(data);
    localStorage.setItem("token", data.access);
    localStorage.setItem("authData", JSON.stringify(data));
    return data;
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("token");
    localStorage.removeItem("authData");
  };

  return (
    <AuthContext.Provider value={{ auth, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);