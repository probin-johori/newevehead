import { CalendarBlank, Users, Receipt, Lightning, Plus } from "@phosphor-icons/react";

const kpis = [
  { label: "Active Events", value: "0", icon: CalendarBlank, color: "text-accent" },
  { label: "Team Members", value: "0", icon: Users, color: "text-info" },
  { label: "Pending Bills", value: "0", icon: Receipt, color: "text-warning" },
  { label: "Tasks Due", value: "0", icon: Lightning, color: "text-accent" },
];

const Dashboard = () => {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>
        <button className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus size={16} weight="bold" />
          New Event
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${color}`}>
                <Icon size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Events Grid + My Tasks */}
      <div className="grid grid-cols-3 gap-4">
        {/* Events */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
            <button className="text-sm font-medium text-accent hover:underline">View all</button>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarBlank size={40} className="mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No events yet</p>
            <p className="text-xs text-muted-foreground/70">Create your first event to get started</p>
          </div>
        </div>

        {/* My Tasks */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">My Tasks</h2>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">0</span>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Lightning size={40} className="mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground/70">No tasks assigned to you</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
