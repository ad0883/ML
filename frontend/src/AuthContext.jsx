import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")||"null"); } catch { return null; }
  });

  const login = (t, u) => {
    setToken(t); setUser(u || null);
    localStorage.setItem("token", t);
    if (u) localStorage.setItem("user", JSON.stringify(u));
  };
  const logout = () => {
    setToken(""); setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}