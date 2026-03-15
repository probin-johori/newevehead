import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { lovable } from "@/integrations/lovable/index";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError("All fields are required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    const { error: err } = await signUp(name, email, password);
    setLoading(false);
    if (err) setError(err);
    else setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-rose-500 text-lg font-bold text-white">ZH</div>
          <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
          <p className="text-sm text-muted-foreground">We've sent a verification link to <strong>{email}</strong>. Click the link to activate your account.</p>
          <Link to="/login" className="mt-6 inline-block text-sm text-accent hover:underline">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-rose-500 text-lg font-bold text-white">ZH</div>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Get started with Zero Hour Events</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stroke bg-card p-6">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading || googleLoading} className="w-full rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50">
            {loading ? "Creating account…" : "Create Account"}
          </button>
          <div className="relative flex items-center gap-4 py-1">
            <div className="flex-1 border-t border-stroke" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-stroke" />
          </div>
          <button type="button" disabled={loading || googleLoading} onClick={async () => {
            setGoogleLoading(true);
            setError("");
            const { error: err } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
            setGoogleLoading(false);
            if (err) setError(err instanceof Error ? err.message : String(err));
          }} className="flex w-full items-center justify-center gap-2 rounded-full border border-stroke bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/></svg>
            {googleLoading ? "Connecting…" : "Continue with Google"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
