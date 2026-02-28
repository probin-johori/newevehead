import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { FeatureLockBanner } from "@/components/FeatureLockBanner";
import { FileText, CaretRight, X } from "@phosphor-icons/react";

export default function BillingPage() {
  const { bills, events, getProfile, getDepartment, getEvent, currentUser, isFreePlan } = useMockData();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [selectedBill, setSelectedBill] = useState<string | null>(null);

  if (isFreePlan) {
    return <><TopBar title="Billing" /><div className="p-6"><FeatureLockBanner /></div></>;
  }

  const filtered = bills.filter(b => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (eventFilter !== "all" && b.event_id !== eventFilter) return false;
    return true;
  });

  const settledTotal = bills.filter(b => b.status === "settled").reduce((s, b) => s + b.amount, 0);
  const pendingTotal = bills.filter(b => b.status === "pending" || b.status === "dept-verified").reduce((s, b) => s + b.amount, 0);
  const advanceTotal = bills.reduce((s, b) => s + b.advance_amount, 0);

  const bill = selectedBill ? bills.find(b => b.id === selectedBill) : null;

  return (
    <>
      <TopBar title="Billing" subtitle={`${bills.length} bills`} />
      <div className="p-6 max-w-[960px] space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Total Settled</p>
            <p className="text-xl font-semibold mt-1 tabular-nums">₹{settledTotal.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Amount</p>
            <p className="text-xl font-semibold mt-1 tabular-nums">₹{pendingTotal.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Advances Given</p>
            <p className="text-xl font-semibold mt-1 tabular-nums">₹{advanceTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm pr-8 focus:outline-none focus:border-foreground/30">
            <option value="all">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm pr-8 focus:outline-none focus:border-foreground/30">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="dept-verified">Dept Verified</option>
            <option value="settled">Settled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Submitted</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const dept = getDepartment(b.dept_id);
                const ev = getEvent(b.event_id);
                return (
                  <tr key={b.id} onClick={() => setSelectedBill(b.id)} className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{b.vendor_name}</td>
                    <td className="px-4 py-3 text-muted-foreground cursor-pointer hover:text-foreground" onClick={e => { e.stopPropagation(); navigate(`/events/${b.event_id}`); }}>{ev?.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dept?.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">₹{b.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">{b.bill_file_url && <span className="flex items-center gap-1 text-xs text-accent-mid"><FileText size={13} /> {b.invoice_number}</span>}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(b.submitted_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><CaretRight size={14} className="text-muted-foreground" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No bills match your filters.</p>
          )}
        </div>
      </div>

      {/* Bill Detail Modal */}
      {bill && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedBill(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{bill.vendor_name}</h3>
                <button onClick={() => setSelectedBill(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <p className="text-sm text-muted-foreground">{bill.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-border pt-4">
                <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Amount</p><p className="font-semibold text-lg">₹{bill.amount.toLocaleString()}</p></div>
                <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Advance</p><p className="font-semibold text-lg">₹{bill.advance_amount.toLocaleString()}</p></div>
                <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status</p><StatusBadge status={bill.status} /></div>
                <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Advance Status</p><StatusBadge status={bill.advance_status} /></div>
                <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Event</p><button onClick={() => { setSelectedBill(null); navigate(`/events/${bill.event_id}`); }} className="text-sm hover:text-accent-mid">{getEvent(bill.event_id)?.name}</button></div>
                <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Department</p><p>{getDepartment(bill.dept_id)?.name}</p></div>
                <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Invoice #</p><p>{bill.invoice_number}</p></div>
                <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Submitted By</p>{(() => { const s = getProfile(bill.submitted_by); return s ? <div className="flex items-center gap-1.5"><UserAvatar name={s.name} color={s.avatar_color} size="sm" /><span>{s.name}</span></div> : null; })()}</div>
                <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Submitted At</p><p>{new Date(bill.submitted_at).toLocaleDateString()}</p></div>
                {bill.dept_verified_at && <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Verified At</p><p>{new Date(bill.dept_verified_at).toLocaleDateString()}</p></div>}
                {bill.settled_at && <div><p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Settled At</p><p>{new Date(bill.settled_at).toLocaleDateString()}</p></div>}
              </div>
              {bill.bill_file_url && (
                <div className="flex items-center gap-1.5 text-sm text-accent-mid cursor-pointer hover:underline border-t border-border pt-3">
                  <FileText size={14} /> {bill.bill_file_url}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                {bill.status === "pending" && currentUser.role === "dept_head" && (
                  <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Verify</button>
                )}
                {bill.status === "dept-verified" && currentUser.role === "sa" && (
                  <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Settle</button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
