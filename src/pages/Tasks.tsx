import { useParams, useNavigate } from "react-router-dom";
import { useMockData } from "@/context/MockDataContext";
import { TopBar } from "@/components/TopBar";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useState } from "react";
import { ChatCircle, PaperPlaneRight, PencilSimple, Trash, X, CaretRight } from "@phosphor-icons/react";

export default function TasksPage() {
  const { id: routeTaskId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, events, departments, getProfile, getDepartment, getEvent, currentUser, getCommentsByTask, taskComments, setTaskComments } = useMockData();
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<string | null>(routeTaskId || null);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const visibleTasks = currentUser.role === "dept_member"
    ? tasks.filter(t => t.assignee_id === currentUser.id)
    : tasks;

  const filtered = visibleTasks.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (eventFilter !== "all" && t.event_id !== eventFilter) return false;
    return true;
  });

  // Group by department
  const groupedByDept = filtered.reduce<Record<string, typeof filtered>>((acc, t) => {
    const deptName = getDepartment(t.dept_id)?.name || "Unassigned";
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(t);
    return acc;
  }, {});

  const task = selectedTask ? tasks.find(t => t.id === selectedTask) : null;
  const comments = task ? getCommentsByTask(task.id) : [];

  const handleSubmitComment = () => {
    if (!newComment.trim() || !task) return;
    setTaskComments([...taskComments, {
      id: `tc_new_${Date.now()}`,
      task_id: task.id,
      author_id: currentUser.id,
      body: newComment.trim(),
      created_at: new Date().toISOString(),
    }]);
    setNewComment("");
  };

  const handleDeleteComment = (commentId: string) => {
    setTaskComments(taskComments.filter(c => c.id !== commentId));
  };

  const handleEditComment = (commentId: string) => {
    if (!editBody.trim()) return;
    setTaskComments(taskComments.map(c => c.id === commentId ? { ...c, body: editBody.trim() } : c));
    setEditingComment(null);
    setEditBody("");
  };

  return (
    <>
      <TopBar title="Tasks" subtitle={`${visibleTasks.length} tasks`} />
      <div className="p-6 max-w-[960px] space-y-5">
        <div className="flex items-center gap-3">
          <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm pr-8 focus:outline-none focus:border-foreground/30">
            <option value="all">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm pr-8 focus:outline-none focus:border-foreground/30">
            <option value="all">All Status</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Grouped by department */}
        {Object.entries(groupedByDept).map(([deptName, deptTasks]) => (
          <div key={deptName} className="space-y-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-foreground">{deptName}</h3>
              <span className="text-xs text-muted-foreground">{deptTasks.length}</span>
            </div>
            <div className="rounded-xl border border-border overflow-hidden mb-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                    <th className="px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                    <th className="px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
                    <th className="px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                    <th className="px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Due Date</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {deptTasks.map(t => {
                    const ev = getEvent(t.event_id);
                    const assignee = getProfile(t.assignee_id);
                    const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                    const taskCommentCount = getCommentsByTask(t.id).length;
                    return (
                      <tr key={t.id} onClick={() => setSelectedTask(t.id)} className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{t.title}</span>
                            {taskCommentCount > 0 && <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground"><ChatCircle size={12} />{taskCommentCount}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground cursor-pointer hover:text-foreground" onClick={e => { e.stopPropagation(); navigate(`/events/${t.event_id}`); }}>{ev?.name}</td>
                        <td className="px-4 py-3">{assignee && <div className="flex items-center gap-1.5"><UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" /><span>{assignee.name}</span></div>}</td>
                        <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className={`px-4 py-3 ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>{t.deadline}</td>
                        <td className="px-4 py-3"><CaretRight size={14} className="text-muted-foreground" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {Object.keys(groupedByDept).length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No tasks match your filters.</p>
        )}
      </div>

      {/* Task Detail Modal */}
      {task && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => { setSelectedTask(null); if (routeTaskId) navigate("/tasks"); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={task.status} />
                    <StatusBadge status={task.priority} />
                    {(() => {
                      const daysLeft = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000);
                      return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${daysLeft < 0 ? "bg-red-50 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>;
                    })()}
                  </div>
                  <h2 className="text-lg font-semibold">{task.title}</h2>
                  {task.description && <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>}
                </div>
                <button onClick={() => { setSelectedTask(null); if (routeTaskId) navigate("/tasks"); }} className="text-muted-foreground hover:text-foreground text-lg ml-4">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Event</p>
                  <button onClick={() => { setSelectedTask(null); navigate(`/events/${task.event_id}`); }} className="text-sm font-medium hover:text-accent-mid transition-colors">{getEvent(task.event_id)?.name}</button>
                  <p className="text-xs text-muted-foreground">{getDepartment(task.dept_id)?.name}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Assignee</p>
                  {(() => { const a = getProfile(task.assignee_id); return a ? <div className="flex items-center gap-1.5"><UserAvatar name={a.name} color={a.avatar_color} size="sm" /><span>{a.name}</span></div> : null; })()}
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Deadline</p>
                  <p>{task.deadline}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Created By</p>
                  {(() => { const c = getProfile(task.created_by); return c ? <div className="flex items-center gap-1.5"><UserAvatar name={c.name} color={c.avatar_color} size="sm" /><span>{c.name}</span></div> : null; })()}
                </div>
              </div>

              {/* Comments */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-3">Discussion ({comments.length})</h3>
                <div className="space-y-3">
                  {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>}
                  {comments.map(c => {
                    const author = getProfile(c.author_id);
                    const canEdit = c.author_id === currentUser.id;
                    const canDelete = c.author_id === currentUser.id || currentUser.role === "sa";
                    return (
                      <div key={c.id} className="flex gap-3">
                        {author && <UserAvatar name={author.name} color={author.avatar_color} size="sm" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{author?.name}</span>
                            <span className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()} · {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {canEdit && (
                              <button onClick={() => { setEditingComment(c.id); setEditBody(c.body); }} className="text-muted-foreground hover:text-foreground ml-auto"><PencilSimple size={13} /></button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDeleteComment(c.id)} className="text-muted-foreground hover:text-destructive"><Trash size={13} /></button>
                            )}
                          </div>
                          {editingComment === c.id ? (
                            <div className="flex gap-2 mt-1">
                              <input value={editBody} onChange={e => setEditBody(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEditComment(c.id)}
                                className="flex-1 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm focus:outline-none focus:border-foreground/30" />
                              <button onClick={() => handleEditComment(c.id)} className="rounded-full bg-foreground px-3 py-1.5 text-xs text-background font-medium">Save</button>
                              <button onClick={() => setEditingComment(null)} className="text-xs text-muted-foreground">Cancel</button>
                            </div>
                          ) : (
                            <p className="text-sm text-foreground/90 leading-relaxed mt-0.5">{c.body}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-4">
                  <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
                  <div className="flex-1 flex gap-2">
                    <input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSubmitComment()}
                      placeholder="Write a comment..."
                      className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
                    />
                    <button onClick={handleSubmitComment} disabled={!newComment.trim()} className="rounded-full bg-foreground px-3 py-2 text-background hover:bg-foreground/90 disabled:opacity-40 transition-colors">
                      <PaperPlaneRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
