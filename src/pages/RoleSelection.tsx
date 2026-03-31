import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, Role } from "@/context/AuthContext";
import { ShieldCheck, Users, UserGear, User } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";

const roles: { role: Role; icon: typeof ShieldCheck; title: string; desc: string }[] = [
  { role: "sa", icon: ShieldCheck, title: "Super Admin (SA)", desc: "Full system access, billing & analytics" },
  { role: "org", icon: Users, title: "Organiser / POC", desc: "Manages events & departments" },
  { role: "dept_head", icon: UserGear, title: "Department Head", desc: "Manages dept tasks & reimbursements" },
  { role: "dept_member", icon: User, title: "Department Member", desc: "View & update own assigned tasks" },
];

export default function RoleSelectionPage() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSelect = async (role: Role) => {
    setLoading(true);
    const { error } = await selectRole(role);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">Choose your role</h1>
          <p className="text-sm text-muted-foreground mt-2">This determines what you can access in EveHead</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {roles.map(r => (
            <button
              key={r.role}
              onClick={() => handleSelect(r.role)}
              disabled={loading}
              className="group flex flex-col items-start gap-3 rounded-xl border border-stroke bg-card p-6 text-left transition-all hover:border-accent hover:bg-selected disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground group-hover:bg-accent group-hover:text-white transition-colors">
                <r.icon size={20} />
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
