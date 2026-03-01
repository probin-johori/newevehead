import { useState } from "react";
import { useMockData, formatDate } from "@/context/MockDataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Eye, ArrowLeft } from "@phosphor-icons/react";

export default function DocumentsPage() {
  const { events, documents, isFreePlan, getProfile, getDepartment, getDocsByEvent } = useMockData();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState("all");

  if (isFreePlan) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-1">Documents</h1>
        <div className="mt-8 rounded-xl border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">This feature is not available on your current plan. Upgrade to Pro to unlock.</p>
        </div>
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="p-6 max-w-[960px]">
        <h1 className="text-2xl font-semibold mb-1">Documents</h1>
        <p className="text-sm text-muted-foreground mb-5">Select an event to view its documents</p>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => {
                const docs = getDocsByEvent(ev.id);
                return (
                  <tr key={ev.id} onClick={() => setSelectedEvent(ev.id)} className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{ev.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{ev.location}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{docs.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const event = events.find(e => e.id === selectedEvent);
  const docs = getDocsByEvent(selectedEvent).filter(d => folderFilter === "all" || d.folder === folderFilter);
  const folders = ["all", "Contracts", "Layouts", "Permits", "Other"];

  return (
    <div className="p-6 max-w-[960px]">
      <button onClick={() => setSelectedEvent(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft size={14} /> Documents / {event?.name}
      </button>

      <div className="flex items-center gap-2 mb-5">
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
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {docs.map(d => {
              const uploader = getProfile(d.uploaded_by);
              const dept = d.dept_id ? getDepartment(d.dept_id) : null;
              return (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{d.folder}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{dept?.name || "—"}</td>
                  <td className="px-4 py-3">{uploader && <div className="flex items-center gap-1.5"><UserAvatar name={uploader.name} color={uploader.avatar_color} size="sm" /><span>{uploader.name}</span></div>}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(d.uploaded_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.file_size}</td>
                  <td className="px-4 py-3"><button className="text-muted-foreground hover:text-foreground transition-colors"><Eye size={15} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
