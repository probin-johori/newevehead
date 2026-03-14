import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useMockData, formatINRShort, formatDate, formatTimeAgo } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { useScrollLock } from "@/hooks/useScrollLock";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Flag, Plus, Eye, FileText, X, Check, PencilSimple, CaretDown, CaretUp,
  ArrowBendDownRight, CheckSquare, Square, ChatCircle, Upload as UploadIcon,
  ArrowRight, At, PaperPlaneRight, Trash, PencilSimple as PencilEdit
} from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";

type Tab = "overview" | "departments" | "tasks" | "billing" | "budget" | "documents";

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: "text-red-600", label: "Urgent" },
  high: { color: "text-amber-600", label: "High" },
  normal: { color: "text-blue-600", label: "Normal" },
  low: { color: "text-muted-foreground", label: "Low" },
};

const activityTypeIcons: Record<string, string> = {
  comment: "💬",
  reply: "↩️",
  mention: "📢",
  edit: "✏️",
  assign: "👤",
  deadline: "📅",
  status: "✅",
  billing: "💳",
  upload: "📎",
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    getEvent, getDeptsByEvent, getTasksByEvent, getBillsByEvent, getDocsByEvent,
    getProfile, getDepartment, getActivitiesByEvent, deptHealth,
    currentUser, bills, events, setEvents, setBills,
    tasks: allTasks, getCommentsByTask, taskComments, setTaskComments
  } = useMockData();

  const initialTab = (searchParams.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set(["t1"]));
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmEdit, setConfirmEdit] = useState<string | null>(null);

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

  useScrollLock(!!selectedBill || !!selectedTask);

  if (!event) return <div className="p-8 text-sm text-muted-foreground">Event not found</div>;

  const depts = getDeptsByEvent(event.id);
  const evTasks = getTasksByEvent(event.id);
  const evBills = getBillsByEvent(event.id);
  const docs = getDocsByEvent(event.id);
  const activities = getActivitiesByEvent(event.id);
  const totalSpent = depts.reduce((s, d) => s + d.spent, 0);
  const totalAllocated = depts.reduce((s, d) => s + d.allocated_budget, 0);
  const budgetRemaining = event.estimated_budget - totalSpent;
  const approvedSpend = evBills.filter(b => b.status === "settled" || b.status === "ca-approved").reduce((s, b) => s + b.amount, 0);
  const pendingBillCount = evBills.filter(b => b.status === "pending" || b.status === "dept-verified").length;
  const totalTasks = 55;
  const doneTasks = 31;
  const dueTodayCount = evTasks.filter(t => {
    const d = new Date(t.deadline);
    const today = new Date();
    return d.toDateString() === today.toDateString() && t.status !== "completed";
  }).length;
  const overdueCount = evTasks.filter(t => t.status !== "completed" && new Date(t.deadline) < new Date()).length;

  const tabs: { key: Tab; label: string; dot?: boolean }[] = [
    { key: "overview", label: "Overview" },
    { key: "departments", label: "Departments" },
    { key: "tasks", label: "Tasks" },
    { key: "billing", label: "Billing", dot: pendingBillCount > 0 },
    { key: "budget", label: "Budget" },
    { key: "documents", label: "Documents" },
  ];

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const bill = selectedBill ? evBills.find(b => b.id === selectedBill) : null;
  const task = selectedTask ? evTasks.find(t => t.id === selectedTask) : null;
  const taskDetailComments = task ? getCommentsByTask(task.id) : [];

  const handleSave = () => {
    setEvents(events.map(e => e.id === event.id ? {
      ...e, name: editName, location: editLocation, start_date: editStartDate,
      end_date: editEndDate, estimated_budget: Number(editBudget)
    } : e));
    setIsEditing(false);
    toast({ title: "Event updated", description: "Changes saved successfully" });
  };

  const handleCancelEdit = () => {
    setEditName(event.name);
    setEditLocation(event.location);
    setEditStartDate(event.start_date);
    setEditEndDate(event.end_date);
    setEditBudget(String(event.estimated_budget));
    setIsEditing(false);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() || !task) return;
    setTaskComments([...taskComments, {
      id: `tc_new_${Date.now()}`, task_id: task.id, author_id: currentUser.id,
      body: newComment.trim(), created_at: new Date().toISOString(),
    }]);
    setNewComment("");
  };

  const handleDeleteComment = (commentId: string) => {
    setTaskComments(taskComments.filter(c => c.id !== commentId));
    setConfirmDelete(null);
    toast({ title: "Comment deleted" });
  };

  const handleEditComment = (commentId: string) => {
    if (!editBody.trim()) return;
    setTaskComments(taskComments.map(c => c.id === commentId ? { ...c, body: editBody.trim() } : c));
    setEditingComment(null);
    setEditBody("");
    setConfirmEdit(null);
    toast({ title: "Comment updated" });
  };

  const handleApproveBill = (billId: string) => {
    setBills(bills.map(b => b.id === billId ? { ...b, status: "settled" as const, settled_by: currentUser.id, settled_at: new Date().toISOString(), paid_date: new Date().toISOString().split("T")[0] } : b));
    toast({ title: "Bill approved", description: "Status updated to Paid" });
  };

  const handleRejectBill = (billId: string) => {
    setBills(bills.map(b => b.id === billId ? { ...b, status: "rejected" as const } : b));
    toast({ title: "Bill rejected" });
  };

  return (
    <div className="p-6 w-full">
      {/* Event Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
          🎆
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input value={editName} onChange={e => setEditName(e.target.value)}
                className="text-xl font-semibold bg-secondary border border-stroke rounded-lg px-3 py-1.5 w-full max-w-md focus:outline-none" />
              <div className="flex gap-3 flex-wrap">
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium">Location</label>
                  <input value={editLocation} onChange={e => setEditLocation(e.target.value)}
                    className="block mt-0.5 text-sm bg-secondary border border-stroke rounded-lg px-3 py-1.5 w-[200px] focus:outline-none" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium">Start Date</label>
                  <input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)}
                    className="block mt-0.5 text-sm bg-secondary border border-stroke rounded-lg px-3 py-1.5 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium">End Date</label>
                  <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)}
                    className="block mt-0.5 text-sm bg-secondary border border-stroke rounded-lg px-3 py-1.5 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium">Est. Budget (₹)</label>
                  <input type="number" value={editBudget} onChange={e => setEditBudget(e.target.value)}
                    className="block mt-0.5 text-sm bg-secondary border border-stroke rounded-lg px-3 py-1.5 w-[160px] focus:outline-none" />
                </div>
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
              <button onClick={() => setIsEditing(true)}
                className="ml-2 flex h-6 w-6 items-center justify-center rounded-md bg-icon-btn text-icon-btn-fg hover:bg-selected transition-colors">
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
            {t.dot && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent" />}
          </button>
        ))}
      </div>

      {/* ============ OVERVIEW ============ */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stat Cards */}
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
            {/* Left: Tasks + Activity */}
            <div className="space-y-6">
              {/* Tasks Preview — simplified flat list */}
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
                        {assignee && <UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" />}
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
                        {user && <UserAvatar name={user.name} color={user.avatar_color} size="sm" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-relaxed">
                            <span className="mr-1.5">{icon}</span>
                            <span className="font-medium">{user?.name}</span>{" "}
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
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(doneTasks / totalTasks) * 100}%` }} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {dueTodayCount > 0 && <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">{dueTodayCount} due today</span>}
                    {overdueCount > 0 && <span className="text-[11px] font-medium text-red-700 bg-red-50 rounded-full px-2 py-0.5">{overdueCount} overdue</span>}
                  </div>
                </div>
                <div className="border-t border-stroke pt-4 mb-4">
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold tabular-nums">{formatINRShort(totalSpent)}/{formatINRShort(totalAllocated)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{formatINRShort(budgetRemaining)} left</p>
                  </div>
                </div>
                <div className="flex items-center justify-center py-4">
                  <div className="relative h-28 w-28">
                    <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--stroke))" strokeWidth="3" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--foreground))" strokeWidth="3"
                        strokeDasharray={`${(totalSpent / totalAllocated) * 88} 88`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-semibold tabular-nums">{formatINRShort(budgetRemaining)}</span>
                      <span className="text-[10px] text-muted-foreground">remaining</span>
                    </div>
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

      {/* ============ TASKS ============ */}
      {tab === "tasks" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-stroke overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke">
                  <th className="w-10"></th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subtasks</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {evTasks.map(t => {
                  const dept = getDepartment(t.dept_id);
                  const assignee = getProfile(t.assignee_id);
                  const doneCount = t.subtasks.filter(s => s.completed).length;
                  const totalCount = t.subtasks.length;
                  const isExpanded = expandedTasks.has(t.id);
                  const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                  const pc = priorityConfig[t.priority] || priorityConfig.normal;
                  return (
                    <tbody key={t.id}>
                      <tr className="border-b border-stroke hover:bg-selected cursor-pointer transition-colors" onClick={() => toggleTask(t.id)}>
                        <td className="px-3 py-3 text-center">
                          {isExpanded ? <CaretUp size={14} className="text-muted-foreground mx-auto" /> : <CaretDown size={14} className="text-muted-foreground mx-auto" />}
                        </td>
                        <td className="px-4 py-3 font-medium">{t.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{dept?.name}</td>
                        <td className="px-4 py-3">{assignee && <div className="flex items-center gap-1.5"><UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" /></div>}</td>
                        <td className={`px-4 py-3 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{formatDate(t.deadline)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{doneCount}/{totalCount}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Flag size={13} weight="fill" className={pc.color} />
                            <span className={`text-xs font-medium ${pc.color}`}>{pc.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      </tr>
                      {isExpanded && t.subtasks.map(st => (
                        <tr key={st.id} className="border-b border-stroke bg-secondary/30">
                          <td></td>
                          <td colSpan={7} className="px-4 py-2">
                            <div className="flex items-center gap-2 pl-4">
                              <ArrowBendDownRight size={14} className="text-muted-foreground shrink-0" />
                              {st.completed ? <CheckSquare size={16} weight="fill" className="text-emerald-500 shrink-0" /> : <Square size={16} className="text-muted-foreground shrink-0" />}
                              <span className={`text-sm ${st.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{st.title}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ DEPARTMENTS ============ */}
      {tab === "departments" && (
        <div className="rounded-xl border border-stroke overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Head</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Allocated</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Spent</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Utilisation</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {depts.map(d => {
                const head = getProfile(d.head_id);
                const dh = deptHealth.find(h => h.name === d.name);
                const utilPct = d.allocated_budget > 0 ? Math.round((d.spent / d.allocated_budget) * 100) : 0;
                const overBudget = utilPct > 100;
                return (
                  <tr key={d.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors cursor-pointer"
                    onClick={() => navigate(`/departments/${encodeURIComponent(d.name)}`)}>
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3">{head && <div className="flex items-center gap-1.5"><UserAvatar name={head.name} color={head.avatar_color} size="sm" /><span>{head.name}</span></div>}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatINRShort(d.allocated_budget)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${overBudget ? "text-red-600 font-medium" : ""}`}>{formatINRShort(d.spent)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dh ? `${dh.tasksDone}/${dh.tasksTotal}` : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16"><ProgressBar value={Math.min(utilPct, 100)} max={100} /></div>
                        <span className={`text-xs font-medium ${overBudget ? "text-red-600" : utilPct > 70 ? "text-amber-600" : "text-muted-foreground"}`}>{utilPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {overBudget ? <span className="text-[11px] font-medium text-red-600 bg-red-50 rounded-full px-2 py-0.5">Over Budget</span>
                        : <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">On Track</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ BILLING ============ */}
      {tab === "billing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{evBills.length} billing items</p>
            <button className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
              <Plus size={14} /> Add Billing Item
            </button>
          </div>
          <div className="rounded-xl border border-stroke overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Item</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {evBills.map(b => {
                  const dept = getDepartment(b.dept_id);
                  return (
                    <tr key={b.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors cursor-pointer" onClick={() => setSelectedBill(b.id)}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{b.description}</p>
                        <p className="text-xs text-muted-foreground">{dept?.name}</p>
                      </td>
                      <td className="px-4 py-3">{b.vendor_name}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{formatINRShort(b.amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{b.due_date ? formatDate(b.due_date) : "—"}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {(b.status === "pending" || b.status === "dept-verified") && (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleApproveBill(b.id)} className="rounded-full bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-medium hover:bg-emerald-700">✓</button>
                            <button onClick={() => handleRejectBill(b.id)} className="rounded-full bg-red-50 text-red-600 px-2.5 py-1 text-[11px] font-medium hover:bg-red-100">✗</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              <thead>
                <tr className="border-b border-stroke">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Allocated</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Spent</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Utilisation</th>
                </tr>
              </thead>
              <tbody>
                {depts.map(d => {
                  const utilPct = d.allocated_budget > 0 ? Math.round((d.spent / d.allocated_budget) * 100) : 0;
                  const pending = evBills.filter(b => b.dept_id === d.id && b.status !== "settled" && b.status !== "rejected").reduce((s, b) => s + b.amount, 0);
                  const overBudget = utilPct > 100;
                  return (
                    <tr key={d.id} className={`border-b border-stroke last:border-0 ${overBudget ? "bg-red-50/50" : "hover:bg-selected"} transition-colors`}>
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINRShort(d.allocated_budget)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${overBudget ? "text-red-600 font-medium" : ""}`}>{formatINRShort(d.spent)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatINRShort(pending)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20"><ProgressBar value={Math.min(utilPct, 100)} max={100} /></div>
                          <span className={`text-xs font-medium ${overBudget ? "text-red-600" : utilPct > 70 ? "text-amber-600" : "text-muted-foreground"}`}>{utilPct}%</span>
                        </div>
                      </td>
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
              <thead>
                <tr className="border-b border-stroke">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Document</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Folder</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Uploaded By</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Size</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {docs.map(d => {
                  const uploader = getProfile(d.uploaded_by);
                  const dept = d.dept_id ? getDepartment(d.dept_id) : null;
                  return (
                    <tr key={d.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{d.folder}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{dept?.name || "—"}</td>
                      <td className="px-4 py-3">{uploader && <div className="flex items-center gap-1.5"><UserAvatar name={uploader.name} color={uploader.avatar_color} size="sm" /><span>{uploader.name}</span></div>}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(d.uploaded_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.file_size}</td>
                      <td className="px-4 py-3"><button className="text-muted-foreground hover:text-foreground transition-colors"><Eye size={15} /></button></td>
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
          </div>
        </>
      )}

      {/* Task Detail Panel */}
      {task && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedTask(null)} />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto bg-card border-l border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={task.status} />
                  <StatusBadge status={task.priority} />
                </div>
                <h2 className="text-lg font-semibold">{task.title}</h2>
                {task.description && <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>}
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-muted-foreground hover:text-foreground ml-4"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-stroke pt-4 text-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Event</p>
                <p className="text-sm font-medium">{getEvent(task.event_id)?.name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Assignee</p>
                {(() => { const a = getProfile(task.assignee_id); return a ? <div className="flex items-center gap-1.5"><UserAvatar name={a.name} color={a.avatar_color} size="sm" /><span>{a.name}</span></div> : null; })()}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Deadline</p>
                <p>{formatDate(task.deadline)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Subtasks</p>
                <p>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} completed</p>
              </div>
            </div>
            {task.subtasks.length > 0 && (
              <div className="border-t border-stroke pt-4">
                <h3 className="text-sm font-semibold mb-3">Sub-tasks</h3>
                <div className="space-y-2">
                  {task.subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={st.completed} readOnly className="h-4 w-4 rounded border-stroke accent-accent" />
                      <span className={`text-sm ${st.completed ? "line-through text-muted-foreground" : ""}`}>{st.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Comments */}
            <div className="border-t border-stroke pt-4">
              <h3 className="text-sm font-semibold mb-3">Discussion ({taskDetailComments.length})</h3>
              <div className="space-y-3">
                {taskDetailComments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>}
                {taskDetailComments.map(c => {
                  const author = getProfile(c.author_id);
                  const canEdit = c.author_id === currentUser.id;
                  const canDelete = c.author_id === currentUser.id || currentUser.role === "sa";
                  return (
                    <div key={c.id} className="flex gap-3">
                      {author && <UserAvatar name={author.name} color={author.avatar_color} size="sm" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{author?.name}</span>
                          <span className="text-[11px] text-muted-foreground">{formatTimeAgo(c.created_at)}</span>
                          {canEdit && <button onClick={() => { setEditingComment(c.id); setEditBody(c.body); }} className="text-muted-foreground hover:text-foreground ml-auto"><PencilEdit size={13} /></button>}
                          {canDelete && <button onClick={() => setConfirmDelete(c.id)} className="text-muted-foreground hover:text-red-600"><Trash size={13} /></button>}
                        </div>
                        {editingComment === c.id ? (
                          <div className="flex gap-2 mt-1">
                            <input value={editBody} onChange={e => setEditBody(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") setConfirmEdit(c.id); }}
                              className="flex-1 rounded-lg border border-stroke bg-secondary px-3 py-1.5 text-sm focus:outline-none" />
                            <button onClick={() => setConfirmEdit(c.id)} className="rounded-full bg-foreground px-3 py-1.5 text-xs text-background font-medium">Save</button>
                            <button onClick={() => { setEditingComment(null); setEditBody(""); }} className="text-xs text-muted-foreground">Cancel</button>
                          </div>
                        ) : <p className="text-sm text-foreground/90 leading-relaxed mt-0.5">{c.body}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-4">
                <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
                <div className="flex-1 flex gap-2">
                  <input value={newComment} onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmitComment()}
                    placeholder="Write a comment..."
                    className="flex-1 rounded-full border border-stroke bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none" />
                  <button onClick={handleSubmitComment} disabled={!newComment.trim()}
                    className="rounded-full bg-foreground px-3 py-2 text-background hover:bg-foreground/90 disabled:opacity-40 transition-colors">
                    <PaperPlaneRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog open={!!confirmDelete} title="Delete Message" message="Delete this message? This cannot be undone."
        confirmLabel="Delete" destructive onConfirm={() => confirmDelete && handleDeleteComment(confirmDelete)} onCancel={() => setConfirmDelete(null)} />
      <ConfirmDialog open={!!confirmEdit} title="Save Changes" message="Save changes to this message?"
        confirmLabel="Confirm" onConfirm={() => confirmEdit && handleEditComment(confirmEdit)} onCancel={() => setConfirmEdit(null)} />
    </div>
  );
}
