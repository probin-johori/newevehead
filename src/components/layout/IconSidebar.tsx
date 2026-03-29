import { useLocation, useNavigate } from "react-router-dom";
import {
  Home, ListChecks, Building2, Receipt, FileText,
  Users, Settings, LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/dashboard", label: "Home" },
  { icon: ListChecks, path: "/tasks", label: "Tasks" },
  { icon: Building2, path: "/events", label: "Depts" },
  { icon: Receipt, path: "/billing", label: "Billing" },
  { icon: FileText, path: "/documents", label: "Docs" },
  { icon: Users, path: "/teams", label: "Teams" },
];

export function IconSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, orgName } = useAuth();

  return (
    <div
      className="flex h-full w-[72px] flex-col items-center rounded-xl py-3 gap-0.5"
      style={{ background: "hsl(0 0% 4%)" }}
    >
      {/* Org avatar */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-destructive text-sm font-bold text-white"
      >
        {orgName?.charAt(0)?.toUpperCase() || "O"}
      </button>

      <div className="flex flex-1 flex-col items-center gap-0.5">
        {navItems.map(item => {
          const active =
            item.path === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon size={20} />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/settings")}
        className={cn(
          "flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors",
          location.pathname.startsWith("/settings")
            ? "bg-white/15 text-white"
            : "text-white/50 hover:bg-white/10 hover:text-white"
        )}
      >
        <Settings size={20} />
        <span className="text-[10px] leading-tight">Settings</span>
      </button>
    </div>
  );
}
