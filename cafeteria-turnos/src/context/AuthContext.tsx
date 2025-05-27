import React, { createContext, useContext, useState } from "react";
import { login as loginService } from "../services/authService";

type Auth = {
  access: string;
  refresh: string;
  username: string;
  rol: string;
  codigo_estudiantil: string;
} | null;

type AuthContextType = {
  auth: Auth;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<Auth>(null);

  const login = async (username: string, password: string) => {
    const data = await loginService(username, password);
    setAuth(data);
    localStorage.setItem("token", data.access);
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);