import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { FeatureLockBanner } from "@/components/FeatureLockBanner";
import { useState } from "react";

export default function ReimbursementsPage() {
  const { reimbursements, events, isFreePlan, getEvent, getDepartment, currentUser } = useMockData();
  const [eventFilter, setEventFilter] = useState("all");

  if (isFreePlan) {
    return <><TopBar title="Reimbursements" /><div className="p-6"><FeatureLockBanner /></div></>;
  }

  const filtered = eventFilter === "all" ? reimbursements : reimbursements.filter(r => r.event_id === eventFilter);
  const caTotal = reimbursements.filter(r => r.status === "ca-approved" || r.pay_status === "paid").reduce((s, r) => s + r.amount, 0);
  const paidTotal = reimbursements.filter(r => r.pay_status === "paid").reduce((s, r) => s + r.amount, 0);
  const pendingCount = reimbursements.filter(r => r.status === "pending" || r.status === "dept-approved").length;

  return (
    <>
      <TopBar title="Reimbursements" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "CA Approved Total", value: `₹${caTotal.toLocaleString()}` },
            { label: "Total Paid Out", value: `₹${paidTotal.toLocaleString()}` },
            { label: "Pending Count", value: pendingCount },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-serif mt-1">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm">
            <option value="all">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          {filtered.map(r => {
            const ev = getEvent(r.event_id);
            const dept = getDepartment(r.dept_id);
            const steps = [
              { label: "Submitted", done: true },
              { label: "Dept Head", done: ["dept-approved", "ca-approved"].includes(r.status) || r.pay_status === "paid" },
              { label: "CA Approved", done: r.status === "ca-approved" || r.pay_status === "paid" },
              { label: "Paid", done: r.pay_status === "paid" },
            ];
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{r.vendor_name}</p>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">{ev?.name}</span>
                      {dept && <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{dept.name}</span>}
                      <StatusBadge status={r.status} />
                      <StatusBadge status={r.pay_status} />
                    </div>
                  </div>
                  <p className="text-2xl font-serif">₹{r.amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 mt-4">
                  {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        s.done ? "bg-accent-light text-accent-mid" : "bg-secondary text-muted-foreground"
                      }`}>
                        <div className={`h-2 w-2 rounded-full ${s.done ? "bg-accent-mid" : "bg-muted-foreground/30"}`} />
                        {s.label}
                      </div>
                      {i < steps.length - 1 && <div className="h-px w-4 bg-border" />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
