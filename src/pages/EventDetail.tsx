import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useMockData, formatINRShort, formatDate, formatTimeAgo } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { TaskDetailSheet } from "@/components/TaskDetailSheet";
import { UserProfileModal } from "@/components/UserProfileModal";
import { useScrollLock } from "@/hooks/useScrollLock";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Trash } from "@phosphor-icons/react";
import {
  Flag, Plus, Eye, FileText, X, PencilSimple, ArrowRight,
  CaretDown, CaretRight, ImageSquare
} from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";
import { EventImageUpload } from "@/components/EventImageUpload";

type Tab = "overview" | "departments" | "tasks" | "billing" | "budget" | "documents";

interface AddTaskForm {
  title: string;
  dept_id: string;
  assignee_id: string;
  priority: string;
  deadline: string;
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: "text-red-600", label: "Urgent" },
  high: { color: "text-amber-600", label: "High" },
  normal: { color: "text-blue-600", label: "Normal" },
  low: { color: "text-muted-foreground", label: "Low" },
};

const activityTypeIcons: Record<string, string> = {
  comment: "💬", reply: "↩️", mention: "📢", edit: "✏️", assign: "👤",
  deadline: "📅", status: "✅", billing: "💳", upload: "📎",
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    getEvent, getDeptsByEvent, getTasksByEvent, getBillsByEvent, getDocsByEvent,
    getProfile, getDepartment, getActivitiesByEvent, deptHealth,
    currentUser, bills, events, setEvents, setBills,
    tasks: allTasks, setTasks, departments, setDepartments, profiles, teamProfiles,
    addEvent: dbAddEvent, updateEvent: dbUpdateEvent,
    addDepartment: dbAddDepartment, deleteDepartment: dbDeleteDepartment, updateDepartment: dbUpdateDepartment,
    addTask: dbAddTask, updateTask: dbUpdateTask,
    updateBill: dbUpdateBill, addBill: dbAddBill,
    addDocument: dbAddDocument, documents,
  } = useMockData();
  const assignableProfiles = teamProfiles.length > 0 ? teamProfiles : profiles;

  const initialTab = (searchParams.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [deptSheet, setDeptSheet] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(["all"]));
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [addTaskForm, setAddTaskForm] = useState<AddTaskForm>({ title: "", dept_id: "", assignee_id: "", priority: "normal", deadline: "" });
  const [showAddDept, setShowAddDept] = useState(false);
  const [removeDeptConfirm, setRemoveDeptConfirm] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editBudget, setEditBudget] = useState("");

  const event = getEvent(id!);

  useEffect(() => {
    if (event) {
      setEditName(event.name);
      setEditLocation(event.location);
      setEditStartDate(event.start_date);
      setEditEndDate(event.end_date);
      setEditBudget(String(event.estimated_budget));
    }
  }, [event?.id]);

  useScrollLock(!!selectedBill || !!deptSheet || showImageUpload);

  if (!event) return <div className="p-8 text-sm text-muted-foreground">Event not found</div>;

  const depts = getDeptsByEvent(event.id);
  const evTasks = getTasksByEvent(event.id);
  const evBills = getBillsByEvent(event.id);
  const docs = getDocsByEvent(event.id);
  const activities = getActivitiesByEvent(event.id);
  const totalSpent = depts.reduce((s, d) => s + d.spent, 0);
  const totalAllocated = depts.reduce((s, d) => s + d.allocated_budget, 0);
  const approvedSpend = evBills.filter(b => b.status === "settled" || b.status === "ca-approved").reduce((s, b) => s + b.amount, 0);
  const pendingBillCount = evBills.filter(b => b.status === "pending" || b.status === "dept-verified").length;
  const doneTasks = evTasks.filter(t => t.status === "completed").length;
  const totalTasks = evTasks.length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "departments", label: "Departments" },
    { key: "tasks", label: "To-Dos" },
    { key: "billing", label: "Billing" },
    { key: "budget", label: "Budget" },
    { key: "documents", label: "Documents" },
  ];

  const handleAddTask = async (deptId: string) => {
    if (!addTaskForm.title.trim()) { toast({ title: "Task title is required", variant: "destructive" }); return; }
    await dbAddTask({
      event_id: event.id,
      dept_id: deptId,
      title: addTaskForm.title.trim(),
      description: "",
      assignee_id: addTaskForm.assignee_id || currentUser.id,
      deadline: addTaskForm.deadline || new Date().toISOString().split("T")[0],
      priority: (addTaskForm.priority || "normal") as any,
      status: "not-started" as const,
      created_by: currentUser.id,
      labels: [],
    });
    setAddTaskForm({ title: "", dept_id: "", assignee_id: "", priority: "normal", deadline: "" });
    setShowAddTask(null);
    toast({ title: "Task added" });
  };

  const handleAddDeptToEvent = async (deptName: string) => {
    const exists = depts.find(d => d.name === deptName);
    if (exists) { toast({ title: "Department already added", variant: "destructive" }); return; }
    await dbAddDepartment({
      event_id: event.id,
      name: deptName,
      head_id: currentUser.id,
      allocated_budget: 0,
      spent: 0,
      notes: "",
    });
    setShowAddDept(false);
    toast({ title: `${deptName} added to event` });
  };

  const handleRemoveDeptFromEvent = async (deptId: string) => {
    await dbDeleteDepartment(deptId);
    setRemoveDeptConfirm(null);
    toast({ title: "Department removed from event" });
  };


  const allDeptNames = Array.from(new Set(departments.map(d => d.name)));
  const existingDeptNames = new Set(depts.map(d => d.name));
  const availableDepts = allDeptNames.filter(n => !existingDeptNames.has(n));

  const bill = selectedBill ? evBills.find(b => b.id === selectedBill) : null;

  const handleSave = async () => {
    await dbUpdateEvent(event.id, { name: editName, location: editLocation, start_date: editStartDate, end_date: editEndDate, estimated_budget: Number(editBudget) });
    setIsEditing(false);
    toast({ title: "Event updated" });
  };

  const handleCancelEdit = () => {
    setEditName(event.name); setEditLocation(event.location); setEditStartDate(event.start_date); setEditEndDate(event.end_date); setEditBudget(String(event.estimated_budget));
    setIsEditing(false);
  };

  const handleImageSelect = async (url: string) => {
    await dbUpdateEvent(event.id, { image_url: url });
    setShowImageUpload(false);
    toast({ title: "Event image updated" });
  };

  const handleApproveBill = async (billId: string) => {
    await dbUpdateBill(billId, { status: "settled" as const, settled_by: currentUser.id, settled_at: new Date().toISOString(), paid_date: new Date().toISOString().split("T")[0] });
    toast({ title: "Bill approved" });
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };

  // Group tasks by department
  const tasksByDept = depts.map(d => ({
    dept: d,
    tasks: evTasks.filter(t => t.dept_id === d.id),
  }));

  return (
    <div className="p-6 w-full">
      {/* Breadcrumb */}
      <p className="text-xs text-muted-foreground mb-3">
        <button onClick={() => navigate("/dashboard")} className="hover:text-foreground">Home</button>
        <span className="mx-1.5">›</span>
        <button onClick={() => navigate("/dashboard")} className="hover:text-foreground">Events</button>
        <span className="mx-1.5">›</span>
        <span className="text-foreground">{event.name}</span>
      </p>

      {/* Event Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => setShowImageUpload(true)} className="shrink-0 group relative">
          {event.image_url ? (
            <img src={event.image_url} alt={event.name} className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
              {event.name.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ImageSquare size={16} className="text-white" />
          </div>
        </button>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input value={editName} onChange={e => setEditName(e.target.value)}
                className="text-xl font-semibold bg-secondary border border-stroke rounded-lg px-3 py-1.5 w-full max-w-md focus:outline-none" />
              <div className="flex gap-3 flex-wrap">
                <div><label className="text-[11px] text-muted-foreground font-medium">Location</label>
                  <input value={editLocation} onChange={e => setEditLocation(e.target.value)} className="block mt-0.5 text-sm bg-secondary border border-stroke rounded-lg px-3 py-1.5 w-[200px] focus:outline-none" /></div>
                <div><label className="text-[11px] text-muted-foreground font-medium">Start Date</label>
                  <input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} className="block mt-0.5 text-sm bg-secondary border border-stroke rounded-lg px-3 py-1.5 focus:outline-none" /></div>
                <div><label className="text-[11px] text-muted-foreground font-medium">End Date</label>
                  <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} className="block mt-0.5 text-sm bg-secondary border border-stroke rounded-lg px-3 py-1.5 focus:outline-none" /></div>
                <div><label className="text-[11px] text-muted-foreground font-medium">Est. Budget (₹)</label>
                  <input type="number" value={editBudget} onChange={e => setEditBudget(e.target.value)} className="block mt-0.5 text-sm bg-secondary border border-stroke rounded-lg px-3 py-1.5 w-[160px] focus:outline-none" /></div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">Save</button>
                <button onClick={handleCancelEdit} className="rounded-full bg-secondary px-4 py-1.5 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{event.name}</h1>
              <StatusBadge status={event.status} />
              <button onClick={() => setIsEditing(true)} className="ml-2 flex h-6 w-6 items-center justify-center rounded-md bg-icon-btn text-icon-btn-fg hover:bg-selected transition-colors">
                <PencilSimple size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-0 border-b border-stroke mb-6 mt-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.key ? "text-foreground border-b-2 border-foreground -mb-px" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ OVERVIEW ============ */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-0 border border-stroke rounded-xl overflow-hidden">
            {[
              { label: "Estimated Budget", value: formatINRShort(event.estimated_budget) },
              { label: "Approved Spend", value: formatINRShort(approvedSpend) },
              { label: "Task Progress", value: `${doneTasks}/${totalTasks}` },
              { label: "Departments", value: String(depts.length) },
            ].map((stat, i) => (
              <div key={i} className={`p-5 ${i < 3 ? "border-r border-stroke" : ""}`}>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold mt-1 tabular-nums">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_300px] gap-6">
            <div className="space-y-6">
              {/* Tasks — flat clickable list */}
              <div className="rounded-xl border border-stroke">
                <div className="flex items-center justify-between px-4 py-3 border-b border-stroke">
                  <h3 className="text-sm font-semibold">Tasks</h3>
                </div>
                <div className="divide-y divide-stroke">
                  {evTasks.slice(0, 5).map(t => {
                    const assignee = getProfile(t.assignee_id);
                    const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-selected transition-colors cursor-pointer"
                        onClick={() => setSelectedTask(t.id)}>
                        <span className="text-sm flex-1 truncate">{t.title}</span>
                        {assignee && <button onClick={e => { e.stopPropagation(); setProfileUserId(assignee.id); }}><UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" /></button>}
                        <StatusBadge status={t.status} />
                        <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{formatDate(t.deadline)}</span>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setTab("tasks")}
                  className="flex items-center justify-center gap-1.5 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-selected border-t border-stroke transition-colors">
                  View all tasks <ArrowRight size={14} />
                </button>
              </div>

              {/* Recent Activities */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Recent Activities</h3>
                <div className="space-y-3">
                  {activities.map(a => {
                    const user = getProfile(a.user_id);
                    const icon = activityTypeIcons[a.type || "status"] || "📌";
                    return (
                      <div key={a.id} className="flex gap-3 items-start">
                        {user && <button onClick={() => setProfileUserId(user.id)}><UserAvatar name={user.name} color={user.avatar_color} size="sm" /></button>}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-relaxed">
                            <span className="mr-1.5">{icon}</span>
                            <button onClick={() => setProfileUserId(a.user_id)} className="font-medium hover:underline">{user?.name}</button>{" "}
                            {a.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(a.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Department Health */}
            <div className="space-y-5">
              <div className="rounded-xl border border-stroke p-4">
                <h3 className="text-sm font-semibold mb-4">Department Health</h3>
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground">Tasks</p>
                  <p className="text-xl font-semibold tabular-nums">{doneTasks}/{totalTasks}</p>
                  <div className="h-1.5 rounded-full bg-secondary mt-2">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="border-t border-stroke pt-4 mb-4">
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold tabular-nums">{formatINRShort(totalSpent)}/{formatINRShort(totalAllocated)}</p>
                  </div>
                </div>
                <div className="border-t border-stroke pt-3 space-y-2">
                  {depts.slice(0, 4).map(d => {
                    const pct = d.allocated_budget > 0 ? Math.round((d.spent / d.allocated_budget) * 100) : 0;
                    return (
                      <div key={d.id} className="flex items-center justify-between text-sm">
                        <span>{d.name}</span>
                        <span className={`tabular-nums font-medium ${pct > 100 ? "text-red-600" : ""}`}>
                          {formatINRShort(d.spent)}/{formatINRShort(d.allocated_budget)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TASKS — grouped by dept, matching screenshot layout ============ */}
      {tab === "tasks" && (
        <div className="space-y-6">
          {tasksByDept.map(({ dept, tasks: dTasks }) => (
            <div key={dept.id}>
              {/* Department group header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold">{dept.name}</h3>
                <button onClick={() => setShowAddTask(showAddTask === dept.id ? null : dept.id)}
                  className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:bg-foreground/90 transition-colors">
                  Add Task
                </button>
              </div>
              {/* Table header */}
              <div className="rounded-xl border border-stroke overflow-hidden">
                <table className="w-full text-sm table-fixed">
                  <thead><tr className="border-b border-stroke">
                    <th className="w-[5%] px-2 py-2.5" />
                    <th className="w-[28%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</th>
                    <th className="w-[14%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                    <th className="w-[10%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
                    <th className="w-[10%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
                    <th className="w-[8%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</th>
                    <th className="w-[12%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                    <th className="w-[10%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="w-[3%] px-2 py-2.5" />
                  </tr></thead>
                  <tbody>
                    {dTasks.map(t => {
                      const assignee = getProfile(t.assignee_id);
                      const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                      const pc = priorityConfig[t.priority] || priorityConfig.normal;
                      const doneCount = t.subtasks.filter(s => s.completed).length;
                      return (
                        <tr key={t.id} className="border-b border-stroke last:border-0 hover:bg-selected cursor-pointer transition-colors"
                          onClick={() => setSelectedTask(t.id)}>
                          <td className="px-2 py-3 text-center">
                            <CaretDown size={14} className="text-muted-foreground mx-auto" />
                          </td>
                          <td className="px-4 py-3 font-medium truncate">{t.title}</td>
                          <td className="px-4 py-3 text-muted-foreground truncate">{dept.name}</td>
                          <td className="px-4 py-3">{assignee && <button onClick={e => { e.stopPropagation(); setProfileUserId(assignee.id); }} className="hover:opacity-80"><UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" /></button>}</td>
                          <td className={`px-4 py-3 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{formatDate(t.deadline)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{doneCount}/{t.subtasks.length}</td>
                          <td className="px-4 py-3"><div className="flex items-center gap-1"><Flag size={13} weight="fill" className={pc.color} /><span className={`text-xs font-medium ${pc.color}`}>{pc.label}</span></div></td>
                          <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                          <td className="px-2 py-3 text-center">
                            <CaretDown size={14} className="text-muted-foreground mx-auto rotate-[-90deg]" />
                          </td>
                        </tr>
                      );
                    })}
                    {/* Inline add task row */}
                    {showAddTask === dept.id && (
                      <tr className="border-b border-stroke bg-secondary/30">
                        <td className="px-2 py-2" />
                        <td className="px-4 py-2" colSpan={2}>
                          <input autoFocus value={addTaskForm.title} onChange={e => setAddTaskForm(f => ({ ...f, title: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && handleAddTask(dept.id)}
                            placeholder="Task name..." className="w-full bg-background border border-stroke rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                        </td>
                        <td className="px-4 py-2">
                          <select value={addTaskForm.assignee_id} onChange={e => setAddTaskForm(f => ({ ...f, assignee_id: e.target.value }))}
                            className="bg-background border border-stroke rounded-lg px-2 py-1.5 text-xs focus:outline-none w-full">
                            <option value="">Assign</option>
                            {assignableProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input type="date" value={addTaskForm.deadline} onChange={e => setAddTaskForm(f => ({ ...f, deadline: e.target.value }))}
                            className="bg-background border border-stroke rounded-lg px-2 py-1.5 text-xs focus:outline-none w-full" />
                        </td>
                        <td className="px-4 py-2" />
                        <td className="px-4 py-2">
                          <select value={addTaskForm.priority} onChange={e => setAddTaskForm(f => ({ ...f, priority: e.target.value }))}
                            className="bg-background border border-stroke rounded-lg px-2 py-1.5 text-xs focus:outline-none w-full">
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </td>
                        <td className="px-4 py-2" colSpan={2}>
                          <div className="flex gap-1">
                            <button onClick={() => handleAddTask(dept.id)} className="rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background">Add</button>
                            <button onClick={() => setShowAddTask(null)} className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium">✕</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {dTasks.length === 0 && !showAddTask && <div className="text-center py-8 text-sm text-muted-foreground">No tasks yet</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ DEPARTMENTS — with assign & budget ============ */}
      {tab === "departments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{depts.length} departments</p>
            <div className="relative">
              <button onClick={() => setShowAddDept(!showAddDept)}
                className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
                <Plus size={14} /> Assign Department
              </button>
              {showAddDept && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-stroke bg-card shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
                  {availableDepts.length > 0 ? availableDepts.map(name => (
                    <button key={name} onClick={() => handleAddDeptToEvent(name)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-selected transition-colors">{name}</button>
                  )) : (
                    <p className="px-4 py-3 text-sm text-muted-foreground">All departments already assigned</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-stroke overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-stroke">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Head</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Members</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Allocated</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Spent</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Utilisation</th>
                <th className="px-4 py-3 w-10" />
              </tr></thead>
              <tbody>
                {depts.map(d => {
                  const head = getProfile(d.head_id);
                  const utilPct = d.allocated_budget > 0 ? Math.round((d.spent / d.allocated_budget) * 100) : 0;
                  const memberCount = d.member_ids?.length || 0;
                  return (
                    <tr key={d.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors cursor-pointer"
                      onClick={() => setDeptSheet(d.id)}>
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3">{head && <button onClick={e => { e.stopPropagation(); setProfileUserId(head.id); }} className="flex items-center gap-1.5 hover:opacity-80"><UserAvatar name={head.name} color={head.avatar_color} size="sm" /><span>{head.name}</span></button>}</td>
                      <td className="px-4 py-3 text-muted-foreground">{memberCount} member{memberCount !== 1 ? "s" : ""}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINRShort(d.allocated_budget)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINRShort(d.spent)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16"><ProgressBar value={Math.min(utilPct, 100)} max={100} /></div>
                          <span className={`text-xs font-medium ${utilPct > 100 ? "text-destructive" : utilPct > 70 ? "text-amber-600" : "text-muted-foreground"}`}>{utilPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setRemoveDeptConfirm(d.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ConfirmDialog
            open={!!removeDeptConfirm}
            title="Remove Department?"
            message="This will remove the department from this event. All associated data and changes will be lost."
            confirmLabel="Remove"
            destructive
            onConfirm={() => removeDeptConfirm && handleRemoveDeptFromEvent(removeDeptConfirm)}
            onCancel={() => setRemoveDeptConfirm(null)}
          />
        </div>
      )}

      {/* ============ BILLING ============ */}
      {tab === "billing" && (() => {
        const [showAddBill, setShowAddBill] = useState(false);
        const [billForm, setBillForm] = useState({
          description: "", vendor_name: "", amount: "", category: "",
          due_date: "", invoice_file: null as File | null,
        });

        const handleAddBillSubmit = async () => {
          if (!billForm.description.trim() || !billForm.vendor_name.trim()) {
            toast({ title: "Description and vendor are required", variant: "destructive" }); return;
          }
          if (!billForm.invoice_file) {
            toast({ title: "Invoice attachment is mandatory", variant: "destructive" }); return;
          }
          await dbAddBill({
            event_id: event.id,
            vendor_name: billForm.vendor_name.trim(),
            description: billForm.description.trim(),
            amount: parseFloat(billForm.amount) || 0,
            category: billForm.category || undefined,
            due_date: billForm.due_date || undefined,
            submitted_by: currentUser.id,
            invoice_file: billForm.invoice_file.name,
          });
          setShowAddBill(false);
          setBillForm({ description: "", vendor_name: "", amount: "", category: "", due_date: "", invoice_file: null });
          toast({ title: "Billing item added" });
        };

        return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{evBills.length} billing items</p>
            <button onClick={() => setShowAddBill(true)} className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
              <Plus size={14} /> Add Billing Item
            </button>
          </div>
          <div className="rounded-xl border border-stroke overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-stroke">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Item</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {evBills.map(b => {
                  const dept = getDepartment(b.dept_id);
                  return (
                    <tr key={b.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors cursor-pointer" onClick={() => setSelectedBill(b.id)}>
                      <td className="px-4 py-3"><p className="font-medium">{b.description}</p><p className="text-xs text-muted-foreground">{dept?.name}</p></td>
                      <td className="px-4 py-3">{b.vendor_name}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{formatINRShort(b.amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{b.due_date ? formatDate(b.due_date) : "—"}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {(b.status === "pending" || b.status === "dept-verified") && (
                          <button onClick={() => handleApproveBill(b.id)} className="rounded-full bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-medium hover:bg-emerald-700">✓</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Bill Sidesheet */}
          {showAddBill && (
            <>
              <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowAddBill(false)} />
              <div className="fixed right-0 top-0 z-[61] h-full w-full max-w-lg overflow-y-auto bg-card border-l border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Add Billing Item</h3>
                    <button onClick={() => setShowAddBill(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description <span className="text-destructive">*</span></label>
                    <input value={billForm.description} onChange={e => setBillForm(f => ({ ...f, description: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="What is this expense for?" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vendor <span className="text-destructive">*</span></label>
                    <input value={billForm.vendor_name} onChange={e => setBillForm(f => ({ ...f, vendor_name: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="Vendor name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Amount (₹)</label>
                      <input type="number" value={billForm.amount} onChange={e => setBillForm(f => ({ ...f, amount: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <input value={billForm.category} onChange={e => setBillForm(f => ({ ...f, category: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="e.g. Logistics" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <input type="date" value={billForm.due_date} onChange={e => setBillForm(f => ({ ...f, due_date: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Invoice Attachment <span className="text-destructive">*</span></label>
                    <input type="file" onChange={e => setBillForm(f => ({ ...f, invoice_file: e.target.files?.[0] || null }))}
                      className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-foreground hover:file:bg-selected" />
                    {billForm.invoice_file && <p className="text-xs text-muted-foreground mt-1">{billForm.invoice_file.name}</p>}
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <button onClick={() => setShowAddBill(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                    <button onClick={handleAddBillSubmit} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Add Item</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        );
      })()}

      {/* ============ BUDGET ============ */}
      {tab === "budget" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-0 border border-stroke rounded-xl overflow-hidden">
            {[
              { label: "Estimated Budget", value: formatINRShort(event.estimated_budget) },
              { label: "Total Allocated", value: formatINRShort(totalAllocated) },
              { label: "Total Spent", value: formatINRShort(totalSpent) },
            ].map((stat, i) => (
              <div key={i} className={`p-5 ${i < 2 ? "border-r border-stroke" : ""}`}>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-semibold mt-1 tabular-nums">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-stroke overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-stroke">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Allocated</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Spent</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Utilisation</th>
              </tr></thead>
              <tbody>
                {depts.map(d => {
                  const utilPct = d.allocated_budget > 0 ? Math.round((d.spent / d.allocated_budget) * 100) : 0;
                  return (
                    <tr key={d.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINRShort(d.allocated_budget)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${utilPct > 100 ? "text-red-600 font-medium" : ""}`}>{formatINRShort(d.spent)}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-20"><ProgressBar value={Math.min(utilPct, 100)} max={100} /></div><span className={`text-xs font-medium ${utilPct > 100 ? "text-red-600" : "text-muted-foreground"}`}>{utilPct}%</span></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ DOCUMENTS ============ */}
      {tab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{docs.length} documents</p>
            <button className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
              <Plus size={14} /> Upload Document
            </button>
          </div>
          <div className="rounded-xl border border-stroke overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-stroke">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Document</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Folder</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Uploaded By</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Size</th>
              </tr></thead>
              <tbody>
                {docs.map(d => {
                  const uploader = getProfile(d.uploaded_by);
                  return (
                    <tr key={d.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{d.folder}</span></td>
                      <td className="px-4 py-3">{uploader && <span>{uploader.name}</span>}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(d.uploaded_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.file_size}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bill Detail Drawer */}
      {bill && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedBill(null)} />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-card border-l border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{bill.vendor_name}</h3>
              <button onClick={() => setSelectedBill(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground">{bill.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm border-t border-stroke pt-4">
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Amount</p><p className="font-semibold text-lg">{formatINRShort(bill.amount)}</p></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status</p><StatusBadge status={bill.status} /></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Invoice</p><p>{bill.invoice_number}</p></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Department</p><p>{getDepartment(bill.dept_id)?.name}</p></div>
            </div>
            {bill.invoice_file && (
              <div className="flex items-center gap-1.5 text-sm text-accent cursor-pointer hover:underline border-t border-stroke pt-3">
                <FileText size={14} /> {bill.invoice_file}
              </div>
            )}
          </div>
        </>
      )}

      {/* Dept Sidesheet */}
      {deptSheet && (() => {
        const dept = getDepartment(deptSheet);
        if (!dept) return null;
        const deptTasks = evTasks.filter(t => t.dept_id === dept.id);
        const deptDocs = docs.filter(d => d.dept_id === dept.id);
        const head = getProfile(dept.head_id);
        const utilPct = dept.allocated_budget > 0 ? Math.round((dept.spent / dept.allocated_budget) * 100) : 0;
        const deptMembers = (dept.member_ids || []).map(id => getProfile(id)).filter(Boolean);
        const admins = profiles.filter(p => p.role === "sa" || p.role === "org");
        const nonMembers = assignableProfiles.filter(p => !(dept.member_ids || []).includes(p.id) && p.id !== dept.head_id);

        const handleAddMember = async (userId: string) => {
          const currentIds = dept.member_ids || [];
          if (currentIds.includes(userId)) return;
          await dbUpdateDepartment(dept.id, { member_ids: [...currentIds, userId] });
          toast({ title: "Member added to department" });
        };

        const handleRemoveMember = async (userId: string) => {
          const currentIds = dept.member_ids || [];
          await dbUpdateDepartment(dept.id, { member_ids: currentIds.filter(id => id !== userId) });
          toast({ title: "Member removed from department" });
        };

        return (
          <>
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setDeptSheet(null)} />
            <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-card border-l border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 space-y-4">
              <p className="text-xs text-muted-foreground">{event.name} › {dept.name}</p>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{dept.name}</h3>
                <button onClick={() => setDeptSheet(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              {head && <div className="flex items-center gap-2"><button onClick={() => setProfileUserId(head.id)}><UserAvatar name={head.name} color={head.avatar_color} size="sm" /></button><span className="text-sm">{head.name} · Dept Head</span></div>}
              <div className="border-t border-stroke pt-3">
                <p className="text-xs text-muted-foreground mb-1">Budget ({utilPct}% used)</p>
                <ProgressBar value={Math.min(utilPct, 100)} max={100} />
                <div className="flex justify-between text-sm mt-1">
                  <span>{formatINRShort(dept.spent)} spent</span>
                  <span>{formatINRShort(dept.allocated_budget)} allocated</span>
                </div>
              </div>
              {/* Department Members with add/remove */}
              <div className="border-t border-stroke pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Members ({deptMembers.length})</p>
                  {nonMembers.length > 0 && (
                    <select
                      value=""
                      onChange={e => { if (e.target.value) handleAddMember(e.target.value); }}
                      className="rounded-lg border border-stroke bg-secondary px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="">+ Add member</option>
                      {nonMembers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                </div>
                {deptMembers.length > 0 ? (
                  <div className="space-y-1.5">
                    {deptMembers.map(m => m && (
                      <div key={m.id} className="flex items-center gap-2 w-full py-1 px-1 rounded hover:bg-secondary/50 group">
                        <button onClick={() => setProfileUserId(m.id)} className="flex items-center gap-2 flex-1 min-w-0">
                          <UserAvatar name={m.name} color={m.avatar_color} size="sm" />
                          <span className="text-sm truncate">{m.name}</span>
                        </button>
                        <button onClick={() => handleRemoveMember(m.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No members assigned. Use the dropdown above to add.</p>
                )}
              </div>
              {/* Admins with Access */}
              <div className="border-t border-stroke pt-3">
                <p className="text-sm font-semibold mb-2">Admins ({admins.length})</p>
                <div className="space-y-1.5">
                  {admins.map(a => (
                    <button key={a.id} onClick={() => setProfileUserId(a.id)} className="flex items-center gap-2 w-full py-1 px-1 rounded hover:bg-secondary/50">
                      <UserAvatar name={a.name} color={a.avatar_color} size="sm" />
                      <div className="text-left">
                        <span className="text-sm">{a.name}</span>
                        <span className="text-[11px] text-muted-foreground ml-2">{a.role === "sa" ? "Super Admin" : "Organiser"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Tasks */}
              <div className="border-t border-stroke pt-3">
                <p className="text-sm font-semibold mb-2">Tasks ({deptTasks.length})</p>
                <div className="space-y-1">
                  {deptTasks.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-secondary/50 rounded px-1" onClick={() => { setDeptSheet(null); setSelectedTask(t.id); }}>
                      <span className="text-sm flex-1 truncate">{t.title}</span>
                      <StatusBadge status={t.status} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Documents */}
              <div className="border-t border-stroke pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Documents ({deptDocs.length})</p>
                  <label className="flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background cursor-pointer hover:bg-foreground/90 transition-colors">
                    <Plus size={12} /> Upload
                    <input type="file" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await dbAddDocument({
                        event_id: event.id,
                        dept_id: dept.id,
                        name: file.name,
                        folder: "Other",
                        file_url: URL.createObjectURL(file),
                        file_size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                        uploaded_by: currentUser.id,
                        visibility: "internal",
                      });
                      toast({ title: "Document uploaded" });
                    }} />
                  </label>
                </div>
                {deptDocs.length > 0 ? (
                  <div className="space-y-1">
                    {deptDocs.map(d => (
                      <div key={d.id} className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-secondary/50">
                        <FileText size={14} className="text-muted-foreground shrink-0" />
                        <span className="text-sm flex-1 truncate">{d.name}</span>
                        <span className="text-[11px] text-muted-foreground">{d.file_size}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No documents yet.</p>
                )}
              </div>
            </div>
          </>
        );
      })()}

      <TaskDetailSheet taskId={selectedTask} onClose={() => setSelectedTask(null)} onOpenProfile={setProfileUserId} />
      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      {showImageUpload && (
        <EventImageUpload currentImage={event.image_url} onSelect={handleImageSelect} onClose={() => setShowImageUpload(false)} />
      )}
    </div>
  );
}
