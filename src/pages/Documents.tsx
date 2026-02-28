import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { FeatureLockBanner } from "@/components/FeatureLockBanner";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ArrowLeft, MapPin, FileText } from "lucide-react";

export default function DocumentsPage() {
  const { events, documents, isFreePlan, getProfile, getDepartment, getDocsByEvent } = useMockData();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState("all");

  if (isFreePlan) {
    return <><TopBar title="Documents" /><div className="p-6"><FeatureLockBanner /></div></>;
  }

  if (!selectedEvent) {
    return (
      <>
        <TopBar title="Documents" />
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">Select an event to view its documents</p>
          <div className="grid grid-cols-3 gap-4">
            {events.map(ev => {
              const docs = getDocsByEvent(ev.id);
              return (
                <button key={ev.id} onClick={() => setSelectedEvent(ev.id)}
                  className="rounded-xl border border-border bg-card p-5 text-left shadow-sm hover:shadow-md hover:border-accent-mid/40 transition-all">
                  <StatusBadge status={ev.status} />
                  <h3 className="text-lg font-serif mt-2">{ev.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{ev.location}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> {docs.length} documents
                  </div>
                  <p className="text-xs text-accent-mid mt-2 font-medium">View Documents →</p>
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  const event = events.find(e => e.id === selectedEvent);
  const docs = getDocsByEvent(selectedEvent).filter(d => folderFilter === "all" || d.folder === folderFilter);
  const folders = ["all", "Contracts", "Layouts", "Permits", "Other"];

  return (
    <>
      <TopBar title="Documents" />
      <div className="p-6 space-y-4">
        <button onClick={() => setSelectedEvent(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Documents / {event?.name}
        </button>

        <div className="flex items-center gap-2">
          {folders.map(f => (
            <button key={f} onClick={() => setFolderFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                folderFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead><tr className="bg-secondary text-left">
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Folder</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Uploaded By</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Size</th>
            </tr></thead>
            <tbody>
              {docs.map(d => {
                const uploader = getProfile(d.uploaded_by);
                const dept = d.dept_id ? getDepartment(d.dept_id) : null;
                return (
                  <tr key={d.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{d.folder}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{dept?.name || "Event-level"}</td>
                    <td className="px-4 py-3">{uploader && <div className="flex items-center gap-1.5"><UserAvatar name={uploader.name} color={uploader.avatar_color} size="sm" /><div><span className="text-sm">{uploader.name}</span><span className="text-[10px] text-muted-foreground ml-1">{uploader.role}</span></div></div>}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.file_size}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
