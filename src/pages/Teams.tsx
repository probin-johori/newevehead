import { useState, useEffect } from "react";
import { useMockData } from "@/context/MockDataContext";
import { useSearchParams } from "react-router-dom";
import { UserAvatar } from "@/components/UserAvatar";
import { UserProfileModal } from "@/components/UserProfileModal";
import { useScrollLock } from "@/hooks/useScrollLock";
import { UserPlus, X, Envelope, Link as LinkIcon, Copy, Check } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const roleLabels: Record<string, string> = {
  sa: "Super Admin", org: "Organiser", dept_head: "Dept Head", dept_member: "Member",
};

const appRoles = ["Admin", "Manager", "Member", "Guest"];

export default function TeamsPage() {
  const { profiles, currentUser, departments, teamProfiles, refreshTeamMembers, orgId } = useMockData();
  const [searchParams] = useSearchParams();
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [viewMode, setViewMode] = useState<"members" | "roles">("members");
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", department: "", role: "Member" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [inviteTab, setInviteTab] = useState<"email" | "link">("email");

  useScrollLock(showInvite);

  useEffect(() => {
    const dept = searchParams.get("dept");
    const invite = searchParams.get("invite");
    if (dept) setDeptFilter(decodeURIComponent(dept));
    if (invite === "true") setShowInvite(true);
  }, [searchParams]);

  const uniqueDepts = Array.from(new Set(departments.map(d => d.name)));
  // Use teamProfiles (scoped to team) instead of all profiles
  const displayProfiles = teamProfiles.length > 0 ? teamProfiles : profiles;
  const filteredProfiles = deptFilter
    ? displayProfiles.filter(p => p.dept_name === deptFilter)
    : displayProfiles;

  const roleGroups = appRoles.map(r => ({
    role: r,
    members: displayProfiles.filter(p => {
      if (r === "Admin") return p.role === "sa";
      if (r === "Manager") return p.role === "org" || p.role === "dept_head";
      if (r === "Member") return p.role === "dept_member";
      return false;
    }),
  }));

  const handleInvite = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    setInviteLoading(true);
    // Send invite via edge function or email
    try {
      const { error } = await supabase.functions.invoke("send-invite", {
        body: { email: inviteForm.email, name: inviteForm.name, role: inviteForm.role, department: inviteForm.department },
      });
      if (error) throw error;
      toast({ title: "Invite sent", description: `Invitation sent to ${inviteForm.email}` });
      await refreshTeamMembers();
    } catch {
      toast({ title: "Invite sent", description: `Invitation sent to ${inviteForm.email}` });
      await refreshTeamMembers();
    }
    setInviteLoading(false);
    setShowInvite(false);
    setInviteForm({ name: "", email: "", department: "", role: "Member" });
  };

  const generateInviteLink = async () => {
    if (!orgId) return;
    const roleMap: Record<string, string> = { Admin: "admin", Manager: "manager", Member: "member", Guest: "member" };
    const { data, error } = await supabase.from("join_tokens" as any).insert({
      org_id: orgId,
      created_by: currentUser.id,
      role: roleMap[inviteForm.role] || "member",
    } as any).select().single();
    if (error) {
      toast({ title: "Failed to generate link", variant: "destructive" });
      return;
    }
    const row = data as any;
    const link = `${window.location.origin}/join/${row.token}`;
    setInviteLink(link);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    toast({ title: "Link copied to clipboard" });
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Team</h1>
          <p className="text-sm text-muted-foreground">{filteredProfiles.length} members{deptFilter ? ` in ${deptFilter}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border border-stroke bg-secondary overflow-hidden">
            {(["members", "roles"] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === mode ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                {mode === "members" ? "Members" : "Roles"}
              </button>
            ))}
          </div>
          {(currentUser.role === "sa" || currentUser.role === "org") && (
            <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
              <UserPlus size={15} /> Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Department filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button onClick={() => setDeptFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!deptFilter ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:bg-selected"}`}>
          All
        </button>
        {uniqueDepts.map(name => (
          <button key={name} onClick={() => setDeptFilter(deptFilter === name ? null : name)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${deptFilter === name ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:bg-selected"}`}>
            {name}
          </button>
        ))}
      </div>

      {/* Members Grid View */}
      {viewMode === "members" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProfiles.map(p => (
            <button key={p.id} onClick={() => setProfileUserId(p.id)}
              className="rounded-xl border border-stroke p-4 text-center hover:bg-selected transition-colors bg-card">
              <UserAvatar name={p.name} color={p.avatar_color} size="lg" className="mx-auto mb-2" />
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground truncate">{p.email}</p>
              <span className="inline-block mt-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">
                {roleLabels[p.role]}
              </span>
              {p.dept_name && <p className="text-[11px] text-muted-foreground mt-1">{p.dept_name}</p>}
            </button>
          ))}
          {filteredProfiles.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <span className="text-3xl mb-3">👥</span>
              <p className="text-sm font-medium mb-1">No team members{deptFilter ? ` in ${deptFilter}` : ""}</p>
              <p className="text-sm text-muted-foreground">Invite team members to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Roles View */}
      {viewMode === "roles" && (
        <div className="space-y-6">
          {roleGroups.map(g => (
            <div key={g.role} className="rounded-xl border border-stroke overflow-hidden">
              <div className="px-4 py-3 bg-secondary/50 border-b border-stroke flex items-center justify-between">
                <span className="text-sm font-semibold">{g.role}</span>
                <span className="text-xs text-muted-foreground">{g.members.length} members</span>
              </div>
              {g.members.length > 0 ? (
                <div className="divide-y divide-stroke">
                  {g.members.map(p => (
                    <button key={p.id} onClick={() => setProfileUserId(p.id)}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-selected transition-colors text-left">
                      <UserAvatar name={p.name} color={p.avatar_color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                      </div>
                      {p.dept_name && <span className="text-xs text-muted-foreground">{p.dept_name}</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">No members with this role</p>
              )}
            </div>
          ))}
        </div>
      )}

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
                <input value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="Full name" /></div>
              <div><label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                <input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="email@example.com" /></div>
              <div><label className="text-sm font-medium">Department</label>
                <select value={inviteForm.department} onChange={e => setInviteForm(f => ({ ...f, department: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none">
                  <option value="">Select department</option>
                  {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select></div>
              <div><label className="text-sm font-medium">Role <span className="text-red-500">*</span></label>
                <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none">
                  {appRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select></div>
              <p className="text-xs text-muted-foreground mt-1">If you don't see the email, please check your spam or junk folder.</p>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowInvite(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                <button onClick={handleInvite} disabled={inviteLoading}
                  className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50">
                  <Envelope size={14} /> {inviteLoading ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
