import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
export type User = { _id?: string; id?: string; fullName: string; rollNumber: string; email: string; username: string; createdAt?: string };
type AuthContextType = { user: User | null; loading: boolean; refresh: () => Promise<void>; setUser: (u: User | null) => void };
const Context = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    try { const { data } = await api.get("/api/auth/me"); setUser(data.user); }
    catch { setUser(null); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);
  return <Context.Provider value={{ user, loading, refresh, setUser }}>{children}</Context.Provider>;
}
export const useAuth = () => { const value = useContext(Context); if (!value) throw new Error("AuthProvider missing"); return value; };
