import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export default function PastEvents() {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!orgId) return;
    supabase.from("events").select("*").eq("org_id", orgId)
      .in("status", ["completed", "archived"])
      .order("end_date", { ascending: false })
      .then(({ data }) => setEvents(data || []));
  }, [orgId]);

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Past Events</h1>
        <div className="grid grid-cols-2 gap-3">
          {events.length === 0 && <p className="col-span-2 text-muted-foreground">No past events</p>}
          {events.map(event => (
            <Card key={event.id} className="cursor-pointer hover:shadow-md" onClick={() => navigate(`/events/${event.id}`)}>
              <CardContent className="p-4">
                <h3 className="font-semibold">{event.name}</h3>
                <p className="text-xs text-muted-foreground">{event.location}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(new Date(event.start_date), "MMM d")} - {format(new Date(event.end_date), "MMM d, yyyy")}
                </p>
                <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${event.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                  {event.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
