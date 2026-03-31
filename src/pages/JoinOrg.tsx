import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { UsersThree, SignIn } from "@phosphor-icons/react";

export default function JoinOrgPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [role, setRole] = useState("member");
  const [expired, setExpired] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [loadingToken, setLoadingToken] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase
        .from("join_tokens" as any)
        .select("*")
        .eq("token", token)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoadingToken(false);
        return;
      }

      const row = data as any;

      if (row.expires_at && new Date(row.expires_at) < new Date()) {
        setExpired(true);
        setLoadingToken(false);
        return;
      }

      setOrgId(row.org_id);
      setRole(row.role || "member");

      // Fetch org name
      const { data: org } = await supabase
        .from("organisations")
        .select("name")
        .eq("id", row.org_id)
        .single();

      if (org) setOrgName(org.name);
      setLoadingToken(false);
    })();
  }, [token]);

  // Check if already a member
  useEffect(() => {
    if (!user || !orgId) return;
    supabase
      .from("team_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .single()
      .then(({ data }) => {
        if (data) setAlreadyMember(true);
      });
  }, [user, orgId]);

  const handleJoin = async () => {
    if (!user || !orgId) return;
    setJoining(true);

    const { error } = await supabase.from("team_members").insert({
      user_id: user.id,
      org_id: orgId,
      role,
    });

    if (error) {
      if (error.code === "23505") {
        setAlreadyMember(true);
      } else {
        toast({ title: "Failed to join", description: error.message, variant: "destructive" });
      }
      setJoining(false);
      return;
    }

    toast({ title: "Joined successfully!", description: `You are now a member of ${orgName}` });
    navigate("/dashboard");
  };

  if (loadingToken || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-4xl">🔗</p>
          <h1 className="text-xl font-semibold">Invalid Invite Link</h1>
          <p className="text-sm text-muted-foreground">This invite link is invalid or has been revoked.</p>
          <button onClick={() => navigate("/login")} className="mt-4 rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-4xl">⏰</p>
          <h1 className="text-xl font-semibold">Link Expired</h1>
          <p className="text-sm text-muted-foreground">This invite link has expired. Ask the admin for a new one.</p>
          <button onClick={() => navigate("/login")} className="mt-4 rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to signup with return URL
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm rounded-2xl border border-stroke bg-card p-8 text-center space-y-5 shadow-lg">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <UsersThree size={28} className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Join {orgName || "Organization"}</h1>
          <p className="text-sm text-muted-foreground">You've been invited to join <strong>{orgName}</strong>. Sign in or create an account to continue.</p>
          <div className="space-y-2">
            <button onClick={() => navigate(`/login?redirect=/join/${token}`)}
              className="w-full rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90">
              Sign In
            </button>
            <button onClick={() => navigate(`/signup?redirect=/join/${token}`)}
              className="w-full rounded-full border border-stroke px-4 py-2.5 text-sm font-medium hover:bg-selected">
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyMember) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-4xl">✅</p>
          <h1 className="text-xl font-semibold">Already a Member</h1>
          <p className="text-sm text-muted-foreground">You're already a member of {orgName}.</p>
          <button onClick={() => navigate("/dashboard")} className="mt-4 rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-2xl border border-stroke bg-card p-8 text-center space-y-5 shadow-lg">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <UsersThree size={28} className="text-primary" />
        </div>
        <h1 className="text-xl font-semibold">Join {orgName}</h1>
        <p className="text-sm text-muted-foreground">
          You've been invited to join <strong>{orgName}</strong> as a <strong className="capitalize">{role}</strong>.
        </p>
        <button onClick={handleJoin} disabled={joining}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50">
          <SignIn size={16} /> {joining ? "Joining…" : "Join Organization"}
        </button>
      </div>
    </div>
  );
}
