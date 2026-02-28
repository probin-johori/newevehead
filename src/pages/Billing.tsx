import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { FeatureLockBanner } from "@/components/FeatureLockBanner";
import { FileText, ArrowRight } from "@phosphor-icons/react";

export default function BillingPage() {
  const { bills, events, getProfile, getDepartment, getEvent, currentUser, isFreePlan } = useMockData();
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

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

  return (
    <>
      <TopBar title="Billing" />
      <div className="p-6 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Total Settled</p>
            <p className="mt-1 text-3xl font-serif">₹{settledTotal.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Pending Amount</p>
            <p className="mt-1 text-3xl font-serif">₹{pendingTotal.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Advances Given</p>
            <p className="mt-1 text-3xl font-serif">₹{advanceTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* Flow Explainer */}
        <div className="rounded-xl border border-border bg-secondary/30 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">How billing works</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-primary text-primary-foreground px-2.5 py-1 font-medium">1</span>
            <span>Advance credited</span>
            <ArrowRight size={12} />
            <span className="rounded-full bg-primary text-primary-foreground px-2.5 py-1 font-medium">2</span>
            <span>Member pays vendor</span>
            <ArrowRight size={12} />
            <span className="rounded-full bg-primary text-primary-foreground px-2.5 py-1 font-medium">3</span>
            <span>Bill uploaded</span>
            <ArrowRight size={12} />
            <span className="rounded-full bg-primary text-primary-foreground px-2.5 py-1 font-medium">4</span>
            <span>Dept Head verifies</span>
            <ArrowRight size={12} />
            <span className="rounded-full bg-primary text-primary-foreground px-2.5 py-1 font-medium">5</span>
            <span>Finance settles</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm pr-8">
            <option value="all">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm pr-8">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="dept-verified">Dept Verified</option>
            <option value="settled">Settled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Bill Cards */}
        <div className="space-y-4">
          {filtered.map(b => {
            const dept = getDepartment(b.dept_id);
            const ev = getEvent(b.event_id);
            const submitter = getProfile(b.submitted_by);
            const steps = [
              { label: "Advance", done: b.advance_status !== "not-given" },
              { label: "Bill Uploaded", done: true },
              { label: "Dept Verified", done: b.status === "dept-verified" || b.status === "settled" },
              { label: "Finance Settled", done: b.status === "settled" },
            ];
            return (
              <div key={b.id} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-serif">{b.vendor_name}</h4>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{b.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {dept && <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px]">{dept.name}</span>}
                      {ev && <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px]">{ev.name}</span>}
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px]">INV: {b.invoice_number}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-serif">₹{b.amount.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground">Advance: ₹{b.advance_amount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Pipeline */}
                <div className="flex items-center gap-1 mb-4">
                  {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        s.done ? "bg-accent-light text-primary" : "bg-secondary text-muted-foreground"
                      }`}>
                        <div className={`h-2 w-2 rounded-full ${s.done ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        {s.label}
                      </div>
                      {i < steps.length - 1 && <div className="h-px w-3 bg-border" />}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    {submitter && <UserAvatar name={submitter.name} color={submitter.avatar_color} size="sm" />}
                    <div>
                      <p className="text-[11px] text-muted-foreground">Submitted by {submitter?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(b.submitted_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.bill_file_url && (
                      <span className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
                        <FileText size={14} /> {b.bill_file_url}
                      </span>
                    )}
                    {b.status === "pending" && currentUser.role === "dept_head" && (
                      <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">Verify</button>
                    )}
                    {b.status === "dept-verified" && currentUser.role === "sa" && (
                      <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">Settle</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No bills match your filters.</p>
          )}
        </div>
      </div>
    </>
  );
}
