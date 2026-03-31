import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AuthCallbackStatus = "restoring" | "redirecting" | "failed";

const getTokensFromUrl = () => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);

  return {
    access_token: hashParams.get("access_token") ?? queryParams.get("access_token"),
    refresh_token: hashParams.get("refresh_token") ?? queryParams.get("refresh_token"),
  };
};

const clearAuthTokensFromUrl = () => {
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.delete("access_token");
  url.searchParams.delete("refresh_token");
  url.searchParams.delete("token_type");
  url.searchParams.delete("expires_in");
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
};

const waitForSession = async (timeoutMs = 6000) => {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  return new Promise<Awaited<typeof data.session>>((resolve) => {
    let resolved = false;

    const timer = window.setTimeout(() => {
      if (resolved) return;
      resolved = true;
      subscription.unsubscribe();
      resolve(null);
    }, timeoutMs);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (resolved || !session) return;
      resolved = true;
      window.clearTimeout(timer);
      subscription.unsubscribe();
      resolve(session);
    });
  });
};

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<AuthCallbackStatus>("restoring");

  useEffect(() => {
    let cancelled = false;

    const finalizeAuth = async () => {
      try {
        const tokens = getTokensFromUrl();

        if (tokens.access_token && tokens.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });

          if (error) throw error;
          clearAuthTokensFromUrl();
        }

        const session = await waitForSession();
        if (cancelled) return;

        if (!session?.user) {
          setStatus("failed");
          window.setTimeout(() => navigate("/login", { replace: true }), 1200);
          return;
        }

        const nextPath = searchParams.get("next");
        setStatus("redirecting");

        if (nextPath && nextPath.startsWith("/")) {
          navigate(nextPath, { replace: true });
          return;
        }

        const { data: memberships } = await supabase
          .from("team_members")
          .select("id")
          .eq("user_id", session.user.id)
          .limit(1);

        if (cancelled) return;
        navigate(memberships && memberships.length > 0 ? "/dashboard" : "/onboarding", { replace: true });
      } catch {
        if (cancelled) return;
        setStatus("failed");
        window.setTimeout(() => navigate("/login", { replace: true }), 1200);
      }
    };

    void finalizeAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">
          {status === "failed" ? "We couldn't finish sign-in" : "Finishing sign-in…"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {status === "failed"
            ? "Sending you back to login."
            : status === "redirecting"
              ? "Redirecting you now."
              : "Restoring your account session securely."}
        </p>
      </div>
    </div>
  );
}
