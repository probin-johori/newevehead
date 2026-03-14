import { useParams, useNavigate } from "react-router-dom";
import { useMockData, formatINRShort, formatDate, formatTimeAgo } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { useState } from "react";
import { Plus, X } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";

export default function DepartmentsPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { departments, events, tasks, bills, profiles, getProfile, getEvent, getTasksByDept, deptHealth, activities } = useMockData();
  const [showAddModal, setShowAddModal] = useState(false);

  // If no specific dept, show all departments overview
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
            const totalAllocated = deptInstances.reduce((s, d) => s + d.allocated_budget, 0);
            const totalSpent = deptInstances.reduce((s, d) => s + d.spent, 0);
            const head = getProfile(deptInstances[0]?.head_id);
            const eventCount = new Set(deptInstances.map(d => d.event_id)).size;
            const dh = deptHealth.find(h => h.name === deptName);
            return (
              <button key={deptName} onClick={() => navigate(`/departments/${encodeURIComponent(deptName)}`)}
                className="rounded-xl border border-stroke p-5 text-left hover:bg-selected transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{deptName}</h3>
                  {head && <UserAvatar name={head.name} color={head.avatar_color} size="sm" />}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>{eventCount} events</div>
                  <div>{dh ? `${dh.tasksDone}/${dh.tasksTotal} tasks` : "—"}</div>
                  <div>Budget: {formatINRShort(totalAllocated)}</div>
                  <div>Spent: {formatINRShort(totalSpent)}</div>
                </div>
                {dh && (
                  <div className="mt-3">
                    <ProgressBar value={dh.tasksDone} max={dh.tasksTotal} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Add Department Modal */}
        {showAddModal && (
          <>
            <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowAddModal(false)} />
            <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-xl bg-card border border-stroke p-6 shadow-[0_8px_40px_rgba(0,0,0,0.15)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Add Department</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
                <div>
                  <label className="text-sm font-medium">Department Name</label>
                  <input className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="e.g. Catering" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" rows={2} placeholder="Brief description" />
                </div>
                <div>
                  <label className="text-sm font-medium">Department Head</label>
                  <select className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none">
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowAddModal(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                  <button onClick={() => { setShowAddModal(false); toast({ title: "Department added" }); }}
                    className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Save</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Dept detail view
  const deptName = decodeURIComponent(name);
  const deptInstances = departments.filter(d => d.name === deptName);
  const deptIds = new Set(deptInstances.map(d => d.id));
  const deptEvents = events.filter(e => deptInstances.some(d => d.event_id === e.id));
  const deptTasks = tasks.filter(t => deptIds.has(t.dept_id));
  const deptBills = bills.filter(b => deptIds.has(b.dept_id));
  const totalAllocated = deptInstances.reduce((s, d) => s + d.allocated_budget, 0);
  const totalSpent = deptInstances.reduce((s, d) => s + d.spent, 0);
  const head = getProfile(deptInstances[0]?.head_id);
  const dh = deptHealth.find(h => h.name === deptName);
  const teamMembers = profiles.filter(p => p.dept_name === deptName);
  const deptActivities = activities.filter(a => {
    const eventIds = new Set(deptInstances.map(d => d.event_id));
    return eventIds.has(a.event_id);
  }).slice(0, 5);

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold">
          {deptName.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{deptName}</h1>
          <p className="text-sm text-muted-foreground">{deptInstances[0]?.notes}</p>
        </div>
        {head && (
          <div className="flex items-center gap-2">
            <UserAvatar name={head.name} color={head.avatar_color} size="sm" />
            <div>
              <p className="text-sm font-medium">{head.name}</p>
              <p className="text-[11px] text-muted-foreground">Dept Head</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-0 border border-stroke rounded-xl overflow-hidden mb-6">
        {[
          { label: "Budget Allocated", value: formatINRShort(totalAllocated) },
          { label: "Budget Spent", value: formatINRShort(totalSpent) },
          { label: "Tasks", value: dh ? `${dh.tasksDone}/${dh.tasksTotal}` : `${deptTasks.filter(t => t.status === "completed").length}/${deptTasks.length}` },
          { label: "Events", value: String(deptEvents.length) },
        ].map((stat, i) => (
          <div key={i} className={`p-5 ${i < 3 ? "border-r border-stroke" : ""}`}>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-semibold mt-1 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* Events managed */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Events</h3>
            <div className="rounded-xl border border-stroke overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stroke">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {deptEvents.map(ev => {
                    const deptForEv = deptInstances.find(d => d.event_id === ev.id);
                    return (
                      <tr key={ev.id} className="border-b border-stroke last:border-0 hover:bg-selected cursor-pointer transition-colors"
                        onClick={() => navigate(`/events/${ev.id}`)}>
                        <td className="px-4 py-3 font-medium">{ev.name}</td>
                        <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(ev.start_date)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{deptForEv ? formatINRShort(deptForEv.allocated_budget) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tasks */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Tasks ({deptTasks.length})</h3>
            <div className="rounded-xl border border-stroke overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stroke">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {deptTasks.slice(0, 8).map(t => {
                    const ev = getEvent(t.event_id);
                    const assignee = getProfile(t.assignee_id);
                    const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                    return (
                      <tr key={t.id} className="border-b border-stroke last:border-0 hover:bg-selected cursor-pointer transition-colors"
                        onClick={() => navigate(`/tasks?task=${t.id}`)}>
                        <td className="px-4 py-3 font-medium">{t.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{ev?.name}</td>
                        <td className="px-4 py-3">{assignee && <div className="flex items-center gap-1.5"><UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" /><span>{assignee.name}</span></div>}</td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className={`px-4 py-3 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{formatDate(t.deadline)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Budget */}
          <div className="rounded-xl border border-stroke p-4">
            <h3 className="text-sm font-semibold mb-3">Budget</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Allocated</span>
                <span className="font-medium tabular-nums">{formatINRShort(totalAllocated)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-medium tabular-nums">{formatINRShort(totalSpent)}</span>
              </div>
              <ProgressBar value={totalSpent} max={totalAllocated} />
              <p className="text-xs text-muted-foreground text-right">{totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0}% utilised</p>
            </div>
          </div>

          {/* Team Members */}
          <div className="rounded-xl border border-stroke p-4">
            <h3 className="text-sm font-semibold mb-3">Team ({teamMembers.length})</h3>
            <div className="space-y-2">
              {teamMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <UserAvatar name={m.name} color={m.avatar_color} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{m.role.replace("_", " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-stroke p-4">
            <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-3">
              {deptActivities.map(a => {
                const user = getProfile(a.user_id);
                return (
                  <div key={a.id} className="flex gap-2">
                    {user && <UserAvatar name={user.name} color={user.avatar_color} size="sm" />}
                    <div className="min-w-0">
                      <p className="text-xs"><span className="font-medium">{user?.name}</span> {a.description}</p>
                      <p className="text-[11px] text-muted-foreground">{formatTimeAgo(a.created_at)}</p>
                    </div>
                  </div>
                );
              })}
              {deptActivities.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
