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
    if (to === "/dashboard") return location.pathname === "/dashboard" || location.pathname.startsWith("/events");
    return location.pathname.startsWith(to);
  };

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[70px] flex-col items-center p-2">
      <div className="flex h-full w-full flex-col items-center rounded-2xl bg-sidebar py-3 shadow-lg">
        {/* Logo */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-rose-500 text-[11px] font-bold text-white mb-4">
          ZH
        </div>

        <nav className="flex flex-1 flex-col items-center gap-0.5">
          {navItems.map(item => {
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
          <NavLink to="/settings" className="mt-1">
            <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
          </NavLink>
          <span className="text-[9px] text-white/50 font-medium text-center leading-tight mt-0.5">
            My Account
          </span>
        </div>
      </div>
    </aside>
  );
}
