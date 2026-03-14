import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMockData, formatTimeAgo } from "@/context/MockDataContext";
import { Check, Funnel, Bell } from "@phosphor-icons/react";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { getUserNotifications, setNotifications, notifications } = useMockData();
  const userNotifs = getUserNotifications();
  const [typeFilter, setTypeFilter] = useState("all");

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filtered = typeFilter === "all" ? userNotifs : userNotifs.filter(n => n.type === typeFilter);

  // Group by time
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; items: typeof filtered }[] = [
    { label: "Today", items: filtered.filter(n => new Date(n.created_at) >= today) },
    { label: "Yesterday", items: filtered.filter(n => { const d = new Date(n.created_at); return d >= yesterday && d < today; }) },
    { label: "This Week", items: filtered.filter(n => { const d = new Date(n.created_at); return d >= weekAgo && d < yesterday; }) },
    { label: "Earlier", items: filtered.filter(n => new Date(n.created_at) < weekAgo) },
  ].filter(g => g.items.length > 0);

  const types = Array.from(new Set(userNotifs.map(n => n.type)));

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{userNotifs.filter(n => !n.read).length} unread</p>
        </div>
        <button onClick={markAllRead}
          className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">
          <Check size={14} weight="bold" /> Mark all as read
        </button>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button onClick={() => setTypeFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${typeFilter === "all" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:bg-selected"}`}>
          All
        </button>
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize ${typeFilter === t ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:bg-selected"}`}>
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Grouped notifications */}
      <div className="space-y-6">
        {groups.map(group => (
          <div key={group.label}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{group.label}</h3>
            <div className="rounded-xl border border-stroke overflow-hidden divide-y divide-stroke">
              {group.items.map(n => (
                <button key={n.id}
                  onClick={() => { markRead(n.id); if (n.link_to) navigate(n.link_to); }}
                  className={`flex w-full gap-3 px-4 py-3.5 text-left hover:bg-selected/50 transition-colors ${!n.read ? "bg-orange-50/30" : ""}`}>
                  <div className="mt-1">
                    {!n.read ? <div className="h-2.5 w-2.5 rounded-full bg-accent" /> : <div className="h-2.5 w-2.5 rounded-full bg-transparent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${!n.read ? "font-medium" : ""}`}>{n.body}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(n.created_at)}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">{n.type.replace("_", " ")}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell size={32} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No notifications to show</p>
          </div>
        )}
      </div>
    </div>
  );
}
