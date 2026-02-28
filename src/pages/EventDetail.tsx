import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { ArrowLeft, CalendarDots, MapPin, FileText } from "@phosphor-icons/react";

type Tab = "overview" | "departments" | "tasks" | "billing" | "budget" | "documents";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEvent, getDeptsByEvent, getTasksByEvent, getBillsByEvent, getDocsByEvent, getProfile, getDepartment, currentUser } = useMockData();
  const [tab, setTab] = useState<Tab>("overview");

  const event = getEvent(id!);
  if (!event) return <div className="p-6">Event not found</div>;

  const depts = getDeptsByEvent(event.id);
  const evTasks = getTasksByEvent(event.id);
  const evBills = getBillsByEvent(event.id);
  const docs = getDocsByEvent(event.id);
  const doneTasks = evTasks.filter(t => t.status === "completed").length;
  const settledSpend = evBills.filter(b => b.status === "settled").reduce((s, b) => s + b.amount, 0);
  const totalAllocated = depts.reduce((s, d) => s + d.allocated_budget, 0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "departments", label: "Departments" },
    { key: "tasks", label: `Tasks (${evTasks.length})` },
    { key: "billing", label: `Billing (${evBills.length})` },
    { key: "budget", label: "Budget" },
    { key: "documents", label: `Documents (${docs.length})` },
  ];

  return (
    <>
      <TopBar title={event.name} />
      <div className="p-6 space-y-6">
        <button onClick={() => navigate("/events")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Events
        </button>

        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2"><StatusBadge status={event.status} /></div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">POC</span>
                    {(() => { const p = getProfile(event.poc_id); return p ? <div className="flex items-center gap-1.5 mt-1"><UserAvatar name={p.name} color={p.avatar_color} size="sm" />{p.name}</div> : null; })()}
                  </div>
                  <div><span className="text-muted-foreground text-xs">Location</span><p className="mt-1 flex items-center gap-1"><MapPin size={14} />{event.location}</p></div>
                  <div><span className="text-muted-foreground text-xs">Event Dates</span><p className="mt-1 flex items-center gap-1"><CalendarDots size={14} />{event.start_date} → {event.end_date}</p></div>
                  <div><span className="text-muted-foreground text-xs">Budget</span><p className="mt-1 font-serif text-lg">₹{event.estimated_budget.toLocaleString()}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Departments", value: depts.length },
                  { label: "Total Tasks", value: evTasks.length },
                  { label: "Tasks Done", value: doneTasks },
                  { label: "Settled Spend", value: `₹${(settledSpend / 1000).toFixed(0)}K` },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-serif mt-1">{s.value}</p>
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

        {/* Departments */}
        {tab === "departments" && (
          <div className="space-y-3">
            {depts.map(d => {
              const head = getProfile(d.head_id);
              const dTasks = evTasks.filter(t => t.dept_id === d.id);
              const dDone = dTasks.filter(t => t.status === "completed").length;
              const dSpend = evBills.filter(b => b.dept_id === d.id && b.status === "settled").reduce((s, b) => s + b.amount, 0);
              return (
                <div key={d.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-serif">{d.name}</h4>
                      {head && <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><UserAvatar name={head.name} color={head.avatar_color} size="sm" />{head.name}</div>}
                    </div>
                    <span className="text-sm font-serif">₹{d.allocated_budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span>{dDone}/{dTasks.length} tasks</span>
                    <span>Settled: ₹{dSpend.toLocaleString()}</span>
                  </div>
                  <ProgressBar value={dDone} max={dTasks.length} />
                  {d.notes && <p className="text-xs text-muted-foreground mt-2">{d.notes}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Tasks */}
        {tab === "tasks" && (
          <div className="space-y-3">
            {evTasks.map(t => {
              const dept = getDepartment(t.dept_id);
              const assignee = getProfile(t.assignee_id);
              const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
              return (
                <button key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    {assignee && <UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" />}
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-[11px] text-muted-foreground">{dept?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.priority} />
                    <StatusBadge status={t.status} />
                    <span className={`text-xs ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>{t.deadline}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Billing */}
        {tab === "billing" && (
          <div className="space-y-4">
            {evBills.map(b => {
              const dept = getDepartment(b.dept_id);
              const submitter = getProfile(b.submitted_by);
              const steps = [
                { label: "Advance", done: b.advance_status !== "not-given" },
                { label: "Bill Uploaded", done: true },
                { label: "Dept Verified", done: b.status === "dept-verified" || b.status === "settled" },
                { label: "Settled", done: b.status === "settled" },
              ];
              return (
                <div key={b.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-serif">{b.vendor_name}</p>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{b.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {dept && <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px]">{dept.name}</span>}
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px]">INV: {b.invoice_number}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-serif">₹{b.amount.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">Advance: ₹{b.advance_amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          s.done ? "bg-accent-light text-primary" : "bg-secondary text-muted-foreground"
                        }`}>
                          <div className={`h-2 w-2 rounded-full ${s.done ? "bg-primary" : "bg-muted-foreground/30"}`} />
                          {s.label}
                        </div>
                        {i < steps.length - 1 && <div className="h-px w-3 bg-border" />}
                      </div>
                    ))}
                  </div>
                  {b.bill_file_url && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-primary cursor-pointer hover:underline">
                      <FileText size={14} /> {b.bill_file_url}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Budget */}
        {tab === "budget" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs text-muted-foreground">Estimated Budget</p>
                <p className="text-2xl font-serif mt-1">₹{event.estimated_budget.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs text-muted-foreground">Dept Allocated</p>
                <p className="text-2xl font-serif mt-1">₹{totalAllocated.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs text-muted-foreground">Settled Spend</p>
                <p className="text-2xl font-serif mt-1">₹{settledSpend.toLocaleString()}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-secondary text-left">
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Head</th>
                  <th className="px-4 py-3 font-medium text-right">Allocated</th>
                  <th className="px-4 py-3 font-medium text-right">Settled</th>
                  <th className="px-4 py-3 font-medium text-right">Pending</th>
                  <th className="px-4 py-3 font-medium">Utilisation</th>
                </tr></thead>
                <tbody>
                  {depts.map(d => {
                    const head = getProfile(d.head_id);
                    const dSettled = evBills.filter(b => b.dept_id === d.id && b.status === "settled").reduce((s, b) => s + b.amount, 0);
                    const dPending = evBills.filter(b => b.dept_id === d.id && b.status !== "settled" && b.status !== "rejected").reduce((s, b) => s + b.amount, 0);
                    const utilPct = d.allocated_budget > 0 ? Math.round((dSettled / d.allocated_budget) * 100) : 0;
                    const overBudget = utilPct > 100;
                    return (
                      <tr key={d.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">{d.name}</td>
                        <td className="px-4 py-3">{head && <div className="flex items-center gap-1.5"><UserAvatar name={head.name} color={head.avatar_color} size="sm" /><span className="text-sm">{head.name}</span></div>}</td>
                        <td className="px-4 py-3 text-right">₹{d.allocated_budget.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">₹{dSettled.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">₹{dPending.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16"><ProgressBar value={Math.min(utilPct, 100)} max={100} /></div>
                            <span className={`text-xs font-medium ${overBudget ? "text-destructive" : utilPct > 70 ? "text-warning" : ""}`}>{utilPct}%</span>
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

        {/* Documents */}
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
