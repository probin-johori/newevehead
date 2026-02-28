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
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col bg-primary text-primary-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 font-serif text-lg font-bold">
          E
        </div>
        <span className="text-lg font-light tracking-tight">EventOps</span>
      </div>

      <div className="px-3 py-1">
        <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-widest text-white/40">
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
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-light tracking-wide transition-colors ${
                isActive
                  ? "bg-white/15 text-white font-normal"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon size={18} weight={isActive ? "fill" : "regular"} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5">
          <span className="text-xs font-light capitalize">{subscription.plan}</span>
          <span className="text-[10px] text-white/40">·</span>
          <span className="text-xs text-white/50 font-light">{subscription.slots_used}/{subscription.slots_total} slots</span>
        </div>
        <NavLink to="/settings" className="flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-white/5 transition-colors">
          <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-light">{currentUser.name}</p>
            <p className="text-[10px] text-white/50 font-light">{roleLabels[currentUser.role]}</p>
          </div>
        </NavLink>
      </div>
    </aside>
  );
}
