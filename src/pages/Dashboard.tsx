import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign, TrendingUp, Clock, Wallet, CheckCircle2,
  AlertTriangle, Calendar, Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { orgId, user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [filterEvent, setFilterEvent] = useState<string>("all");

  useEffect(() => {
    if (!orgId) return;
    supabase.from("events").select("*").eq("org_id", orgId).then(({ data }) => setEvents(data || []));
    supabase.from("team_members").select("*").eq("org_id", orgId).then(({ data }) => setTeamMembers(data || []));
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    const eventIds = events.map(e => e.id);
    if (eventIds.length === 0) return;

    const filteredIds = filterEvent === "all" ? eventIds : [filterEvent];
    supabase.from("tasks").select("*").in("event_id", filteredIds).then(({ data }) => setTasks(data || []));
    supabase.from("bills").select("*").in("event_id", filteredIds).then(({ data }) => setBills(data || []));
    supabase.from("departments").select("*").in("event_id", filteredIds).then(({ data }) => setDepartments(data || []));
  }, [events, filterEvent, orgId]);

  const activeEvents = events.filter(e => e.status === "planning" || e.status === "active");
  const totalBudget = (filterEvent === "all" ? events : events.filter(e => e.id === filterEvent)).reduce((s, e) => s + (e.estimated_budget || 0), 0);
  const approvedSpend = bills.filter(b => b.status === "approved" || b.status === "paid").reduce((s, b) => s + b.amount, 0);
  const pendingSpend = bills.filter(b => b.status === "pending").reduce((s, b) => s + b.amount, 0);
  const allocatedBudget = departments.reduce((s, d) => s + (d.allocated_budget || 0), 0);
  const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "done").length;
  const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed" && t.status !== "done").length;

  const stats = [
    { label: "Total Budget", value: `₹${totalBudget.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600" },
    { label: "Approved Spend", value: `₹${approvedSpend.toLocaleString()}`, icon: TrendingUp, color: "text-blue-600" },
    { label: "Pending Spend", value: `₹${pendingSpend.toLocaleString()}`, icon: Clock, color: "text-amber-600" },
    { label: "Allocated Budget", value: `₹${allocatedBudget.toLocaleString()}`, icon: Wallet, color: "text-purple-600" },
  ];

  const stats2 = [
    { label: "Tasks Completed", value: `${completedTasks}/${tasks.length}`, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Overdue Tasks", value: overdueTasks.toString(), icon: AlertTriangle, color: "text-red-600" },
    { label: "Active Events", value: activeEvents.length.toString(), icon: Calendar, color: "text-blue-600" },
    { label: "Team Members", value: teamMembers.length.toString(), icon: Users, color: "text-purple-600" },
  ];

  const recentTasks = tasks.slice(0, 8);

  const statusColor = (s: string) => {
    if (s === "completed" || s === "done") return "bg-emerald-500";
    if (s === "in-progress") return "bg-blue-500";
    if (s === "overdue" || (s !== "completed" && s !== "done")) return "bg-amber-500";
    return "bg-muted-foreground";
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header with filter */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Select value={filterEvent} onValueChange={setFilterEvent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards in single container */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}>
                    <s.icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-semibold">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-4 gap-4">
              {stats2.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}>
                    <s.icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-semibold">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-6">
          {/* Active Events */}
          <div className="col-span-2">
            <h2 className="mb-3 text-lg font-semibold">Active Events</h2>
            <div className="grid grid-cols-2 gap-3">
              {activeEvents.length === 0 && <p className="col-span-2 text-sm text-muted-foreground">No active events</p>}
              {activeEvents.map(event => (
                <Card key={event.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/events/${event.id}`)}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{event.name}</h3>
                    <p className="text-xs text-muted-foreground">{event.location}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${event.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                        {event.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Tasks - notification style */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">Recent Tasks</h2>
            <div className="space-y-1">
              {recentTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet</p>}
              {recentTasks.map(task => (
                <div key={task.id} className="flex items-start gap-2.5 rounded-lg px-3 py-2 hover:bg-accent/50 cursor-pointer">
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusColor(task.status)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.deadline ? `Due ${formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}` : "No deadline"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
