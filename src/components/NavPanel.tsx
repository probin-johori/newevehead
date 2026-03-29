import { useState, useEffect, useCallback } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ChartBar, Hash, Plus, DotsThreeOutline, CaretDown, CaretRight,
  Funnel, Clock, Upload, User, ShieldCheck, UserPlus,
  ListChecks, FolderOpen, CheckCircle, XCircle, HourglassSimple, Receipt, Buildings
} from "@phosphor-icons/react";

type MainTab = "home" | "task" | "dept" | "billing" | "document" | "team";

function getMainTab(pathname: string): MainTab {
  if (pathname.startsWith("/tasks")) return "task";
  if (pathname.startsWith("/departments")) return "dept";
  if (pathname.startsWith("/billing")) return "billing";
  if (pathname.startsWith("/documents")) return "document";
  if (pathname.startsWith("/teams")) return "team";
  return "home";
}

const sectionLabelClass = "text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" as const;
const sectionLabelColor = { color: "#9A9A9A" };
const navItemBase = "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors";
const navItemActive = `${navItemBase} bg-selected text-foreground`;
const navItemInactive = `${navItemBase} text-muted-foreground hover:bg-selected hover:text-foreground`;
const iconBtnClass = "flex h-5 w-5 items-center justify-center rounded-md bg-icon-btn text-icon-btn-fg hover:bg-[hsl(0_0%_88%)] transition-colors";

export function NavPanel() {
  const { events, getDeptsByEvent, departments } = useMockData();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["events-task", "events-billing", "events-doc"]));

  const STORAGE_KEY = "zh-nav-width";
  const MIN_W = 180;
  const DEFAULT_W = 220;
  const MAX_W = 380;
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Math.max(MIN_W, Math.min(MAX_W, parseInt(saved))) : DEFAULT_W;
  });
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); }, []);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const navEl = document.getElementById("zh-nav-panel");
      if (!navEl) return;
      const rect = navEl.getBoundingClientRect();
      const newW = Math.max(MIN_W, Math.min(MAX_W, e.clientX - rect.left));
      setWidth(newW);
      localStorage.setItem(STORAGE_KEY, String(newW));
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); };
  }, [isResizing]);

  const mainTab = getMainTab(location.pathname);
  const selectedEventId = params.id || (location.pathname.startsWith("/events/") ? location.pathname.split("/")[2] : null);
  const visibleEvents = showAllEvents ? events : events.slice(0, 4);
  const uniqueDepts = Array.from(new Set(departments.map(d => d.name)));

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div id="zh-nav-panel" className="relative flex-shrink-0" style={{ width }}>
      <aside className="h-full overflow-y-auto bg-nav-panel" style={{ width }}>
        <div className="p-4 space-y-5">
          {/* ===== HOME TAB — Events only, no departments ===== */}
          {mainTab === "home" && (
            <>
              <div>
                <p className={sectionLabelClass} style={sectionLabelColor}>HOME</p>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? navItemActive : navItemInactive}>
                  <ChartBar size={15} /> Dashboard
                </NavLink>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={sectionLabelClass} style={{ ...sectionLabelColor, marginBottom: 0 }}>EVENTS</p>
                  <button className={iconBtnClass}><Plus size={12} weight="bold" /></button>
                </div>
                <div className="space-y-0.5">
                  {visibleEvents.map(ev => {
                    const isSelected = selectedEventId === ev.id;
                    const initials = ev.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <NavLink key={ev.id} to={`/events/${ev.id}`}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${isSelected ? "bg-selected text-foreground" : "text-muted-foreground hover:bg-selected hover:text-foreground"}`}>
                        {ev.image_url ? (
                          <img src={ev.image_url} alt="" className="h-6 w-6 rounded-md object-cover shrink-0" />
                        ) : (
                          <div className="h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{ backgroundColor: ev.status === "active" ? "#e85d04" : ev.status === "planning" ? "#3b82f6" : "#9ca3af" }}>
                            {initials}
                          </div>
                        )}
                        <span className="truncate flex-1">{ev.name}</span>
                      </NavLink>
                    );
                  })}
                  {events.length > 4 && (
                    <button onClick={() => setShowAllEvents(!showAllEvents)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <DotsThreeOutline size={12} weight="fill" />
                      {showAllEvents ? "Show less" : "More"}
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
                <p className={sectionLabelClass} style={sectionLabelColor}>TASKS</p>
                <div className="space-y-0.5">
                  <NavLink to="/tasks?view=my" className={navItemInactive}><User size={14} /> My Tasks</NavLink>
                  <NavLink to="/tasks" end className={({ isActive }) => isActive ? navItemActive : navItemInactive}><ListChecks size={14} /> All Tasks</NavLink>
                </div>
              </div>
              <div>
                <button onClick={() => toggleSection("events-task")} className={`flex items-center gap-1 w-full ${sectionLabelClass}`} style={sectionLabelColor}>
                  {expandedSections.has("events-task") ? <CaretDown size={10} /> : <CaretRight size={10} />} BY EVENT
                </button>
                {expandedSections.has("events-task") && (
                  <div className="space-y-0.5 pl-1">
                    {events.map(ev => (
                      <NavLink key={ev.id} to={`/tasks?event=${ev.id}`} className={`${navItemInactive} truncate`}>
                        <span className="truncate">{ev.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== DEPT TAB ===== */}
          {mainTab === "dept" && (
            <>
              <div>
                <p className={sectionLabelClass} style={sectionLabelColor}>DEPARTMENTS</p>
                <div className="space-y-0.5">
                  <NavLink to="/departments" end className={({ isActive }) => isActive ? navItemActive : navItemInactive}>
                    <Buildings size={14} /> All Departments
                  </NavLink>
                </div>
              </div>
              <div>
                <p className={sectionLabelClass} style={sectionLabelColor}>BY NAME</p>
                <div className="space-y-0.5">
                  {uniqueDepts.map(name => (
                    <NavLink key={name} to={`/departments/${encodeURIComponent(name)}`} className={navItemInactive}>
                      <Hash size={13} /> <span className="truncate">{name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ===== BILLING TAB ===== */}
          {mainTab === "billing" && (
            <>
              <div>
                <p className={sectionLabelClass} style={sectionLabelColor}>BILLING</p>
                <div className="space-y-0.5">
                  <NavLink to="/billing" end className={({ isActive }) => isActive ? navItemActive : navItemInactive}>
                    <Receipt size={14} /> All Billing
                  </NavLink>
                </div>
              </div>
              <div>
                <button onClick={() => toggleSection("events-billing")} className={`flex items-center gap-1 w-full ${sectionLabelClass}`} style={sectionLabelColor}>
                  {expandedSections.has("events-billing") ? <CaretDown size={10} /> : <CaretRight size={10} />} BY EVENT
                </button>
                {expandedSections.has("events-billing") && (
                  <div className="space-y-0.5 pl-1">
                    {events.map(ev => (
                      <NavLink key={ev.id} to={`/billing?event=${ev.id}`} className={`${navItemInactive} truncate`}>
                        <span className="truncate">{ev.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <NavLink to="/billing?status=pending" className={navItemInactive}><HourglassSimple size={14} /> Pending</NavLink>
                <NavLink to="/billing?status=settled" className={navItemInactive}><CheckCircle size={14} /> Paid</NavLink>
                <NavLink to="/billing?status=rejected" className={navItemInactive}><XCircle size={14} /> Rejected</NavLink>
              </div>
            </>
          )}

          {/* ===== DOCUMENT TAB ===== */}
          {mainTab === "document" && (
            <>
              <div>
                <p className={sectionLabelClass} style={sectionLabelColor}>DOCUMENTS</p>
                <div className="space-y-0.5">
                  <NavLink to="/documents" end className={({ isActive }) => isActive ? navItemActive : navItemInactive}>
                    <FolderOpen size={14} /> All Documents
                  </NavLink>
                </div>
              </div>
              <div>
                <button onClick={() => toggleSection("events-doc")} className={`flex items-center gap-1 w-full ${sectionLabelClass}`} style={sectionLabelColor}>
                  {expandedSections.has("events-doc") ? <CaretDown size={10} /> : <CaretRight size={10} />} BY EVENT
                </button>
                {expandedSections.has("events-doc") && (
                  <div className="space-y-0.5 pl-1">
                    {events.map(ev => (
                      <NavLink key={ev.id} to={`/documents?event=${ev.id}`} className={`${navItemInactive} truncate`}>
                        <span className="truncate">{ev.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <NavLink to="/documents?view=recent" className={navItemInactive}><Clock size={14} /> Recently Added</NavLink>
                <NavLink to="/documents?view=mine" className={navItemInactive}><Upload size={14} /> My Uploads</NavLink>
              </div>
            </>
          )}

          {/* ===== TEAM TAB ===== */}
          {mainTab === "team" && (
            <>
              <div>
                <p className={sectionLabelClass} style={sectionLabelColor}>TEAM</p>
                <div className="space-y-0.5">
                  <NavLink to="/teams" end className={({ isActive }) => isActive ? navItemActive : navItemInactive}>
                    <ShieldCheck size={14} /> All Members
                  </NavLink>
                </div>
              </div>
              <div>
                <p className={sectionLabelClass} style={sectionLabelColor}>DEPARTMENT TEAMS</p>
                <div className="space-y-0.5">
                  {uniqueDepts.map(name => (
                    <NavLink key={name} to={`/teams?dept=${encodeURIComponent(name)}`} className={navItemInactive}>
                      <Hash size={13} /> <span className="truncate">{name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
              <div>
                <NavLink to="/teams?invite=true" className={navItemInactive}><UserPlus size={14} /> Invite Members</NavLink>
              </div>
            </>
          )}
        </div>
      </aside>
      <div onMouseDown={handleMouseDown}
        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-accent/30 transition-colors z-10 ${isResizing ? "bg-accent/40" : ""}`} />
    </div>
  );
}
