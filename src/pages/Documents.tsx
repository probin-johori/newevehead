import { useState } from "react";
import { useMockData, formatDate } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useScrollLock } from "@/hooks/useScrollLock";
import { Eye, ArrowLeft, Plus, FolderOpen, Trash, X, FileText } from "@phosphor-icons/react";

export default function DocumentsPage() {
  const { events, documents, isFreePlan, getProfile, getDepartment, getDocsByEvent, currentUser } = useMockData();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  useScrollLock(!!selectedDoc);

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

  // Document detail view
  const doc = selectedDoc ? documents.find(d => d.id === selectedDoc) : null;

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
                <tr key={d.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors cursor-pointer" onClick={() => setSelectedDoc(d.id)}>
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{d.folder}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{dept?.name || "—"}</td>
                  <td className="px-4 py-3">{uploader && <div className="flex items-center gap-1.5"><UserAvatar name={uploader.name} color={uploader.avatar_color} size="sm" /><span>{uploader.name}</span></div>}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(d.uploaded_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.file_size}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={e => { e.stopPropagation(); setSelectedDoc(d.id); }}><Eye size={15} /></button>
                    {isAdmin && <button className="text-muted-foreground hover:text-red-600 transition-colors" onClick={e => e.stopPropagation()}><Trash size={15} /></button>}
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

      {/* Document Detail Drawer */}
      {doc && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedDoc(null)} />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-card border-l border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{doc.name}</h3>
              <button onClick={() => setSelectedDoc(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="flex items-center justify-center py-12 bg-secondary rounded-xl">
              <FileText size={48} className="text-muted-foreground/30" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm border-t border-stroke pt-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Folder</p>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{doc.folder}</span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Size</p>
                <p>{doc.file_size}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Uploaded By</p>
                {(() => { const u = getProfile(doc.uploaded_by); return u ? <div className="flex items-center gap-1.5"><UserAvatar name={u.name} color={u.avatar_color} size="sm" /><span>{u.name}</span></div> : null; })()}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Date</p>
                <p>{formatDate(doc.uploaded_at)}</p>
              </div>
              {doc.dept_id && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Department</p>
                  <p>{getDepartment(doc.dept_id)?.name}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
