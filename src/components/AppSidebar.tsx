import { NavLink, useLocation } from "react-router-dom";
import { House, ListChecks, Buildings, Receipt, FileText, UsersThree, GearSix } from "@phosphor-icons/react";

const navItems = [
  { to: "/dashboard", icon: House, label: "Home" },
  { to: "/tasks", icon: ListChecks, label: "Tasks" },
  { to: "/departments", icon: Buildings, label: "Depts" },
  { to: "/billing", icon: Receipt, label: "Billing" },
  { to: "/documents", icon: FileText, label: "Docs" },
  { to: "/teams", icon: UsersThree, label: "Teams" },
];

export function AppSidebar() {
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === "/dashboard") return location.pathname === "/dashboard" || location.pathname.startsWith("/events");
    return location.pathname.startsWith(to);
  };

  return (
    <aside className="flex w-[70px] flex-col items-center shrink-0">
      <div className="flex h-full w-full flex-col items-center bg-sidebar py-3 rounded-xl">
        <nav className="flex flex-1 flex-col items-center gap-0.5">
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to === "/dashboard" ? "/events/e1" : item.to}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition-colors w-[54px] ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon size={20} weight={active ? "fill" : "regular"} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-1 pb-2">
          <NavLink
            to="/settings"
            className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition-colors w-[54px] ${
              location.pathname.startsWith("/settings")
                ? "bg-white/15 text-white"
                : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <GearSix size={20} weight={location.pathname.startsWith("/settings") ? "fill" : "regular"} />
            <span className="text-[10px] font-medium">Settings</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
