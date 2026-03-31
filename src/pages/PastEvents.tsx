import { useNavigate } from "react-router-dom";
import { useMockData, formatDate } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft } from "@phosphor-icons/react";

export default function PastEventsPage() {
  const navigate = useNavigate();
  const { events } = useMockData();

  const pastEvents = events.filter(
    e => e.status === "completed" || e.status === "archived"
  );

  return (
    <div className="p-6 w-full">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/dashboard")} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-selected transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-semibold">Past Events</h1>
          <p className="text-sm text-muted-foreground">{pastEvents.length} completed or archived events</p>
        </div>
      </div>

      {pastEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-stroke">
          <span className="text-3xl mb-3">📁</span>
          <p className="text-sm font-medium mb-1">No past events</p>
          <p className="text-sm text-muted-foreground">Completed and archived events will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {pastEvents.map(ev => {
            const initials = ev.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button key={ev.id} onClick={() => navigate(`/events/${ev.id}`)}
                className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-3 ring-2 ring-stroke group-hover:ring-foreground/30 transition-all">
                  {ev.image_url ? (
                    <img src={ev.image_url} alt={ev.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-lg font-bold">
                      {initials}
                    </div>
                  )}
                </div>
                <p className="font-medium text-sm truncate max-w-full">{ev.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(ev.start_date)} – {formatDate(ev.end_date)}</p>
                <StatusBadge status={ev.status} className="mt-1" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
