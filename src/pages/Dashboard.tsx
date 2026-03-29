import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMockData, formatINRShort, formatDate } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { X, Hash, Plus } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";
import { useScrollLock } from "@/hooks/useScrollLock";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { events, departments, tasks, bills, getProfile, getDepartment, getEvent, getTasksByEvent } = useMockData();
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);

  useScrollLock(showAddEvent);

  const allDeptNames = Array.from(new Set(departments.map(d => d.name)));
  const filteredDepts = deptFilter ? departments.filter(d => d.name === deptFilter) : departments;
  const filteredDeptIds = new Set(filteredDepts.map(d => d.id));
  const filteredEventIds = new Set(filteredDepts.map(d => d.event_id));
  const filteredEvents = deptFilter ? events.filter(e => filteredEventIds.has(e.id)) : events;
  const filteredTasks = deptFilter ? tasks.filter(t => filteredDeptIds.has(t.dept_id)) : tasks;

  const totalBudget = filteredEvents.reduce((s, e) => s + e.estimated_budget, 0);
  const totalSpent = filteredDepts.reduce((s, d) => s + d.spent, 0);
  const tasksDone = filteredTasks.filter(t => t.status === "completed").length;
  const overdueTasks = filteredTasks.filter(t => t.status !== "completed" && new Date(t.deadline) < new Date()).length;

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview across all events</p>
        </div>
        <button onClick={() => setShowAddEvent(true)}
          className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
          <Plus size={14} /> Add Event
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">Department:</span>
        <button onClick={() => setDeptFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!deptFilter ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:bg-selected"}`}>
          All
        </button>
        {allDeptNames.map(name => (
          <button key={name} onClick={() => deptFilter === name ? setDeptFilter(null) : navigate(`/departments/${encodeURIComponent(name)}`)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${deptFilter === name ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:bg-selected"}`}>
            <Hash size={10} />{name}
          </button>
        ))}
        {deptFilter && (
          <button onClick={() => setDeptFilter(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-1">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-0 border border-stroke rounded-xl overflow-hidden mb-6">
        {[
          { label: "Total Budget", value: formatINRShort(totalBudget) },
          { label: "Total Spent", value: formatINRShort(totalSpent) },
          { label: "Tasks Completed", value: `${tasksDone}/${filteredTasks.length}` },
          { label: "Overdue Tasks", value: String(overdueTasks) },
        ].map((stat, i) => (
          <div key={i} className={`p-5 ${i < 3 ? "border-r border-stroke" : ""}`}>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-semibold mt-1 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-3">Events{deptFilter ? ` — ${deptFilter}` : ""}</h3>
      <div className="rounded-xl border border-stroke overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Budget</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map(ev => {
              const evTasks = getTasksByEvent(ev.id);
              const done = evTasks.filter(t => t.status === "completed").length;
              return (
                <tr key={ev.id} className="border-b border-stroke last:border-0 cursor-pointer hover:bg-selected transition-colors" onClick={() => navigate(`/events/${ev.id}`)}>
                  <td className="px-4 py-3 font-medium">{ev.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(ev.start_date)} – {formatDate(ev.end_date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINRShort(ev.estimated_budget)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{done}/{evTasks.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-semibold mb-3">Recent Tasks{deptFilter ? ` — ${deptFilter}` : ""}</h3>
      <div className="rounded-xl border border-stroke overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.slice(0, 5).map(t => {
              const ev = getEvent(t.event_id);
              const assignee = getProfile(t.assignee_id);
              const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
              return (
                <tr key={t.id} className="border-b border-stroke last:border-0 cursor-pointer hover:bg-selected transition-colors" onClick={() => navigate(`/tasks?task=${t.id}`)}>
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3">
                    <button className="text-muted-foreground hover:text-accent text-sm" onClick={e => { e.stopPropagation(); navigate(`/events/${t.event_id}`); }}>{ev?.name}</button>
                  </td>
                  <td className="px-4 py-3">{assignee && <div className="flex items-center gap-1.5"><UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" /><span>{assignee.name}</span></div>}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className={`px-4 py-3 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{formatDate(t.deadline)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddEvent && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowAddEvent(false)} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-card border border-stroke p-6 shadow-[0_8px_40px_rgba(0,0,0,0.15)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Event</h3>
                <button onClick={() => setShowAddEvent(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Event Name</label>
                  <input className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="e.g. Annual Gala 2026" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Location</label>
                  <input className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="Venue name and city" />
                </div>
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <input type="date" className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <input type="date" className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">Estimated Budget (₹)</label>
                  <input type="number" className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="0" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddEvent(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                <button onClick={() => { setShowAddEvent(false); toast({ title: "Event created" }); }}
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Save</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}