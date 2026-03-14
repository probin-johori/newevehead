import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, Bell, Check, CaretDown, GearSix, SignOut, User, Plus, CheckCircle } from "@phosphor-icons/react";
import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";

export function TopBar() {
  const { getUserNotifications, setNotifications, notifications, currentUser, logout, organisations } = useMockData();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const navigate = useNavigate();
  const userNotifs = getUserNotifications();
  const unreadCount = userNotifs.filter(n => !n.read).length;
  const profileRef = useRef<HTMLDivElement>(null);
  const orgRef = useRef<HTMLDivElement>(null);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotifClick = (n: typeof userNotifs[0]) => {
    setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
    setNotifOpen(false);
    if (n.link_to) navigate(n.link_to);
  };

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  useEffect(() => {
    if (!orgOpen) return;
    const handler = (e: MouseEvent) => {
      if (orgRef.current && !orgRef.current.contains(e.target as Node)) setOrgOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [orgOpen]);

  const roleLabels: Record<string, string> = {
    sa: "Super Admin", org: "Organiser", dept_head: "Dept Head", dept_member: "Member",
  };

  const activeOrg = organisations.find(o => o.active);

  return (
    <header className="flex h-[52px] items-center justify-between px-5 bg-page-bg shrink-0 sticky top-0 z-30">
      {/* Left: Org switcher */}
      <div className="relative" ref={orgRef}>
        <button
          onClick={() => setOrgOpen(!orgOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-rose-500 text-[10px] font-bold text-white">
            ZH
          </div>
          {activeOrg?.name || "Zero Hour Events"}
          <CaretDown size={12} className="text-muted-foreground" />
        </button>
        {orgOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOrgOpen(false)} />
            <div className="absolute left-0 top-10 z-50 w-[260px] rounded-xl border border-stroke bg-card shadow-[0_4px_16px_rgba(0,0,0,0.10)] py-1">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Organisations</div>
              {organisations.map(org => (
                <button
                  key={org.id}
                  onClick={() => setOrgOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-selected transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-rose-500 text-[9px] font-bold text-white shrink-0">
                    {org.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </div>
                  <span className="flex-1 text-left truncate font-medium">{org.name}</span>
                  {org.active && <CheckCircle size={16} weight="fill" className="text-accent shrink-0" />}
                </button>
              ))}
              <div className="border-t border-stroke mt-1 pt-1">
                <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-selected transition-colors">
                  <Plus size={16} /> Add Organisation
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: Search + Notifications + Profile */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-background border border-stroke px-4 py-1.5 w-[240px]">
          <MagnifyingGlass size={14} className="text-muted-foreground" />
          <input type="text" placeholder="Search" className="bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none w-full" />
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
              <div className="absolute right-0 top-10 z-50 w-[380px] rounded-xl border border-stroke bg-card shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
                <div className="flex items-center justify-between border-b border-stroke px-4 py-3">
                  <span className="text-sm font-semibold">Notifications</span>
                  <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    <Check size={12} weight="bold" /> Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {userNotifs.slice(0, 7).length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
                  ) : (
                    userNotifs.slice(0, 7).map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`flex w-full gap-3 px-4 py-3 text-left border-b border-stroke/50 hover:bg-secondary/50 transition-colors ${!n.read ? "bg-orange-50/50" : ""}`}
                      >
                        {!n.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                        <div className={!n.read ? "" : "pl-5"}>
                          <p className="text-sm leading-snug">{n.body}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <button
                  onClick={() => { setNotifOpen(false); navigate("/notifications"); }}
                  className="flex w-full items-center justify-center py-3 text-xs font-medium text-accent hover:text-accent/80 border-t border-stroke transition-colors"
                >
                  See all notifications
                </button>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-1.5">
            <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
          </button>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-10 z-50 w-[240px] rounded-xl border border-stroke bg-card shadow-[0_4px_16px_rgba(0,0,0,0.10)] py-2">
                <div className="px-4 py-2 border-b border-stroke">
                  <p className="text-sm font-semibold">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{roleLabels[currentUser.role]}</p>
                </div>
                <div className="py-1">
                  <button onClick={() => { setProfileOpen(false); navigate("/settings?tab=profile"); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-selected transition-colors">
                    <User size={15} /> My Profile
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-selected transition-colors">
                    <GearSix size={15} /> Settings
                  </button>
                </div>
                <div className="border-t border-stroke pt-1">
                  <button onClick={() => { setProfileOpen(false); logout(); navigate("/login"); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-selected transition-colors">
                    <SignOut size={15} /> Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
