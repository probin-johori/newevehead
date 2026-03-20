import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMockData, formatDate, formatTimeAgo } from "@/context/MockDataContext";
import type { Task, TaskStatus, TaskPriority, SubTask } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  X, PaperPlaneRight, PencilSimple, Trash, Flag, Plus, Check,
  CheckSquare, Square, CaretDown
} from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: "text-red-600", label: "Urgent" },
  high: { color: "text-amber-600", label: "High" },
  normal: { color: "text-blue-600", label: "Normal" },
  low: { color: "text-muted-foreground", label: "Low" },
};

const STATUS_OPTIONS: { key: TaskStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "not-started", label: "To Do" },
  { key: "in-progress", label: "In Progress" },
  { key: "in-review", label: "In Review" },
  { key: "completed", label: "Done" },
  { key: "blocked", label: "Blocked" },
];

const PRIORITY_OPTIONS: { key: TaskPriority; label: string }[] = [
  { key: "urgent", label: "Urgent" },
  { key: "high", label: "High" },
  { key: "normal", label: "Normal" },
  { key: "low", label: "Low" },
];

interface TaskDetailSheetProps {
  taskId: string | null;
  onClose: () => void;
  onOpenProfile?: (userId: string) => void;
}

export function TaskDetailSheet({ taskId, onClose, onOpenProfile }: TaskDetailSheetProps) {
  const navigate = useNavigate();
  const {
    tasks, setTasks, getProfile, getEvent, getDepartment, getDeptsByEvent, currentUser,
    getCommentsByTask, taskComments, setTaskComments, events, profiles,
    updateTask: dbUpdateTask, deleteTask: dbDeleteTask, addComment: dbAddComment,
    departments,
  } = useMockData();

  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmEdit, setConfirmEdit] = useState<string | null>(null);
  const [confirmDeleteSubtask, setConfirmDeleteSubtask] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [editDescValue, setEditDescValue] = useState("");
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(false);

  useScrollLock(!!taskId);

  const task = taskId ? tasks.find(t => t.id === taskId) : null;
  const comments = task ? getCommentsByTask(task.id) : [];
  const eventDepts = task ? getDeptsByEvent(task.event_id) : [];

  if (!task) return null;

  const doneSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const pctDone = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0;

  const updateTask = (updates: Partial<Task>) => {
    dbUpdateTask(task.id, updates);
    setTasks(tasks.map(t => t.id === task.id ? { ...t, ...updates } : t));
  };

  const toggleSubtask = (subtaskId: string) => {
    const newSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed, status: (!st.completed ? "completed" : "not-started") as TaskStatus } : st
    );
    updateTask({ subtasks: newSubtasks });
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSt: SubTask = {
      id: `st_new_${Date.now()}`, title: newSubtaskTitle.trim(), completed: false,
      assignee_id: currentUser.id, priority: "normal", status: "not-started",
    };
    updateTask({ subtasks: [...task.subtasks, newSt] });
    setNewSubtaskTitle("");
    toast({ title: "Subtask added" });
  };

  const deleteSubtask = (stId: string) => {
    updateTask({ subtasks: task.subtasks.filter(st => st.id !== stId) });
    setConfirmDeleteSubtask(null);
    toast({ title: "Subtask deleted" });
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    await dbAddComment({
      task_id: task.id, author_id: currentUser.id, body: newComment.trim(),
    });
    setNewComment("");
  };

  const handleDeleteTask = async () => {
    await dbDeleteTask(task.id);
    setConfirmDeleteTask(false);
    onClose();
    toast({ title: "Task deleted" });
  };

  const handleDeleteComment = (commentId: string) => {
    setTaskComments(taskComments.filter(c => c.id !== commentId));
    setConfirmDelete(null);
    toast({ title: "Comment deleted" });
  };

  const handleEditComment = (commentId: string) => {
    if (!editBody.trim()) return;
    setTaskComments(taskComments.map(c => c.id === commentId ? { ...c, body: editBody.trim() } : c));
    setEditingComment(null);
    setEditBody("");
    setConfirmEdit(null);
    toast({ title: "Comment updated" });
  };

  const saveTitle = () => {
    if (editTitleValue.trim()) updateTask({ title: editTitleValue.trim() });
    setEditingTitle(false);
  };

  const saveDesc = () => {
    updateTask({ description: editDescValue });
    setEditingDesc(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto bg-card border-l border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <select value={task.status} onChange={e => updateTask({ status: e.target.value as TaskStatus })}
                className="rounded-full border border-stroke bg-secondary px-2 py-0.5 text-[11px] font-medium focus:outline-none">
                {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <select value={task.priority} onChange={e => updateTask({ priority: e.target.value as TaskPriority })}
                className="rounded-full border border-stroke bg-secondary px-2 py-0.5 text-[11px] font-medium focus:outline-none">
                {PRIORITY_OPTIONS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              {(() => {
                const daysLeft = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000);
                return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${daysLeft < 0 ? "bg-red-50 text-red-600" : "bg-secondary text-muted-foreground"}`}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                </span>;
              })()}
            </div>

            {editingTitle ? (
              <input value={editTitleValue} onChange={e => setEditTitleValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                onBlur={saveTitle} autoFocus
                className="text-lg font-semibold w-full bg-secondary border border-stroke rounded-lg px-2 py-1 focus:outline-none" />
            ) : (
              <h2 className="text-lg font-semibold cursor-pointer hover:bg-secondary/50 px-1 -mx-1 rounded transition-colors"
                onClick={() => { setEditTitleValue(task.title); setEditingTitle(true); }}>
                {task.title}
              </h2>
            )}

            {editingDesc ? (
              <div>
                <textarea value={editDescValue} onChange={e => setEditDescValue(e.target.value)} rows={3}
                  className="w-full text-sm bg-secondary border border-stroke rounded-lg px-3 py-2 focus:outline-none" />
                <div className="flex gap-2 mt-1">
                  <button onClick={saveDesc} className="rounded-full bg-foreground px-3 py-1 text-xs text-background font-medium">Save</button>
                  <button onClick={() => setEditingDesc(false)} className="text-xs text-muted-foreground">Cancel</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed cursor-pointer hover:bg-secondary/50 px-1 -mx-1 rounded transition-colors"
                onClick={() => { setEditDescValue(task.description); setEditingDesc(true); }}>
                {task.description || "Click to add description..."}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button onClick={() => setConfirmDeleteTask(true)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash size={18} /></button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>
        </div>

        {/* Editable fields */}
        <div className="grid grid-cols-2 gap-4 border-t border-stroke pt-4 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Event</p>
            <select value={task.event_id} onChange={e => updateTask({ event_id: e.target.value })}
              className="w-full rounded-lg border border-stroke bg-secondary px-2 py-1.5 text-sm focus:outline-none">
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Assignee</p>
            <select value={task.assignee_id} onChange={e => updateTask({ assignee_id: e.target.value })}
              className="w-full rounded-lg border border-stroke bg-secondary px-2 py-1.5 text-sm focus:outline-none">
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Deadline</p>
            <input type="date" value={task.deadline} onChange={e => updateTask({ deadline: e.target.value })}
              className="w-full rounded-lg border border-stroke bg-secondary px-2 py-1.5 text-sm focus:outline-none" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Department</p>
            <select value={task.dept_id} onChange={e => updateTask({ dept_id: e.target.value })}
              className="w-full rounded-lg border border-stroke bg-secondary px-2 py-1.5 text-sm focus:outline-none">
              <option value="">No department</option>
              {eventDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        {/* Subtasks with progress bar */}
        <div className="border-t border-stroke pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Subtasks ({doneSubtasks}/{totalSubtasks})</h3>
            <span className="text-xs text-muted-foreground">{pctDone}% done</span>
          </div>
          {totalSubtasks > 0 && <ProgressBar value={doneSubtasks} max={totalSubtasks} className="mb-3" />}

          {/* Subtask table */}
          <div className="space-y-0 rounded-lg border border-stroke overflow-hidden">
            {task.subtasks.map(st => {
              const assignee = st.assignee_id ? getProfile(st.assignee_id) : null;
              const pc = priorityConfig[st.priority || "normal"];
              return (
                <div key={st.id} className="flex items-center gap-2 px-3 py-2 border-b border-stroke last:border-0 hover:bg-secondary/50 transition-colors group">
                  <button onClick={() => toggleSubtask(st.id)} className="shrink-0">
                    {st.completed
                      ? <CheckSquare size={16} weight="fill" className="text-emerald-500" />
                      : <Square size={16} className="text-muted-foreground" />}
                  </button>
                  <span className={`text-sm flex-1 min-w-0 truncate ${st.completed ? "line-through text-muted-foreground" : ""}`}>{st.title}</span>
                  {assignee && (
                    <button onClick={() => onOpenProfile?.(assignee.id)} className="shrink-0">
                      <UserAvatar name={assignee.name} color={assignee.avatar_color} size="sm" />
                    </button>
                  )}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Flag size={11} weight="fill" className={pc.color} />
                    <span className={`text-[10px] font-medium ${pc.color}`}>{pc.label}</span>
                  </div>
                  <StatusBadge status={st.status || "not-started"} className="shrink-0" />
                  <button onClick={() => setConfirmDeleteSubtask(st.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 shrink-0 transition-opacity">
                    <Trash size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add subtask */}
          <div className="flex gap-2 mt-2">
            <input value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSubtask()}
              placeholder="Add subtask..." className="flex-1 rounded-lg border border-stroke bg-secondary px-3 py-1.5 text-sm focus:outline-none" />
            <button onClick={addSubtask} disabled={!newSubtaskTitle.trim()}
              className="rounded-full bg-foreground px-3 py-1.5 text-xs text-background font-medium disabled:opacity-40">
              <Plus size={13} />
            </button>
          </div>
        </div>

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
                  {author && (
                    <button onClick={() => onOpenProfile?.(author.id)} className="shrink-0">
                      <UserAvatar name={author.name} color={author.avatar_color} size="sm" />
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onOpenProfile?.(c.author_id)} className="text-sm font-medium hover:underline">{author?.name}</button>
                      <span className="text-[11px] text-muted-foreground">{formatTimeAgo(c.created_at)}</span>
                      {canEdit && <button onClick={() => { setEditingComment(c.id); setEditBody(c.body); }} className="text-muted-foreground hover:text-foreground ml-auto"><PencilSimple size={13} /></button>}
                      {canDelete && <button onClick={() => setConfirmDelete(c.id)} className="text-muted-foreground hover:text-red-600"><Trash size={13} /></button>}
                    </div>
                    {editingComment === c.id ? (
                      <div className="flex gap-2 mt-1">
                        <input value={editBody} onChange={e => setEditBody(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") setConfirmEdit(c.id); }}
                          className="flex-1 rounded-lg border border-stroke bg-secondary px-3 py-1.5 text-sm focus:outline-none" />
                        <button onClick={() => setConfirmEdit(c.id)} className="rounded-full bg-foreground px-3 py-1.5 text-xs text-background font-medium">Save</button>
                        <button onClick={() => { setEditingComment(null); setEditBody(""); }} className="text-xs text-muted-foreground">Cancel</button>
                      </div>
                    ) : <p className="text-sm text-foreground/90 leading-relaxed mt-0.5">{c.body}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-4">
            <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
            <div className="flex-1 flex gap-2">
              <input value={newComment} onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmitComment()}
                placeholder="Write a comment..."
                className="flex-1 rounded-full border border-stroke bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none" />
              <button onClick={handleSubmitComment} disabled={!newComment.trim()}
                className="rounded-full bg-foreground px-3 py-2 text-background hover:bg-foreground/90 disabled:opacity-40 transition-colors">
                <PaperPlaneRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog open={!!confirmDelete} title="Delete Message" message="Delete this message? This cannot be undone."
        confirmLabel="Delete" destructive onConfirm={() => confirmDelete && handleDeleteComment(confirmDelete)} onCancel={() => setConfirmDelete(null)} />
      <ConfirmDialog open={!!confirmEdit} title="Save Changes" message="Save changes to this message?"
        confirmLabel="Confirm" onConfirm={() => confirmEdit && handleEditComment(confirmEdit)} onCancel={() => setConfirmEdit(null)} />
      <ConfirmDialog open={!!confirmDeleteSubtask} title="Delete Subtask" message="Delete this subtask? This cannot be undone."
        confirmLabel="Delete" destructive onConfirm={() => confirmDeleteSubtask && deleteSubtask(confirmDeleteSubtask)} onCancel={() => setConfirmDeleteSubtask(null)} />
    </>
  );
}
