import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { ArrowRight, TrendUp, TrendDown, Clock, Warning, CalendarDots, CheckCircle } from "@phosphor-icons/react";

const monthlySpend = [
  { month: "Sep", spend: 120000 },
  { month: "Oct", spend: 180000 },
  { month: "Nov", spend: 95000 },
  { month: "Dec", spend: 210000 },
  { month: "Jan", spend: 160000 },
  { month: "Feb", spend: 80000 },
];

const taskTrend = [
  { week: "W1", completed: 3, created: 5 },
  { week: "W2", completed: 5, created: 4 },
  { week: "W3", completed: 2, created: 6 },
  { week: "W4", completed: 7, created: 3 },
];

const COLORS = ["hsl(120, 40%, 16%)", "hsl(104, 54%, 35%)", "hsl(40, 15%, 82%)", "hsl(40, 8%, 42%)"];

export default function DashboardPage() {
  const { currentUser, events, tasks, bills, subscription, getProfile, getDeptsByEvent, getEvent, getDepartment } = useMockData();
  const navigate = useNavigate();
  const isAdmin = currentUser.role === "sa" || currentUser.role === "org";

  const settledTotal = bills.filter(b => b.status === "settled").reduce((s, b) => s + b.amount, 0);
  const pendingBills = bills.filter(b => {
    if (currentUser.role === "sa") return b.status === "dept-verified";
    if (currentUser.role === "dept_head") return b.status === "pending";
    return false;
  });

  const overdueTasks = tasks.filter(t => t.status !== "completed" && new Date(t.deadline) < new Date());
  const myTasks = tasks.filter(t => t.assignee_id === currentUser.id);
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const totalTasks = tasks.length;

  // Pie data for task status
  const taskStatusData = [
    { name: "Completed", value: tasks.filter(t => t.status === "completed").length },
    { name: "In Progress", value: tasks.filter(t => t.status === "in-progress").length },
    { name: "Not Started", value: tasks.filter(t => t.status === "not-started").length },
    { name: "Blocked", value: tasks.filter(t => t.status === "blocked").length },
  ].filter(d => d.value > 0);

  // Dept spend breakdown
  const deptSpend = events.filter(e => e.status === "active" || e.status === "planning").flatMap(e => {
    const depts = getDeptsByEvent(e.id);
    return depts.map(d => ({
      dept: d.name,
      event: e.name,
      allocated: d.allocated_budget,
      spent: bills.filter(b => b.dept_id === d.id && (b.status === "settled" || b.status === "dept-verified")).reduce((s, b) => s + b.amount, 0),
    }));
  });

  if (currentUser.role === "dept_member") {
    return (
      <>
        <TopBar title="Dashboard" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">Your Tasks</p>
              <p className="mt-1 text-3xl font-serif">{myTasks.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">Completed</p>
              <p className="mt-1 text-3xl font-serif">{myTasks.filter(t => t.status === "completed").length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">Overdue</p>
              <p className="mt-1 text-3xl font-serif text-destructive">{myTasks.filter(t => t.status !== "completed" && new Date(t.deadline) < new Date()).length}</p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif">Your Assigned Tasks</h2>
              <button onClick={() => navigate("/tasks")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight size={12} />
              </button>
            </div>
            {myTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have no assigned tasks yet.</p>
            ) : (
              <div className="space-y-2">
                {myTasks.map(t => {
                  const ev = getEvent(t.event_id);
                  const dept = getDepartment(t.dept_id);
                  const daysLeft = Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86400000);
                  return (
                    <button key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left hover:shadow-md transition-all">
                      <div>
                        <p className="font-medium text-sm">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{ev?.name} · {dept?.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={t.priority} />
                        <StatusBadge status={t.status} />
                        <span className={`text-xs font-medium ${daysLeft < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <button onClick={() => navigate("/events")} className="rounded-xl border border-border bg-card p-5 shadow-sm text-left hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Active Events</p>
              <CalendarDots size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <p className="mt-1 text-3xl font-serif">{events.filter(e => e.status === "active").length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{events.length} total events</p>
          </button>
          <button onClick={() => navigate("/billing")} className="rounded-xl border border-border bg-card p-5 shadow-sm text-left hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Settled Amount</p>
              <TrendUp size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <p className="mt-1 text-3xl font-serif">₹{(settledTotal / 1000).toFixed(0)}K</p>
            <p className="text-[11px] text-muted-foreground mt-1">{bills.filter(b => b.status === "settled").length} bills settled</p>
          </button>
          <button onClick={() => navigate("/billing")} className="rounded-xl border border-border bg-card p-5 shadow-sm text-left hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Pending Bills</p>
              <Clock size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <p className="mt-1 text-3xl font-serif">{pendingBills.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Awaiting your action</p>
          </button>
          <button onClick={() => navigate("/tasks")} className="rounded-xl border border-border bg-card p-5 shadow-sm text-left hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Task Completion</p>
              <CheckCircle size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <p className="mt-1 text-3xl font-serif">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</p>
            <p className="text-[11px] text-muted-foreground mt-1">{completedTasks}/{totalTasks} tasks done</p>
          </button>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-3 gap-6">
            {/* Spend Chart */}
            <div className="col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-base font-serif mb-4">Monthly Spend Overview</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlySpend}>
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}K`} />
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, border: '1px solid hsl(40, 14%, 87%)', fontSize: 13 }} />
                  <Bar dataKey="spend" fill="hsl(120, 40%, 16%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Task Status Pie */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-base font-serif mb-4">Task Distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={taskStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {taskStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {taskStatusData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="grid grid-cols-2 gap-6">
            {/* Task Trend */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-base font-serif mb-4">Task Velocity</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={taskTrend}>
                  <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Area type="monotone" dataKey="completed" stackId="1" stroke="hsl(120, 40%, 16%)" fill="hsl(120, 40%, 16%)" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="created" stackId="2" stroke="hsl(104, 54%, 35%)" fill="hsl(104, 54%, 35%)" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-primary" /> Completed
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <div className="h-2 w-2 rounded-full" style={{ background: "hsl(104, 54%, 35%)" }} /> Created
                </span>
              </div>
            </div>

            {/* Active Events */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-serif">Active Events</h3>
                <button onClick={() => navigate("/events")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {events.filter(e => e.status === "active" || e.status === "planning").map(ev => {
                  const evTasks = tasks.filter(t => t.event_id === ev.id);
                  const done = evTasks.filter(t => t.status === "completed").length;
                  const poc = getProfile(ev.poc_id);
                  return (
                    <button key={ev.id} onClick={() => navigate(`/events/${ev.id}`)} className="flex w-full items-center justify-between text-left hover:bg-secondary/50 rounded-lg px-2 py-2 -mx-2 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {poc && <UserAvatar name={poc.name} color={poc.avatar_color} size="sm" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{ev.name}</p>
                          <p className="text-[11px] text-muted-foreground">{poc?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20">
                          <ProgressBar value={done} max={evTasks.length} />
                        </div>
                        <StatusBadge status={ev.status} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Warning size={16} className="text-destructive" />
                <h3 className="text-base font-serif">Overdue Tasks</h3>
              </div>
              <button onClick={() => navigate("/tasks")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {overdueTasks.map(t => {
                const ev = getEvent(t.event_id);
                const dept = getDepartment(t.dept_id);
                const assignee = getProfile(t.assignee_id);
                const daysOverdue = Math.ceil((Date.now() - new Date(t.deadline).getTime()) / 86400000);
                return (
                  <button key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="flex w-full items-center justify-between rounded-lg bg-secondary/50 px-4 py-3 text-left hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-3">
                      {assignee && <UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" />}
                      <div>
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="text-[11px] text-muted-foreground">{ev?.name} · {dept?.name}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                      {daysOverdue}d overdue
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending Bills */}
        {isAdmin && pendingBills.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-serif">Pending Bills</h3>
              <button onClick={() => navigate("/billing")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {pendingBills.map(b => {
                const ev = getEvent(b.event_id);
                return (
                  <button key={b.id} onClick={() => navigate("/billing")} className="flex w-full items-center justify-between rounded-lg bg-secondary/50 px-4 py-3 text-left hover:bg-secondary transition-colors">
                    <div>
                      <p className="text-sm font-medium">{b.vendor_name}</p>
                      <p className="text-[11px] text-muted-foreground">{ev?.name} · {b.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-sm font-semibold">₹{b.amount.toLocaleString()}</span>
                      <StatusBadge status={b.status} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
