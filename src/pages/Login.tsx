import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { lovable } from "@/integrations/lovable/index";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    const redirectUri = redirect
      ? `${window.location.origin}${redirect}`
      : window.location.origin;
    const { error: err } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectUri,
    });
    setLoading(false);
    if (err) setError(err instanceof Error ? err.message : String(err));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      {/* Subtle gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-rose-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo + Branding */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 text-xl font-bold text-white shadow-lg shadow-rose-500/25">
            EH
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome to EveHead
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Event management, simplified for teams.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 backdrop-blur-sm shadow-2xl">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogle}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-100 hover:shadow-lg hover:shadow-white/5 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            {loading ? "Connecting…" : "Continue with Google"}
          </button>

          <p className="mt-6 text-center text-xs text-zinc-500">
            Sign in or sign up — we'll handle the rest.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          By continuing, you agree to EveHead's Terms of Service.
        </p>
      </div>
    </div>
  );
}
