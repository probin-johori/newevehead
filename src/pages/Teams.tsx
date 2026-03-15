import { useState } from "react";
import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { UserProfileModal } from "@/components/UserProfileModal";
import { useScrollLock } from "@/hooks/useScrollLock";
import { UserPlus, X } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";

const roleLabels: Record<string, string> = {
  sa: "Super Admin", org: "Organiser", dept_head: "Dept Head", dept_member: "Member",
};

const appRoles = ["Admin", "Manager", "Member", "Guest"];

export default function TeamsPage() {
  const { profiles, currentUser } = useMockData();
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  useScrollLock(showInvite);

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
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors cursor-pointer" onClick={() => setProfileUserId(p.id)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={p.name} color={p.avatar_color} size="sm" />
                    <span className="font-medium">{p.name}</span>
                    {p.role === "sa" && <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0 text-[10px] font-medium">SA</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{roleLabels[p.role]}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{p.dept_name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowInvite(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-card border border-stroke p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] space-y-4"
              onKeyDown={e => e.key === "Escape" && setShowInvite(false)}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Invite Team Member</h3>
                <button onClick={() => setShowInvite(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div><label className="text-sm font-medium">Name <span className="text-red-500">*</span></label>
                <input className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="Full name" /></div>
              <div><label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                <input type="email" className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="email@example.com" /></div>
              <div><label className="text-sm font-medium">Department</label>
                <input className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="e.g. Lighting, Catering" /></div>
              <div><label className="text-sm font-medium">Role <span className="text-red-500">*</span></label>
                <select className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none">
                  {appRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select></div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowInvite(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                <button onClick={() => { setShowInvite(false); toast({ title: "Invite sent" }); }}
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Send Invite</button>
              </div>
            </div>
          </div>
        </>
      )}

      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
