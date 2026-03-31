import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMockData, formatINRShort, formatDate, formatTimeAgo } from "@/context/MockDataContext";
import type { Bill, BillStatus } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useScrollLock } from "@/hooks/useScrollLock";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FileText, X, Plus, Check, Download, Trash, PencilSimple, PaperPlaneRight } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";

const BILL_STATUSES: { key: string; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "settled", label: "Paid" },
  { key: "on-hold", label: "On Hold" },
  { key: "rejected", label: "Rejected" },
];

export default function BillingPage() {
  const { bills, events, getProfile, getDepartment, getEvent, currentUser, isFreePlan, setBills, departments, profiles, billEditLogs, setBillEditLogs, taskComments, setTaskComments, addBill: dbAddBill, updateBill: dbUpdateBill, deleteBill: dbDeleteBill, addComment: dbAddComment } = useMockData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [eventFilter, setEventFilter] = useState(searchParams.get("event") || "all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailTab, setDetailTab] = useState<"details" | "discussion" | "history">("details");

  // Add billing form state
  const [addForm, setAddForm] = useState({
    description: "", vendor_name: "", amount: "", category: "",
    event_id: "", dept_id: "", due_date: "", status: "pending", notes: "", invoice_file: null as File | null,
  });

  // Discussion state
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [confirmDeleteComment, setConfirmDeleteComment] = useState<string | null>(null);
  const [confirmEditComment, setConfirmEditComment] = useState<string | null>(null);

  useScrollLock(!!selectedBill || showAddModal);

  useEffect(() => {
    const s = searchParams.get("status");
    const e = searchParams.get("event");
    if (s) setStatusFilter(s);
    if (e) setEventFilter(e);
  }, [searchParams]);

  useEffect(() => {
    if (selectedBill) setDetailTab("details");
  }, [selectedBill]);

  if (isFreePlan) {
    return (
      <div className="p-6 w-full">
        <h1 className="text-xl font-semibold mb-1">Billing</h1>
        <div className="mt-8 rounded-xl border border-stroke p-8 text-center">
          <p className="text-sm text-muted-foreground">This feature is not available on your current plan. Upgrade to Pro to unlock.</p>
        </div>
      </div>
    );
  }

  const filtered = bills.filter(b => {
    if (statusFilter !== "all") {
      if (statusFilter === "pending" && !["pending", "dept-verified", "ca-approved"].includes(b.status)) return false;
      if (statusFilter === "settled" && b.status !== "settled") return false;
      if (statusFilter === "rejected" && b.status !== "rejected") return false;
      if (statusFilter === "on-hold" && (b as any).status !== "on-hold") return false;
    }
    if (eventFilter !== "all" && b.event_id !== eventFilter) return false;
    if (categoryFilter !== "all" && b.category !== categoryFilter) return false;
    return true;
  });

  const totalBudget = events.reduce((s, e) => s + e.estimated_budget, 0);
  const totalSpent = bills.filter(b => b.status === "settled").reduce((s, b) => s + b.amount, 0);
  const pendingTotal = bills.filter(b => ["pending", "dept-verified", "ca-approved"].includes(b.status)).reduce((s, b) => s + b.amount, 0);
  const overdueTotal = bills.filter(b => b.due_date && new Date(b.due_date) < new Date() && b.status !== "settled" && b.status !== "rejected").reduce((s, b) => s + b.amount, 0);
  const categories = Array.from(new Set(bills.map(b => b.category).filter(Boolean)));

  const bill = selectedBill ? bills.find(b => b.id === selectedBill) : null;

  // Use taskComments as a shared comment store (bill comments use bill ID as task_id)
  const billComments = bill ? taskComments.filter(c => c.task_id === `bill_${bill.id}`) : [];

  const handleMarkPaid = async (billId: string) => {
    await dbUpdateBill(billId, { status: "settled" as BillStatus, settled_by: currentUser.id, settled_at: new Date().toISOString(), paid_date: new Date().toISOString().split("T")[0] });
    toast({ title: "Marked as Paid" });
  };

  const handleReject = async (billId: string) => {
    await dbUpdateBill(billId, { status: "rejected" as BillStatus });
    toast({ title: "Bill rejected" });
  };

  const handleOnHold = async (billId: string) => {
    await dbUpdateBill(billId, { status: "on-hold" as any });
    toast({ title: "Bill put on hold" });
  };

  const handleDelete = async (billId: string) => {
    await dbDeleteBill(billId);
    setConfirmDelete(null);
    setSelectedBill(null);
    toast({ title: "Bill deleted" });
  };

  const handleAddBill = async () => {
    if (!addForm.description.trim() || !addForm.vendor_name.trim()) {
      toast({ title: "Description and vendor are required", variant: "destructive" });
      return;
    }
    if (!addForm.invoice_file) {
      toast({ title: "Invoice attachment is mandatory", variant: "destructive" });
      return;
    }
    if (!addForm.dept_id) {
      toast({ title: "Department is required", variant: "destructive" });
      return;
    }
    await dbAddBill({
      event_id: addForm.event_id || events[0]?.id || "",
      dept_id: addForm.dept_id,
      vendor_name: addForm.vendor_name,
      description: addForm.description,
      amount: parseFloat(addForm.amount) || 0,
      status: addForm.status as BillStatus,
      submitted_by: currentUser.id,
      category: addForm.category || undefined,
      due_date: addForm.due_date || undefined,
      invoice_file: addForm.invoice_file?.name,
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    });
    setShowAddModal(false);
    setAddForm({ description: "", vendor_name: "", amount: "", category: "", event_id: "", dept_id: "", due_date: "", status: "pending", notes: "", invoice_file: null });
    toast({ title: "Billing item added" });
  };

  // Discussion handlers
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !bill) return;
    await dbAddComment({
      task_id: `bill_${bill.id}`,
      author_id: currentUser.id,
      body: newComment.trim(),
    });
    setNewComment("");
  };

  const handleDeleteComment = (commentId: string) => {
    setTaskComments(taskComments.filter(c => c.id !== commentId));
    setConfirmDeleteComment(null);
    toast({ title: "Comment deleted" });
  };

  const handleEditComment = (commentId: string) => {
    if (!editBody.trim()) return;
    setTaskComments(taskComments.map(c => c.id === commentId ? { ...c, body: editBody.trim() } : c));
    setEditingComment(null);
    setEditBody("");
    setConfirmEditComment(null);
    toast({ title: "Comment updated" });
  };

  const exportCSV = () => {
    const headers = ["#", "Item", "Vendor", "Category", "Amount", "Status", "Due Date", "Paid Date"];
    const rows = filtered.map((b, i) => [i + 1, b.description, b.vendor_name, b.category || "", b.amount, b.status, b.due_date || "", b.paid_date || ""]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "billing_export.csv";
    a.click();
    toast({ title: "CSV exported" });
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Billing</h1>
          <p className="text-sm text-muted-foreground">{bills.length} items</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
            <Plus size={14} /> Add Billing Item
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-0 border border-stroke rounded-xl overflow-hidden mb-5">
        {[
          { label: "Total Budget", value: formatINRShort(totalBudget) },
          { label: "Total Spent", value: formatINRShort(totalSpent) },
          { label: "Pending", value: formatINRShort(pendingTotal) },
          { label: "Overdue", value: formatINRShort(overdueTotal) },
        ].map((stat, i) => (
          <div key={i} className={`p-5 ${i < 3 ? "border-r border-stroke" : ""}`}>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-semibold mt-1 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
          className="rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm pr-8 focus:outline-none">
          <option value="all">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm pr-8 focus:outline-none">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="settled">Paid</option>
          <option value="on-hold">On Hold</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-full border border-stroke bg-secondary px-3 py-1.5 text-sm pr-8 focus:outline-none">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Billing Table */}
      <div className="rounded-xl border border-stroke overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-stroke">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-10">#</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[28%]">Item / Description</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[14%]">Vendor</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[10%]">Category</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[10%]">Amount</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[10%]">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[10%]">Due Date</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[10%]">Paid Date</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[8%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, idx) => {
              const ev = getEvent(b.event_id);
              const overdue = b.due_date && new Date(b.due_date) < new Date() && b.status !== "settled" && b.status !== "rejected";
              return (
                <tr key={b.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors cursor-pointer"
                  onClick={() => setSelectedBill(b.id)}>
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium truncate">{b.description}</p>
                    <p className="text-xs text-muted-foreground truncate">{ev?.name}</p>
                  </td>
                  <td className="px-4 py-3 truncate">{b.vendor_name}</td>
                  <td className="px-4 py-3">
                    {b.category && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{b.category}</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{formatINRShort(b.amount)}</td>
                  <td className="px-4 py-3">
                    {overdue ? <StatusBadge status="overdue" /> : <StatusBadge status={b.status} />}
                  </td>
                  <td className={`px-4 py-3 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{b.due_date ? formatDate(b.due_date) : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.paid_date ? formatDate(b.paid_date) : "—"}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      {b.status !== "settled" && b.status !== "rejected" && (
                        <button onClick={() => handleMarkPaid(b.id)} className="rounded-full bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-medium hover:bg-emerald-700" title="Mark as Paid">✓</button>
                      )}
                      <button onClick={() => setConfirmDelete(b.id)} className="text-muted-foreground hover:text-red-600 transition-colors" title="Delete"><Trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-3xl mb-3">💳</span>
            <p className="text-sm font-medium mb-1">No billing items found</p>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or add a new item.</p>
            <button onClick={() => setShowAddModal(true)} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
              <Plus size={14} className="inline mr-1" /> Add Billing Item
            </button>
          </div>
        )}
      </div>

      {/* Bill Detail Drawer with Tabs */}
      {bill && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedBill(null)} />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-card border-l border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
            onKeyDown={e => e.key === "Escape" && setSelectedBill(null)}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{bill.vendor_name}</h3>
                <button onClick={() => setSelectedBill(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <p className="text-sm text-muted-foreground">{bill.description}</p>

              {/* Tabs */}
              <div className="flex gap-0 border-b border-stroke">
                {(["details", "discussion", "history"] as const).map(t => (
                  <button key={t} onClick={() => setDetailTab(t)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${detailTab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {t === "details" ? "Details" : t === "discussion" ? `Discussion (${billComments.length})` : "History"}
                  </button>
                ))}
              </div>

              {/* Details Tab */}
              {detailTab === "details" && (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Amount</p><p className="font-semibold text-lg">{formatINRShort(bill.amount)}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Advance</p><p className="font-semibold text-lg">{formatINRShort(bill.advance_amount)}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status</p><StatusBadge status={bill.status} /></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Event</p><button onClick={() => { setSelectedBill(null); navigate(`/events/${bill.event_id}`); }} className="text-sm hover:text-accent">{getEvent(bill.event_id)?.name}</button></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Department</p><p>{getDepartment(bill.dept_id)?.name}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Invoice</p><p>{bill.invoice_number}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Submitted</p><p>{new Date(bill.submitted_at).toLocaleDateString()}</p></div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Submitted By</p>
                      {(() => { const s = getProfile(bill.submitted_by); return s ? <div className="flex items-center gap-1.5"><UserAvatar name={s.name} color={s.avatar_color} size="sm" /><span>{s.name}</span></div> : null; })()}
                    </div>
                  </div>
                  {/* Invoice/Attachment section */}
                  {(bill.invoice_files && bill.invoice_files.length > 0) || bill.invoice_file || bill.bill_file_url ? (
                    <div className="border-t border-stroke pt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Attachments</p>
                      <div className="space-y-2">
                        {bill.invoice_files && bill.invoice_files.length > 0 && bill.invoice_files.map((f, i) => (
                          <a key={i} href={f} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-accent hover:underline">
                            <FileText size={14} /> {f.split('/').pop() || `Attachment ${i + 1}`}
                          </a>
                        ))}
                        {bill.invoice_file && !bill.invoice_files?.includes(bill.invoice_file) && (
                          <div className="flex items-center gap-2 text-sm text-accent">
                            <FileText size={14} /> {bill.invoice_file}
                          </div>
                        )}
                        {bill.bill_file_url && !bill.invoice_files?.includes(bill.bill_file_url) && (
                          <a href={bill.bill_file_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-accent hover:underline">
                            <FileText size={14} /> {bill.bill_file_url.split('/').pop() || 'View file'}
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-stroke pt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Attachments</p>
                      <p className="text-sm text-muted-foreground">No attachments</p>
                    </div>
                  )}
                  <div className="flex gap-2 border-t border-stroke pt-3">
                    {bill.status !== "settled" && bill.status !== "rejected" && (
                      <>
                        <button onClick={() => { handleMarkPaid(bill.id); setSelectedBill(null); }}
                          className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700">Mark as Paid</button>
                        <button onClick={() => { handleOnHold(bill.id); }}
                          className="rounded-full bg-secondary text-foreground px-4 py-2 text-sm font-medium hover:bg-selected">On Hold</button>
                        <button onClick={() => { handleReject(bill.id); setSelectedBill(null); }}
                          className="rounded-full bg-red-50 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-100">Reject</button>
                      </>
                    )}
                    <button onClick={() => setConfirmDelete(bill.id)}
                      className="rounded-full bg-red-50 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-100 ml-auto">Delete</button>
                  </div>
                </>
              )}

              {/* Discussion Tab */}
              {detailTab === "discussion" && (
                <div className="space-y-4">
                  {billComments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Start the discussion.</p>}
                  {billComments.map(c => {
                    const author = getProfile(c.author_id);
                    const canEdit = c.author_id === currentUser.id;
                    const canDelete = c.author_id === currentUser.id || currentUser.role === "sa";
                    return (
                      <div key={c.id} className="flex gap-3">
                        {author && <UserAvatar name={author.name} color={author.avatar_color} size="sm" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{author?.name}</span>
                            <span className="text-[11px] text-muted-foreground">{formatTimeAgo(c.created_at)}</span>
                            {canEdit && <button onClick={() => { setEditingComment(c.id); setEditBody(c.body); }} className="text-muted-foreground hover:text-foreground ml-auto"><PencilSimple size={13} /></button>}
                            {canDelete && <button onClick={() => setConfirmDeleteComment(c.id)} className="text-muted-foreground hover:text-red-600"><Trash size={13} /></button>}
                          </div>
                          {editingComment === c.id ? (
                            <div className="flex gap-2 mt-1">
                              <input value={editBody} onChange={e => setEditBody(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") setConfirmEditComment(c.id); }}
                                className="flex-1 rounded-lg border border-stroke bg-secondary px-3 py-1.5 text-sm focus:outline-none" />
                              <button onClick={() => setConfirmEditComment(c.id)} className="rounded-full bg-foreground px-3 py-1.5 text-xs text-background font-medium">Save</button>
                              <button onClick={() => { setEditingComment(null); setEditBody(""); }} className="text-xs text-muted-foreground">Cancel</button>
                            </div>
                          ) : <p className="text-sm text-foreground/90 leading-relaxed mt-0.5">{c.body}</p>}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-3 pt-2 border-t border-stroke">
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
              )}

              {/* History Tab */}
              {detailTab === "history" && (
                <div className="space-y-3">
                  {billEditLogs.filter(l => l.bill_id === bill.id).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No edit history.</p>
                  )}
                  {billEditLogs.filter(l => l.bill_id === bill.id).map(log => {
                    const user = getProfile(log.user_id);
                    return (
                      <div key={log.id} className="flex items-start gap-3 text-sm">
                        {user && <UserAvatar name={user.name} color={user.avatar_color} size="sm" />}
                        <div>
                          <p><span className="font-medium">{user?.name}</span> changed <span className="font-medium">{log.field}</span> from <span className="text-muted-foreground">{log.old_value}</span> → <span className="font-medium">{log.new_value}</span></p>
                          <p className="text-[11px] text-muted-foreground">{formatTimeAgo(log.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Billing Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-card border border-stroke p-6 shadow-[0_8px_40px_rgba(0,0,0,0.15)] space-y-4 max-h-[90vh] overflow-y-auto"
              onKeyDown={e => e.key === "Escape" && setShowAddModal(false)}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Billing Item</h3>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Description <span className="text-destructive">*</span></label>
                  <input value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground" placeholder="Item description" />
                </div>
                <div>
                  <label className="text-sm font-medium">Vendor <span className="text-destructive">*</span></label>
                  <input value={addForm.vendor_name} onChange={e => setAddForm(p => ({ ...p, vendor_name: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground" placeholder="Vendor name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount (₹) <span className="text-destructive">*</span></label>
                  <input type="number" value={addForm.amount} onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <input value={addForm.category} onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground" placeholder="e.g. Equipment" />
                </div>
                <div>
                  <label className="text-sm font-medium">Event <span className="text-destructive">*</span></label>
                  <select value={addForm.event_id} onChange={e => setAddForm(p => ({ ...p, event_id: e.target.value, dept_id: "" }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground">
                    <option value="">Select event</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Department <span className="text-destructive">*</span></label>
                  <select value={addForm.dept_id} onChange={e => setAddForm(p => ({ ...p, dept_id: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground">
                    <option value="">Select department</option>
                    {departments.filter(d => !addForm.event_id || d.event_id === addForm.event_id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <input type="date" value={addForm.due_date} onChange={e => setAddForm(p => ({ ...p, due_date: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground" />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select value={addForm.status} onChange={e => setAddForm(p => ({ ...p, status: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground">
                    {BILL_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Invoice Attachment <span className="text-destructive">*</span></label>
                  <label className="mt-1 flex items-center justify-center w-full h-20 border-2 border-dashed border-stroke rounded-lg bg-secondary hover:bg-selected transition-colors cursor-pointer">
                    <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden"
                      onChange={e => setAddForm(p => ({ ...p, invoice_file: e.target.files?.[0] || null }))} />
                    {addForm.invoice_file ? (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText size={16} className="text-accent" />
                        <span className="font-medium">{addForm.invoice_file.name}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click to upload invoice (required)</p>
                    )}
                  </label>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea value={addForm.notes} onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground" rows={2} placeholder="Additional notes" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddModal(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                <button onClick={handleAddBill}
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Save</button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog open={!!confirmDelete} title="Delete Bill" message="Delete this billing item? This cannot be undone."
        confirmLabel="Delete" destructive onConfirm={() => confirmDelete && handleDelete(confirmDelete)} onCancel={() => setConfirmDelete(null)} />
      <ConfirmDialog open={!!confirmDeleteComment} title="Delete Comment" message="Delete this comment? This cannot be undone."
        confirmLabel="Delete" destructive onConfirm={() => confirmDeleteComment && handleDeleteComment(confirmDeleteComment)} onCancel={() => setConfirmDeleteComment(null)} />
      <ConfirmDialog open={!!confirmEditComment} title="Save Changes" message="Save changes to this comment?"
        confirmLabel="Confirm" onConfirm={() => confirmEditComment && handleEditComment(confirmEditComment)} onCancel={() => setConfirmEditComment(null)} />
    </div>
  );
}
