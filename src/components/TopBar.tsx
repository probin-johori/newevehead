import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, Bell, Check, CaretDown } from "@phosphor-icons/react";
import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";

export function TopBar() {
  const { getUserNotifications, setNotifications, notifications, currentUser } = useMockData();
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const userNotifs = getUserNotifications();
  const unreadCount = userNotifs.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotifClick = (n: typeof userNotifs[0]) => {
    setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
    setNotifOpen(false);
    if (n.link_to) navigate(n.link_to);
  };

  return (
    <header className="flex h-[52px] items-center justify-between px-5 bg-page-bg shrink-0">
      {/* Left: Logo + org name */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-rose-500 text-[10px] font-bold text-white">
          ZH
        </div>
        <button className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors">
          Zero Hour Events
          <CaretDown size={12} className="text-muted-foreground" />
        </button>
      </div>

      {/* Right: Search + Notifications + Avatar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-background border border-stroke px-4 py-1.5 w-[240px]">
          <MagnifyingGlass size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none w-full"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-background transition-colors"
          >
            <Bell size={18} weight={unreadCount > 0 ? "fill" : "regular"} className="text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-10 z-50 w-[360px] rounded-xl border border-stroke bg-card shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
                <div className="flex items-center justify-between border-b border-stroke px-4 py-3">
                  <span className="text-sm font-semibold">Notifications</span>
                  <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    <Check size={12} weight="bold" /> Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {userNotifs.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
                  ) : (
                    userNotifs.map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`flex w-full gap-3 px-4 py-3 text-left border-b border-stroke/50 hover:bg-secondary/50 transition-colors ${!n.read ? "bg-orange-50/50" : ""}`}
                      >
                        {!n.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                        <div className={!n.read ? "" : "pl-5"}>
                          <p className="text-sm leading-snug">{n.body}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(n.created_at).toLocaleDateString()}
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

        {/* Avatar */}
        <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
      </div>
    </header>
  );
}
