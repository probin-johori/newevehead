import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { month: "Sep", spend: 120000 },
  { month: "Oct", spend: 180000 },
  { month: "Nov", spend: 95000 },
  { month: "Dec", spend: 210000 },
  { month: "Jan", spend: 160000 },
  { month: "Feb", spend: 80000 },
];

export default function DashboardPage() {
  const { currentUser, events, tasks, reimbursements, subscription, getProfile, getDeptsByEvent, getEvent, getDepartment } = useMockData();
  const isAdmin = currentUser.role === "sa" || currentUser.role === "org";

  const caApprovedTotal = reimbursements.filter(r => r.status === "ca-approved" || r.pay_status === "paid").reduce((s, r) => s + r.amount, 0);
  const pendingApprovals = reimbursements.filter(r => {
    if (currentUser.role === "sa") return r.status === "dept-approved";
    if (currentUser.role === "dept_head") return r.status === "pending";
    return false;
  }).length;

  const overdueTasks = tasks.filter(t => t.status !== "completed" && new Date(t.deadline) < new Date());
  const myTasks = tasks.filter(t => t.assignee_id === currentUser.id);

  if (currentUser.role === "dept_member") {
    return (
      <>
        <TopBar title="Dashboard" />
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-serif">Your Assigned Tasks</h2>
          {myTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have no assigned tasks yet.</p>
          ) : (
            <div className="space-y-2">
              {myTasks.map(t => {
                const ev = getEvent(t.event_id);
                const dept = getDepartment(t.dept_id);
                const daysLeft = Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86400000);
                return (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
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
                  </div>
                );
              })}
            </div>
          )}
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
          {[
            { label: "Total Events", value: events.length },
            { label: "Approved Spend", value: `₹${(caApprovedTotal / 1000).toFixed(0)}K` },
            { label: "Pending Approvals", value: pendingApprovals },
            { label: "Slots Used", value: `${subscription.slots_used} / ${subscription.slots_total}` },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-2xl font-serif">{kpi.value}</p>
            </div>
          ))}
        </div>

        {isAdmin && (
          <div className="grid grid-cols-2 gap-6">
            {/* Spend Chart */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Monthly Spend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}K`} />
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                  <Bar dataKey="spend" fill="hsl(104, 54%, 35%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Active Events */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Active Events</h3>
              <div className="space-y-3">
                {events.filter(e => e.status === "active" || e.status === "planning").map(ev => {
                  const evTasks = tasks.filter(t => t.event_id === ev.id);
                  const done = evTasks.filter(t => t.status === "completed").length;
                  const poc = getProfile(ev.poc_id);
                  return (
                    <div key={ev.id} className="flex items-center justify-between">
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-4">Overdue Tasks</h3>
            <div className="space-y-2">
              {overdueTasks.map(t => {
                const ev = getEvent(t.event_id);
                const dept = getDepartment(t.dept_id);
                const assignee = getProfile(t.assignee_id);
                const daysOverdue = Math.ceil((Date.now() - new Date(t.deadline).getTime()) / 86400000);
                return (
                  <div key={t.id} className="flex items-center justify-between rounded-md bg-secondary/50 px-4 py-3">
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
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending Reimbursements */}
        {isAdmin && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-4">Pending Reimbursements</h3>
            <div className="space-y-2">
              {reimbursements.filter(r => r.status === "pending" || r.status === "dept-approved").map(r => {
                const ev = getEvent(r.event_id);
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-md bg-secondary/50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{r.vendor_name}</p>
                      <p className="text-[11px] text-muted-foreground">{ev?.name} · {r.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-sm font-semibold">₹{r.amount.toLocaleString()}</span>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
