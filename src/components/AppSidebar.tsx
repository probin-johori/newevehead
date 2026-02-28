import { NavLink, useLocation } from "react-router-dom";
import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { SquaresFour, CalendarDots, CheckSquare, Receipt, FolderOpen, GearSix, UsersThree } from "@phosphor-icons/react";

const navItems = [
  { to: "/dashboard", icon: SquaresFour, label: "Dashboard" },
  { to: "/events", icon: CalendarDots, label: "Events" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/billing", icon: Receipt, label: "Billing" },
  { to: "/documents", icon: FolderOpen, label: "Documents" },
  { to: "/teams", icon: UsersThree, label: "Teams" },
  { to: "/settings", icon: GearSix, label: "Settings" },
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
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-56 flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-sm font-semibold">
          E
        </div>
        <span className="text-[15px] font-medium tracking-tight">EventOps</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 mt-2">
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-normal transition-colors ${
                isActive
                  ? "bg-white/12 text-white"
                  : "text-white/50 hover:bg-white/8 hover:text-white/80"
              }`}
            >
              <item.icon size={17} weight={isActive ? "fill" : "regular"} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/8 p-4 space-y-3">
        <div className="flex items-center gap-2 rounded-md bg-white/8 px-3 py-1.5">
          <span className="text-xs font-normal capitalize">{subscription.plan}</span>
          <span className="text-[10px] text-white/30">·</span>
          <span className="text-xs text-white/40">{subscription.slots_used}/{subscription.slots_total} slots</span>
        </div>
        <NavLink to="/settings" className="flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-white/5 transition-colors">
          <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-normal">{currentUser.name}</p>
            <p className="text-[10px] text-white/40">{roleLabels[currentUser.role]}</p>
          </div>
        </NavLink>
      </div>
    </aside>
  );
}
