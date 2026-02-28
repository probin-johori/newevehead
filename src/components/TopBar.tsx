import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check } from "@phosphor-icons/react";
import { useMockData } from "@/context/MockDataContext";

export function TopBar({ title }: { title: string }) {
  const { getUserNotifications, setNotifications, notifications } = useMockData();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const userNotifs = getUserNotifications();
  const unreadCount = userNotifs.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotifClick = (n: typeof userNotifs[0]) => {
    // Mark as read
    setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
    setOpen(false);
    if (n.link_to) {
      navigate(n.link_to);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-xl font-serif">{title}</h1>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <Bell size={18} weight={unreadCount > 0 ? "fill" : "regular"} className="text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-11 z-50 w-[380px] rounded-xl border border-border bg-card shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold">Notifications</span>
                <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  <Check size={12} weight="bold" /> Mark all read
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {userNotifs.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No notifications</p>
                ) : (
                  userNotifs.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`flex w-full gap-3 px-4 py-3 text-left border-b border-border/50 hover:bg-secondary/50 transition-colors ${!n.read ? "bg-accent-light" : ""}`}
                    >
                      {!n.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-mid" />}
                      <div className={!n.read ? "" : "pl-5"}>
                        <p className="text-sm leading-snug">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleDateString()} · {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
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
