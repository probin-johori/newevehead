import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Tasks() {
  const { orgId, user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("normal");
  const [eventId, setEventId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!orgId) return;
    supabase.from("events").select("*").eq("org_id", orgId).then(({ data }) => setEvents(data || []));
    supabase.from("profiles").select("*").then(({ data }) => setProfiles(data || []));
    supabase.from("team_members").select("*").eq("org_id", orgId).then(({ data }) => setMembers(data || []));
  }, [orgId]);

  const loadTasks = () => {
    if (!orgId || events.length === 0) return;
    const ids = filterEvent === "all" ? events.map(e => e.id) : [filterEvent];
    supabase.from("tasks").select("*").in("event_id", ids).order("created_at", { ascending: false })
      .then(({ data }) => setTasks(data || []));
  };

  useEffect(() => { loadTasks(); }, [events, filterEvent]);

  useEffect(() => {
    if (!orgId) return;
    const ch = supabase.channel("tasks-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, loadTasks)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId, events, filterEvent]);

  const handleAdd = async () => {
    if (!title.trim() || !eventId || !user) { toast.error("Title and event are required"); return; }
    const { error } = await supabase.from("tasks").insert({
      title: title.trim(), description: desc, priority,
      event_id: eventId, created_by: user.id, assignee_id: assignee || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Task created"); setShowAdd(false); setTitle(""); setDesc(""); }
  };

  const getProfile = (uid: string) => profiles.find(p => p.id === uid);
  const getEventName = (eid: string) => events.find(e => e.id === eid)?.name || "";

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <div className="flex gap-2">
            <Select value={filterEvent} onValueChange={setFilterEvent}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Events" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild><Button><Plus size={14} className="mr-1" />Add Task</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
                  <div><Label>Event *</Label>
                    <Select value={eventId} onValueChange={setEventId}>
                      <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                      <SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} /></div>
                  <div><Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Assignee</Label>
                    <Select value={assignee} onValueChange={setAssignee}>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        {members.map(m => {
                          const p = getProfile(m.user_id);
                          return <SelectItem key={m.user_id} value={m.user_id}>{p?.name || m.user_id}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAdd} className="w-full">Create Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="space-y-1">
          {tasks.length === 0 && <p className="py-8 text-center text-muted-foreground">No tasks found</p>}
          {tasks.map(task => {
            const a = getProfile(task.assignee_id);
            return (
              <div key={task.id} className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-accent/50">
                <div className={`h-2 w-2 rounded-full ${task.status === "completed" || task.status === "done" ? "bg-emerald-500" : task.status === "in-progress" ? "bg-blue-500" : "bg-muted-foreground"}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{getEventName(task.event_id)} · {a?.name || "Unassigned"}</p>
                </div>
                <Badge variant={task.priority === "urgent" ? "destructive" : "secondary"}>{task.priority}</Badge>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
