import { useNavigate, useSearchParams } from "react-router-dom";
import { useMockData, formatDate } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useState, useEffect } from "react";
import { ChatCircle, PaperPlaneRight, PencilSimple, Trash, X, CaretRight, Flag, Plus, ListChecks } from "@phosphor-icons/react";

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: "text-red-600", label: "Urgent" },
  high: { color: "text-amber-600", label: "High" },
  normal: { color: "text-blue-600", label: "Normal" },
  low: { color: "text-muted-foreground", label: "Low" },
};

export default function TasksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tasks, events, getProfile, getDepartment, getEvent, currentUser, getCommentsByTask, taskComments, setTaskComments } = useMockData();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [eventFilter, setEventFilter] = useState(searchParams.get("event") || "all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<string | null>(searchParams.get("task"));
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmEdit, setConfirmEdit] = useState<string | null>(null);

  useScrollLock(!!selectedTask);

  // Sync URL params
  useEffect(() => {
    const ev = searchParams.get("event");
    const st = searchParams.get("status");
    const task = searchParams.get("task");
    if (ev) setEventFilter(ev);
    if (st) setStatusFilter(st);
    if (task) setSelectedTask(task);
  }, [searchParams]);

  const visibleTasks = currentUser.role === "dept_member"
    ? tasks.filter(t => t.assignee_id === currentUser.id)
    : tasks;

  const filtered = visibleTasks.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (eventFilter !== "all" && t.event_id !== eventFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

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
      id: `tc_new_${Date.now()}`, task_id: task.id, author_id: currentUser.id,
      body: newComment.trim(), created_at: new Date().toISOString(),
    }]);
    setNewComment("");
  };

  const handleDeleteComment = (commentId: string) => {
    setTaskComments(taskComments.filter(c => c.id !== commentId));
    setConfirmDelete(null);
  };

  const handleEditComment = (commentId: string) => {
    if (!editBody.trim()) return;
    setTaskComments(taskComments.map(c => c.id === commentId ? { ...c, body: editBody.trim() } : c));
    setEditingComment(null);
    setEditBody("");
    setConfirmEdit(null);
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">{visibleTasks.length} tasks</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
          <Plus size={14} /> Create Task
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
          className="rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm pr-8 focus:outline-none focus:border-muted-foreground">
          <option value="all">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm pr-8 focus:outline-none focus:border-muted-foreground">
          <option value="all">All Status</option>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="completed">Completed</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm pr-8 focus:outline-none focus:border-muted-foreground">
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {Object.entries(groupedByDept).map(([deptName, deptTasks]) => (
        <div key={deptName} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold">{deptName}</h3>
            <span className="text-xs text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">{deptTasks.length}</span>
          </div>
          <div className="rounded-xl border border-stroke overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subtasks</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {deptTasks.map(t => {
                  const ev = getEvent(t.event_id);
                  const assignee = getProfile(t.assignee_id);
                  const overdue = t.status !== "completed" && new Date(t.deadline) < new Date();
                  const commentCount = getCommentsByTask(t.id).length;
                  const pc = priorityConfig[t.priority] || priorityConfig.normal;
                  const doneSubtasks = t.subtasks.filter(s => s.completed).length;
                  return (
                    <tr key={t.id} onClick={() => setSelectedTask(t.id)} className="border-b border-stroke last:border-0 cursor-pointer hover:bg-selected transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t.title}</span>
                          {commentCount > 0 && <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground"><ChatCircle size={12} />{commentCount}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="text-muted-foreground hover:text-accent transition-colors text-sm"
                          onClick={e => { e.stopPropagation(); navigate(`/events/${t.event_id}`); }}
                        >
                          {ev?.name}
                        </button>
                      </td>
                      <td className="px-4 py-3">{assignee && <div className="flex items-center gap-1.5"><UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" /><span>{assignee.name}</span></div>}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Flag size={13} weight="fill" className={pc.color} />
                          <span className={`text-xs font-medium ${pc.color}`}>{pc.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3">
                        {t.subtasks.length > 0 ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ListChecks size={13} />
                            {doneSubtasks}/{t.subtasks.length}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{formatDate(t.deadline)}</td>
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
        <div className="flex flex-col items-center justify-center py-16">
          <span className="text-3xl mb-3">📋</span>
          <p className="text-sm text-muted-foreground mb-3">No tasks match your filters.</p>
          <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
            Create your first task
          </button>
        </div>
      )}

      {/* Task Detail Slide-in Panel */}
      {task && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedTask(null)} />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto bg-card border-l border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={task.status} />
                  <StatusBadge status={task.priority} />
                  {(() => {
                    const daysLeft = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000);
                    return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${daysLeft < 0 ? "bg-red-50 text-red-600" : "bg-secondary text-muted-foreground"}`}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                    </span>;
                  })()}
                </div>
                <h2 className="text-lg font-semibold">{task.title}</h2>
                {task.description && <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>}
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-muted-foreground hover:text-foreground ml-4"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-stroke pt-4 text-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Event</p>
                <button onClick={() => { setSelectedTask(null); navigate(`/events/${task.event_id}`); }} className="text-sm font-medium hover:text-accent transition-colors">{getEvent(task.event_id)?.name}</button>
                <p className="text-xs text-muted-foreground">{getDepartment(task.dept_id)?.name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Assignee</p>
                {(() => { const a = getProfile(task.assignee_id); return a ? <div className="flex items-center gap-1.5"><UserAvatar name={a.name} color={a.avatar_color} size="sm" /><span>{a.name}</span></div> : null; })()}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Deadline</p>
                <p>{formatDate(task.deadline)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Subtasks</p>
                <p>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} completed</p>
              </div>
            </div>

            {/* Subtasks */}
            {task.subtasks.length > 0 && (
              <div className="border-t border-stroke pt-4">
                <h3 className="text-sm font-semibold mb-3">Sub-tasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</h3>
                <div className="space-y-2">
                  {task.subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={st.completed} readOnly className="h-4 w-4 rounded border-stroke accent-accent" />
                      <span className={`text-sm ${st.completed ? "line-through text-muted-foreground" : ""}`}>{st.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments / Thread */}
            <div className="border-t border-stroke pt-4">
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
                          <span className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                          {canEdit && (
                            <button onClick={() => { setEditingComment(c.id); setEditBody(c.body); }} className="text-muted-foreground hover:text-foreground ml-auto">
                              <PencilSimple size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setConfirmDelete(c.id)} className="text-muted-foreground hover:text-red-600">
                              <Trash size={13} />
                            </button>
                          )}
                        </div>
                        {editingComment === c.id ? (
                          <div className="flex gap-2 mt-1">
                            <input value={editBody} onChange={e => setEditBody(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") setConfirmEdit(c.id); }}
                              className="flex-1 rounded-lg border border-stroke bg-secondary px-3 py-1.5 text-sm focus:outline-none" />
                            <button onClick={() => setConfirmEdit(c.id)} className="rounded-full bg-foreground px-3 py-1.5 text-xs text-background font-medium">Save</button>
                            <button onClick={() => { setEditingComment(null); setEditBody(""); }} className="text-xs text-muted-foreground">Cancel</button>
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
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmitComment()}
                    placeholder="Write a comment..." className="flex-1 rounded-full border border-stroke bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none" />
                  <button onClick={handleSubmitComment} disabled={!newComment.trim()} className="rounded-full bg-foreground px-3 py-2 text-background hover:bg-foreground/90 disabled:opacity-40 transition-colors">
                    <PaperPlaneRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Message"
        message="Delete this message? This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => confirmDelete && handleDeleteComment(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={!!confirmEdit}
        title="Save Changes"
        message="Save changes to this message?"
        confirmLabel="Confirm"
        onConfirm={() => confirmEdit && handleEditComment(confirmEdit)}
        onCancel={() => setConfirmEdit(null)}
      />
    </div>
  );
}
