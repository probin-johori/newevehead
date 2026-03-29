import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, CheckSquare, Receipt, FileText,
  Users, Settings, LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { icon: LayoutDashboard, path: "/dashboard", label: "Dashboard" },
  { icon: Calendar, path: "/events", label: "Events" },
  { icon: CheckSquare, path: "/tasks", label: "Tasks" },
  { icon: Receipt, path: "/billing", label: "Billing" },
  { icon: FileText, path: "/documents", label: "Documents" },
  { icon: Users, path: "/teams", label: "Teams" },
  { icon: Settings, path: "/settings", label: "Settings" },
];

export function IconSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, orgName } = useAuth();

  return (
    <div className="flex h-full w-16 flex-col items-center rounded-xl py-4 gap-1"
      style={{ background: "hsl(0 0% 4%)" }}>
      {/* Org avatar */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white"
      >
        {orgName?.charAt(0)?.toUpperCase() || "O"}
      </button>

      <div className="flex flex-1 flex-col gap-1">
        {navItems.map(item => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                    active ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={signOut}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Sign out</TooltipContent>
      </Tooltip>
    </div>
  );
}
