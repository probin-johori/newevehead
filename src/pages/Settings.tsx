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
      <TopBar title="Settings" />
      <div className="p-6 space-y-6">
        <div className="flex gap-1 border-b border-border">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "subscription" && (
          <div className="space-y-6">
            <div className="rounded-xl bg-gradient-to-r from-primary to-accent-mid p-6 text-primary-foreground">
              <p className="text-sm font-light opacity-80">Current Plan</p>
              <p className="text-2xl font-serif mt-1 capitalize">{subscription.plan}</p>
              <div className="flex items-center gap-2 mt-3">
                {Array.from({ length: subscription.slots_total }).map((_, i) => (
                  <div key={i} className={`h-3 w-8 rounded-full ${i < subscription.slots_used ? "bg-white" : "bg-white/30"}`} />
                ))}
                <span className="text-sm font-light ml-2">{subscription.slots_used}/{subscription.slots_total} slots used</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {planDetails.map(p => (
                <div key={p.plan} className={`rounded-xl border p-5 shadow-sm ${subscription.plan === p.plan ? "border-primary bg-accent-light" : "border-border bg-card"}`}>
                  <p className="text-lg font-serif">{p.name}</p>
                  <p className="text-2xl font-serif mt-1">{p.price}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.slots}</p>
                  <div className="mt-4 space-y-1.5">
                    {p.features.map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-sm"><Check size={14} className="text-primary" weight="bold" />{f}</div>
                    ))}
                    {p.locked.map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-sm text-muted-foreground"><X size={14} />{f}</div>
                    ))}
                  </div>
                  <button className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-medium transition-opacity ${
                    subscription.plan === p.plan ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:opacity-80"
                  }`}>
                    {subscription.plan === p.plan ? "Current Plan" : "Upgrade"}
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-base font-serif mb-3">Event Slot Usage</h3>
              <table className="w-full text-sm">
                <thead><tr className="bg-secondary text-left">
                  <th className="px-4 py-2.5 font-medium">Event</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Slot</th>
                </tr></thead>
                <tbody>
                  {events.map(ev => (
                    <tr key={ev.id} className="border-t border-border cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/events/${ev.id}`)}>
                      <td className="px-4 py-2.5">{ev.name}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={ev.status} /></td>
                      <td className="px-4 py-2.5"><span className="rounded-full bg-accent-light text-primary px-2.5 py-0.5 text-xs font-medium">Occupied</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-muted-foreground mt-3">Completing or archiving an event does not free the slot. Slots reset on billing cycle.</p>
            </div>
          </div>
        )}

        {tab === "profile" && (
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
              <input defaultValue={currentUser.name} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input defaultValue={currentUser.email} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <input value={roleLabels[currentUser.role]} disabled className="mt-1 block w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground" />
            </div>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Save Changes</button>
          </div>
        )}
      </div>
    </>
  );
}
