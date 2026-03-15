import { useNavigate, useSearchParams } from "react-router-dom";
import { useMockData, formatDate, formatINRShort } from "@/context/MockDataContext";
import type { Task, TaskStatus, TaskPriority } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { TaskDetailSheet } from "@/components/TaskDetailSheet";
import { UserProfileModal } from "@/components/UserProfileModal";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useState, useEffect } from "react";
import {
  ChatCircle, Flag, Plus, ListBullets, Kanban, CaretRight,
  ListChecks, CheckSquare, Square, X
} from "@phosphor-icons/react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { toast } from "@/hooks/use-toast";

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: "text-red-600", label: "Urgent" },
  high: { color: "text-amber-600", label: "High" },
  normal: { color: "text-blue-600", label: "Normal" },
  low: { color: "text-muted-foreground", label: "Low" },
};

type ViewMode = "list" | "board";

const BOARD_COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "backlog", label: "Backlog", color: "bg-gray-400" },
  { key: "not-started", label: "To Do", color: "bg-gray-500" },
  { key: "in-progress", label: "In Progress", color: "bg-blue-500" },
  { key: "in-review", label: "In Review", color: "bg-purple-500" },
  { key: "completed", label: "Done", color: "bg-emerald-500" },
  { key: "blocked", label: "Blocked", color: "bg-orange-500" },
];

export default function TasksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    tasks, events, getProfile, getDepartment, getEvent, currentUser,
    getCommentsByTask, setTasks, profiles, departments
  } = useMockData();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [eventFilter, setEventFilter] = useState(searchParams.get("event") || "all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<string | null>(searchParams.get("task"));
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "status" | "assignee">("deadline");
  const [showAddModal, setShowAddModal] = useState(false);

  // Add task form
  const [addForm, setAddForm] = useState({
    title: "", description: "", event_id: "", assignee_id: "", deadline: "",
    priority: "normal" as TaskPriority, status: "not-started" as TaskStatus, labels: "",
  });

  useScrollLock(showAddModal);

  useEffect(() => {
    const ev = searchParams.get("event");
    const st = searchParams.get("status");
    const task = searchParams.get("task");
    const view = searchParams.get("view");
    if (ev) setEventFilter(ev);
    if (st) setStatusFilter(st);
    if (task) setSelectedTask(task);
    if (view === "my") setAssigneeFilter(currentUser.id);
  }, [searchParams]);

  const visibleTasks = tasks;

  const filtered = visibleTasks.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (eventFilter !== "all" && t.event_id !== eventFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== "all" && t.assignee_id !== assigneeFilter) return false;
    return true;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (sortBy === "deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (sortBy === "priority") {
      const order = { urgent: 0, high: 1, normal: 2, low: 3 };
      return (order[a.priority] || 2) - (order[b.priority] || 2);
    }
    return 0;
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as TaskStatus;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    toast({ title: "Task moved", description: `Moved to ${newStatus}` });
  };

  const toggleSelectTask = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const bulkChangeStatus = (status: TaskStatus) => {
    setTasks(tasks.map(t => selectedTasks.has(t.id) ? { ...t, status } : t));
    toast({ title: `${selectedTasks.size} tasks updated` });
    setSelectedTasks(new Set());
  };

  const handleInlineCreate = (columnStatus: TaskStatus) => {
    const title = newTaskTitle[columnStatus]?.trim();
    if (!title) return;
    const newTask: Task = {
      id: `t_new_${Date.now()}`, event_id: "e1", dept_id: "d1", title,
      description: "", assignee_id: currentUser.id, deadline: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      priority: "normal", status: columnStatus, subtasks: [],
      created_by: currentUser.id, created_at: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle(prev => ({ ...prev, [columnStatus]: "" }));
    toast({ title: "Task created" });
  };

  const handleAddTask = () => {
    if (!addForm.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const eventId = addForm.event_id || events[0]?.id || "e1";
    const deptForEvent = departments.find(d => d.event_id === eventId);
    const newTask: Task = {
      id: `t_new_${Date.now()}`,
      event_id: eventId,
      dept_id: deptForEvent?.id || "d1",
      title: addForm.title.trim(),
      description: addForm.description,
      assignee_id: addForm.assignee_id || currentUser.id,
      deadline: addForm.deadline || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      priority: addForm.priority,
      status: addForm.status,
      subtasks: [],
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      labels: addForm.labels ? addForm.labels.split(",").map(l => l.trim()).filter(Boolean) : undefined,
    };
    setTasks([...tasks, newTask]);
    setShowAddModal(false);
    setAddForm({ title: "", description: "", event_id: "", assignee_id: "", deadline: "", priority: "normal", status: "not-started", labels: "" });
    toast({ title: "Task created" });
  };

  // Column widths for consistent table layout
  const colWidths = {
    checkbox: "w-10",
    task: "w-[30%]",
    event: "w-[14%]",
    assignee: "w-[14%]",
    priority: "w-[10%]",
    status: "w-[10%]",
    subtasks: "w-[8%]",
    due: "w-[10%]",
    action: "w-8",
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">{visibleTasks.length} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border border-stroke bg-secondary overflow-hidden">
            {([["list", ListBullets], ["board", Kanban]] as [ViewMode, any][]).map(([mode, Icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === mode ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon size={13} /> {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
          className="rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm pr-8 focus:outline-none focus:border-muted-foreground">
          <option value="all">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm pr-8 focus:outline-none focus:border-muted-foreground">
          <option value="all">All Status</option>
          {BOARD_COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm pr-8 focus:outline-none focus:border-muted-foreground">
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}
          className="rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm pr-8 focus:outline-none focus:border-muted-foreground">
          <option value="all">All Assignees</option>
          <option value={currentUser.id}>My Tasks</option>
          {profiles.filter(p => p.id !== currentUser.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {viewMode === "list" && (
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm pr-8 focus:outline-none focus:border-muted-foreground ml-auto">
            <option value="deadline">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="status">Sort: Status</option>
          </select>
        )}
        {selectedTasks.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">{selectedTasks.size} selected</span>
            <select onChange={e => { if (e.target.value) bulkChangeStatus(e.target.value as TaskStatus); e.target.value = ""; }}
              className="rounded-full border border-stroke bg-secondary px-2 py-1 text-xs focus:outline-none">
              <option value="">Change status...</option>
              {BOARD_COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div className="rounded-xl border border-stroke overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-stroke">
                <th className={`${colWidths.checkbox} px-3`}><input type="checkbox" className="h-3.5 w-3.5 rounded accent-accent" onChange={e => {
                  if (e.target.checked) setSelectedTasks(new Set(sortedFiltered.map(t => t.id)));
                  else setSelectedTasks(new Set());
                }} /></th>
                <th className={`${colWidths.task} px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`}>Task</th>
                <th className={`${colWidths.event} px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`}>Event</th>
                <th className={`${colWidths.assignee} px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`}>Assignee</th>
                <th className={`${colWidths.priority} px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`}>Priority</th>
                <th className={`${colWidths.status} px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`}>Status</th>
                <th className={`${colWidths.subtasks} px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`}>Subtasks</th>
                <th className={`${colWidths.due} px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`}>Due</th>
                <th className={colWidths.action}></th>
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.map(t => {
                const ev = getEvent(t.event_id);
                const assignee = getProfile(t.assignee_id);
                const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                const commentCount = getCommentsByTask(t.id).length;
                const pc = priorityConfig[t.priority] || priorityConfig.normal;
                const doneSubtasks = t.subtasks.filter(s => s.completed).length;
                return (
                  <tr key={t.id} onClick={() => setSelectedTask(t.id)}
                    className={`border-b border-stroke last:border-0 cursor-pointer hover:bg-selected transition-colors ${selectedTasks.has(t.id) ? "bg-selected/50" : ""}`}>
                    <td className={`${colWidths.checkbox} px-3`} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedTasks.has(t.id)} onChange={() => toggleSelectTask(t.id)} className="h-3.5 w-3.5 rounded accent-accent" />
                    </td>
                    <td className={`${colWidths.task} px-4 py-3`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate">{t.title}</span>
                        {commentCount > 0 && <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground shrink-0"><ChatCircle size={12} />{commentCount}</span>}
                      </div>
                    </td>
                    <td className={`${colWidths.event} px-4 py-3`}>
                      <button className="text-muted-foreground hover:text-accent transition-colors text-sm truncate"
                        onClick={e => { e.stopPropagation(); navigate(`/events/${t.event_id}`); }}>
                        {ev?.name}
                      </button>
                    </td>
                    <td className={`${colWidths.assignee} px-4 py-3`}>
                      {assignee && (
                        <button onClick={e => { e.stopPropagation(); setProfileUserId(assignee.id); }} className="flex items-center gap-1.5 hover:opacity-80 min-w-0">
                          <UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" /><span className="truncate">{assignee.name}</span>
                        </button>
                      )}
                    </td>
                    <td className={`${colWidths.priority} px-4 py-3`}>
                      <div className="flex items-center gap-1">
                        <Flag size={13} weight="fill" className={pc.color} />
                        <span className={`text-xs font-medium ${pc.color}`}>{pc.label}</span>
                      </div>
                    </td>
                    <td className={`${colWidths.status} px-4 py-3`}><StatusBadge status={t.status} /></td>
                    <td className={`${colWidths.subtasks} px-4 py-3`}>
                      {t.subtasks.length > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><ListChecks size={13} />{doneSubtasks}/{t.subtasks.length}</span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className={`${colWidths.due} px-4 py-3 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{formatDate(t.deadline)}</td>
                    <td className={`${colWidths.action} px-4 py-3`}><CaretRight size={14} className="text-muted-foreground" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* BOARD VIEW */}
      {viewMode === "board" && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {BOARD_COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.key);
              return (
                <div key={col.key} className="flex-shrink-0 w-[280px]">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                    <span className="text-sm font-semibold">{col.label}</span>
                    <span className="text-xs text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">{colTasks.length}</span>
                  </div>
                  <Droppable droppableId={col.key}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        className={`rounded-xl border border-stroke bg-secondary/30 p-2 min-h-[200px] space-y-2 transition-colors ${snapshot.isDraggingOver ? "bg-accent/5" : ""}`}>
                        {colTasks.map((t, index) => {
                          const assignee = getProfile(t.assignee_id);
                          const ev = getEvent(t.event_id);
                          const pc = priorityConfig[t.priority] || priorityConfig.normal;
                          const doneSubtasks = t.subtasks.filter(s => s.completed).length;
                          const commentCount = getCommentsByTask(t.id).length;
                          return (
                            <Draggable key={t.id} draggableId={t.id} index={index}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                  onClick={() => setSelectedTask(t.id)}
                                  className="rounded-lg border border-stroke bg-card p-3 cursor-pointer hover:shadow-sm transition-shadow space-y-2">
                                  <p className="text-sm font-medium leading-tight">{t.title}</p>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {ev && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{ev.name}</span>}
                                    <div className="flex items-center gap-0.5">
                                      <Flag size={11} weight="fill" className={pc.color} />
                                      <span className={`text-[10px] font-medium ${pc.color}`}>{pc.label}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      {assignee && <UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" />}
                                      <span>{formatDate(t.deadline)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {t.subtasks.length > 0 && <span className="flex items-center gap-0.5"><ListChecks size={11} />{doneSubtasks}/{t.subtasks.length}</span>}
                                      {commentCount > 0 && <span className="flex items-center gap-0.5"><ChatCircle size={11} />{commentCount}</span>}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        <div className="mt-1">
                          {newTaskTitle[col.key] !== undefined ? (
                            <div className="space-y-1.5">
                              <input value={newTaskTitle[col.key] || ""} onChange={e => setNewTaskTitle(p => ({ ...p, [col.key]: e.target.value }))}
                                onKeyDown={e => { if (e.key === "Enter") handleInlineCreate(col.key); if (e.key === "Escape") setNewTaskTitle(p => { const n = { ...p }; delete n[col.key]; return n; }); }}
                                placeholder="Task title..." autoFocus
                                className="w-full rounded-lg border border-stroke bg-card px-3 py-2 text-sm focus:outline-none" />
                              <div className="flex gap-1.5">
                                <button onClick={() => handleInlineCreate(col.key)} className="rounded-full bg-foreground px-3 py-1 text-xs text-background font-medium">Add</button>
                                <button onClick={() => setNewTaskTitle(p => { const n = { ...p }; delete n[col.key]; return n; })} className="text-xs text-muted-foreground">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setNewTaskTitle(p => ({ ...p, [col.key]: "" }))}
                              className="flex items-center gap-1 w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-card">
                              <Plus size={12} /> Add task
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="text-3xl mb-3">📋</span>
          <p className="text-sm font-medium mb-1">No tasks found</p>
          <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or create a new task.</p>
          <button onClick={() => setShowAddModal(true)} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
            <Plus size={14} className="inline mr-1" /> Create Task
          </button>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-card border border-stroke p-6 shadow-[0_8px_40px_rgba(0,0,0,0.15)] space-y-4 max-h-[90vh] overflow-y-auto"
              onKeyDown={e => e.key === "Escape" && setShowAddModal(false)}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Task</h3>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
                  <input value={addForm.title} onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground" placeholder="Task title" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground" rows={2} placeholder="Task description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Event</label>
                    <select value={addForm.event_id} onChange={e => setAddForm(p => ({ ...p, event_id: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground">
                      <option value="">Select event</option>
                      {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Assignee</label>
                    <select value={addForm.assignee_id} onChange={e => setAddForm(p => ({ ...p, assignee_id: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground">
                      <option value="">Assign to...</option>
                      {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Deadline</label>
                    <input type="date" value={addForm.deadline} onChange={e => setAddForm(p => ({ ...p, deadline: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <select value={addForm.priority} onChange={e => setAddForm(p => ({ ...p, priority: e.target.value as TaskPriority }))}
                      className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground">
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select value={addForm.status} onChange={e => setAddForm(p => ({ ...p, status: e.target.value as TaskStatus }))}
                      className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground">
                      {BOARD_COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Labels</label>
                    <input value={addForm.labels} onChange={e => setAddForm(p => ({ ...p, labels: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground" placeholder="tag1, tag2" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddModal(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                <button onClick={handleAddTask}
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Create Task</button>
              </div>
            </div>
          </div>
        </>
      )}

      <TaskDetailSheet taskId={selectedTask} onClose={() => setSelectedTask(null)} onOpenProfile={setProfileUserId} />
      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
