import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { IconSidebar } from "./IconSidebar";
import { NavPanel } from "./NavPanel";
import { AppHeader } from "./AppHeader";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/40 p-2 gap-2">
      {/* Icon sidebar - black pill */}
      <IconSidebar />
      {/* Main area with nav panel + content */}
      <div className="flex flex-1 rounded-xl border bg-card overflow-hidden">
        <NavPanel />
        <div className="h-[1px] w-[1px] bg-border" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
