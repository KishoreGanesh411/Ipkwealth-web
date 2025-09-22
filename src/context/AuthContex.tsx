import React, { createContext, useContext, useMemo, useState } from "react";

export type Role = "MARKETING" | "RM" | "ADMIN" | "STAFF";

export type User = {
  id: string;
  email: string;
  role: Role;
};

type AuthCtx = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

const STORAGE_KEY = "ipk_auth_user";

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  });

  const login = async (email: string, password: string) => {
    // Dummy users for now
    if (email === "digital@ipkmahi.com" && password === "ipk@12345") {
      const u: User = { id: "u1", email, role: "MARKETING" };
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return true;
    }
    if (email === "sales@ipkramya.com" && password === "ipk@12345") {
      const u: User = { id: "u2", email, role: "RM" };
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
};
