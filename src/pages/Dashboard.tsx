import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMockData, formatINRShort, formatDate } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { X, Plus, CaretDown } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";
import { useScrollLock } from "@/hooks/useScrollLock";
import { EventImageUpload } from "@/components/EventImageUpload";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { events, departments, tasks, bills, getTasksByEvent, currentUser, addEvent: dbAddEvent, orgId } = useMockData();
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", location: "", start_date: "", end_date: "", estimated_budget: "", image_url: "" });

  useScrollLock(showAddEvent);

  const allDeptNames = Array.from(new Set(departments.map(d => d.name)));
  const filteredDepts = deptFilter ? departments.filter(d => d.name === deptFilter) : departments;
  const filteredDeptIds = new Set(filteredDepts.map(d => d.id));
  const filteredEventIds = new Set(filteredDepts.map(d => d.event_id));
  const filteredEvents = deptFilter ? events.filter(e => filteredEventIds.has(e.id)) : events;
  const filteredTasks = deptFilter ? tasks.filter(t => filteredDeptIds.has(t.dept_id)) : tasks;

  // Split events into upcoming/current vs past
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcomingEvents = filteredEvents.filter(e => new Date(e.end_date) >= now || e.status === "planning" || e.status === "active");
  const pastEvents = filteredEvents.filter(e => new Date(e.end_date) < now && e.status !== "planning" && e.status !== "active");
  const displayEvents = showPastEvents ? filteredEvents : upcomingEvents;

  const totalBudget = filteredEvents.reduce((s, e) => s + e.estimated_budget, 0);
  const totalSpent = filteredDepts.reduce((s, d) => s + d.spent, 0);
  const tasksDone = filteredTasks.filter(t => t.status === "completed").length;
  const overdueTasks = filteredTasks.filter(t => t.status !== "completed" && t.deadline && new Date(t.deadline) < new Date()).length;

  const handleAddEvent = async () => {
    if (!addForm.name.trim()) { toast({ title: "Event name is required", variant: "destructive" }); return; }
    const newEvent = await dbAddEvent({
      name: addForm.name.trim(), location: addForm.location,
      start_date: addForm.start_date || new Date().toISOString().split("T")[0],
      end_date: addForm.end_date || new Date().toISOString().split("T")[0],
      setup_date: addForm.start_date || new Date().toISOString().split("T")[0],
      teardown_date: addForm.end_date || new Date().toISOString().split("T")[0],
      estimated_budget: Number(addForm.estimated_budget) || 0,
      status: "planning" as const, poc_id: currentUser.id, created_by: currentUser.id,
      image_url: addForm.image_url || undefined,
    });
    setShowAddEvent(false);
    setAddForm({ name: "", location: "", start_date: "", end_date: "", estimated_budget: "", image_url: "" });
    toast({ title: "Event created" });
    if (newEvent) navigate(`/events/${newEvent.id}`);
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

      {/* Department Filter — dropdown instead of chips */}
      <div className="flex items-center gap-2 mb-5">
        <div className="relative">
          <button onClick={() => setShowDeptDropdown(!showDeptDropdown)}
            className="flex items-center gap-1.5 rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-selected transition-colors">
            {deptFilter ? deptFilter : "All Departments"}
            <CaretDown size={12} />
          </button>
          {showDeptDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDeptDropdown(false)} />
              <div className="absolute left-0 top-full mt-1 w-48 rounded-xl border border-stroke bg-card shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
                <button onClick={() => { setDeptFilter(null); setShowDeptDropdown(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-selected transition-colors ${!deptFilter ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  All Departments
                </button>
                {allDeptNames.map(name => (
                  <button key={name} onClick={() => { setDeptFilter(name); setShowDeptDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-selected transition-colors ${deptFilter === name ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {deptFilter && (
          <button onClick={() => setDeptFilter(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
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

      {/* Events Header with "All Events" toggle */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Events{deptFilter ? ` — ${deptFilter}` : ""}</h3>
        {pastEvents.length > 0 && (
          <button onClick={() => setShowPastEvents(!showPastEvents)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            {showPastEvents ? "Show Upcoming" : `All Events (${filteredEvents.length})`}
          </button>
        )}
      </div>

      {displayEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-stroke">
          <span className="text-3xl mb-3">🎉</span>
          <p className="text-sm font-medium mb-1">No events yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first event to get started.</p>
          <button onClick={() => setShowAddEvent(true)} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
            <Plus size={14} className="inline mr-1" /> Add Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {displayEvents.map(ev => {
            const evTasks = getTasksByEvent(ev.id);
            const done = evTasks.filter(t => t.status === "completed").length;
            const initials = ev.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button key={ev.id} onClick={() => navigate(`/events/${ev.id}`)}
                className="flex flex-col items-center text-center group">
                {/* Round thumbnail */}
                <div className="w-20 h-20 rounded-full overflow-hidden mb-3 ring-2 ring-stroke group-hover:ring-foreground/30 transition-all">
                  {ev.image_url ? (
                    <img src={ev.image_url} alt={ev.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold">
                      {initials}
                    </div>
                  )}
                </div>
                <p className="font-medium text-sm truncate max-w-full">{ev.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(ev.start_date)} – {formatDate(ev.end_date)}</p>
                <StatusBadge status={ev.status} className="mt-1" />
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
                  const ev = events.find(e => e.id === t.event_id);
                  const overdue = t.status !== "completed" && t.deadline && new Date(t.deadline) < new Date();
                  return (
                    <tr key={t.id} className="border-b border-stroke last:border-0 cursor-pointer hover:bg-selected transition-colors" onClick={() => navigate(`/tasks?event=${t.event_id}&task=${t.id}`)}>
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

              {/* Square Thumbnail with rounded corners */}
              <div>
                <label className="text-sm font-medium">Event Thumbnail</label>
                {addForm.image_url ? (
                  <div className="relative mt-2 w-32 h-32 rounded-xl overflow-hidden group">
                    <img src={addForm.image_url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setShowImageUpload(true)}
                      className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">Change</button>
                  </div>
                ) : (
                  <button onClick={() => setShowImageUpload(true)}
                    className="mt-2 flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-stroke rounded-xl bg-secondary hover:bg-selected transition-colors cursor-pointer">
                    <p className="text-sm font-medium">Add</p>
                    <p className="text-xs text-muted-foreground">thumbnail</p>
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
