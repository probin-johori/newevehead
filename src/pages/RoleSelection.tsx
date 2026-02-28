import { useNavigate } from "react-router-dom";
import { useMockData, Role } from "@/context/MockDataContext";
import { ShieldCheck, Users, UserCog, User } from "lucide-react";

const roles: { role: Role; icon: typeof ShieldCheck; title: string; desc: string }[] = [
  { role: "sa", icon: ShieldCheck, title: "Super Admin (SA)", desc: "Full system access, billing & analytics" },
  { role: "org", icon: Users, title: "Organiser / POC", desc: "Manages events & departments" },
  { role: "dept_head", icon: UserCog, title: "Department Head", desc: "Manages dept tasks & reimbursements" },
  { role: "dept_member", icon: User, title: "Department Member", desc: "View & update own assigned tasks" },
];

export default function RoleSelectionPage() {
  const { selectRole } = useMockData();
  const navigate = useNavigate();

  const handleSelect = (role: Role) => {
    selectRole(role);
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif">Choose your role</h1>
          <p className="text-sm text-muted-foreground mt-2">This determines what you can access in EventOps</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {roles.map(r => (
            <button
              key={r.role}
              onClick={() => handleSelect(r.role)}
              className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:border-accent-mid hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light text-accent-mid group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <r.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="text-sm text-muted-foreground">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
