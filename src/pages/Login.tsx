import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { GoogleLogo, Lightning } from "@phosphor-icons/react";

const Login = () => {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-accent" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-primary">
        <div className="max-w-md px-8 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent">
            <Lightning size={40} weight="fill" className="text-accent-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-primary-foreground">
            Zero Hour Events
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/70">
            Multi-tenant event management platform. Plan, execute, and settle — all in one place.
          </p>
        </div>
      </div>

      {/* Right panel — login */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex flex-col items-center lg:hidden">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
              <Lightning size={28} weight="fill" className="text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Zero Hour Events</h1>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GoogleLogo size={20} weight="bold" />
            Continue with Google
          </button>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
