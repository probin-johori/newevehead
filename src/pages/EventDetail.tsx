import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useMockData, formatINR, formatDate, formatTimeAgo } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import {
  CaretDown, CaretUp, ArrowBendDownRight, CheckSquare, Square,
  Flag, Plus, Eye, FileText, DotsThreeOutline, X, Check
} from "@phosphor-icons/react";

type Tab = "overview" | "departments" | "todos" | "billing" | "budget" | "documents";

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: "text-red-600", label: "Urgent" },
  high: { color: "text-amber-600", label: "High" },
  normal: { color: "text-blue-600", label: "Normal" },
  low: { color: "text-gray-500", label: "Low" },
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    getEvent, getDeptsByEvent, getTasksByEvent, getBillsByEvent, getDocsByEvent,
    getProfile, getDepartment, getActivitiesByEvent, deptHealth,
    currentUser, bills, tasks: allTasks
  } = useMockData();

  const initialTab = (searchParams.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set(["t1"]));
  const [selectedBill, setSelectedBill] = useState<string | null>(null);

  const event = getEvent(id!);
  if (!event) return <div className="p-8 text-sm text-muted-foreground">Event not found</div>;

  const depts = getDeptsByEvent(event.id);
  const evTasks = getTasksByEvent(event.id);
  const evBills = getBillsByEvent(event.id);
  const docs = getDocsByEvent(event.id);
  const activities = getActivitiesByEvent(event.id);
  const approvedSpend = 775000; // hardcoded as specified
  const pendingBillCount = evBills.filter(b => b.status === "pending" || b.status === "dept-verified").length;

  const tabs: { key: Tab; label: string; dot?: boolean }[] = [
    { key: "overview", label: "Overview" },
    { key: "departments", label: "Departments" },
    { key: "todos", label: "To-Dos" },
    { key: "billing", label: "Billing", dot: pendingBillCount > 0 },
    { key: "budget", label: "Budget" },
    { key: "documents", label: "Documents" },
  ];

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const bill = selectedBill ? evBills.find(b => b.id === selectedBill) : null;

  return (
    <div className="p-6 max-w-[960px]">
      {/* Event Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm">
          🎆
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{event.name}</h1>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-0 border-b border-border mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "text-foreground border-b-2 border-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.dot && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>
        ))}
      </div>

      {/* ============ OVERVIEW ============ */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Estimated Budget</p>
              <p className="text-2xl font-semibold mt-1">{formatINR(event.estimated_budget)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved Spend</p>
              <p className="text-2xl font-semibold mt-1">{formatINR(approvedSpend)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Task Progress</p>
              <p className="text-2xl font-semibold mt-1">31/55</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Departments</p>
              <p className="text-2xl font-semibold mt-1">{depts.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_280px] gap-6">
            {/* Left: To-Dos + Activity */}
            <div className="space-y-6">
              {/* To-Dos Preview */}
              <div className="rounded-xl border border-border">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold">To-Dos</h3>
                  <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full border border-border px-2.5 py-1">
                    <Plus size={12} /> Add Task
                  </button>
                </div>
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Tasks</span>
                    <span className="w-16">Assignee</span>
                    <span className="w-16">Due</span>
                    <span className="w-16">Priority</span>
                  </div>
                  {evTasks.slice(0, 4).map(t => {
                    const assignee = getProfile(t.assignee_id);
                    const dept = getDepartment(t.dept_id);
                    const doneCount = t.subtasks.filter(s => s.completed).length;
                    const allDone = doneCount === t.subtasks.length && t.subtasks.length > 0;
                    const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                    const pc = priorityConfig[t.priority] || priorityConfig.normal;
                    return (
                      <div key={t.id} className="px-4 py-2.5 hover:bg-secondary/30 transition-colors">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center">
                          <div className="flex items-center gap-2">
                            {allDone ? (
                              <CheckSquare size={16} weight="fill" className="text-emerald-500 shrink-0" />
                            ) : (
                              <Square size={16} className="text-muted-foreground shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className={`text-sm ${allDone ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</span>
                              <p className="text-[11px] text-muted-foreground">{dept?.name}</p>
                            </div>
                          </div>
                          <div className="w-16 flex justify-center">
                            {assignee && <UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" />}
                          </div>
                          <span className={`w-16 text-xs text-right ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            {formatDate(t.deadline)}
                          </span>
                          <div className="w-16 flex items-center gap-1 justify-end">
                            <Flag size={12} weight="fill" className={pc.color} />
                            <span className={`text-xs ${pc.color}`}>{pc.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setTab("todos")}
                  className="flex items-center gap-1.5 w-full px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground border-t border-border transition-colors"
                >
                  <DotsThreeOutline size={12} weight="fill" /> See all tasks
                </button>
              </div>

              {/* Recent Activities */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Recent Activities</h3>
                <div className="space-y-4">
                  {activities.map(a => {
                    const user = getProfile(a.user_id);
                    return (
                      <div key={a.id} className="flex gap-3">
                        {user && <UserAvatar name={user.name} color={user.avatar_color} size="sm" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-relaxed">
                            <span className="font-medium">{user?.name}</span>{" "}
                            {a.description.split(/\[([^\]]+)\]/).map((part, i) =>
                              i % 2 === 1 ? (
                                <button key={i} onClick={() => navigate(`/events/${a.event_id}`)} className="text-blue-600 hover:underline font-medium">
                                  {part}
                                </button>
                              ) : part
                            )}
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
            <div>
              <h3 className="text-sm font-semibold mb-3">Department Health</h3>
              <div className="space-y-4">
                {deptHealth.map(dh => {
                  const pct = dh.tasksTotal > 0 ? Math.round((dh.tasksDone / dh.tasksTotal) * 100) : 0;
                  return (
                    <div key={dh.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{dh.name}</span>
                        <span className={`text-xs font-medium ${dh.budgetPct > 100 ? "text-red-600" : "text-muted-foreground"}`}>
                          {dh.budgetPct > 100 ? `${dh.budgetPct}%` : `${pct}%`}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1.5">{dh.tasksDone}/{dh.tasksTotal} tasks</p>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            dh.budgetPct > 100 ? "bg-red-500" : dh.budgetPct > 70 ? "bg-amber-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(dh.budgetPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TO-DOS ============ */}
      {tab === "todos" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10"></th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="w-10"></th>
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
                    <>
                      <tr
                        key={t.id}
                        className="border-b border-border hover:bg-secondary/30 cursor-pointer transition-colors"
                        onClick={() => toggleTask(t.id)}
                      >
                        <td className="px-3 py-3 text-center">
                          {isExpanded ? (
                            <CaretUp size={14} className="text-muted-foreground mx-auto" />
                          ) : (
                            <CaretDown size={14} className="text-muted-foreground mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{t.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{dept?.name}</td>
                        <td className="px-4 py-3">
                          {assignee && (
                            <div className="flex items-center gap-1.5">
                              <UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" />
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-3 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                          {formatDate(t.deadline)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{doneCount}/{totalCount}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Flag size={13} weight="fill" className={pc.color} />
                            <span className={`text-xs font-medium ${pc.color}`}>{pc.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-3 py-3 text-center">
                          {isExpanded ? (
                            <CaretUp size={14} className="text-muted-foreground mx-auto" />
                          ) : (
                            <CaretDown size={14} className="text-muted-foreground mx-auto" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && t.subtasks.map(st => (
                        <tr key={st.id} className="border-b border-border bg-secondary/20">
                          <td></td>
                          <td colSpan={8} className="px-4 py-2">
                            <div className="flex items-center gap-2 pl-4">
                              <ArrowBendDownRight size={14} className="text-muted-foreground shrink-0" />
                              {st.completed ? (
                                <CheckSquare size={16} weight="fill" className="text-emerald-500 shrink-0" />
                              ) : (
                                <Square size={16} className="text-muted-foreground shrink-0" />
                              )}
                              <span className={`text-sm ${st.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {st.title}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ DEPARTMENTS ============ */}
      {tab === "departments" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Head</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Allocated</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Spent</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Utilisation</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {depts.map(d => {
                  const head = getProfile(d.head_id);
                  const dh = deptHealth.find(h => h.name === d.name);
                  const utilPct = d.allocated_budget > 0 ? Math.round((d.spent / d.allocated_budget) * 100) : 0;
                  const overBudget = utilPct > 100;
                  return (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3">
                        {head && (
                          <div className="flex items-center gap-1.5">
                            <UserAvatar name={head.name} color={head.avatar_color} size="sm" />
                            <span>{head.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(d.allocated_budget)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${overBudget ? "text-red-600 font-medium" : ""}`}>{formatINR(d.spent)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{dh ? `${dh.tasksDone}/${dh.tasksTotal}` : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16"><ProgressBar value={Math.min(utilPct, 100)} max={100} /></div>
                          <span className={`text-xs font-medium ${overBudget ? "text-red-600" : utilPct > 70 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {utilPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {overBudget ? (
                          <span className="text-[11px] font-medium text-red-600 bg-red-50 rounded-full px-2 py-0.5">Over Budget</span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">On Track</span>
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

      {/* ============ BILLING ============ */}
      {tab === "billing" && (
        <div className="space-y-4">
          <div className="space-y-4">
            {evBills.map(b => {
              const dept = getDepartment(b.dept_id);
              const submitter = getProfile(b.submitted_by);
              const steps = [
                { label: "Submitted", done: true },
                { label: "Dept Head", done: b.status === "dept-verified" || b.status === "ca-approved" || b.status === "settled" },
                { label: "CA Approved", done: b.status === "ca-approved" || b.status === "settled" },
                { label: "Paid Out", done: b.status === "settled" },
              ];
              return (
                <div key={b.id} className="rounded-xl border border-border p-5 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelectedBill(b.id)}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium">{b.vendor_name}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{b.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{dept?.name}</span>
                        <StatusBadge status={b.status} />
                        {submitter && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <UserAvatar name={submitter.name} color={submitter.avatar_color} size="sm" />
                            {submitter.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xl font-semibold tabular-nums">{formatINR(b.amount)}</p>
                  </div>

                  {/* Pipeline */}
                  <div className="flex items-center gap-0">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-center flex-1">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-3 w-3 rounded-full border-2 ${step.done ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-300"}`}>
                            {step.done && <Check size={8} weight="bold" className="text-white m-auto" />}
                          </div>
                          <span className={`text-xs ${step.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`flex-1 h-px mx-2 ${step.done ? "bg-emerald-500" : "bg-border"}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {(b.status === "pending" || b.status === "dept-verified") && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                      {b.status === "pending" && (currentUser.role === "dept_head" || currentUser.role === "sa") && (
                        <>
                          <button className="rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background hover:bg-foreground/90 transition-colors" onClick={e => e.stopPropagation()}>Approve</button>
                          <button className="rounded-full bg-red-50 text-red-600 px-3.5 py-1.5 text-xs font-medium hover:bg-red-100 transition-colors" onClick={e => e.stopPropagation()}>Reject</button>
                        </>
                      )}
                      {b.status === "dept-verified" && currentUser.role === "sa" && (
                        <button className="rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background hover:bg-foreground/90 transition-colors" onClick={e => e.stopPropagation()}>CA Approve</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bill Detail Modal */}
          {bill && (
            <>
              <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedBill(null)} />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{bill.vendor_name}</h3>
                    <button onClick={() => setSelectedBill(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                  </div>
                  <p className="text-sm text-muted-foreground">{bill.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm border-t border-border pt-4">
                    <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Amount</p><p className="font-semibold text-lg">{formatINR(bill.amount)}</p></div>
                    <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Advance</p><p className="font-semibold text-lg">{formatINR(bill.advance_amount)}</p></div>
                    <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status</p><StatusBadge status={bill.status} /></div>
                    <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Event</p><p>{event.name}</p></div>
                    <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Department</p><p>{getDepartment(bill.dept_id)?.name}</p></div>
                    <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Invoice</p><p>{bill.invoice_number}</p></div>
                    <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Submitted</p><p>{new Date(bill.submitted_at).toLocaleDateString()}</p></div>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Submitted By</p>
                      {(() => { const s = getProfile(bill.submitted_by); return s ? <div className="flex items-center gap-1.5"><UserAvatar name={s.name} color={s.avatar_color} size="sm" /><span>{s.name}</span></div> : null; })()}
                    </div>
                  </div>
                  {bill.bill_file_url && (
                    <div className="flex items-center gap-1.5 text-sm text-blue-600 cursor-pointer hover:underline border-t border-border pt-3">
                      <FileText size={14} /> {bill.bill_file_url}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============ BUDGET ============ */}
      {tab === "budget" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Estimated Budget</p>
              <p className="text-xl font-semibold mt-1">{formatINR(event.estimated_budget)}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Allocated</p>
              <p className="text-xl font-semibold mt-1">{formatINR(depts.reduce((s, d) => s + d.allocated_budget, 0))}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-xl font-semibold mt-1">{formatINR(depts.reduce((s, d) => s + d.spent, 0))}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Allocated</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Spent</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Pending</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Utilisation</th>
                </tr>
              </thead>
              <tbody>
                {depts.map(d => {
                  const utilPct = d.allocated_budget > 0 ? Math.round((d.spent / d.allocated_budget) * 100) : 0;
                  const pending = evBills.filter(b => b.dept_id === d.id && b.status !== "settled" && b.status !== "rejected").reduce((s, b) => s + b.amount, 0);
                  const overBudget = utilPct > 100;
                  return (
                    <tr key={d.id} className={`border-b border-border last:border-0 ${overBudget ? "bg-red-50/50" : "hover:bg-secondary/30"} transition-colors`}>
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(d.allocated_budget)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${overBudget ? "text-red-600 font-medium" : ""}`}>{formatINR(d.spent)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatINR(pending)}</td>
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
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {docs.map(d => {
                  const uploader = getProfile(d.uploaded_by);
                  const dept = d.dept_id ? getDepartment(d.dept_id) : null;
                  return (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{d.folder}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{dept?.name || "—"}</td>
                      <td className="px-4 py-3">
                        {uploader && (
                          <div className="flex items-center gap-1.5">
                            <UserAvatar name={uploader.name} color={uploader.avatar_color} size="sm" />
                            <span>{uploader.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(d.uploaded_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.file_size}</td>
                      <td className="px-4 py-3">
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
