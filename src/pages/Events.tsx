import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { useMockData, EventStatus } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { Plus, MapPin, CalendarDots } from "@phosphor-icons/react";

const filters: { label: string; value: EventStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Planning", value: "planning" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" },
];

export default function EventsPage() {
  const { events, tasks, subscription, getProfile, getDeptsByEvent, currentUser } = useMockData();
  const [filter, setFilter] = useState<EventStatus | "all">("all");
  const navigate = useNavigate();

  const filtered = filter === "all" ? events : events.filter(e => e.status === filter);
  const slotsExhausted = subscription.slots_used >= subscription.slots_total;
  const slotsWarning = subscription.slots_total - subscription.slots_used === 1;

  return (
    <>
      <TopBar title="Events" />
      <div className="p-6 space-y-4">
        {slotsWarning && (
          <div className="rounded-lg border border-warning/30 bg-amber-50 px-4 py-3 text-sm text-warning">
            ⚠️ You have 1 event slot remaining. Consider upgrading your plan.
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {filters.map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <button
            disabled={slotsExhausted}
            title={slotsExhausted ? "All event slots are used. Upgrade to create more events." : ""}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> New Event
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filtered.map(ev => {
            const poc = getProfile(ev.poc_id);
            const depts = getDeptsByEvent(ev.id);
            const evTasks = tasks.filter(t => t.event_id === ev.id);
            const done = evTasks.filter(t => t.status === "completed").length;
            const pct = evTasks.length > 0 ? Math.round((done / evTasks.length) * 100) : 0;
            const isMember = currentUser.role === "dept_member";

            return (
              <div
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}`)}
                className="cursor-pointer rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge status={ev.status} />
                </div>
                <h3 className="text-xl font-serif mb-2">{ev.name}</h3>
                <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1.5"><MapPin size={14} />{ev.location}</div>
                  <div className="flex items-center gap-1.5"><CalendarDots size={14} />{ev.start_date} → {ev.end_date}</div>
                  {poc && (
                    <div className="flex items-center gap-1.5">
                      <UserAvatar name={poc.name} color={poc.avatar_color} size="sm" />
                      <span>{poc.name}</span>
                    </div>
                  )}
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{done}/{evTasks.length} tasks</span>
                    <span>{pct}%</span>
                  </div>
                  <ProgressBar value={done} max={evTasks.length} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{depts.length} departments</span>
                  {!isMember && <span>Budget: ₹{(ev.estimated_budget / 1000).toFixed(0)}K</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
