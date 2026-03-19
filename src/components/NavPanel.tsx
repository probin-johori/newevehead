import { useState, useEffect, useCallback } from "react";
import { NavLink, useLocation, useParams, useNavigate } from "react-router-dom";
import { useMockData } from "@/context/MockDataContext";
import { useAuth } from "@/context/AuthContext";
import { EventImageUpload } from "@/components/EventImageUpload";
import {
  ChartBar, Hash, Plus, DotsThreeOutline, CaretDown, CaretRight,
  User, ShieldCheck, UserPlus,
  ListChecks, FolderOpen, Receipt, Buildings
} from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";
import { useScrollLock } from "@/hooks/useScrollLock";
import { X } from "@phosphor-icons/react";

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
  const { events, getDeptsByEvent, departments, setEvents, currentUser, documents } = useMockData();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["events-task", "events-billing", "events-doc", "folders"]));
  const [showAddEvent, setShowAddEvent] = useState(false);

  // Add event form
  const [addEventForm, setAddEventForm] = useState({
    name: "", location: "", start_date: "", end_date: "", estimated_budget: "", image_url: "",
  });
  const [showImageUpload, setShowImageUpload] = useState(false);

  useScrollLock(showAddEvent);

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

  // Get custom folders from documents
  const builtInFolders = ["Contracts", "Layouts", "Permits", "Other"];
  const allDocFolders = Array.from(new Set(documents.map(d => d.folder)));
  const customFolders = allDocFolders.filter(f => !builtInFolders.includes(f));
  const displayFolders = [...builtInFolders, ...customFolders].filter(f => {
    return documents.some(d => d.folder === f);
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleAddEvent = () => {
    if (!addEventForm.name.trim()) {
      toast({ title: "Event name is required", variant: "destructive" });
      return;
    }
    const newEvent = {
      id: `e_${Date.now()}`,
      name: addEventForm.name.trim(),
      location: addEventForm.location,
      start_date: addEventForm.start_date || new Date().toISOString().split("T")[0],
      end_date: addEventForm.end_date || new Date().toISOString().split("T")[0],
      setup_date: addEventForm.start_date || new Date().toISOString().split("T")[0],
      teardown_date: addEventForm.end_date || new Date().toISOString().split("T")[0],
      estimated_budget: Number(addEventForm.estimated_budget) || 0,
      status: "planning" as const,
      poc_id: currentUser.id,
      created_by: currentUser.id,
      image_url: addEventForm.image_url || undefined,
    };
    setEvents([...events, newEvent]);
    setShowAddEvent(false);
    setAddEventForm({ name: "", location: "", start_date: "", end_date: "", estimated_budget: "", image_url: "" });
    toast({ title: "Event created" });
    navigate(`/events/${newEvent.id}`);
  };

  return (
    <div id="zh-nav-panel" className="relative flex-shrink-0 h-full" style={{ width }}>
      <aside className="h-full overflow-y-auto bg-nav-panel" style={{ width, minHeight: '100%' }}>
        <div className="p-4 space-y-5">
          {/* ===== HOME TAB ===== */}
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
                  <button onClick={() => setShowAddEvent(true)} className={iconBtnClass} aria-label="Add event"><Plus size={12} weight="bold" /></button>
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
              {displayFolders.length > 0 && (
                <div>
                  <button onClick={() => toggleSection("folders")} className={`flex items-center gap-1 w-full ${sectionLabelClass}`} style={sectionLabelColor}>
                    {expandedSections.has("folders") ? <CaretDown size={10} /> : <CaretRight size={10} />} FOLDERS
                  </button>
                  {expandedSections.has("folders") && (
                    <div className="space-y-0.5 pl-1">
                      {displayFolders.map(f => {
                        const count = documents.filter(d => d.folder === f).length;
                        return (
                          <NavLink key={f} to={`/documents?folder=${encodeURIComponent(f)}`}
                            className={`${navItemInactive} justify-between`}>
                            <span className="truncate">{f}</span>
                            <span className="text-xs text-muted-foreground">{count}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
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

      {/* Add Event Sidesheet */}
      {showAddEvent && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowAddEvent(false)} />
          <div className="fixed right-0 top-0 z-[61] h-full w-full max-w-lg overflow-y-auto bg-nav-panel border-l border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
            onKeyDown={e => e.key === "Escape" && setShowAddEvent(false)}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create Event</h3>
                <button onClick={() => setShowAddEvent(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>

              {/* Image thumbnail */}
              <div>
                <label className="text-sm font-medium">Event Thumbnail</label>
                {addEventForm.image_url ? (
                  <div className="relative mt-2 rounded-xl overflow-hidden group">
                    <img src={addEventForm.image_url} alt="" className="w-full h-32 object-cover" />
                    <button onClick={() => setShowImageUpload(true)}
                      className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Change
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowImageUpload(true)}
                    className="mt-2 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-stroke rounded-xl bg-secondary hover:bg-selected transition-colors cursor-pointer">
                    <p className="text-sm font-medium">Add thumbnail</p>
                    <p className="text-xs text-muted-foreground">Upload or choose from gallery</p>
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Event Name <span className="text-red-500">*</span></label>
                <input value={addEventForm.name} onChange={e => setAddEventForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="e.g. Annual Gala 2026" />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <input value={addEventForm.location} onChange={e => setAddEventForm(f => ({ ...f, location: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="Venue name and city" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <input type="date" value={addEventForm.start_date} onChange={e => setAddEventForm(f => ({ ...f, start_date: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <input type="date" value={addEventForm.end_date} onChange={e => setAddEventForm(f => ({ ...f, end_date: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Estimated Budget (₹)</label>
                <input type="number" value={addEventForm.estimated_budget} onChange={e => setAddEventForm(f => ({ ...f, estimated_budget: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="0" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowAddEvent(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                <button onClick={handleAddEvent} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Create Event</button>
              </div>
            </div>
          </div>

          {showImageUpload && (
            <EventImageUpload
              currentImage={addEventForm.image_url || undefined}
              onSelect={(url) => { setAddEventForm(f => ({ ...f, image_url: url })); setShowImageUpload(false); }}
              onClose={() => setShowImageUpload(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
