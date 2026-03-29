import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isReady: boolean;
  profile: any;
  userRole: string | null;
  orgId: string | null;
  orgName: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, isReady: false, profile: null,
  userRole: null, orgId: null, orgName: null,
  signOut: async () => {}, refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  const loadProfile = async (uid: string) => {
    const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(p);

    const { data: r } = await supabase.rpc("get_user_role", { _user_id: uid });
    setUserRole(r);

    const { data: tms } = await supabase.from("team_members").select("org_id").eq("user_id", uid).limit(1);
    if (tms && tms.length > 0) {
      setOrgId(tms[0].org_id);
      const { data: org } = await supabase.from("organisations").select("name").eq("id", tms[0].org_id).single();
      setOrgName(org?.name ?? null);
    }
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id);
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id);
      else {
        setProfile(null);
        setUserRole(null);
        setOrgId(null);
        setOrgName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isReady, profile, userRole, orgId, orgName, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
