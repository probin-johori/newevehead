import { useState } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { useMockData } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { ChartBar, Hash, Plus, DotsThreeOutline } from "@phosphor-icons/react";

export function NavPanel() {
  const { events, getDeptsByEvent } = useMockData();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllDepts, setShowAllDepts] = useState(false);

  const selectedEventId = params.id || (location.pathname.startsWith("/events/") ? location.pathname.split("/")[2] : null);
  const visibleEvents = showAllEvents ? events : events.slice(0, 4);

  // Show departments for selected event or first active event
  const deptEventId = selectedEventId || events[0]?.id;
  const depts = deptEventId ? getDeptsByEvent(deptEventId) : [];
  const visibleDepts = showAllDepts ? depts : depts.slice(0, 8);

  return (
    <aside className="fixed left-16 top-[52px] z-10 h-[calc(100vh-52px)] w-[220px] border-r border-border bg-background overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Home Section */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Home</p>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                isActive ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`
            }
          >
            <ChartBar size={15} />
            Dashboard
          </NavLink>
        </div>

        {/* Events Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Events</p>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-0.5">
            {visibleEvents.map(ev => {
              const isSelected = selectedEventId === ev.id;
              return (
                <NavLink
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    isSelected ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-sm shrink-0 ${
                      ev.status === "active" ? "bg-emerald-500" :
                      ev.status === "planning" ? "bg-blue-500" :
                      ev.status === "completed" ? "bg-gray-400" : "bg-gray-300"
                    }`}
                  />
                  <span className="truncate flex-1">{ev.name}</span>
                  <StatusBadge status={ev.status} className="text-[10px] px-1.5 py-0" />
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

        {/* Departments Section */}
        {depts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Departments</p>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {visibleDepts.map(dept => (
                <NavLink
                  key={dept.id}
                  to={`/events/${dept.event_id}?tab=departments`}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
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
        )}
      </div>
    </aside>
  );
}
