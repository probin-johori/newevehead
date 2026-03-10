import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMockData, formatINR } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
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
    <div className="p-6 w-full">
      <h1 className="text-xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-5">Manage your account</p>

      <div className="flex gap-8">
        <div className="w-44 shrink-0 space-y-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                tab === t.key ? "bg-selected font-medium text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-selected"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {tab === "subscription" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-stroke p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <p className="text-lg font-semibold capitalize">{subscription.plan}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{subscription.slots_used} / {subscription.slots_total} slots used</p>
                </div>
                <div className="h-1.5 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(subscription.slots_used / subscription.slots_total) * 100}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {planDetails.map(p => (
                  <div key={p.plan} className={`rounded-xl border p-5 ${subscription.plan === p.plan ? "border-accent/30 bg-orange-50/20" : "border-stroke"}`}>
                    <p className="text-base font-semibold">{p.name}</p>
                    <p className="text-lg font-semibold mt-1">{p.price}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.slots}</p>
                    <div className="mt-4 space-y-1.5">
                      {p.features.map(f => (
                        <div key={f} className="flex items-center gap-1.5 text-sm"><Check size={13} weight="bold" className="text-emerald-500" />{f}</div>
                      ))}
                      {p.locked.map(f => (
                        <div key={f} className="flex items-center gap-1.5 text-sm text-muted-foreground"><X size={13} />{f}</div>
                      ))}
                    </div>
                    <button className={`mt-4 w-full rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                      subscription.plan === p.plan ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-selected"
                    }`}>
                      {subscription.plan === p.plan ? "Current Plan" : "Upgrade"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-semibold">Event Slot Usage</h3>
                <div className="rounded-xl border border-stroke overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stroke">
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Slot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(ev => (
                        <tr key={ev.id} className="border-b border-stroke last:border-0 cursor-pointer hover:bg-selected" onClick={() => navigate(`/events/${ev.id}`)}>
                          <td className="px-4 py-3 font-medium">{ev.name}</td>
                          <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                          <td className="px-4 py-3"><span className="rounded-full bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 text-[11px] font-medium">Occupied</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div className="space-y-6">
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
                  <input defaultValue={currentUser.name} className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input defaultValue={currentUser.email} className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <input value={roleLabels[currentUser.role]} disabled className="mt-1 block w-full rounded-lg border border-stroke bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
                </div>
                <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
