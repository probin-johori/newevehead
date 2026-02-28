import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { useMockData } from "@/context/MockDataContext";

export function TopBar({ title }: { title: string }) {
  const { getUserNotifications, setNotifications, notifications } = useMockData();
  const [open, setOpen] = useState(false);
  const userNotifs = getUserNotifications();
  const unreadCount = userNotifs.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-xl font-serif">{title}</h1>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <Bell className="h-4.5 w-4.5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-11 z-50 w-[350px] rounded-lg border border-border bg-card shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold">Notifications</span>
                <button onClick={markAllRead} className="text-xs text-accent-mid hover:underline flex items-center gap-1">
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {userNotifs.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No notifications</p>
                ) : (
                  userNotifs.map(n => (
                    <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-border/50 ${!n.read ? "bg-accent-light" : ""}`}>
                      {!n.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-mid" />}
                      <div className={!n.read ? "" : "pl-5"}>
                        <p className="text-sm">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
