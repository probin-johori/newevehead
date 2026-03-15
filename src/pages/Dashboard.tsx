import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMockData, formatINRShort, formatDate } from "@/context/MockDataContext";
import type { Event } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { X, Hash, Plus } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";
import { useScrollLock } from "@/hooks/useScrollLock";
import { EventImageUpload } from "@/components/EventImageUpload";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { events, departments, tasks, bills, getProfile, getDepartment, getEvent, getTasksByEvent, setEvents, currentUser } = useMockData();
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", location: "", start_date: "", end_date: "", estimated_budget: "", image_url: "" });

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

  const handleAddEvent = () => {
    if (!addForm.name.trim()) { toast({ title: "Event name is required", variant: "destructive" }); return; }
    const newEvent: Event = {
      id: `e_${Date.now()}`, name: addForm.name.trim(), location: addForm.location,
      start_date: addForm.start_date || new Date().toISOString().split("T")[0],
      end_date: addForm.end_date || new Date().toISOString().split("T")[0],
      setup_date: addForm.start_date || new Date().toISOString().split("T")[0],
      teardown_date: addForm.end_date || new Date().toISOString().split("T")[0],
      estimated_budget: Number(addForm.estimated_budget) || 0,
      status: "planning", poc_id: currentUser.id, created_by: currentUser.id,
      image_url: addForm.image_url || undefined,
    };
    setEvents([...events, newEvent]);
    setShowAddEvent(false);
    setAddForm({ name: "", location: "", start_date: "", end_date: "", estimated_budget: "", image_url: "" });
    toast({ title: "Event created" });
    navigate(`/events/${newEvent.id}`);
  };

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

      {/* Department Filter Chips */}
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

      {/* Stat Cards */}
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

      {/* Events — card grid with thumbnails */}
      <h3 className="text-sm font-semibold mb-3">Events{deptFilter ? ` — ${deptFilter}` : ""}</h3>
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-stroke">
          <span className="text-3xl mb-3">🎉</span>
          <p className="text-sm font-medium mb-1">No events yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first event to get started.</p>
          <button onClick={() => setShowAddEvent(true)} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
            <Plus size={14} className="inline mr-1" /> Add Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredEvents.map(ev => {
            const evTasks = getTasksByEvent(ev.id);
            const done = evTasks.filter(t => t.status === "completed").length;
            const initials = ev.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button key={ev.id} onClick={() => navigate(`/events/${ev.id}`)}
                className="rounded-xl border border-stroke overflow-hidden text-left hover:shadow-md transition-shadow bg-card">
                {ev.image_url ? (
                  <img src={ev.image_url} alt={ev.name} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate flex-1">{ev.name}</p>
                    <StatusBadge status={ev.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(ev.start_date)} – {formatDate(ev.end_date)}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{formatINRShort(ev.estimated_budget)}</span>
                    <span>{done}/{evTasks.length} tasks</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Recent Tasks */}
      {filteredTasks.length > 0 && (
        <>
          <h3 className="text-sm font-semibold mb-3">Recent Tasks{deptFilter ? ` — ${deptFilter}` : ""}</h3>
          <div className="rounded-xl border border-stroke overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.slice(0, 5).map(t => {
                  const ev = getEvent(t.event_id);
                  const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                  return (
                    <tr key={t.id} className="border-b border-stroke last:border-0 cursor-pointer hover:bg-selected transition-colors" onClick={() => navigate(`/tasks?task=${t.id}`)}>
                      <td className="px-4 py-3 font-medium">{t.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ev?.name}</td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className={`px-4 py-3 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{formatDate(t.deadline)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Event Sidesheet */}
      {showAddEvent && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowAddEvent(false)} />
          <div className="fixed right-0 top-0 z-[61] h-full w-full max-w-lg overflow-y-auto bg-card border-l border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
            onKeyDown={e => e.key === "Escape" && setShowAddEvent(false)}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create Event</h3>
                <button onClick={() => setShowAddEvent(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="text-sm font-medium">Event Thumbnail</label>
                {addForm.image_url ? (
                  <div className="relative mt-2 rounded-xl overflow-hidden group">
                    <img src={addForm.image_url} alt="" className="w-full h-32 object-cover" />
                    <button onClick={() => setShowImageUpload(true)}
                      className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">Change</button>
                  </div>
                ) : (
                  <button onClick={() => setShowImageUpload(true)}
                    className="mt-2 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-stroke rounded-xl bg-secondary hover:bg-selected transition-colors cursor-pointer">
                    <p className="text-sm font-medium">Add thumbnail</p>
                    <p className="text-xs text-muted-foreground">Upload or choose from gallery</p>
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Event Name <span className="text-red-500">*</span></label>
                <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="e.g. Annual Gala 2026" />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <input value={addForm.location} onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="Venue name and city" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <input type="date" value={addForm.start_date} onChange={e => setAddForm(f => ({ ...f, start_date: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <input type="date" value={addForm.end_date} onChange={e => setAddForm(f => ({ ...f, end_date: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Estimated Budget (₹)</label>
                <input type="number" value={addForm.estimated_budget} onChange={e => setAddForm(f => ({ ...f, estimated_budget: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="0" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowAddEvent(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                <button onClick={handleAddEvent} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Create Event</button>
              </div>
            </div>
          </div>
          {showImageUpload && (
            <EventImageUpload
              currentImage={addForm.image_url || undefined}
              onSelect={(url) => { setAddForm(f => ({ ...f, image_url: url })); setShowImageUpload(false); }}
              onClose={() => setShowImageUpload(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
