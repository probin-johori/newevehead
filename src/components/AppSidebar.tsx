import { NavLink, useLocation } from "react-router-dom";
import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { House, ListChecks, Receipt, FileText, UsersThree, GearSix } from "@phosphor-icons/react";

const navItems = [
  { to: "/dashboard", icon: House, label: "Home" },
  { to: "/tasks", icon: ListChecks, label: "Task" },
  { to: "/billing", icon: Receipt, label: "Billing" },
  { to: "/documents", icon: FileText, label: "Document" },
  { to: "/teams", icon: UsersThree, label: "Team" },
];

export function AppSidebar() {
  const { currentUser } = useMockData();
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(to);
  };

  return (
    <aside className="fixed left-0 top-[52px] z-20 flex h-[calc(100vh-52px)] w-16 flex-col items-center border-r border-border bg-background py-3">
      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map(item => {
          const active = isActive(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 transition-colors w-14 ${
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon size={20} weight={active ? "fill" : "regular"} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2 pb-2">
        <NavLink
          to="/settings"
          className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 transition-colors w-14 ${
            location.pathname.startsWith("/settings")
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <GearSix size={20} weight={location.pathname.startsWith("/settings") ? "fill" : "regular"} />
          <span className="text-[10px] font-medium">Settings</span>
        </NavLink>
        <NavLink to="/settings" className="mt-1">
          <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
        </NavLink>
        <span className="text-[9px] text-muted-foreground font-medium text-center leading-tight">
          {currentUser.name.split(' ')[0]}<br/>{currentUser.name.split(' ')[1]}
        </span>
      </div>
    </aside>
  );
}
