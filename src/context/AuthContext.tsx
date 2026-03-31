import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type Role = "sa" | "org" | "dept_head" | "dept_member";

export interface AuthProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_color: string;
  dept_name?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: AuthProfile | null;
  role: Role | null;
  hasSelectedRole: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (name: string, email: string, password: string, orgName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  selectRole: (role: Role) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (data) {
      setProfile({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        avatar_color: data.avatar_color || "#6b21a8",
        dept_name: data.dept_name || undefined,
      });
      return;
    }

    setProfile(null);
  };

  const fetchRole = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).limit(1).single();

    if (data) {
      setRole(data.role as Role);
    } else {
      setRole(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await Promise.all([fetchProfile(user.id), fetchRole(user.id)]);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        window.setTimeout(() => {
          void Promise.all([fetchProfile(newSession.user.id), fetchRole(newSession.user.id)]).finally(() => {
            setLoading(false);
          });
        }, 0);
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    void supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (existingSession?.user) {
        setSession(existingSession);
        setUser(existingSession.user);
        void Promise.all([fetchProfile(existingSession.user.id), fetchRole(existingSession.user.id)]).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (name: string, email: string, password: string, orgName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, org_name: orgName },
        emailRedirectTo: window.location.origin,
      },
    });

    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const selectRole = async (selectedRole: Role) => {
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: user.id, role: selectedRole }, { onConflict: "user_id,role" });

    if (!error) {
      setRole(selectedRole);
    }

    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        hasSelectedRole: role !== null,
        isAuthenticated: !!session,
        loading,
        signUp,
        signIn,
        signOut,
        selectRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
