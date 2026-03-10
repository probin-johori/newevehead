import { useState } from "react";
import { useMockData, formatDate } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Eye, ArrowLeft, Plus, FolderOpen, Trash } from "@phosphor-icons/react";

export default function DocumentsPage() {
  const { events, documents, isFreePlan, getProfile, getDepartment, getDocsByEvent, currentUser } = useMockData();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState("all");

  if (isFreePlan) {
    return (
      <div className="p-6 w-full">
        <h1 className="text-xl font-semibold mb-1">Documents</h1>
        <div className="mt-8 rounded-xl border border-stroke p-8 text-center">
          <p className="text-sm text-muted-foreground">This feature is not available on your current plan.</p>
        </div>
      </div>
    );
  }

  // Event Folder Grid
  if (!selectedEvent) {
    return (
      <div className="p-6 w-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold">Documents</h1>
            <p className="text-sm text-muted-foreground">Select an event to view documents</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
            <Plus size={14} /> Upload Document
          </button>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
          {events.map(ev => {
            const docs = getDocsByEvent(ev.id);
            const initials = ev.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button
                key={ev.id}
                onClick={() => setSelectedEvent(ev.id)}
                className="rounded-xl border border-stroke p-5 text-left hover:bg-selected transition-colors group"
              >
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-base font-bold text-white mb-3"
                  style={{ backgroundColor: ev.status === "active" ? "#e85d04" : "#3b82f6" }}
                >
                  {initials}
                </div>
                <p className="font-medium text-sm truncate">{ev.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{docs.length} docs</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const event = events.find(e => e.id === selectedEvent);
  const docs = getDocsByEvent(selectedEvent).filter(d => folderFilter === "all" || d.folder === folderFilter);
  const folders = ["all", "Contracts", "Layouts", "Permits", "Other"];
  const isAdmin = currentUser.role === "sa" || currentUser.role === "org";

  return (
    <div className="p-6 w-full">
      <button onClick={() => setSelectedEvent(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft size={14} /> Documents / {event?.name}
      </button>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {folders.map(f => (
            <button key={f} onClick={() => setFolderFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                folderFilter === f ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:bg-selected"
              }`}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
          <Plus size={14} /> Upload Document
        </button>
      </div>

      <div className="rounded-xl border border-stroke overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Document</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Folder</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Uploaded By</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Size</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {docs.map(d => {
              const uploader = getProfile(d.uploaded_by);
              const dept = d.dept_id ? getDepartment(d.dept_id) : null;
              return (
                <tr key={d.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{d.folder}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{dept?.name || "—"}</td>
                  <td className="px-4 py-3">{uploader && <div className="flex items-center gap-1.5"><UserAvatar name={uploader.name} color={uploader.avatar_color} size="sm" /><span>{uploader.name}</span></div>}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(d.uploaded_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.file_size}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <button className="text-muted-foreground hover:text-foreground transition-colors"><Eye size={15} /></button>
                    {isAdmin && <button className="text-muted-foreground hover:text-red-600 transition-colors"><Trash size={15} /></button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {docs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <FolderOpen size={32} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No documents yet — Upload the first one</p>
          </div>
        )}
      </div>
    </div>
  );
}
