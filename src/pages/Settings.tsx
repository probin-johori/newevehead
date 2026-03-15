import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMockData } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Check, X, Shield, Plus, Trash } from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";

const roleLabels: Record<string, string> = {
  sa: "Super Admin", org: "Organiser", dept_head: "Dept Head", dept_member: "Member",
};

const features = [
  "Tasks", "Billing", "Departments", "Events", "Reports", "Documents", "Team Management", "Settings"
];

const permissions = ["View", "Edit", "Delete", "Export"];

const defaultRoles = ["Admin", "Manager", "Member", "Guest"];

const planDetails = [
  { plan: "free", name: "Free", price: "₹0/mo", slots: "1 event slot", features: ["1 active event", "Basic task management", "Team collaboration"], locked: ["Billing", "Budget details", "Document Vault", "Analytics"] },
  { plan: "pro", name: "Pro", price: "₹10,000/mo", slots: "4 event slots", features: ["4 active events", "Full task management", "Billing & verification flow", "Budget tracking", "Document Vault", "Analytics dashboard"], locked: [] },
  { plan: "business", name: "Business", price: "₹25,000/mo", slots: "12 event slots", features: ["12 active events", "Everything in Pro", "Priority support", "Custom branding"], locked: [] },
];

export default function SettingsPage() {
  const { currentUser, subscription, events } = useMockData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || (currentUser.role === "sa" ? "permissions" : "profile");
  const [tab, setTab] = useState(initialTab);

  // Custom roles
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [showAddRole, setShowAddRole] = useState(false);
  const [deleteRole, setDeleteRole] = useState<string | null>(null);

  const allRoles = [...defaultRoles, ...customRoles];

  // Permission matrix state
  const [permMatrix, setPermMatrix] = useState<Record<string, Record<string, Record<string, boolean>>>>(() => {
    const m: Record<string, Record<string, Record<string, boolean>>> = {};
    defaultRoles.forEach(role => {
      m[role] = {};
      features.forEach(feat => {
        m[role][feat] = {
          View: true,
          Edit: role === "Admin" || role === "Manager",
          Delete: role === "Admin",
          Export: role === "Admin" || role === "Manager",
        };
      });
    });
    return m;
  });

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  const togglePerm = (role: string, feat: string, perm: string) => {
    setPermMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [feat]: {
          ...prev[role][feat],
          [perm]: !prev[role][feat][perm],
        }
      }
    }));
  };

  const handleAddCustomRole = () => {
    const name = newRoleName.trim();
    if (!name || allRoles.includes(name)) {
      toast({ title: "Role name must be unique and non-empty", variant: "destructive" });
      return;
    }
    setCustomRoles(prev => [...prev, name]);
    // Initialize permissions for the new role
    const rolePerms: Record<string, Record<string, boolean>> = {};
    features.forEach(feat => {
      rolePerms[feat] = { View: true, Edit: false, Delete: false, Export: false };
    });
    setPermMatrix(prev => ({ ...prev, [name]: rolePerms }));
    setNewRoleName("");
    setShowAddRole(false);
    toast({ title: `Role "${name}" created` });
  };

  const handleDeleteRole = (roleName: string) => {
    setCustomRoles(prev => prev.filter(r => r !== roleName));
    setPermMatrix(prev => {
      const next = { ...prev };
      delete next[roleName];
      return next;
    });
    setDeleteRole(null);
    toast({ title: `Role "${roleName}" deleted` });
  };

  const tabs = [
    ...(currentUser.role === "sa" ? [
      { key: "permissions", label: "Permissions" },
      { key: "subscription", label: "Subscription" },
    ] : []),
    { key: "profile", label: "My Profile" },
    { key: "notifications", label: "Notifications" },
  ];

  return (
    <div className="p-6 w-full">
      <h1 className="text-xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-5">Manage permissions, account, and preferences</p>

      {/* Tabs — inline, no sub-sidebar */}
      <div className="flex gap-0 border-b border-stroke mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="w-full">
        {/* ===== PERMISSIONS ===== */}
        {tab === "permissions" && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">Manage access levels for each role across features.</p>
            {allRoles.map(role => (
              <div key={role} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Shield size={14} /> {role}
                  </h3>
                  {customRoles.includes(role) && (
                    <button onClick={() => setDeleteRole(role)} className="text-muted-foreground hover:text-red-600 transition-colors" title="Delete role">
                      <Trash size={14} />
                    </button>
                  )}
                </div>
                <div className="rounded-xl border border-stroke overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stroke">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Feature</th>
                        {permissions.map(p => (
                          <th key={p} className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {features.map(feat => (
                        <tr key={feat} className="border-b border-stroke last:border-0">
                          <td className="px-4 py-2.5 font-medium">{feat}</td>
                          {permissions.map(perm => (
                            <td key={perm} className="px-4 py-2.5 text-center">
                              <button onClick={() => togglePerm(role, feat, perm)}
                                className={`h-5 w-9 rounded-full transition-colors ${permMatrix[role]?.[feat]?.[perm] ? "bg-accent" : "bg-muted"}`}>
                                <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${permMatrix[role]?.[feat]?.[perm] ? "translate-x-4" : "translate-x-0.5"}`} />
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Add Custom Role */}
            {showAddRole ? (
              <div className="flex items-center gap-3">
                <input value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAddCustomRole(); if (e.key === "Escape") setShowAddRole(false); }}
                  placeholder="Role name" autoFocus
                  className="rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground w-48" />
                <button onClick={handleAddCustomRole} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Create</button>
                <button onClick={() => { setShowAddRole(false); setNewRoleName(""); }} className="text-sm text-muted-foreground">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowAddRole(true)}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">
                <Plus size={14} /> Add Custom Role
              </button>
            )}
          </div>
        )}

        {/* ===== SUBSCRIPTION ===== */}
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
                  <button className={`mt-4 w-full rounded-full px-3 py-2 text-sm font-medium transition-colors ${subscription.plan === p.plan ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-selected"}`}>
                    {subscription.plan === p.plan ? "Current Plan" : "Upgrade"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== PROFILE ===== */}
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
                <input defaultValue={currentUser.name} className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input defaultValue={currentUser.email} className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-muted-foreground" />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <input value={roleLabels[currentUser.role]} disabled className="mt-1 block w-full rounded-lg border border-stroke bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
              </div>
              <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">Save Changes</button>
            </div>
          </div>
        )}

        {/* ===== NOTIFICATIONS ===== */}
        {tab === "notifications" && (
          <div className="space-y-6 max-w-md">
            <h3 className="text-sm font-semibold">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { label: "Email Notifications", desc: "Receive email for important updates", value: emailNotifs, setter: setEmailNotifs },
                { label: "In-App Notifications", desc: "Show notifications in the app header", value: inAppNotifs, setter: setInAppNotifs },
                { label: "Two-Factor Authentication", desc: "Add extra security to your account", value: twoFA, setter: setTwoFA },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-stroke p-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <button onClick={() => item.setter(!item.value)}
                    className={`h-6 w-11 rounded-full transition-colors ${item.value ? "bg-accent" : "bg-muted"}`}>
                    <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${item.value ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog open={!!deleteRole} title="Delete Role" message={`Delete the "${deleteRole}" role? Members assigned to this role will need to be reassigned.`}
        confirmLabel="Delete" destructive onConfirm={() => deleteRole && handleDeleteRole(deleteRole)} onCancel={() => setDeleteRole(null)} />
    </div>
  );
}
