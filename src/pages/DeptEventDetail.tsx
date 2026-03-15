import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMockData, formatINRShort, formatDate } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { TaskDetailSheet } from "@/components/TaskDetailSheet";
import { UserProfileModal } from "@/components/UserProfileModal";
import { Flag, FileText } from "@phosphor-icons/react";

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: "text-red-600", label: "Urgent" },
  high: { color: "text-amber-600", label: "High" },
  normal: { color: "text-blue-600", label: "Normal" },
  low: { color: "text-muted-foreground", label: "Low" },
};

type DeptEvTab = "tasks" | "budget" | "documents" | "team";

export default function DeptEventDetailPage() {
  const { deptName, eventId } = useParams<{ deptName: string; eventId: string }>();
  const navigate = useNavigate();
  const { departments, events, tasks, bills, documents, profiles, getProfile, getEvent, getDepartment } = useMockData();
  const [tab, setTab] = useState<DeptEvTab>("tasks");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const decodedDept = decodeURIComponent(deptName || "");
  const event = getEvent(eventId || "");
  const dept = departments.find(d => d.name === decodedDept && d.event_id === eventId);

  if (!event || !dept) {
    return <div className="p-8 text-sm text-muted-foreground">Department or event not found</div>;
  }

  const deptTasks = tasks.filter(t => t.dept_id === dept.id && t.event_id === eventId);
  const deptBills = bills.filter(b => b.dept_id === dept.id && b.event_id === eventId);
  const deptDocs = documents.filter(d => d.dept_id === dept.id && d.event_id === eventId);
  const head = getProfile(dept.head_id);
  const teamMembers = profiles.filter(p => p.dept_name === decodedDept);
  const utilPct = dept.allocated_budget > 0 ? Math.round((dept.spent / dept.allocated_budget) * 100) : 0;
  const doneTasks = deptTasks.filter(t => t.status === "completed").length;

  const tabs: { key: DeptEvTab; label: string }[] = [
    { key: "tasks", label: "Tasks" },
    { key: "budget", label: "Budget" },
    { key: "documents", label: "Documents" },
    { key: "team", label: "Team" },
  ];

  return (
    <div className="p-6 w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
        <button onClick={() => navigate("/departments")} className="hover:text-foreground transition-colors">Departments</button>
        <span>›</span>
        <button onClick={() => navigate(`/departments/${encodeURIComponent(decodedDept)}`)} className="hover:text-foreground transition-colors">{decodedDept}</button>
        <span>›</span>
        <span className="text-foreground font-medium">{event.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        {event.image_url ? (
          <img src={event.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold">
            {event.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{event.name}</h1>
          <p className="text-sm text-muted-foreground">{decodedDept} · {dept.notes}</p>
        </div>
        {head && (
          <button onClick={() => setProfileUserId(head.id)} className="flex items-center gap-2 hover:opacity-80">
            <UserAvatar name={head.name} color={head.avatar_color} size="sm" />
            <div className="text-left"><p className="text-sm font-medium">{head.name}</p><p className="text-[11px] text-muted-foreground">Dept Head</p></div>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-0 border border-stroke rounded-xl overflow-hidden mb-4">
        {[
          { label: "Tasks", value: `${doneTasks}/${deptTasks.length}` },
          { label: "Budget", value: formatINRShort(dept.allocated_budget) },
          { label: "Spent", value: formatINRShort(dept.spent) },
          { label: "Utilisation", value: `${utilPct}%` },
        ].map((stat, i) => (
          <div key={i} className={`p-4 ${i < 3 ? "border-r border-stroke" : ""}`}>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-semibold mt-0.5 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-stroke mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.key ? "text-foreground border-b-2 border-foreground -mb-px" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {tab === "tasks" && (
        <div className="rounded-xl border border-stroke overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead><tr className="border-b border-stroke">
              <th className="w-[35%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
              <th className="w-[15%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
              <th className="w-[12%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
              <th className="w-[12%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="w-[12%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subtasks</th>
              <th className="w-[14%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
            </tr></thead>
            <tbody>
              {deptTasks.map(t => {
                const assignee = getProfile(t.assignee_id);
                const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                const pc = priorityConfig[t.priority] || priorityConfig.normal;
                const done = t.subtasks.filter(s => s.completed).length;
                return (
                  <tr key={t.id} className="border-b border-stroke last:border-0 hover:bg-selected cursor-pointer transition-colors"
                    onClick={() => setSelectedTask(t.id)}>
                    <td className="px-4 py-3 font-medium truncate">{t.title}</td>
                    <td className="px-4 py-3">{assignee && <button onClick={e => { e.stopPropagation(); setProfileUserId(assignee.id); }} className="flex items-center gap-1.5 hover:opacity-80"><UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" /></button>}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1"><Flag size={13} weight="fill" className={pc.color} /><span className={`text-xs font-medium ${pc.color}`}>{pc.label}</span></div></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{done}/{t.subtasks.length}</td>
                    <td className={`px-4 py-3 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{formatDate(t.deadline)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {deptTasks.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">No tasks for this department in this event</div>}
        </div>
      )}

      {/* Budget Tab */}
      {tab === "budget" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-stroke p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Budget Utilisation</span>
              <span className={`text-sm font-semibold ${utilPct > 100 ? "text-red-600" : ""}`}>{utilPct}%</span>
            </div>
            <ProgressBar value={Math.min(utilPct, 100)} max={100} />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{formatINRShort(dept.spent)} spent</span>
              <span>{formatINRShort(dept.allocated_budget)} allocated</span>
            </div>
          </div>
          <div className="rounded-xl border border-stroke overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-stroke">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Item</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr></thead>
              <tbody>
                {deptBills.map(b => (
                  <tr key={b.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors">
                    <td className="px-4 py-3 font-medium">{b.description}</td>
                    <td className="px-4 py-3">{b.vendor_name}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{formatINRShort(b.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deptBills.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">No billing items</div>}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {tab === "documents" && (
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
                  <tr key={d.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2"><FileText size={14} className="text-muted-foreground" />{d.name}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{d.folder}</span></td>
                    <td className="px-4 py-3">{uploader?.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(d.uploaded_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {deptDocs.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">No documents</div>}
        </div>
      )}

      {/* Team Tab */}
      {tab === "team" && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map(p => (
            <button key={p.id} onClick={() => setProfileUserId(p.id)}
              className="rounded-xl border border-stroke p-4 text-left hover:bg-selected transition-colors flex items-center gap-3">
              <UserAvatar name={p.name} color={p.avatar_color} size="md" />
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.email}</p>
              </div>
            </button>
          ))}
          {teamMembers.length === 0 && <div className="col-span-full text-center py-12 text-sm text-muted-foreground">No team members assigned</div>}
        </div>
      )}

      <TaskDetailSheet taskId={selectedTask} onClose={() => setSelectedTask(null)} onOpenProfile={setProfileUserId} />
      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
