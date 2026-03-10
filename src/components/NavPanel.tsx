import { useState, useEffect, useCallback } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ChartBar, Hash, Plus, DotsThreeOutline, CaretDown, CaretRight,
  Funnel, Clock, Upload, User, ShieldCheck, UserPlus,
  ListChecks, FolderOpen, CheckCircle, XCircle, HourglassSimple
} from "@phosphor-icons/react";

type MainTab = "home" | "task" | "billing" | "document" | "team";

function getMainTab(pathname: string): MainTab {
  if (pathname.startsWith("/tasks")) return "task";
  if (pathname.startsWith("/billing")) return "billing";
  if (pathname.startsWith("/documents")) return "document";
  if (pathname.startsWith("/teams")) return "team";
  return "home";
}

export function NavPanel() {
  const { events, getDeptsByEvent, profiles, departments } = useMockData();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllDepts, setShowAllDepts] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["events-task", "events-billing", "events-doc"]));

  // Resizable width
  const STORAGE_KEY = "zh-nav-width";
  const MIN_W = 180;
  const DEFAULT_W = 220;
  const MAX_W = 380;
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Math.max(MIN_W, Math.min(MAX_W, parseInt(saved))) : DEFAULT_W;
  });
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newW = Math.max(MIN_W, Math.min(MAX_W, e.clientX - 70));
      setWidth(newW);
      localStorage.setItem(STORAGE_KEY, String(newW));
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const mainTab = getMainTab(location.pathname);

  const selectedEventId = params.id || (location.pathname.startsWith("/events/") ? location.pathname.split("/")[2] : null);
  const visibleEvents = showAllEvents ? events : events.slice(0, 4);
  const deptEventId = selectedEventId || events[0]?.id;
  const depts = deptEventId ? getDeptsByEvent(deptEventId) : [];
  const visibleDepts = showAllDepts ? depts : depts.slice(0, 8);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Unique departments across all events
  const uniqueDepts = Array.from(new Set(departments.map(d => d.name)));

  return (
    <div className="relative flex-shrink-0" style={{ width }}>
      <aside
        className="h-full overflow-y-auto bg-nav-panel"
        style={{ width }}
      >
        <div className="p-4 space-y-5">
          {/* ===== HOME TAB ===== */}
          {mainTab === "home" && (
            <>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Home</p>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                      isActive ? "bg-selected font-medium text-foreground" : "text-muted-foreground hover:bg-selected hover:text-foreground"
                    }`
                  }
                >
                  <ChartBar size={15} />
                  Dashboard
                </NavLink>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Events</p>
                  <button className="flex h-5 w-5 items-center justify-center rounded-md bg-icon-btn text-icon-btn-fg hover:bg-selected transition-colors">
                    <Plus size={12} weight="bold" />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {visibleEvents.map(ev => {
                    const isSelected = selectedEventId === ev.id;
                    const initials = ev.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <NavLink
                        key={ev.id}
                        to={`/events/${ev.id}`}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                          isSelected ? "bg-selected font-medium text-foreground" : "text-muted-foreground hover:bg-selected hover:text-foreground"
                        }`}
                      >
                        <div
                          className="h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ backgroundColor: ev.status === "active" ? "#e85d04" : ev.status === "planning" ? "#3b82f6" : "#9ca3af" }}
                        >
                          {initials}
                        </div>
                        <span className="truncate flex-1">{ev.name}</span>
                        <StatusBadge status={ev.status} />
                      </NavLink>
                    );
                  })}
                  {events.length > 4 && (
                    <button
                      onClick={() => setShowAllEvents(!showAllEvents)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <DotsThreeOutline size={12} weight="fill" />
                      {showAllEvents ? "Show less" : "More"}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Departments</p>
                  <button className="flex h-5 w-5 items-center justify-center rounded-md bg-icon-btn text-icon-btn-fg hover:bg-selected transition-colors">
                    <Plus size={12} weight="bold" />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {visibleDepts.map(dept => (
                    <NavLink
                      key={dept.id}
                      to={`/events/${dept.event_id}?tab=departments`}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors"
                    >
                      <Hash size={13} className="shrink-0" />
                      <span className="truncate">{dept.name}</span>
                    </NavLink>
                  ))}
                  {depts.length > 8 && (
                    <button
                      onClick={() => setShowAllDepts(!showAllDepts)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <DotsThreeOutline size={12} weight="fill" />
                      {showAllDepts ? "Show less" : "More"}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ===== TASK TAB ===== */}
          {mainTab === "task" && (
            <>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tasks</p>
                <div className="space-y-0.5">
                  <NavLink to="/tasks?view=my" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors">
                    <User size={14} /> My Tasks
                  </NavLink>
                  <NavLink to="/tasks" end className={({ isActive }) => `flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${isActive ? "bg-selected font-medium text-foreground" : "text-muted-foreground hover:bg-selected hover:text-foreground"}`}>
                    <ListChecks size={14} /> All Tasks
                  </NavLink>
                </div>
              </div>
              <div>
                <button onClick={() => toggleSection("events-task")} className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 w-full">
                  {expandedSections.has("events-task") ? <CaretDown size={10} /> : <CaretRight size={10} />}
                  By Event
                </button>
                {expandedSections.has("events-task") && (
                  <div className="space-y-0.5 pl-1">
                    {events.map(ev => (
                      <NavLink key={ev.id} to={`/tasks?event=${ev.id}`} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors truncate">
                        <span className="truncate">{ev.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Filters</p>
                <div className="space-y-0.5">
                  <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors w-full text-left">
                    <Funnel size={14} /> Status
                  </button>
                  <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors w-full text-left">
                    <Funnel size={14} /> Priority
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ===== BILLING TAB ===== */}
          {mainTab === "billing" && (
            <>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Billing</p>
                <div className="space-y-0.5">
                  <NavLink to="/billing" end className={({ isActive }) => `flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${isActive ? "bg-selected font-medium text-foreground" : "text-muted-foreground hover:bg-selected hover:text-foreground"}`}>
                    <Receipt size={14} /> All Billing
                  </NavLink>
                </div>
              </div>
              <div>
                <button onClick={() => toggleSection("events-billing")} className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 w-full">
                  {expandedSections.has("events-billing") ? <CaretDown size={10} /> : <CaretRight size={10} />}
                  By Event
                </button>
                {expandedSections.has("events-billing") && (
                  <div className="space-y-0.5 pl-1">
                    {events.map(ev => (
                      <NavLink key={ev.id} to={`/billing?event=${ev.id}`} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors truncate">
                        <span className="truncate">{ev.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <NavLink to="/billing?status=pending" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors">
                  <HourglassSimple size={14} /> Pending Approvals
                </NavLink>
                <NavLink to="/billing?status=settled" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors">
                  <CheckCircle size={14} /> Approved
                </NavLink>
                <NavLink to="/billing?status=rejected" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors">
                  <XCircle size={14} /> Rejected
                </NavLink>
              </div>
            </>
          )}

          {/* ===== DOCUMENT TAB ===== */}
          {mainTab === "document" && (
            <>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Documents</p>
                <div className="space-y-0.5">
                  <NavLink to="/documents" end className={({ isActive }) => `flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${isActive ? "bg-selected font-medium text-foreground" : "text-muted-foreground hover:bg-selected hover:text-foreground"}`}>
                    <FolderOpen size={14} /> All Documents
                  </NavLink>
                </div>
              </div>
              <div>
                <button onClick={() => toggleSection("events-doc")} className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 w-full">
                  {expandedSections.has("events-doc") ? <CaretDown size={10} /> : <CaretRight size={10} />}
                  By Event
                </button>
                {expandedSections.has("events-doc") && (
                  <div className="space-y-0.5 pl-1">
                    {events.map(ev => (
                      <NavLink key={ev.id} to={`/documents?event=${ev.id}`} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors truncate">
                        <span className="truncate">{ev.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <NavLink to="/documents?view=recent" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors">
                  <Clock size={14} /> Recently Added
                </NavLink>
                <NavLink to="/documents?view=mine" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors">
                  <Upload size={14} /> My Uploads
                </NavLink>
              </div>
            </>
          )}

          {/* ===== TEAM TAB ===== */}
          {mainTab === "team" && (
            <>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Team</p>
                <div className="space-y-0.5">
                  <NavLink to="/teams" end className={({ isActive }) => `flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${isActive ? "bg-selected font-medium text-foreground" : "text-muted-foreground hover:bg-selected hover:text-foreground"}`}>
                    <ShieldCheck size={14} /> All Members
                  </NavLink>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Department Teams</p>
                <div className="space-y-0.5">
                  {uniqueDepts.map(name => (
                    <NavLink key={name} to={`/teams?dept=${encodeURIComponent(name)}`} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors">
                      <Hash size={13} /> <span className="truncate">{name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
              <div>
                <NavLink to="/teams?invite=true" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-selected hover:text-foreground transition-colors">
                  <UserPlus size={14} /> Invite Members
                </NavLink>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-accent/30 transition-colors z-10 ${isResizing ? "bg-accent/40" : ""}`}
      />
    </div>
  );
}
