import { House, CalendarBlank, Users, Receipt, Folder, Gear, Lightning } from "@phosphor-icons/react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: House, to: "/", label: "Dashboard" },
  { icon: CalendarBlank, to: "/events", label: "Events" },
  { icon: Users, to: "/teams", label: "Teams" },
  { icon: Receipt, to: "/billing", label: "Billing" },
  { icon: Folder, to: "/documents", label: "Documents" },
];

const IconSidebar = () => {
  const { user } = useAuth();
  const initials = (user?.user_metadata?.full_name ?? "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen w-16 flex-col items-center bg-sidebar py-4">
      {/* Logo */}
      <div className="mb-8 flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
        <Lightning size={20} weight="fill" className="text-accent-foreground" />
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map(({ icon: Icon, to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            activeClassName="bg-sidebar-accent text-sidebar-foreground"
            title={label}
          >
            <Icon size={20} />
          </NavLink>
        ))}
      </nav>

      {/* Settings + Avatar */}
      <div className="flex flex-col items-center gap-2">
        <NavLink
          to="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          activeClassName="bg-sidebar-accent text-sidebar-foreground"
          title="Settings"
        >
          <Gear size={20} />
        </NavLink>
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
          {initials}
        </div>
      </div>
    </div>
  );
};

export default IconSidebar;
