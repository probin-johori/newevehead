import { useParams, useNavigate } from "react-router-dom";
import { useMockData, formatINRShort, formatDate, formatTimeAgo } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { TaskDetailSheet } from "@/components/TaskDetailSheet";
import { UserProfileModal } from "@/components/UserProfileModal";
import { useState } from "react";
import { Plus, X, ArrowLeft } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";
import { useScrollLock } from "@/hooks/useScrollLock";

type DeptTab = "events" | "tasks" | "billing" | "documents";

export default function DepartmentsPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { departments, events, tasks, bills, profiles, documents, getProfile, getEvent, deptHealth, activities } = useMockData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [deptTab, setDeptTab] = useState<DeptTab>("events");

  useScrollLock(showAddModal);

  if (!name) {
    const uniqueDepts = Array.from(new Set(departments.map(d => d.name)));
    return (
      <div className="p-6 w-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold">Departments</h1>
            <p className="text-sm text-muted-foreground">{uniqueDepts.length} departments across all events</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
            <Plus size={14} /> Add Department
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueDepts.map(deptName => {
            const deptInstances = departments.filter(d => d.name === deptName);
            const head = getProfile(deptInstances[0]?.head_id);
            const eventCount = new Set(deptInstances.map(d => d.event_id)).size;
            const dh = deptHealth.find(h => h.name === deptName);
            return (
              <button key={deptName} onClick={() => navigate(`/departments/${encodeURIComponent(deptName)}`)}
                className="rounded-xl border border-stroke p-5 text-left hover:bg-selected transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{deptName}</h3>
                  {head && <button onClick={e => { e.stopPropagation(); setProfileUserId(head.id); }}><UserAvatar name={head.name} color={head.avatar_color} size="sm" /></button>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>{eventCount} events</div>
                  <div>{dh ? `${dh.tasksDone}/${dh.tasksTotal} tasks` : "—"}</div>
                </div>
                {dh && <div className="mt-3"><ProgressBar value={dh.tasksDone} max={dh.tasksTotal} /></div>}
              </button>
            );
          })}
        </div>

        {showAddModal && (
          <>
            <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowAddModal(false)} />
            <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-xl bg-card border border-stroke p-6 shadow-[0_8px_40px_rgba(0,0,0,0.15)] space-y-4"
                onKeyDown={e => e.key === "Escape" && setShowAddModal(false)}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Add Department</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
                <div><label className="text-sm font-medium">Department Name <span className="text-red-500">*</span></label>
                  <input className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="e.g. Catering" /></div>
                <div><label className="text-sm font-medium">Description</label>
                  <textarea className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" rows={2} placeholder="Brief description" /></div>
                <div><label className="text-sm font-medium">Department Head <span className="text-red-500">*</span></label>
                  <select className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none">
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select></div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowAddModal(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                  <button onClick={() => { setShowAddModal(false); toast({ title: "Department added" }); }}
                    className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Save</button>
                </div>
              </div>
            </div>
          </>
        )}
        <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      </div>
    );
  }

  // Dept detail view with tabs
  const deptName = decodeURIComponent(name);
  const deptInstances = departments.filter(d => d.name === deptName);
  const deptIds = new Set(deptInstances.map(d => d.id));
  const deptEvents = events.filter(e => deptInstances.some(d => d.event_id === e.id));
  const deptTasks = tasks.filter(t => deptIds.has(t.dept_id));
  const deptBills = bills.filter(b => deptIds.has(b.dept_id));
  const deptDocs = documents.filter(d => d.dept_id && deptIds.has(d.dept_id));
  const head = getProfile(deptInstances[0]?.head_id);
  const dh = deptHealth.find(h => h.name === deptName);
  const teamMembers = profiles.filter(p => p.dept_name === deptName);

  const deptTabs: { key: DeptTab; label: string }[] = [
    { key: "events", label: "Events" },
    { key: "tasks", label: "Tasks" },
    { key: "billing", label: "Billing" },
    { key: "documents", label: "Documents" },
  ];

  return (
    <div className="p-6 w-full">
      {/* Breadcrumb */}
      <button onClick={() => navigate("/departments")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft size={14} /> Departments / {deptName}
      </button>

      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold">
          {deptName.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{deptName}</h1>
          <p className="text-sm text-muted-foreground">{deptInstances[0]?.notes}</p>
        </div>
        {head && (
          <button onClick={() => setProfileUserId(head.id)} className="flex items-center gap-2 hover:opacity-80">
            <UserAvatar name={head.name} color={head.avatar_color} size="sm" />
            <div className="text-left"><p className="text-sm font-medium">{head.name}</p><p className="text-[11px] text-muted-foreground">Dept Head</p></div>
          </button>
        )}
      </div>

      {/* Stats — no global budget, show per-event */}
      <div className="grid grid-cols-3 gap-0 border border-stroke rounded-xl overflow-hidden mb-4">
        {[
          { label: "Tasks", value: dh ? `${dh.tasksDone}/${dh.tasksTotal}` : `${deptTasks.filter(t => t.status === "completed").length}/${deptTasks.length}` },
          { label: "Events", value: String(deptEvents.length) },
          { label: "Team", value: String(teamMembers.length) },
        ].map((stat, i) => (
          <div key={i} className={`p-5 ${i < 2 ? "border-r border-stroke" : ""}`}>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-semibold mt-1 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-0 border-b border-stroke mb-6">
        {deptTabs.map(t => (
          <button key={t.key} onClick={() => setDeptTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${deptTab === t.key ? "text-foreground border-b-2 border-foreground -mb-px" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Events Tab — cards with per-event budget */}
      {deptTab === "events" && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {deptEvents.map(ev => {
            const deptForEv = deptInstances.find(d => d.event_id === ev.id);
            const initials = ev.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button key={ev.id} onClick={() => navigate(`/events/${ev.id}`)}
                className="rounded-xl border border-stroke p-5 text-left hover:bg-selected transition-colors">
                {ev.image_url ? (
                  <img src={ev.image_url} alt="" className="h-16 w-full rounded-lg object-cover mb-3" />
                ) : (
                  <div className="h-16 w-full rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold mb-3">
                    {initials}
                  </div>
                )}
                <p className="font-medium text-sm">{ev.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(ev.start_date)} · <StatusBadge status={ev.status} /></p>
                {deptForEv && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Budget: {formatINRShort(deptForEv.allocated_budget)} · Spent: {formatINRShort(deptForEv.spent)}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tasks Tab */}
      {deptTab === "tasks" && (
        <div className="rounded-xl border border-stroke overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-stroke">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
            </tr></thead>
            <tbody>
              {deptTasks.map(t => {
                const ev = getEvent(t.event_id);
                const assignee = getProfile(t.assignee_id);
                const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                return (
                  <tr key={t.id} className="border-b border-stroke last:border-0 hover:bg-selected cursor-pointer transition-colors"
                    onClick={() => setSelectedTask(t.id)}>
                    <td className="px-4 py-3 font-medium">{t.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ev?.name}</td>
                    <td className="px-4 py-3">{assignee && <button onClick={e => { e.stopPropagation(); setProfileUserId(assignee.id); }} className="flex items-center gap-1.5 hover:opacity-80"><UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" /><span>{assignee.name}</span></button>}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className={`px-4 py-3 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{formatDate(t.deadline)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {deptTasks.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">No tasks for this department</div>}
        </div>
      )}

      {/* Billing Tab — per event */}
      {deptTab === "billing" && (
        <div className="rounded-xl border border-stroke overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-stroke">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Item</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            </tr></thead>
            <tbody>
              {deptBills.map(b => {
                const ev = getEvent(b.event_id);
                return (
                  <tr key={b.id} className="border-b border-stroke last:border-0 hover:bg-selected cursor-pointer transition-colors"
                    onClick={() => navigate("/billing")}>
                    <td className="px-4 py-3 font-medium">{b.description}</td>
                    <td className="px-4 py-3">{b.vendor_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ev?.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{formatINRShort(b.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {deptBills.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">No billing items for this department</div>}
        </div>
      )}

      {/* Documents Tab */}
      {deptTab === "documents" && (
        <div className="rounded-xl border border-stroke overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-stroke">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Document</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Folder</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Uploaded By</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
            </tr></thead>
            <tbody>
              {deptDocs.map(d => {
                const uploader = getProfile(d.uploaded_by);
                return (
                  <tr key={d.id} className="border-b border-stroke last:border-0 hover:bg-selected cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{d.folder}</span></td>
                    <td className="px-4 py-3">{uploader && <span>{uploader.name}</span>}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(d.uploaded_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {deptDocs.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">No documents for this department</div>}
        </div>
      )}

      <TaskDetailSheet taskId={selectedTask} onClose={() => setSelectedTask(null)} onOpenProfile={setProfileUserId} />
      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
