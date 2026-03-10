import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMockData, formatINR } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { FileText, CaretRight, X, Plus, Check } from "@phosphor-icons/react";

export default function BillingPage() {
  const { bills, events, getProfile, getDepartment, getEvent, currentUser, isFreePlan } = useMockData();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [selectedBill, setSelectedBill] = useState<string | null>(null);

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
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (eventFilter !== "all" && b.event_id !== eventFilter) return false;
    return true;
  });

  const settledTotal = bills.filter(b => b.status === "settled").reduce((s, b) => s + b.amount, 0);
  const pendingTotal = bills.filter(b => b.status === "pending" || b.status === "dept-verified" || b.status === "ca-approved").reduce((s, b) => s + b.amount, 0);
  const advanceTotal = bills.reduce((s, b) => s + b.advance_amount, 0);

  const bill = selectedBill ? bills.find(b => b.id === selectedBill) : null;

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Billing</h1>
          <p className="text-sm text-muted-foreground">{bills.length} bills</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
          <Plus size={14} /> Add Billing Item
        </button>
      </div>

      <div className="grid grid-cols-3 gap-0 border border-stroke rounded-xl overflow-hidden mb-5">
        {[
          { label: "Total Settled", value: formatINR(settledTotal) },
          { label: "Pending Amount", value: formatINR(pendingTotal) },
          { label: "Advances Given", value: formatINR(advanceTotal) },
        ].map((stat, i) => (
          <div key={i} className={`p-5 ${i < 2 ? "border-r border-stroke" : ""}`}>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-semibold mt-1 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

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
          <option value="dept-verified">Dept Verified</option>
          <option value="ca-approved">CA Approved</option>
          <option value="settled">Settled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Billing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(b => {
          const dept = getDepartment(b.dept_id);
          const ev = getEvent(b.event_id);
          const submitter = getProfile(b.submitted_by);
          return (
            <div key={b.id} onClick={() => setSelectedBill(b.id)} className="rounded-xl border border-stroke p-5 hover:bg-selected/50 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{b.vendor_name}</h4>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{ev?.name}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{dept?.name}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
                <p className="text-lg font-semibold tabular-nums">{formatINR(b.amount)}</p>
              </div>
              {/* Approve/Reject */}
              {(b.status === "pending" || b.status === "dept-verified") && (currentUser.role === "sa" || currentUser.role === "dept_head") && (
                <div className="flex gap-2 pt-3 border-t border-stroke">
                  <button className="rounded-full bg-emerald-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-700 transition-colors" onClick={e => e.stopPropagation()}>
                    <Check size={12} weight="bold" className="inline mr-1" />Approve
                  </button>
                  <button className="rounded-full bg-red-50 text-red-600 px-3 py-1.5 text-xs font-medium hover:bg-red-100 transition-colors" onClick={e => e.stopPropagation()}>
                    <X size={12} weight="bold" className="inline mr-1" />Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="text-3xl mb-3">💳</span>
          <p className="text-sm text-muted-foreground">No bills match your filters.</p>
        </div>
      )}

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
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Amount</p><p className="font-semibold text-lg">{formatINR(bill.amount)}</p></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Advance</p><p className="font-semibold text-lg">{formatINR(bill.advance_amount)}</p></div>
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
          </div>
        </>
      )}
    </div>
  );
}
