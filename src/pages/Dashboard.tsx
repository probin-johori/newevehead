import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart3, ClipboardList, FileText as FileIcon, TrendingUp,
  Plus, ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

function formatIndian(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `₹${n}`;
}

export default function Dashboard() {
  const { orgId, user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");

  useEffect(() => {
    if (!orgId) return;
    supabase.from("events").select("*").eq("org_id", orgId).order("start_date", { ascending: true })
      .then(({ data }) => setEvents(data || []));
    supabase.from("team_members").select("*").eq("org_id", orgId)
      .then(({ data }) => setTeamMembers(data || []));
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    const eventIds = events.map(e => e.id);
    if (eventIds.length === 0) { setTasks([]); setBills([]); setDepartments([]); return; }
    const filteredIds = filterEvent === "all" ? eventIds : [filterEvent];
    supabase.from("tasks").select("*").in("event_id", filteredIds).then(({ data }) => setTasks(data || []));
    supabase.from("bills").select("*").in("event_id", filteredIds).then(({ data }) => setBills(data || []));
    supabase.from("departments").select("*").in("event_id", filteredIds).then(({ data }) => setDepartments(data || []));
  }, [events, filterEvent, orgId]);

  const activeEvents = events.filter(e => e.status === "planning" || e.status === "active");
  const displayEvents = showAllEvents ? events : activeEvents;

  // Stats scoped to filter
  const scopedEvents = filterEvent === "all" ? events : events.filter(e => e.id === filterEvent);
  const totalBudget = scopedEvents.reduce((s, e) => s + (e.estimated_budget || 0), 0);
  const approvedSpend = bills.filter(b => b.status === "approved" || b.status === "paid").reduce((s, b) => s + b.amount, 0);
  const pendingSpend = bills.filter(b => b.status === "pending").reduce((s, b) => s + b.amount, 0);
  const allocatedBudget = departments.reduce((s, d) => s + (d.allocated_budget || 0), 0);
  const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "done").length;
  const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed" && t.status !== "done").length;

  const myTasks = tasks.filter(t => t.assignee_id === user?.id).slice(0, 10);

  const statusBadge = (s: string) => {
    if (s === "completed" || s === "done") return { label: "Done", cls: "bg-emerald-100 text-emerald-700" };
    if (s === "in-progress") return { label: "In Progress", cls: "bg-orange-100 text-orange-700" };
    return { label: "Not Started", cls: "bg-muted text-muted-foreground" };
  };

  const eventStatusBadge = (s: string) => {
    if (s === "active") return "text-emerald-600";
    if (s === "planning") return "text-blue-600";
    return "text-muted-foreground";
  };

  const handleAddEvent = async () => {
    if (!newEventName.trim() || !orgId || !user) return;
    const { error } = await supabase.from("events").insert({
      name: newEventName.trim(), location: newEventLocation.trim(),
      org_id: orgId, created_by: user.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Event created");
      setShowAddEvent(false); setNewEventName(""); setNewEventLocation("");
      supabase.from("events").select("*").eq("org_id", orgId).order("start_date", { ascending: true })
        .then(({ data }) => setEvents(data || []));
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview across all events</p>
          </div>
          <Button onClick={() => setShowAddEvent(true)} className="rounded-full gap-1.5">
            <Plus size={16} />
            Add Event
          </Button>
        </div>

        {/* Event filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full gap-1.5 h-9 px-4 text-sm">
              {filterEvent === "all" ? "All Events" : events.find(e => e.id === filterEvent)?.name || "All Events"}
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setFilterEvent("all")}>All Events</DropdownMenuItem>
            {events.map(e => (
              <DropdownMenuItem key={e.id} onClick={() => setFilterEvent(e.id)}>{e.name}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* KPI Cards - single container, 2 rows */}
        <Card className="border">
          <CardContent className="p-5">
            <div className="grid grid-cols-4 gap-6">
              {[
                { icon: BarChart3, label: "Total Budget", value: formatIndian(totalBudget), color: "text-foreground" },
                { icon: ClipboardList, label: "Approved Spend", value: formatIndian(approvedSpend), color: "text-foreground" },
                { icon: FileIcon, label: "Pending Spend", value: formatIndian(pendingSpend), color: "text-foreground" },
                { icon: TrendingUp, label: "Allocated Budget", value: formatIndian(allocatedBudget), color: "text-foreground" },
              ].map(s => (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <s.icon size={14} />
                    <span className="text-xs">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: "Tasks Completed", value: `${completedTasks}/${tasks.length}` },
                { label: "Overdue Tasks", value: overdueTasks.toString() },
                { label: "Active Events", value: activeEvents.length.toString() },
                { label: "Team Members", value: teamMembers.length.toString() },
              ].map(s => (
                <div key={s.label} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Events section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Events</h2>
            <button
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAllEvents ? `Active Events (${activeEvents.length})` : `All Events (${events.length})`}
            </button>
          </div>
          <div className="flex gap-8 overflow-x-auto pb-2">
            {displayEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">No events yet</p>
            )}
            {displayEvents.map(event => (
              <button
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="flex flex-col items-center gap-2 min-w-[120px] group"
              >
                {/* Circular thumbnail */}
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border group-hover:border-foreground transition-colors">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                      {event.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium leading-tight">{event.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.start_date && event.end_date
                      ? `${format(new Date(event.start_date), "MMM d")} – ${format(new Date(event.end_date), "MMM d")}`
                      : "No dates"}
                  </p>
                  <p className={`text-xs font-medium capitalize ${eventStatusBadge(event.status)}`}>
                    {event.status}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* My Tasks - notification style */}
        <div>
          <h2 className="text-lg font-semibold mb-3">My Tasks</h2>
          <div className="space-y-0.5">
            {myTasks.length === 0 && <p className="text-sm text-muted-foreground py-4">No tasks assigned to you</p>}
            {myTasks.map(task => {
              const badge = statusBadge(task.status);
              const eventName = events.find(e => e.id === task.event_id)?.name || "";
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border last:border-0"
                >
                  {/* Status dot */}
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    task.status === "in-progress" ? "bg-destructive" :
                    task.status === "completed" || task.status === "done" ? "bg-emerald-500" :
                    "bg-muted-foreground/40"
                  }`} />
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {eventName}{task.deadline ? ` · Due ${format(new Date(task.deadline), "MMM d")}` : ""}
                    </p>
                  </div>
                  {/* Status badge */}
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label>Event Name</Label><Input value={newEventName} onChange={e => setNewEventName(e.target.value)} placeholder="Annual Gala" /></div>
            <div><Label>Location</Label><Input value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} placeholder="Convention Center" /></div>
            <Button onClick={handleAddEvent} className="w-full">Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
