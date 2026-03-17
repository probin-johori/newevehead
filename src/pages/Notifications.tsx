import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMockData, formatTimeAgo } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Check } from "@phosphor-icons/react";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { getUserNotifications, markNotificationRead, markAllNotificationsRead, getProfile } = useMockData();
  const userNotifs = getUserNotifications();
  const [tab, setTab] = useState<"all" | "unread">("all");

  const markAllRead = () => markAllNotificationsRead();
  const markRead = (id: string) => markNotificationRead(id);

  const filtered = tab === "unread" ? userNotifs.filter(n => !n.read) : userNotifs;

  // Group by time
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; items: typeof filtered }[] = [
    { label: "Today", items: filtered.filter(n => new Date(n.created_at) >= today) },
    { label: "Yesterday", items: filtered.filter(n => { const d = new Date(n.created_at); return d >= yesterday && d < today; }) },
    { label: "This Week", items: filtered.filter(n => { const d = new Date(n.created_at); return d >= weekAgo && d < yesterday; }) },
    { label: "Earlier", items: filtered.filter(n => new Date(n.created_at) < weekAgo) },
  ].filter(g => g.items.length > 0);

  return (
    <div className="p-6 w-full max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <button onClick={markAllRead}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Check size={14} weight="bold" /> Mark all as read
        </button>
      </div>

      {/* Tabs: All | Unread */}
      <div className="flex items-center gap-0 border-b border-stroke mb-6">
        {(["all", "unread"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t ? "text-foreground border-b-2 border-foreground -mb-px" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "all" ? "All" : "Unread"}
          </button>
        ))}
      </div>

      {/* Grouped notifications — clean list */}
      <div className="space-y-6">
        {groups.map(group => (
          <div key={group.label}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{group.label}</h3>
            <div className="divide-y divide-stroke/50">
              {group.items.map(n => (
                <button key={n.id}
                  onClick={() => { markRead(n.id); if (n.link_to) navigate(n.link_to); }}
                  className="flex w-full items-center gap-3 py-3 text-left hover:bg-secondary/30 transition-colors rounded-lg px-2 -mx-2">
                  <div className="shrink-0">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm">
                      {n.type === "billing" ? "💳" : n.type === "comment" ? "💬" : n.type === "mention" ? "📢" : n.type === "task_overdue" ? "⚠️" : n.type === "task_completed" ? "✅" : n.type === "document" ? "📄" : n.type === "team" ? "👤" : "🔔"}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? "font-medium" : ""}`}>{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <div className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                </button>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-3xl mb-3">🔔</span>
            <p className="text-sm text-muted-foreground">No notifications to show</p>
          </div>
        )}
      </div>
    </div>
  );
}
