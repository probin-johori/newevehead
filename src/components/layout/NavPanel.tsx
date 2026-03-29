import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, BarChart3, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function NavPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orgId, user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");

  useEffect(() => {
    if (!orgId) return;
    const load = () =>
      supabase.from("events").select("*").eq("org_id", orgId).order("created_at", { ascending: false })
        .then(({ data }) => setEvents(data || []));
    load();
    const channel = supabase.channel("nav-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId]);

  const activeEvents = events.filter(e => e.status === "planning" || e.status === "active");
  const pastEvents = events.filter(e => e.status === "completed" || e.status === "archived");

  const handleAddEvent = async () => {
    if (!newEventName.trim() || !orgId || !user) return;
    const { error } = await supabase.from("events").insert({
      name: newEventName.trim(),
      location: newEventLocation.trim(),
      org_id: orgId,
      created_by: user.id,
    });
    if (error) toast.error(error.message);
    else { toast.success("Event created"); setShowAddEvent(false); setNewEventName(""); setNewEventLocation(""); }
  };

  return (
    <div className="flex h-full w-56 flex-col border-r bg-[hsl(var(--nav-panel))] overflow-y-auto">
      {/* HOME section */}
      <div className="px-4 pt-4 pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Home</span>
      </div>
      <div className="px-2 pb-2">
        <button
          onClick={() => navigate("/dashboard")}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
            location.pathname === "/dashboard" ? "bg-accent font-medium" : "hover:bg-accent/50"
          )}
        >
          <BarChart3 size={16} className="text-muted-foreground" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* EVENTS section */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Events</span>
        <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
          <DialogTrigger asChild>
            <button className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent text-muted-foreground">
              <Plus size={14} />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Event Name</Label><Input value={newEventName} onChange={e => setNewEventName(e.target.value)} placeholder="Annual Gala" /></div>
              <div><Label>Location</Label><Input value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} placeholder="Convention Center" /></div>
              <Button onClick={handleAddEvent} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 space-y-0.5 px-2 pb-2">
        {activeEvents.map(event => (
          <button
            key={event.id}
            onClick={() => navigate(`/events/${event.id}`)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              location.pathname === `/events/${event.id}` ? "bg-accent font-medium" : "hover:bg-accent/50"
            )}
          >
            {/* Circular event thumbnail */}
            {event.image_url ? (
              <img src={event.image_url} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-muted shrink-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                {event.name?.charAt(0)}
              </div>
            )}
            <span className="truncate">{event.name}</span>
          </button>
        ))}

        {pastEvents.length > 0 && (
          <button
            onClick={() => navigate("/past-events")}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors",
              location.pathname === "/past-events" ? "bg-accent font-medium text-foreground" : "hover:bg-accent/50"
            )}
          >
            <Archive size={16} className="shrink-0" />
            <span>Past Events</span>
          </button>
        )}
      </div>
    </div>
  );
}
