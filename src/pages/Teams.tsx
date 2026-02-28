import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Envelope, Phone, PencilSimple, UserPlus, CaretRight, ArrowLeft } from "@phosphor-icons/react";

const roleLabels: Record<string, string> = {
  sa: "Super Admin", org: "Organiser", dept_head: "Dept Head", dept_member: "Member",
};

const roleDescriptions: Record<string, string> = {
  sa: "Full system access, billing, analytics, approval",
  org: "Manages events, departments, and teams",
  dept_head: "Manages department tasks, verifies bills",
  dept_member: "Views & updates assigned tasks, uploads bills",
};

export default function TeamsPage() {
  const { profiles, currentUser } = useMockData();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const member = selectedMember ? profiles.find(p => p.id === selectedMember) : null;

  if (member) {
    return (
      <>
        <TopBar title="Team Member" />
        <div className="p-6 space-y-6 max-w-2xl">
          <button onClick={() => setSelectedMember(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back to Teams
          </button>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <UserAvatar name={member.name} color={member.avatar_color} size="lg" />
              <div>
                <h2 className="text-2xl font-serif">{member.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">{roleLabels[member.role]}</span>
                  {member.dept_name && <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{member.dept_name}</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-5">
              <div className="flex items-center gap-3">
                <Envelope size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="text-sm">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Phone</p>
                  <p className="text-sm">{member.phone || "Not provided"}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Role</p>
                <p className="text-sm mt-1">{roleLabels[member.role]}</p>
                <p className="text-[11px] text-muted-foreground">{roleDescriptions[member.role]}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Department</p>
                <p className="text-sm mt-1">{member.dept_name || "—"}</p>
              </div>
            </div>

            {(currentUser.role === "sa" || currentUser.role === "org") && (
              <div className="border-t border-border pt-5 space-y-3">
                <h4 className="text-sm font-semibold">Manage</h4>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-1.5">
                    <PencilSimple size={14} /> Edit Details
                  </button>
                  <select defaultValue={member.role} className="rounded-lg border border-input bg-background px-3 py-2 text-sm pr-8">
                    <option value="sa">Super Admin</option>
                    <option value="org">Organiser</option>
                    <option value="dept_head">Dept Head</option>
                    <option value="dept_member">Member</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Teams" />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{profiles.length} team members</p>
          </div>
          {(currentUser.role === "sa" || currentUser.role === "org") && (
            <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <UserPlus size={16} /> Invite Member
            </button>
          )}
        </div>

        {/* Invite Modal */}
        {showInvite && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowInvite(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
                <h3 className="text-xl font-serif">Invite Team Member</h3>
                <p className="text-sm text-muted-foreground">An invitation will be sent to their email or phone.</p>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Full name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <input className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pr-8">
                    <option value="dept_member">Member</option>
                    <option value="dept_head">Dept Head</option>
                    <option value="org">Organiser</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Department</label>
                  <input className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Lighting, Catering" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowInvite(false)} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-secondary transition-colors">Cancel</button>
                  <button onClick={() => setShowInvite(false)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Send Invite</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Team List */}
        <div className="space-y-2">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedMember(p.id)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <UserAvatar name={p.name} color={p.avatar_color} size="md" />
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Envelope size={12} /> {p.email}</span>
                    {p.phone && <span className="flex items-center gap-1"><Phone size={12} /> {p.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">{roleLabels[p.role]}</span>
                {p.dept_name && <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{p.dept_name}</span>}
                <CaretRight size={14} className="text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
