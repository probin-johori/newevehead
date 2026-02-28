import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { useMockData, EventStatus } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Plus, MapPin, CalendarDots, CaretRight } from "@phosphor-icons/react";

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
      <TopBar title="Events" subtitle={`${events.length} events`} />
      <div className="p-6 max-w-[960px] space-y-5">
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
                  filter === f.value ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:bg-muted"
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <button
            disabled={slotsExhausted}
            title={slotsExhausted ? "All event slots are used. Upgrade to create more events." : ""}
            className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} /> New Event
          </button>
        </div>

        {/* Table view */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Start Date</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">End Date</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">POC</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Depts</th>
                {currentUser.role !== "dept_member" && (
                  <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Budget</th>
                )}
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ev => {
                const poc = getProfile(ev.poc_id);
                const depts = getDeptsByEvent(ev.id);
                const evTasks = tasks.filter(t => t.event_id === ev.id);
                const done = evTasks.filter(t => t.status === "completed").length;

                return (
                  <tr
                    key={ev.id}
                    onClick={() => navigate(`/events/${ev.id}`)}
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{ev.name}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin size={13} />{ev.location}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(ev.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(ev.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3">
                      {poc && (
                        <div className="flex items-center gap-1.5">
                          <UserAvatar name={poc.name} color={poc.avatar_color} size="sm" />
                          <span className="text-sm">{poc.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{done}/{evTasks.length}</td>
                    <td className="px-4 py-3 text-muted-foreground">{depts.length}</td>
                    {currentUser.role !== "dept_member" && (
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">₹{(ev.estimated_budget / 1000).toFixed(0)}K</td>
                    )}
                    <td className="px-4 py-3"><CaretRight size={14} className="text-muted-foreground" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No events match your filter.</p>
          )}
        </div>
      </div>
    </>
  );
}
