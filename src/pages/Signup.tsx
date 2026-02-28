import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMockData } from "@/context/MockDataContext";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signup } = useMockData();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError("All fields are required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    signup(name, email, password);
    navigate("/onboarding/role");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-serif text-2xl text-primary-foreground">E</div>
          <h1 className="text-2xl font-serif">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Get started with EventOps</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="John Doe" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            Create Account
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-accent-mid hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
