import { useParams, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useState } from "react";
import { ArrowLeft, ChatCircle, PaperPlaneRight, CalendarDots, Flag, User } from "@phosphor-icons/react";

function TaskDetail({ taskId }: { taskId: string }) {
  const { tasks, getProfile, getEvent, getDepartment, getCommentsByTask, taskComments, setTaskComments, currentUser } = useMockData();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState("");

  const task = tasks.find(t => t.id === taskId);
  if (!task) return <div className="p-6">Task not found</div>;

  const ev = getEvent(task.event_id);
  const dept = getDepartment(task.dept_id);
  const assignee = getProfile(task.assignee_id);
  const creator = getProfile(task.created_by);
  const comments = getCommentsByTask(taskId);
  const daysLeft = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: `tc_new_${Date.now()}`,
      task_id: taskId,
      author_id: currentUser.id,
      body: newComment.trim(),
      created_at: new Date().toISOString(),
    };
    setTaskComments([...taskComments, comment]);
    setNewComment("");
  };

  return (
    <>
      <TopBar title="Task Detail" />
      <div className="p-6 space-y-6 max-w-4xl">
        <button onClick={() => navigate("/tasks")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Tasks
        </button>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={task.status} />
              <StatusBadge status={task.priority} />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${daysLeft < 0 ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
              </span>
            </div>
            <h2 className="text-2xl font-serif">{task.title}</h2>
            {task.description && <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>}
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-5">
            <div className="flex items-start gap-3">
              <CalendarDots size={16} className="text-muted-foreground mt-0.5" />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Event</p>
                <button onClick={() => navigate(`/events/${task.event_id}`)} className="text-sm font-medium hover:text-primary transition-colors">{ev?.name}</button>
                <p className="text-[11px] text-muted-foreground">{dept?.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User size={16} className="text-muted-foreground mt-0.5" />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Assignee</p>
                {assignee && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" />
                    <span className="text-sm">{assignee.name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Flag size={16} className="text-muted-foreground mt-0.5" />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Deadline</p>
                <p className="text-sm">{task.deadline}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User size={16} className="text-muted-foreground mt-0.5" />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Created By</p>
                {creator && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <UserAvatar name={creator.name} color={creator.avatar_color} size="sm" />
                    <span className="text-sm">{creator.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Thread */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <ChatCircle size={18} />
            <h3 className="text-base font-serif">Discussion</h3>
            <span className="text-xs text-muted-foreground">({comments.length})</span>
          </div>

          <div className="divide-y divide-border">
            {comments.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted-foreground text-center">No comments yet. Start the conversation.</p>
            )}
            {comments.map(c => {
              const author = getProfile(c.author_id);
              return (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    {author && <UserAvatar name={author.name} color={author.avatar_color} size="sm" />}
                    <div>
                      <span className="text-sm font-medium">{author?.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">
                        {new Date(c.created_at).toLocaleDateString()} · {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed pl-8">{c.body}</p>
                </div>
              );
            })}
          </div>

          {/* New Comment */}
          <div className="border-t border-border px-5 py-4">
            <div className="flex gap-3">
              <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
              <div className="flex-1 flex gap-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmitComment()}
                  placeholder="Write a comment..."
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button onClick={handleSubmitComment} disabled={!newComment.trim()} className="rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
                  <PaperPlaneRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function TasksPage() {
  const { id: routeTaskId } = useParams<{ id: string }>();
  const { tasks, events, getProfile, getDepartment, getEvent, currentUser, getCommentsByTask } = useMockData();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  if (routeTaskId) {
    return <TaskDetail taskId={routeTaskId} />;
  }

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
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm pr-8">
            <option value="all">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm pr-8">
            <option value="all">All Status</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Task Summary */}
        <div className="flex gap-3">
          {[
            { label: "Not Started", status: "not-started", count: filtered.filter(t => t.status === "not-started").length },
            { label: "In Progress", status: "in-progress", count: filtered.filter(t => t.status === "in-progress").length },
            { label: "Blocked", status: "blocked", count: filtered.filter(t => t.status === "blocked").length },
            { label: "Completed", status: "completed", count: filtered.filter(t => t.status === "completed").length },
          ].map(s => (
            <div key={s.status} className="flex items-center gap-1.5">
              <StatusBadge status={s.status} />
              <span className="text-xs text-muted-foreground">{s.count}</span>
            </div>
          ))}
        </div>

        {/* Task Cards */}
        <div className="space-y-3">
          {filtered.map(t => {
            const ev = getEvent(t.event_id);
            const dept = getDepartment(t.dept_id);
            const assignee = getProfile(t.assignee_id);
            const comments = getCommentsByTask(t.id);
            const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
            const daysLeft = Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86400000);

            return (
              <button
                key={t.id}
                onClick={() => navigate(`/tasks/${t.id}`)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {assignee && <UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" />}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {ev?.name} · {dept?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {comments.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ChatCircle size={13} /> {comments.length}
                    </span>
                  )}
                  <StatusBadge status={t.priority} />
                  <StatusBadge status={t.status} />
                  <span className={`text-xs font-medium min-w-[60px] text-right ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                  </span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No tasks match your filters.</p>
          )}
        </div>
      </div>
    </>
  );
}
