import { NavLink, useLocation } from "react-router-dom";
import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { LayoutDashboard, CalendarDays, CheckSquare, Receipt, Wallet, FolderOpen, Settings } from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/events", icon: CalendarDays, label: "Events" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/reimbursements", icon: Receipt, label: "Reimbursements" },
  { to: "/budget", icon: Wallet, label: "Budget" },
  { to: "/documents", icon: FolderOpen, label: "Documents" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const roleLabels: Record<string, string> = {
  sa: "Super Admin",
  org: "Organiser",
  dept_head: "Dept Head",
  dept_member: "Member",
};

export function AppSidebar() {
  const { currentUser, subscription } = useMockData();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col bg-primary text-primary-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 font-serif text-lg font-bold">
          E
        </div>
        <span className="text-lg font-semibold tracking-tight">EventOps</span>
      </div>

      <div className="px-3 py-1">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/50">
          Navigation
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/12 p-4 space-y-3">
        <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5">
          <span className="text-xs font-medium capitalize">{subscription.plan}</span>
          <span className="text-[10px] text-white/60">·</span>
          <span className="text-xs text-white/70">{subscription.slots_used}/{subscription.slots_total} slots</span>
        </div>
        <div className="flex items-center gap-2.5">
          <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{currentUser.name}</p>
            <p className="text-[10px] text-white/60">{roleLabels[currentUser.role]}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
