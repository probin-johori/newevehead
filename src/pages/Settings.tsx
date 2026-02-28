import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Check, X } from "@phosphor-icons/react";

const planDetails = [
  { plan: "free", name: "Free", price: "₹0/mo", slots: "1 event slot", features: ["1 active event", "Basic task management", "Team collaboration"], locked: ["Billing", "Budget details", "Document Vault", "Analytics"] },
  { plan: "pro", name: "Pro", price: "₹10,000/mo", slots: "4 event slots", features: ["4 active events", "Full task management", "Billing & verification flow", "Budget tracking", "Document Vault", "Analytics dashboard"], locked: [] },
  { plan: "business", name: "Business", price: "₹25,000/mo", slots: "12 event slots", features: ["12 active events", "Everything in Pro", "Priority support", "Custom branding"], locked: [] },
];

const roleLabels: Record<string, string> = {
  sa: "Super Admin", org: "Organiser", dept_head: "Dept Head", dept_member: "Member",
};

export default function SettingsPage() {
  const { currentUser, subscription, events } = useMockData();
  const navigate = useNavigate();
  const [tab, setTab] = useState(currentUser.role === "sa" ? "subscription" : "profile");

  const tabs = [
    ...(currentUser.role === "sa" ? [{ key: "subscription", label: "Subscription & Plans" }] : []),
    { key: "profile", label: "My Profile" },
  ];

  return (
    <>
      <TopBar title="Settings" subtitle="Manage your account." />
      <div className="flex">
        {/* Vertical nav */}
        <div className="w-48 shrink-0 border-r border-border p-4 space-y-1 min-h-[calc(100vh-52px)]">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                tab === t.key ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 max-w-[760px]">
          {tab === "subscription" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold mb-1">Subscription & Plans</h2>
                <p className="text-sm text-muted-foreground">Manage your plan and event slots.</p>
              </div>

              {/* Current plan */}
              <div className="rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <p className="text-lg font-semibold capitalize">{subscription.plan}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{subscription.slots_used} / {subscription.slots_total} slots used</p>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent-mid transition-all" style={{ width: `${(subscription.slots_used / subscription.slots_total) * 100}%` }} />
                </div>
              </div>

              {/* Plans */}
              <div className="grid grid-cols-3 gap-4">
                {planDetails.map(p => (
                  <div key={p.plan} className={`rounded-xl border p-5 ${subscription.plan === p.plan ? "border-foreground/30 bg-accent-light" : "border-border"}`}>
                    <p className="text-base font-semibold">{p.name}</p>
                    <p className="text-lg font-semibold mt-1">{p.price}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.slots}</p>
                    <div className="mt-4 space-y-1.5">
                      {p.features.map(f => (
                        <div key={f} className="flex items-center gap-1.5 text-sm"><Check size={13} weight="bold" className="text-success" />{f}</div>
                      ))}
                      {p.locked.map(f => (
                        <div key={f} className="flex items-center gap-1.5 text-sm text-muted-foreground"><X size={13} />{f}</div>
                      ))}
                    </div>
                    <button className={`mt-4 w-full rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                      subscription.plan === p.plan ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-muted"
                    }`}>
                      {subscription.plan === p.plan ? "Current Plan" : "Upgrade"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Slot Usage */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold">Event Slot Usage</h3>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                        <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Slot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(ev => (
                        <tr key={ev.id} className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/events/${ev.id}`)}>
                          <td className="px-4 py-3 font-medium">{ev.name}</td>
                          <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                          <td className="px-4 py-3"><span className="rounded-full bg-accent-light text-accent-mid px-2 py-0.5 text-[11px] font-medium">Occupied</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">Completing or archiving an event does not free the slot. Slots reset on billing cycle.</p>
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold mb-1">My Profile</h2>
                <p className="text-sm text-muted-foreground">Update your personal information.</p>
              </div>
              <div className="max-w-md space-y-4">
                <div className="flex items-center gap-4">
                  <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="lg" />
                  <div>
                    <p className="font-semibold">{currentUser.name}</p>
                    <p className="text-sm text-muted-foreground">{roleLabels[currentUser.role]}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input defaultValue={currentUser.name} className="mt-1 block w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input defaultValue={currentUser.email} className="mt-1 block w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <input value={roleLabels[currentUser.role]} disabled className="mt-1 block w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
                </div>
                <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
