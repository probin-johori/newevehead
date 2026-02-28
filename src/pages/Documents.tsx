import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useMockData } from "@/context/MockDataContext";
import { FeatureLockBanner } from "@/components/FeatureLockBanner";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { ArrowLeft, FileText, CaretRight } from "@phosphor-icons/react";

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
        <TopBar title="Documents" subtitle="Select an event to view its documents" />
        <div className="p-6 max-w-[960px] space-y-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => {
                  const docs = getDocsByEvent(ev.id);
                  return (
                    <tr key={ev.id} onClick={() => setSelectedEvent(ev.id)} className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{ev.name}</td>
                      <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{ev.location}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{docs.length}</td>
                      <td className="px-4 py-3"><CaretRight size={14} className="text-muted-foreground" /></td>
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

  const event = events.find(e => e.id === selectedEvent);
  const docs = getDocsByEvent(selectedEvent).filter(d => folderFilter === "all" || d.folder === folderFilter);
  const folders = ["all", "Contracts", "Layouts", "Permits", "Other"];

  return (
    <>
      <TopBar title="Documents" />
      <div className="p-6 max-w-[960px] space-y-4">
        <button onClick={() => setSelectedEvent(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Documents / {event?.name}
        </button>

        <div className="flex items-center gap-2">
          {folders.map(f => (
            <button key={f} onClick={() => setFolderFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                folderFilter === f ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Document</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Folder</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Uploaded By</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Size</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => {
                const uploader = getProfile(d.uploaded_by);
                const dept = d.dept_id ? getDepartment(d.dept_id) : null;
                return (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{d.folder}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{dept?.name || "Event-level"}</td>
                    <td className="px-4 py-3">{uploader && <div className="flex items-center gap-1.5"><UserAvatar name={uploader.name} color={uploader.avatar_color} size="sm" /><span>{uploader.name}</span></div>}</td>
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
