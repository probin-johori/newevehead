import { Navigate } from "react-router-dom";
import { useMockData } from "@/context/MockDataContext";

export default function EventsPage() {
  const { events } = useMockData();
  const firstEvent = events[0];
  if (firstEvent) return <Navigate to={`/events/${firstEvent.id}`} replace />;
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-52px)]">
      <p className="text-sm text-muted-foreground">No events yet</p>
    </div>
  );
}
