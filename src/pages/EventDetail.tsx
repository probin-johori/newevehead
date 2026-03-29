import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Users, CheckSquare, FileText, MapPin, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const { user, orgId } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Add task state
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("normal");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");

  // Add dept state
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptBudget, setNewDeptBudget] = useState("");

  // Selected task
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const loadData = async () => {
    if (!id) return;
    const [evRes, tRes, dRes, bRes, docRes, actRes] = await Promise.all([
      supabase.from("events").select("*").eq("id", id).single(),
      supabase.from("tasks").select("*").eq("event_id", id).order("created_at", { ascending: false }),
      supabase.from("departments").select("*").eq("event_id", id),
      supabase.from("bills").select("*").eq("event_id", id),
      supabase.from("documents").select("*").eq("event_id", id),
      supabase.from("activities").select("*").eq("event_id", id).order("created_at", { ascending: false }).limit(20),
    ]);
    setEvent(evRes.data);
    setTasks(tRes.data || []);
    setDepartments(dRes.data || []);
    setBills(bRes.data || []);
    setDocuments(docRes.data || []);
    setActivities(actRes.data || []);
  };

  useEffect(() => {
    loadData();
    supabase.from("profiles").select("*").then(({ data }) => setProfiles(data || []));
    if (orgId) supabase.from("team_members").select("*").eq("org_id", orgId).then(({ data }) => setMembers(data || []));
  }, [id, orgId]);

  // Realtime
  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`event-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `event_id=eq.${id}` }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "departments", filter: `event_id=eq.${id}` }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "bills", filter: `event_id=eq.${id}` }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "documents", filter: `event_id=eq.${id}` }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "activities", filter: `event_id=eq.${id}` }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  // Load task details
  useEffect(() => {
    if (!selectedTask) return;
    supabase.from("subtasks").select("*").eq("task_id", selectedTask.id).then(({ data }) => setSubtasks(data || []));
    supabase.from("task_comments").select("*").eq("task_id", selectedTask.id).order("created_at").then(({ data }) => setComments(data || []));

    const ch = supabase.channel(`task-${selectedTask.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subtasks", filter: `task_id=eq.${selectedTask.id}` },
        () => supabase.from("subtasks").select("*").eq("task_id", selectedTask.id).then(({ data }) => setSubtasks(data || [])))
      .on("postgres_changes", { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${selectedTask.id}` },
        () => supabase.from("task_comments").select("*").eq("task_id", selectedTask.id).order("created_at").then(({ data }) => setComments(data || [])))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedTask?.id]);

  const getProfile = (uid: string) => profiles.find(p => p.id === uid);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !id || !user) return;
    const { error } = await supabase.from("tasks").insert({
      title: newTaskTitle.trim(),
      description: newTaskDesc,
      priority: newTaskPriority,
      assignee_id: newTaskAssignee || null,
      event_id: id,
      created_by: user.id,
    });
    if (error) toast.error(error.message);
    else { toast.success("Task added"); setShowAddTask(false); setNewTaskTitle(""); setNewTaskDesc(""); }
  };

  const handleAddDept = async () => {
    if (!newDeptName.trim() || !id || !user) return;
    const { error } = await supabase.from("departments").insert({
      name: newDeptName.trim(),
      event_id: id,
      head_id: user.id,
      allocated_budget: parseFloat(newDeptBudget) || 0,
    });
    if (error) toast.error(error.message);
    else { toast.success("Department added"); setShowAddDept(false); setNewDeptName(""); setNewDeptBudget(""); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask || !user) return;
    await supabase.from("task_comments").insert({
      task_id: selectedTask.id,
      body: newComment.trim(),
      author_id: user.id,
    });
    setNewComment("");
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !selectedTask) return;
    await supabase.from("subtasks").insert({
      task_id: selectedTask.id,
      title: newSubtaskTitle.trim(),
    });
    setNewSubtaskTitle("");
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    await supabase.from("events").update({ status }).eq("id", id);
    setEvent((e: any) => ({ ...e, status }));
    toast.success(`Event marked as ${status}`);
  };

  const renderMention = (text: string) => {
    return text.replace(/@([\w\s]+?)(?=\s@|$|\s{2}|[.,!?])/g, (_, name) => {
      return `<span class="font-bold text-blue-600 cursor-pointer">@${name}</span>`;
    });
  };

  if (!event) return <AppShell><div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></AppShell>;

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Event header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin size={14} />{event.location || "No location"}</span>
              <span className="flex items-center gap-1"><CalIcon size={14} />{format(new Date(event.start_date), "MMM d")} - {format(new Date(event.end_date), "MMM d, yyyy")}</span>
            </div>
          </div>
          <Select value={event.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={t => setSearchParams({ tab: t })}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Budget</p><p className="text-lg font-semibold">₹{(event.estimated_budget || 0).toLocaleString()}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tasks</p><p className="text-lg font-semibold">{tasks.length}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Departments</p><p className="text-lg font-semibold">{departments.length}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Bills</p><p className="text-lg font-semibold">{bills.length}</p></CardContent></Card>
            </div>
            <h3 className="font-semibold">Recent Activity</h3>
            <div className="space-y-2">
              {activities.map(a => (
                <div key={a.id} className="flex items-start gap-2 text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  <div>
                    <span>{a.description}</span>
                    <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "MMM d, h:mm a")}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Tasks ({tasks.length})</h2>
              <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
                <DialogTrigger asChild><Button size="sm"><Plus size={14} className="mr-1" />Add Task</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div><Label>Title</Label><Input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} /></div>
                    <div><Label>Description</Label><Textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} /></div>
                    <div><Label>Priority</Label>
                      <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
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
                      <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                        <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                        <SelectContent>
                          {members.map(m => {
                            const p = getProfile(m.user_id);
                            return <SelectItem key={m.user_id} value={m.user_id}>{p?.name || p?.email || m.user_id}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddTask} className="w-full">Create Task</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-1">
              {tasks.map(task => {
                const assignee = getProfile(task.assignee_id);
                return (
                  <div key={task.id} onClick={() => setSelectedTask(task)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 hover:bg-accent/50">
                    <div className={`h-2 w-2 rounded-full ${task.status === "completed" || task.status === "done" ? "bg-emerald-500" : task.status === "in-progress" ? "bg-blue-500" : "bg-muted-foreground"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{assignee?.name || "Unassigned"}</p>
                    </div>
                    <Badge variant={task.priority === "urgent" ? "destructive" : task.priority === "high" ? "default" : "secondary"}>
                      {task.priority}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="departments" className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Departments ({departments.length})</h2>
              <Dialog open={showAddDept} onOpenChange={setShowAddDept}>
                <DialogTrigger asChild><Button size="sm"><Plus size={14} className="mr-1" />Add Department</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div><Label>Name</Label><Input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} /></div>
                    <div><Label>Budget</Label><Input type="number" value={newDeptBudget} onChange={e => setNewDeptBudget(e.target.value)} placeholder="0" /></div>
                    <Button onClick={handleAddDept} className="w-full">Create Department</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {departments.map(dept => (
                <Card key={dept.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{dept.name}</h3>
                      <Badge variant="secondary">{dept.member_ids?.length || 0} members</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Budget: ₹{(dept.allocated_budget || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Spent: ₹{(dept.spent || 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <h2 className="mb-3 font-semibold">Documents ({documents.length})</h2>
            <div className="space-y-1">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
                  <FileText size={16} className="text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.folder} · {doc.file_size}</p>
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Detail Sheet */}
      <Sheet open={!!selectedTask} onOpenChange={open => { if (!open) setSelectedTask(null); }}>
        <SheetContent className="w-[480px] sm:max-w-[480px]">
          {selectedTask && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTask.title}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
                <div className="space-y-4 pr-4">
                  <p className="text-sm text-muted-foreground">{selectedTask.description || "No description"}</p>
                  <div className="flex gap-2">
                    <Badge>{selectedTask.status}</Badge>
                    <Badge variant="secondary">{selectedTask.priority}</Badge>
                  </div>

                  <Separator />
                  <h4 className="text-sm font-semibold">Subtasks ({subtasks.length})</h4>
                  <div className="space-y-1">
                    {subtasks.map(st => (
                      <div key={st.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={st.completed}
                          onChange={async () => {
                            await supabase.from("subtasks").update({ completed: !st.completed }).eq("id", st.id);
                          }}
                        />
                        <span className={st.completed ? "line-through text-muted-foreground" : ""}>{st.title}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Add subtask..." value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddSubtask()} />
                    <Button size="sm" onClick={handleAddSubtask}>Add</Button>
                  </div>

                  <Separator />
                  <h4 className="text-sm font-semibold">Comments ({comments.length})</h4>
                  <div className="space-y-3">
                    {comments.map(c => {
                      const author = getProfile(c.author_id);
                      return (
                        <div key={c.id} className="rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: author?.avatar_color || "#6b21a8" }}>
                              {author?.name?.charAt(0) || "?"}
                            </div>
                            <span className="text-sm font-medium">{author?.name || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, h:mm a")}</span>
                          </div>
                          <p className="text-sm" dangerouslySetInnerHTML={{ __html: renderMention(c.body) }} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Add comment... Use @name to mention" value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddComment()} />
                    <Button size="sm" onClick={handleAddComment}>Send</Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
