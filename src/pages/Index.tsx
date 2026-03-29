import { useAuth } from "@/contexts/AuthContext";
import { SignOut } from "@phosphor-icons/react";

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
      <h1 className="text-2xl font-bold">Welcome, {user?.user_metadata?.full_name ?? "User"}!</h1>
      <p className="text-muted-foreground">You're signed in as {user?.email}</p>
      <button
        onClick={signOut}
        className="mt-4 flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <SignOut size={18} />
        Sign Out
      </button>
    </div>
  );
};

export default Index;
