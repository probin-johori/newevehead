import { Bell, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export function AppHeader() {
  const { profile, user, signOut, orgName } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = () => {
      supabase.from("notifications").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(50)
        .then(({ data }) => {
          setNotifications(data || []);
          setUnreadCount(data?.filter(n => !n.read).length || 0);
        });
    };
    load();
    const ch = supabase.channel("header-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  const handleNotifClick = async (n: any) => {
    await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    if (n.link_to) navigate(n.link_to);
    setShowNotifs(false);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-6">
      {/* Org name */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{orgName}</span>
      </div>

      {/* Search - centered */}
      <div className="relative ml-auto max-w-sm flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-9 rounded-full bg-muted pl-9 text-sm" placeholder="Search events, tasks, people..." />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <Sheet open={showNotifs} onOpenChange={setShowNotifs}>
          <SheetTrigger asChild>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle>Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-muted-foreground hover:underline">Mark all read</button>
                )}
              </div>
            </SheetHeader>
            <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
              <div className="space-y-1">
                {notifications.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>}
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors ${n.read ? "opacity-60" : "bg-accent/50"} hover:bg-accent`}
                  >
                    <span className="text-sm">{n.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: profile?.avatar_color || "#6b21a8" }}
            >
              {profile?.name?.charAt(0)?.toUpperCase() || "U"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-3 py-2 text-sm">
              <p className="font-medium">{profile?.name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
