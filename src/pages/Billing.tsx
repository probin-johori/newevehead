import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMockData, formatINRShort, formatDate } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useScrollLock } from "@/hooks/useScrollLock";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FileText, X, Plus, Check, Download, Trash, PencilSimple } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";

const billStatusMap: Record<string, string> = {
  pending: "pending",
  "dept-verified": "pending",
  "ca-approved": "pending",
  settled: "paid",
  rejected: "rejected",
};

export default function BillingPage() {
  const { bills, events, getProfile, getDepartment, getEvent, currentUser, isFreePlan, setBills } = useMockData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [eventFilter, setEventFilter] = useState(searchParams.get("event") || "all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useScrollLock(!!selectedBill || showAddModal);

  useEffect(() => {
    const s = searchParams.get("status");
    const e = searchParams.get("event");
    if (s) setStatusFilter(s);
    if (e) setEventFilter(e);
  }, [searchParams]);

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

  const handleMarkPaid = (billId: string) => {
    setBills(bills.map(b => b.id === billId ? { ...b, status: "settled" as const, settled_by: currentUser.id, settled_at: new Date().toISOString(), paid_date: new Date().toISOString().split("T")[0] } : b));
    toast({ title: "Marked as Paid" });
  };

  const handleReject = (billId: string) => {
    setBills(bills.map(b => b.id === billId ? { ...b, status: "rejected" as const } : b));
    toast({ title: "Bill rejected" });
  };

  const handleDelete = (billId: string) => {
    setBills(bills.filter(b => b.id !== billId));
    setConfirmDelete(null);
    setSelectedBill(null);
    toast({ title: "Bill deleted" });
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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-10">#</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Item / Description</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due Date</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Paid Date</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
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
                    <p className="font-medium">{b.description}</p>
                    <p className="text-xs text-muted-foreground">{ev?.name}</p>
                  </td>
                  <td className="px-4 py-3">{b.vendor_name}</td>
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
            <p className="text-sm text-muted-foreground">No bills match your filters.</p>
          </div>
        )}
      </div>

      {/* Bill Detail Drawer */}
      {bill && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedBill(null)} />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-card border-l border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{bill.vendor_name}</h3>
              <button onClick={() => setSelectedBill(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground">{bill.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm border-t border-stroke pt-4">
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
            {bill.bill_file_url && (
              <div className="flex items-center gap-1.5 text-sm text-accent cursor-pointer hover:underline border-t border-stroke pt-3">
                <FileText size={14} /> {bill.bill_file_url}
              </div>
            )}
            <div className="flex gap-2 border-t border-stroke pt-3">
              {bill.status !== "settled" && bill.status !== "rejected" && (
                <button onClick={() => { handleMarkPaid(bill.id); setSelectedBill(null); }}
                  className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700">Mark as Paid</button>
              )}
              <button onClick={() => setConfirmDelete(bill.id)}
                className="rounded-full bg-red-50 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-100">Delete</button>
            </div>
          </div>
        </>
      )}

      {/* Add Billing Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-card border border-stroke p-6 shadow-[0_8px_40px_rgba(0,0,0,0.15)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Billing Item</h3>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <input className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="Item description" />
                </div>
                <div>
                  <label className="text-sm font-medium">Vendor</label>
                  <input className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="Vendor name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount (₹)</label>
                  <input type="number" className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <input className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="e.g. Equipment" />
                </div>
                <div>
                  <label className="text-sm font-medium">Event</label>
                  <select className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none">
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <input type="date" className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none">
                    <option value="pending">Pending</option>
                    <option value="settled">Paid</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddModal(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                <button onClick={() => { setShowAddModal(false); toast({ title: "Billing item added" }); }}
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Save</button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog open={!!confirmDelete} title="Delete Bill" message="Delete this billing item? This cannot be undone."
        confirmLabel="Delete" destructive onConfirm={() => confirmDelete && handleDelete(confirmDelete)} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
