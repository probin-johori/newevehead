import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { ArrowLeft, MapPin, CalendarDots, FileText, CaretRight } from "@phosphor-icons/react";

type Tab = "overview" | "departments" | "tasks" | "billing" | "budget" | "documents";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEvent, getDeptsByEvent, getTasksByEvent, getBillsByEvent, getDocsByEvent, getProfile, getDepartment, currentUser } = useMockData();
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedBill, setSelectedBill] = useState<string | null>(null);

  const event = getEvent(id!);
  if (!event) return <div className="p-6 text-sm text-muted-foreground">Event not found</div>;

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

  const bill = selectedBill ? evBills.find(b => b.id === selectedBill) : null;

  return (
    <>
      <TopBar title={event.name} />
      <div className="flex">
        {/* Vertical tab nav */}
        <div className="w-48 shrink-0 border-r border-border p-4 space-y-1 min-h-[calc(100vh-52px)]">
          <button onClick={() => navigate("/events")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 w-full">
            <ArrowLeft size={14} /> Back
          </button>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                tab === t.key ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 max-w-[800px]">
          {/* Overview */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold mb-1">Event Details</h2>
                <p className="text-sm text-muted-foreground">Key information about this event.</p>
              </div>
              <div className="rounded-xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-2"><StatusBadge status={event.status} /></div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">POC</p>
                    {(() => { const p = getProfile(event.poc_id); return p ? <div className="flex items-center gap-1.5"><UserAvatar name={p.name} color={p.avatar_color} size="sm" /><span>{p.name}</span></div> : null; })()}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Location</p>
                    <p className="flex items-center gap-1"><MapPin size={13} />{event.location}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Event Dates</p>
                    <p className="flex items-center gap-1"><CalendarDots size={13} />{event.start_date} → {event.end_date}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Budget</p>
                    <p className="font-semibold">₹{event.estimated_budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Setup Date</p>
                    <p>{event.setup_date}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Teardown Date</p>
                    <p>{event.teardown_date}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Departments", value: depts.length },
                  { label: "Total Tasks", value: evTasks.length },
                  { label: "Tasks Done", value: doneTasks },
                  { label: "Settled Spend", value: `₹${(settledSpend / 1000).toFixed(0)}K` },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-border p-4">
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-semibold mt-1">{s.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{evTasks.length > 0 ? Math.round((doneTasks / evTasks.length) * 100) : 0}%</span>
                </div>
                <ProgressBar value={doneTasks} max={evTasks.length} />
              </div>
            </div>
          )}

          {/* Departments */}
          {tab === "departments" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold mb-1">Departments</h2>
                <p className="text-sm text-muted-foreground">All departments assigned to this event.</p>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Head</th>
                      <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Allocated</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depts.map(d => {
                      const head = getProfile(d.head_id);
                      const dTasks = evTasks.filter(t => t.dept_id === d.id);
                      const dDone = dTasks.filter(t => t.status === "completed").length;
                      return (
                        <tr key={d.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                          <td className="px-4 py-3 font-medium">{d.name}</td>
                          <td className="px-4 py-3">{head && <div className="flex items-center gap-1.5"><UserAvatar name={head.name} color={head.avatar_color} size="sm" /><span>{head.name}</span></div>}</td>
                          <td className="px-4 py-3 text-right tabular-nums">₹{d.allocated_budget.toLocaleString()}</td>
                          <td className="px-4 py-3 text-muted-foreground">{dDone}/{dTasks.length}</td>
                          <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{d.notes || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tasks */}
          {tab === "tasks" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold mb-1">Tasks</h2>
                <p className="text-sm text-muted-foreground">All tasks for this event.</p>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Due Date</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {evTasks.map(t => {
                      const dept = getDepartment(t.dept_id);
                      const assignee = getProfile(t.assignee_id);
                      const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                      return (
                        <tr key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{t.title}</td>
                          <td className="px-4 py-3 text-muted-foreground">{dept?.name}</td>
                          <td className="px-4 py-3">{assignee && <div className="flex items-center gap-1.5"><UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" /><span>{assignee.name}</span></div>}</td>
                          <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
                          <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                          <td className={`px-4 py-3 ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>{t.deadline}</td>
                          <td className="px-4 py-3"><CaretRight size={14} className="text-muted-foreground" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Billing */}
          {tab === "billing" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold mb-1">Billing</h2>
                <p className="text-sm text-muted-foreground">Bills submitted for this event.</p>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {evBills.map(b => {
                      const dept = getDepartment(b.dept_id);
                      return (
                        <tr key={b.id} onClick={() => setSelectedBill(b.id)} className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{b.vendor_name}</td>
                          <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{b.description}</td>
                          <td className="px-4 py-3 text-muted-foreground">{dept?.name}</td>
                          <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">₹{b.amount.toLocaleString()}</td>
                          <td className="px-4 py-3">{b.bill_file_url && <span className="flex items-center gap-1 text-xs text-accent-mid"><FileText size={13} /> {b.invoice_number}</span>}</td>
                          <td className="px-4 py-3"><CaretRight size={14} className="text-muted-foreground" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bill Detail Modal */}
              {bill && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedBill(null)} />
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{bill.vendor_name}</h3>
                        <button onClick={() => setSelectedBill(null)} className="text-muted-foreground hover:text-foreground text-lg">×</button>
                      </div>
                      <p className="text-sm text-muted-foreground">{bill.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Amount</p><p className="font-semibold text-lg">₹{bill.amount.toLocaleString()}</p></div>
                        <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Advance</p><p className="font-semibold text-lg">₹{bill.advance_amount.toLocaleString()}</p></div>
                        <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status</p><StatusBadge status={bill.status} /></div>
                        <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Advance Status</p><StatusBadge status={bill.advance_status} /></div>
                        <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Invoice</p><p>{bill.invoice_number}</p></div>
                        <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Department</p><p>{getDepartment(bill.dept_id)?.name}</p></div>
                        <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Submitted By</p>{(() => { const s = getProfile(bill.submitted_by); return s ? <div className="flex items-center gap-1.5"><UserAvatar name={s.name} color={s.avatar_color} size="sm" /><span>{s.name}</span></div> : null; })()}</div>
                        <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Submitted At</p><p>{new Date(bill.submitted_at).toLocaleDateString()}</p></div>
                      </div>
                      {bill.bill_file_url && (
                        <div className="flex items-center gap-1.5 text-sm text-accent-mid cursor-pointer hover:underline">
                          <FileText size={14} /> {bill.bill_file_url}
                        </div>
                      )}
                      <div className="flex justify-end gap-2 pt-2">
                        {bill.status === "pending" && currentUser.role === "dept_head" && (
                          <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Verify</button>
                        )}
                        {bill.status === "dept-verified" && currentUser.role === "sa" && (
                          <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Settle</button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Budget */}
          {tab === "budget" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold mb-1">Budget</h2>
                <p className="text-sm text-muted-foreground">Budget allocation and utilisation breakdown.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Estimated Budget</p>
                  <p className="text-xl font-semibold mt-1">₹{event.estimated_budget.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Dept Allocated</p>
                  <p className="text-xl font-semibold mt-1">₹{totalAllocated.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Settled Spend</p>
                  <p className="text-xl font-semibold mt-1">₹{settledSpend.toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Head</th>
                      <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Allocated</th>
                      <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Settled</th>
                      <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Pending</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Utilisation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depts.map(d => {
                      const head = getProfile(d.head_id);
                      const dSettled = evBills.filter(b => b.dept_id === d.id && b.status === "settled").reduce((s, b) => s + b.amount, 0);
                      const dPending = evBills.filter(b => b.dept_id === d.id && b.status !== "settled" && b.status !== "rejected").reduce((s, b) => s + b.amount, 0);
                      const utilPct = d.allocated_budget > 0 ? Math.round((dSettled / d.allocated_budget) * 100) : 0;
                      const overBudget = utilPct > 100;
                      return (
                        <tr key={d.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium">{d.name}</td>
                          <td className="px-4 py-3">{head && <div className="flex items-center gap-1.5"><UserAvatar name={head.name} color={head.avatar_color} size="sm" /><span>{head.name}</span></div>}</td>
                          <td className="px-4 py-3 text-right tabular-nums">₹{d.allocated_budget.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right tabular-nums">₹{dSettled.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right tabular-nums">₹{dPending.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16"><ProgressBar value={Math.min(utilPct, 100)} max={100} /></div>
                              <span className={`text-xs font-medium ${overBudget ? "text-destructive" : utilPct > 70 ? "text-warning" : "text-muted-foreground"}`}>{utilPct}%</span>
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
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold mb-1">Documents</h2>
                <p className="text-sm text-muted-foreground">All documents uploaded for this event.</p>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Document</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Folder</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Uploaded By</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map(d => {
                      const uploader = getProfile(d.uploaded_by);
                      const dept = d.dept_id ? getDepartment(d.dept_id) : null;
                      return (
                        <tr key={d.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                          <td className="px-4 py-3 font-medium">{d.name}</td>
                          <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{d.folder}</span></td>
                          <td className="px-4 py-3 text-muted-foreground">{dept?.name || "Event-level"}</td>
                          <td className="px-4 py-3">{uploader && <div className="flex items-center gap-1.5"><UserAvatar name={uploader.name} color={uploader.avatar_color} size="sm" /><span>{uploader.name}</span></div>}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-muted-foreground">{d.file_size}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
