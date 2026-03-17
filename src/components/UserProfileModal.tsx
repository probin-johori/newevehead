import { useState, useEffect } from "react";
import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useScrollLock } from "@/hooks/useScrollLock";
import { X, Envelope, Phone, Shield } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

const roleLabels: Record<string, string> = {
  sa: "Super Admin", org: "Organiser", dept_head: "Dept Head", dept_member: "Member",
};

const teamRoleOptions = [
  { value: "admin", label: "Admin", description: "View, Edit, Manage, Invite" },
  { value: "manager", label: "Manager", description: "View, Edit, Manage" },
  { value: "member", label: "Member", description: "View, Edit" },
  { value: "guest", label: "Guest", description: "View only" },
];

interface UserProfileModalProps {
  userId: string | null;
  onClose: () => void;
}

export function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const { getProfile, events, currentUser, teamMembers } = useMockData();
  const [eventAccess, setEventAccess] = useState<Record<string, boolean>>({});
  const [memberRole, setMemberRole] = useState<string>("member");
  const [loading, setLoading] = useState(false);

  useScrollLock(!!userId);

  // Fetch event access and team role when modal opens
  useEffect(() => {
    if (!userId) return;
    // Fetch admin_event_access
    supabase.from("admin_event_access").select("event_id").eq("admin_id", userId)
      .then(({ data }) => {
        const acc: Record<string, boolean> = {};
        if (data) data.forEach((row: any) => { acc[row.event_id] = true; });
        setEventAccess(acc);
      });
    // Get team member role
    const tm = teamMembers.find(m => m.user_id === userId);
    if (tm) setMemberRole(tm.role);
  }, [userId, teamMembers]);

  if (!userId) return null;
  const user = getProfile(userId);
  if (!user) return null;

  const isCurrentUser = userId === currentUser.id;
  const canManage = currentUser.role === "sa" || currentUser.role === "org";

  const toggleEventAccess = async (eventId: string) => {
    setLoading(true);
    if (eventAccess[eventId]) {
      await supabase.from("admin_event_access").delete().eq("admin_id", userId).eq("event_id", eventId);
      setEventAccess(prev => ({ ...prev, [eventId]: false }));
    } else {
      await supabase.from("admin_event_access").insert({ admin_id: userId, event_id: eventId });
      setEventAccess(prev => ({ ...prev, [eventId]: true }));
    }
    setLoading(false);
  };

  const handleRoleChange = async (newRole: string) => {
    setMemberRole(newRole);
    const tm = teamMembers.find(m => m.user_id === userId);
    if (tm) {
      await supabase.from("team_members").update({ role: newRole }).eq("id", tm.id);
      toast({ title: "Role updated" });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-card border border-stroke p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] space-y-5 max-h-[80vh] overflow-y-auto"
          onKeyDown={e => e.key === "Escape" && onClose()}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar name={user.name} color={user.avatar_color} size="lg" />
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{roleLabels[user.role]}</span>
                  {user.dept_name && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">{user.dept_name}</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm border-t border-stroke pt-4">
            <div className="flex items-center gap-2">
              <Envelope size={14} className="text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-muted-foreground" />
              <span>{user.phone || "Not provided"}</span>
            </div>
          </div>

          {/* Role Management */}
          {canManage && !isCurrentUser && (
            <div className="border-t border-stroke pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-muted-foreground" />
                <h4 className="text-sm font-semibold">Role</h4>
              </div>
              <select
                value={memberRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none"
              >
                {teamRoleOptions.map(r => (
                  <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                ))}
              </select>
            </div>
          )}

          {/* Event Access */}
          {canManage && events.length > 0 && (
            <div className="border-t border-stroke pt-4">
              <h4 className="text-sm font-semibold mb-3">Event Access</h4>
              <p className="text-xs text-muted-foreground mb-3">Grant or revoke access to specific events</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {events.map(ev => (
                  <label key={ev.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
                    <Checkbox
                      checked={!!eventAccess[ev.id]}
                      onCheckedChange={() => toggleEventAccess(ev.id)}
                      disabled={loading}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ev.name}</p>
                      <p className="text-[11px] text-muted-foreground">{ev.status}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface ClickableUserProps {
  userId: string;
  children: React.ReactNode;
  onOpenProfile: (userId: string) => void;
}

export function ClickableUser({ userId, children, onOpenProfile }: ClickableUserProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpenProfile(userId); }}
      className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
    >
      {children}
    </button>
  );
}
