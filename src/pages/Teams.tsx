import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Envelope, Phone, UserPlus, X } from "@phosphor-icons/react";

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

  return (
    <>
      <TopBar title="Team" subtitle={`${profiles.length} members`} />
      <div className="p-6 max-w-[960px] space-y-5">
        <div className="flex items-center justify-end">
          {(currentUser.role === "sa" || currentUser.role === "org") && (
            <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
              <UserPlus size={15} /> Invite Member
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Phone</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id} onClick={() => setSelectedMember(p.id)} className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={p.name} color={p.avatar_color} size="sm" />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.phone || "—"}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{roleLabels[p.role]}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{p.dept_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Detail Modal */}
      {member && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedMember(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar name={member.name} color={member.avatar_color} size="lg" />
                  <div>
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{roleLabels[member.role]}</span>
                      {member.dept_name && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">{member.dept_name}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-t border-border pt-4">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                  <p className="flex items-center gap-1.5"><Envelope size={13} />{member.email}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Phone</p>
                  <p className="flex items-center gap-1.5"><Phone size={13} />{member.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Role</p>
                  <p>{roleLabels[member.role]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{roleDescriptions[member.role]}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Department</p>
                  <p>{member.dept_name || "—"}</p>
                </div>
              </div>

              {(currentUser.role === "sa" || currentUser.role === "org") && (
                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-sm font-semibold">Manage</p>
                  <div className="flex gap-2">
                    <button className="rounded-full border border-border bg-secondary px-3 py-1.5 text-sm hover:bg-muted transition-colors">Edit Details</button>
                    <select defaultValue={member.role} className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm pr-8 focus:outline-none focus:border-foreground/30">
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
      )}

      {/* Invite Modal */}
      {showInvite && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowInvite(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Invite Team Member</h3>
                <button onClick={() => setShowInvite(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <p className="text-sm text-muted-foreground">An invitation will be sent to their email or phone.</p>
              <div>
                <label className="text-sm font-medium">Name</label>
                <input className="mt-1 block w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" placeholder="Full name" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input type="email" className="mt-1 block w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <input className="mt-1 block w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select className="mt-1 block w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm pr-8 focus:outline-none focus:border-foreground/30">
                  <option value="dept_member">Member</option>
                  <option value="dept_head">Dept Head</option>
                  <option value="org">Organiser</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <input className="mt-1 block w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" placeholder="e.g. Lighting, Catering" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowInvite(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button onClick={() => setShowInvite(false)} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Send Invite</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
