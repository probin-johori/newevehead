import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useState } from "react";

export default function TasksPage() {
  const { tasks, events, getProfile, getDepartment, getEvent, currentUser } = useMockData();
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  const visibleTasks = currentUser.role === "dept_member"
    ? tasks.filter(t => t.assignee_id === currentUser.id)
    : tasks;

  const filtered = visibleTasks.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (eventFilter !== "all" && t.event_id !== eventFilter) return false;
    return true;
  });

  return (
    <>
      <TopBar title="Tasks" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm">
            <option value="all">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm">
            <option value="all">All Status</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead><tr className="bg-secondary text-left">
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Assignee</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Due</th>
            </tr></thead>
            <tbody>
              {filtered.map(t => {
                const ev = getEvent(t.event_id);
                const dept = getDepartment(t.dept_id);
                const assignee = getProfile(t.assignee_id);
                const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                return (
                  <tr key={t.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{t.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ev?.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dept?.name}</td>
                    <td className="px-4 py-3">{assignee && <div className="flex items-center gap-1.5"><UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" />{assignee.name}</div>}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className={`px-4 py-3 ${overdue ? "text-destructive font-medium" : ""}`}>{t.deadline}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
