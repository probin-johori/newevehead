import { NavLink, useLocation } from "react-router-dom";
import { House, ListChecks, Buildings, Receipt, FileText, UsersThree } from "@phosphor-icons/react";

const navItems = [
  { to: "/dashboard", icon: House, label: "Home" },
  { to: "/tasks", icon: ListChecks, label: "Tasks" },
  { to: "/departments", icon: Buildings, label: "Depts" },
  { to: "/billing", icon: Receipt, label: "Billing" },
  { to: "/documents", icon: FileText, label: "Docs" },
  { to: "/teams", icon: UsersThree, label: "Teams" },
];

export function MobileBottomNav() {
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === "/dashboard") return location.pathname === "/dashboard" || location.pathname.startsWith("/events");
    return location.pathname.startsWith(to);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-card border-t border-stroke px-1 py-1 md:hidden safe-area-bottom">
      {navItems.map(item => {
        const active = isActive(item.to);
        return (
          <NavLink key={item.to} to={item.to === "/dashboard" ? "/events/e1" : item.to}
            className={`flex flex-col items-center gap-0.5 px-2 py-2 min-h-[44px] min-w-[44px] rounded-lg transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}>
            <item.icon size={20} weight={active ? "fill" : "regular"} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
