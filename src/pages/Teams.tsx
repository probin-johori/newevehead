import { useState } from "react";
import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useScrollLock } from "@/hooks/useScrollLock";
import { Envelope, Phone, UserPlus, X } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";

const roleLabels: Record<string, string> = {
  sa: "Super Admin", org: "Organiser", dept_head: "Dept Head", dept_member: "Member",
};

const accessLevels = ["View Only", "Can Comment", "Can Edit", "Admin"];

export default function TeamsPage() {
  const { profiles, currentUser } = useMockData();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [accessMap, setAccessMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    profiles.forEach(p => {
      if (p.role === "sa") map[p.id] = "Admin";
      else if (p.role === "org") map[p.id] = "Can Edit";
      else if (p.role === "dept_head") map[p.id] = "Can Edit";
      else map[p.id] = "Can Comment";
    });
    return map;
  });

  const member = selectedMember ? profiles.find(p => p.id === selectedMember) : null;

  useScrollLock(!!selectedMember || showInvite);

  const handleAccessChange = (userId: string, level: string) => {
    setAccessMap(prev => ({ ...prev, [userId]: level }));
    toast({ title: "Access updated", description: `Access level changed to "${level}"` });
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Team</h1>
          <p className="text-sm text-muted-foreground">{profiles.length} members</p>
        </div>
        {(currentUser.role === "sa" || currentUser.role === "org") && (
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
            <UserPlus size={15} /> Invite Member
          </button>
        )}
      </div>

      <div className="rounded-xl border border-stroke overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Phone</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Access Level</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors cursor-pointer" onClick={() => setSelectedMember(p.id)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={p.name} color={p.avatar_color} size="sm" />
                    <span className="font-medium">{p.name}</span>
                    {p.role === "sa" && <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0 text-[10px] font-medium">SA</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.phone || "—"}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{roleLabels[p.role]}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{p.dept_name || "—"}</td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  {(currentUser.role === "sa" || currentUser.role === "org") ? (
                    <select
                      value={accessMap[p.id] || "View Only"}
                      onChange={e => handleAccessChange(p.id, e.target.value)}
                      disabled={p.role === "sa" && currentUser.role !== "sa"}
                      className="rounded-full border border-stroke bg-secondary px-2.5 py-1 text-xs font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {accessLevels.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs text-muted-foreground">{accessMap[p.id] || "View Only"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Member Detail Modal */}
      {member && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedMember(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-card border border-stroke p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] space-y-5">
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

              <div className="grid grid-cols-2 gap-4 text-sm border-t border-stroke pt-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                  <p className="flex items-center gap-1.5"><Envelope size={13} />{member.email}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Phone</p>
                  <p className="flex items-center gap-1.5"><Phone size={13} />{member.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Access Level</p>
                  <p className="text-sm">{accessMap[member.id] || "View Only"}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowInvite(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-card border border-stroke p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Invite Team Member</h3>
                <button onClick={() => setShowInvite(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div>
                <label className="text-sm font-medium">Name</label>
                <input className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="Full name" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input type="email" className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <input className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="e.g. Lighting, Catering" />
              </div>
              <div>
                <label className="text-sm font-medium">Access Level</label>
                <select className="mt-1 block w-full rounded-full border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none">
                  {accessLevels.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowInvite(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                <button onClick={() => { setShowInvite(false); toast({ title: "Invite sent" }); }} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Send Invite</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
