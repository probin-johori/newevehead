import { MagnifyingGlass, Plus, SignOut } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";

const NavPanel = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen w-60 flex-col border-r border-border bg-nav-panel">
      {/* Org header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">
          ZH
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Zero Hour</p>
          <p className="truncate text-xs text-muted-foreground">Organization</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm text-muted-foreground">
          <MagnifyingGlass size={16} />
          <span>Search…</span>
        </div>
      </div>

      {/* Quick sections */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="mb-4">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming Events
          </p>
          <div className="rounded-lg bg-background p-3 text-center text-sm text-muted-foreground">
            No upcoming events
          </div>
        </div>

        <div>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            My Tasks
          </p>
          <div className="rounded-lg bg-background p-3 text-center text-sm text-muted-foreground">
            No pending tasks
          </div>
        </div>
      </div>

      {/* User footer */}
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {(user?.user_metadata?.full_name ?? "U")[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.user_metadata?.full_name ?? "User"}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Sign out"
          >
            <SignOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavPanel;
