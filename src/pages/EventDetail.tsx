import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";

type Tab = "overview" | "departments" | "tasks" | "reimbursements" | "documents";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEvent, getDeptsByEvent, getTasksByEvent, getReimbursementsByEvent, getDocsByEvent, getProfile, getDepartment, currentUser } = useMockData();
  const [tab, setTab] = useState<Tab>("overview");

  const event = getEvent(id!);
  if (!event) return <div className="p-6">Event not found</div>;

  const depts = getDeptsByEvent(event.id);
  const evTasks = getTasksByEvent(event.id);
  const reimbs = getReimbursementsByEvent(event.id);
  const docs = getDocsByEvent(event.id);
  const doneTasks = evTasks.filter(t => t.status === "completed").length;
  const approvedSpend = reimbs.filter(r => r.status === "ca-approved" || r.pay_status === "paid").reduce((s, r) => s + r.amount, 0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "departments", label: "Departments" },
    { key: "tasks", label: `Tasks (${evTasks.length})` },
    { key: "reimbursements", label: `Reimbursements (${reimbs.length})` },
    { key: "documents", label: `Documents (${docs.length})` },
  ];

  return (
    <>
      <TopBar title={event.name} />
      <div className="p-6 space-y-6">
        <button onClick={() => navigate("/events")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </button>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2"><StatusBadge status={event.status} /></div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">POC</span>
                    {(() => { const p = getProfile(event.poc_id); return p ? <div className="flex items-center gap-1.5 mt-1"><UserAvatar name={p.name} color={p.avatar_color} size="sm" />{p.name}</div> : null; })()}
                  </div>
                  <div><span className="text-muted-foreground">Location</span><p className="mt-1 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</p></div>
                  <div><span className="text-muted-foreground">Event Dates</span><p className="mt-1 flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{event.start_date} → {event.end_date}</p></div>
                  <div><span className="text-muted-foreground">Budget</span><p className="mt-1 font-serif text-lg">₹{event.estimated_budget.toLocaleString()}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Departments", value: depts.length },
                  { label: "Total Tasks", value: evTasks.length },
                  { label: "Tasks Done", value: doneTasks },
                  { label: "Approved Spend", value: `₹${(approvedSpend / 1000).toFixed(0)}K` },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-serif mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Overall Progress</p>
              <ProgressBar value={doneTasks} max={evTasks.length} />
              <p className="text-xs text-muted-foreground mt-1">{evTasks.length > 0 ? Math.round((doneTasks / evTasks.length) * 100) : 0}% complete</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs text-muted-foreground">Setup Date</p>
                <p className="text-sm font-medium mt-1">{event.setup_date}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs text-muted-foreground">Teardown Date</p>
                <p className="text-sm font-medium mt-1">{event.teardown_date}</p>
              </div>
            </div>
          </div>
        )}

        {/* Departments Tab */}
        {tab === "departments" && (
          <div className="space-y-3">
            {depts.map(d => {
              const head = getProfile(d.head_id);
              const dTasks = evTasks.filter(t => t.dept_id === d.id);
              const dDone = dTasks.filter(t => t.status === "completed").length;
              const dSpend = reimbs.filter(r => r.dept_id === d.id && (r.status === "ca-approved" || r.pay_status === "paid")).reduce((s, r) => s + r.amount, 0);
              return (
                <div key={d.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{d.name}</h4>
                      {head && <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><UserAvatar name={head.name} color={head.avatar_color} size="sm" />{head.name}</div>}
                    </div>
                    <span className="text-sm font-serif">₹{d.allocated_budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span>{dDone}/{dTasks.length} tasks</span>
                    <span>Approved: ₹{dSpend.toLocaleString()}</span>
                  </div>
                  <ProgressBar value={dDone} max={dTasks.length} />
                  {d.notes && <p className="text-xs text-muted-foreground mt-2">{d.notes}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Tasks Tab */}
        {tab === "tasks" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {["not-started", "in-progress", "completed"].map(s => {
                const count = evTasks.filter(t => t.status === s).length;
                return <StatusBadge key={s} status={s} className="text-xs" />;
              })}
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead><tr className="bg-secondary text-left">
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Dept</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                </tr></thead>
                <tbody>
                  {evTasks.map(t => {
                    const dept = getDepartment(t.dept_id);
                    const assignee = getProfile(t.assignee_id);
                    const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                    return (
                      <tr key={t.id} className="border-t border-border hover:bg-secondary/30">
                        <td className="px-4 py-3 font-medium">{t.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{dept?.name}</td>
                        <td className="px-4 py-3">{assignee && <div className="flex items-center gap-1.5"><UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" />{assignee.name}</div>}</td>
                        <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className={`px-4 py-3 ${overdue ? "text-destructive font-medium" : ""}`}>{t.deadline}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reimbursements Tab */}
        {tab === "reimbursements" && (
          <div className="space-y-4">
            {reimbs.map(r => {
              const dept = getDepartment(r.dept_id);
              const steps = [
                { label: "Submitted", done: true },
                { label: "Dept Head", done: r.status === "dept-approved" || r.status === "ca-approved" || r.pay_status === "paid" },
                { label: "CA Approved", done: r.status === "ca-approved" || r.pay_status === "paid" },
                { label: "Paid", done: r.pay_status === "paid" },
              ];
              return (
                <div key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{r.vendor_name}</p>
                      <p className="text-sm text-muted-foreground">{r.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {dept && <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{dept.name}</span>}
                        <StatusBadge status={r.status} />
                        <StatusBadge status={r.pay_status} />
                      </div>
                    </div>
                    <p className="text-xl font-serif">₹{r.amount.toLocaleString()}</p>
                  </div>
                  {/* Pipeline */}
                  <div className="flex items-center gap-1 mt-4">
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          s.done ? "bg-accent-light text-accent-mid" : "bg-secondary text-muted-foreground"
                        }`}>
                          <div className={`h-2 w-2 rounded-full ${s.done ? "bg-accent-mid" : "bg-muted-foreground/30"}`} />
                          {s.label}
                        </div>
                        {i < steps.length - 1 && <div className="h-px w-4 bg-border" />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Documents Tab */}
        {tab === "documents" && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead><tr className="bg-secondary text-left">
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Folder</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Uploaded By</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Size</th>
              </tr></thead>
              <tbody>
                {docs.map(d => {
                  const uploader = getProfile(d.uploaded_by);
                  const dept = d.dept_id ? getDepartment(d.dept_id) : null;
                  return (
                    <tr key={d.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{d.folder}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{dept?.name || "Event-level"}</td>
                      <td className="px-4 py-3">{uploader && <div className="flex items-center gap-1.5"><UserAvatar name={uploader.name} color={uploader.avatar_color} size="sm" />{uploader.name}</div>}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.file_size}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
