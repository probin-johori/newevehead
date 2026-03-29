import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function JoinOrg() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setChecking(false);
    });
  }, []);

  const handleJoin = async () => {
    if (!token) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("accept_join_token", { _token: token });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("You've joined the organisation!");
    navigate("/dashboard");
  };

  if (checking) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-bold">You're Invited!</h1>
          <p className="mb-4 text-muted-foreground">Sign in or create an account to join.</p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => navigate(`/login?redirect=/join/${token}`)}>Sign in</Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate(`/signup?redirect=/join/${token}`)}>Sign up</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">Join Organisation</h1>
        <p className="mb-4 text-muted-foreground">Click below to accept the invitation.</p>
        <Button onClick={handleJoin} disabled={loading} className="w-full">
          {loading ? "Joining..." : "Accept & Join"}
        </Button>
      </div>
    </div>
  );
}
