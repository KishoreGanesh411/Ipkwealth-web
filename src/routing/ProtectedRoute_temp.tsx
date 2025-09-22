// src/context/AuthContex.tsx
import React, { createContext, useContext, useState } from "react";

export type Role = "MARKETING" | "RM" | "ADMIN" | "STAFF";
export type User = { id: string; email: string; role: Role };

type Ctx = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthCtx = createContext<Ctx | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    if (email === "digital@ipkmahi.com" && password === "ipk@12345") {
      setUser({ id: "u1", email, role: "MARKETING" }); return true;
    }
    if (email === "sales@ipkramya.com" && password === "ipk@12345") {
      setUser({ id: "u2", email, role: "RM" }); return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
};
