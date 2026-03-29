import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ChevronRight, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    supabase.from("events").select("*").eq("org_id", orgId).order("created_at", { ascending: false })
      .then(({ data }) => setEvents(data || []));

    const channel = supabase.channel("nav-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        supabase.from("events").select("*").eq("org_id", orgId).order("created_at", { ascending: false })
          .then(({ data }) => setEvents(data || []));
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orgId]);

  const activeEvents = events.filter(e => e.status === "planning" || e.status === "active");
  const pastEvents = events.filter(e => e.status === "completed" || e.status === "archived");

  const isEventsSection = location.pathname.startsWith("/events");
  const isDashboard = location.pathname === "/dashboard";

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
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-foreground">
          {isEventsSection ? "Events" : isDashboard ? "Dashboard" : location.pathname.split("/")[1]?.charAt(0).toUpperCase() + location.pathname.split("/")[1]?.slice(1)}
        </span>
        {(isEventsSection || isDashboard) && (
          <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
            <DialogTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent">
                <Plus size={14} />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>Event Name</Label>
                  <Input value={newEventName} onChange={e => setNewEventName(e.target.value)} placeholder="Annual Gala" />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} placeholder="Convention Center" />
                </div>
                <Button onClick={handleAddEvent} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex-1 space-y-1 px-2">
        {(isEventsSection || isDashboard) && activeEvents.map(event => (
          <button
            key={event.id}
            onClick={() => navigate(`/events/${event.id}`)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              location.pathname === `/events/${event.id}` ? "bg-accent font-medium" : "hover:bg-accent/50"
            )}
          >
            <span className="truncate">{event.name}</span>
            <ChevronRight size={14} className="ml-auto shrink-0 text-muted-foreground" />
          </button>
        ))}

        {(isEventsSection || isDashboard) && pastEvents.length > 0 && (
          <button
            onClick={() => navigate("/past-events")}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent/50"
          >
            <Archive size={14} />
            <span>Past Events ({pastEvents.length})</span>
          </button>
        )}
      </div>
    </div>
  );
}
