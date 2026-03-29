import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useScrollLock } from "@/hooks/useScrollLock";
import { X, Envelope, Phone } from "@phosphor-icons/react";

const roleLabels: Record<string, string> = {
  sa: "Super Admin", org: "Organiser", dept_head: "Dept Head", dept_member: "Member",
};

interface UserProfileModalProps {
  userId: string | null;
  onClose: () => void;
}

export function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const { getProfile } = useMockData();
  useScrollLock(!!userId);

  if (!userId) return null;
  const user = getProfile(userId);
  if (!user) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-card border border-stroke p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] space-y-5"
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