import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMockData, formatINRShort, formatDate, formatTimeAgo } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { X, Plus, CaretDown, ListChecks, Receipt, Users, CalendarBlank, ChartBar } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";
import { useScrollLock } from "@/hooks/useScrollLock";
import { EventImageUpload } from "@/components/EventImageUpload";
import { UserAvatar } from "@/components/UserAvatar";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { events, departments, tasks, bills, getTasksByEvent, currentUser, addEvent: dbAddEvent, orgId, getProfile, teamMembers } = useMockData();
  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", location: "", start_date: "", end_date: "", estimated_budget: "", image_url: "" });

  useScrollLock(showAddEvent);

  // Only show active/planning events on dashboard
  const activeEvents2 = events.filter(e => e.status === "planning" || e.status === "active");
  const pastEvents = events.filter(e => e.status === "completed" || e.status === "archived");
  const displayEvents = activeEvents2;

  // Stats — scoped to event filter
  const statsEvents = eventFilter ? events.filter(e => e.id === eventFilter) : events;
  const statsEventIds = new Set(statsEvents.map(e => e.id));
  const statsDepts = departments.filter(d => statsEventIds.has(d.event_id));
  const statsTasks = tasks.filter(t => statsEventIds.has(t.event_id));
  const statsBills = bills.filter(b => statsEventIds.has(b.event_id));

  const totalBudget = statsEvents.reduce((s, e) => s + e.estimated_budget, 0);
  const totalSpent = statsBills.filter(b => b.status === "settled").reduce((s, b) => s + b.amount, 0);
  const pendingSpend = statsBills.filter(b => ["pending", "dept-verified", "ca-approved"].includes(b.status)).reduce((s, b) => s + b.amount, 0);
  const allocatedBudget = statsDepts.reduce((s, d) => s + d.allocated_budget, 0);
  const tasksDone = statsTasks.filter(t => t.status === "completed").length;
  const tasksTotal = statsTasks.length;
  const overdueTasks = statsTasks.filter(t => t.status !== "completed" && t.deadline && new Date(t.deadline) < new Date()).length;
  const activeEvents = statsEvents.filter(e => e.status === "active" || e.status === "planning").length;
  const teamSize = teamMembers.length;

  // Recent tasks assigned to current user
  const myRecentTasks = tasks
    .filter(t => t.assignee_id === currentUser.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

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

      {/* Event Filter — scoped to stats only */}
      <div className="flex items-center gap-2 mb-5">
        <div className="relative">
          <button onClick={() => setShowEventDropdown(!showEventDropdown)}
            className="flex items-center gap-1.5 rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-selected transition-colors">
            {eventFilter ? events.find(e => e.id === eventFilter)?.name || "Event" : "All Events"}
            <CaretDown size={12} />
          </button>
          {showEventDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowEventDropdown(false)} />
              <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-stroke bg-card shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
                <button onClick={() => { setEventFilter(null); setShowEventDropdown(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-selected transition-colors ${!eventFilter ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  All Events
                </button>
                {events.map(ev => (
                  <button key={ev.id} onClick={() => { setEventFilter(ev.id); setShowEventDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-selected transition-colors ${eventFilter === ev.id ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {ev.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {eventFilter && (
          <button onClick={() => setEventFilter(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* KPI Cards — single container, two rows */}
      <div className="border border-stroke rounded-xl overflow-hidden mb-6">
        <div className="grid grid-cols-4 gap-0">
          {[
            { label: "Total Budget", value: formatINRShort(totalBudget), icon: <ChartBar size={16} className="text-muted-foreground" /> },
            { label: "Approved Spend", value: formatINRShort(totalSpent), icon: <Receipt size={16} className="text-emerald-500" /> },
            { label: "Pending Spend", value: formatINRShort(pendingSpend), icon: <Receipt size={16} className="text-amber-500" /> },
            { label: "Allocated Budget", value: formatINRShort(allocatedBudget), icon: <ChartBar size={16} className="text-accent" /> },
          ].map((stat, i) => (
            <div key={i} className={`p-5 ${i < 3 ? "border-r border-stroke" : ""}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {stat.icon}
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-stroke" />
        <div className="grid grid-cols-4 gap-0">
          {[
            { label: "Tasks Completed", value: `${tasksDone}/${tasksTotal}` },
            { label: "Overdue Tasks", value: String(overdueTasks) },
            { label: "Active Events", value: String(activeEvents) },
            { label: "Team Members", value: String(teamSize) },
          ].map((stat, i) => (
            <div key={i} className={`p-5 ${i < 3 ? "border-r border-stroke" : ""}`}>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Events Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Events</h3>
        {pastEvents.length > 0 && (
          <button onClick={() => navigate("/past-events")}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            All Events ({events.length})
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

      {/* Recent Tasks — notification-style list */}
      {myRecentTasks.length > 0 && (
        <>
          <h3 className="text-sm font-semibold mb-3">My Tasks</h3>
          <div className="rounded-xl border border-stroke overflow-hidden divide-y divide-stroke">
            {myRecentTasks.map(t => {
              const ev = events.find(e => e.id === t.event_id);
              const overdue = t.status !== "completed" && t.deadline && new Date(t.deadline) < new Date();
              return (
                <button key={t.id}
                  onClick={() => navigate(`/events/${t.event_id}?tab=tasks&task=${t.id}`)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-selected transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === "completed" ? "bg-emerald-500" : overdue ? "bg-red-500" : t.status === "in-progress" ? "bg-amber-500" : "bg-muted-foreground/30"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ev?.name}{t.deadline ? ` · Due ${formatDate(t.deadline)}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </button>
              );
            })}
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
