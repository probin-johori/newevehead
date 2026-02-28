import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { FeatureLockBanner } from "@/components/FeatureLockBanner";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function BudgetPage() {
  const { events, departments, reimbursements, isFreePlan, getProfile } = useMockData();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isFreePlan) {
    return <><TopBar title="Budget" /><div className="p-6"><FeatureLockBanner /></div></>;
  }

  const totalBudget = events.reduce((s, e) => s + e.estimated_budget, 0);
  const totalApproved = reimbursements.filter(r => r.status === "ca-approved" || r.pay_status === "paid").reduce((s, r) => s + r.amount, 0);
  const totalPaid = reimbursements.filter(r => r.pay_status === "paid").reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <TopBar title="Budget" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Estimated Budget", value: `₹${totalBudget.toLocaleString()}` },
            { label: "Total Approved Spend", value: `₹${totalApproved.toLocaleString()}` },
            { label: "Total Paid Out", value: `₹${totalPaid.toLocaleString()}` },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-serif mt-1">{k.value}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">Click any event to see department breakdown</p>

        <div className="space-y-2">
          {events.map(ev => {
            const evDepts = departments.filter(d => d.event_id === ev.id);
            const evReimbs = reimbursements.filter(r => r.event_id === ev.id);
            const approved = evReimbs.filter(r => r.status === "ca-approved" || r.pay_status === "paid").reduce((s, r) => s + r.amount, 0);
            const paid = evReimbs.filter(r => r.pay_status === "paid").reduce((s, r) => s + r.amount, 0);
            const pending = evReimbs.filter(r => r.status === "pending" || r.status === "dept-approved").reduce((s, r) => s + r.amount, 0);
            const pct = ev.estimated_budget > 0 ? (approved / ev.estimated_budget) * 100 : 0;
            const isOpen = expanded === ev.id;

            return (
              <div key={ev.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : ev.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-serif text-lg">{ev.name}</span>
                    <StatusBadge status={ev.status} />
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right"><span className="text-muted-foreground text-xs">Budget</span><p className="font-medium">₹{ev.estimated_budget.toLocaleString()}</p></div>
                    <div className="text-right"><span className="text-muted-foreground text-xs">Approved</span><p className="font-medium">₹{approved.toLocaleString()}</p></div>
                    <div className="text-right"><span className="text-muted-foreground text-xs">Paid</span><p className="font-medium">₹{paid.toLocaleString()}</p></div>
                    <div className="w-24"><ProgressBar value={approved} max={ev.estimated_budget} /><p className="text-[10px] text-muted-foreground mt-0.5">{pct.toFixed(0)}%</p></div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-secondary/50 text-left">
                        <th className="px-5 py-2.5 font-medium">Department</th>
                        <th className="px-5 py-2.5 font-medium">Head</th>
                        <th className="px-5 py-2.5 font-medium">Allocated</th>
                        <th className="px-5 py-2.5 font-medium">Approved</th>
                        <th className="px-5 py-2.5 font-medium">Paid</th>
                        <th className="px-5 py-2.5 font-medium">Utilisation</th>
                      </tr></thead>
                      <tbody>
                        {evDepts.map(d => {
                          const dReimbs = evReimbs.filter(r => r.dept_id === d.id);
                          const dApproved = dReimbs.filter(r => r.status === "ca-approved" || r.pay_status === "paid").reduce((s, r) => s + r.amount, 0);
                          const dPaid = dReimbs.filter(r => r.pay_status === "paid").reduce((s, r) => s + r.amount, 0);
                          const dPct = d.allocated_budget > 0 ? (dApproved / d.allocated_budget) * 100 : 0;
                          const head = getProfile(d.head_id);
                          const overBudget = dPct > 100;
                          return (
                            <tr key={d.id} className="border-t border-border/50">
                              <td className="px-5 py-3 font-medium">{d.name}</td>
                              <td className="px-5 py-3">{head && <div className="flex items-center gap-1.5"><UserAvatar name={head.name} color={head.avatar_color} size="sm" />{head.name}</div>}</td>
                              <td className="px-5 py-3">₹{d.allocated_budget.toLocaleString()}</td>
                              <td className={`px-5 py-3 ${overBudget ? "text-destructive font-medium" : ""}`}>₹{dApproved.toLocaleString()}</td>
                              <td className="px-5 py-3">₹{dPaid.toLocaleString()}</td>
                              <td className="px-5 py-3"><div className="w-20"><ProgressBar value={dApproved} max={d.allocated_budget} /><span className="text-[10px] text-muted-foreground">{dPct.toFixed(0)}%</span></div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
