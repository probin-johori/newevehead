import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useMockData, formatDate, formatTimeAgo } from "@/context/MockDataContext";
import type { Document as DocType } from "@/context/MockDataContext";
import { UserAvatar } from "@/components/UserAvatar";
import { UserProfileModal } from "@/components/UserProfileModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  Eye, Plus, FolderOpen, X, FileText, PencilSimple, Trash,
  PaperPlaneRight, FolderPlus
} from "@phosphor-icons/react";
import { toast } from "@/hooks/use-toast";

type DocComment = { id: string; doc_id: string; author_id: string; body: string; created_at: string };

export default function DocumentsPage() {
  const {
    events, documents, setDocuments, isFreePlan, getProfile, getDepartment,
    currentUser, departments, profiles, taskComments, setTaskComments,
    addDocument, deleteDocument,
  } = useMockData();
  const [searchParams] = useSearchParams();

  const folderFilter = searchParams.get("folder") || "all";
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"details" | "discussion">("details");
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string | null>(null);
  const [editFolderValue, setEditFolderValue] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DocType | null>(null);

  // Editing doc
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // Discussion
  const [newComment, setNewComment] = useState("");
  const [confirmDeleteComment, setConfirmDeleteComment] = useState<string | null>(null);

  // Add form
  const [addForm, setAddForm] = useState({
    title: "", description: "", event_id: "", folder: "Other", file: null as File | null, tags: "",
  });

  useScrollLock(!!selectedDoc || showAddModal || !!previewDoc);

  if (isFreePlan) {
    return (
      <div className="p-6 w-full">
        <h1 className="text-xl font-semibold mb-1">Documents</h1>
        <div className="mt-8 rounded-xl border border-stroke p-8 text-center">
          <FolderOpen size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium mb-1">Feature Locked</p>
          <p className="text-sm text-muted-foreground">Upgrade to access document management.</p>
        </div>
      </div>
    );
  }

  const builtInFolders = ["Contracts", "Layouts", "Permits", "Other"];
  const allFolders = [...builtInFolders, ...customFolders];

  const doc = selectedDoc ? documents.find(d => d.id === selectedDoc) : null;
  const filtered = folderFilter === "all" ? documents : documents.filter(d => d.folder === folderFilter);

  // Discussion comments (using taskComments store with doc_ prefix)
  const docComments = doc ? taskComments.filter(c => c.task_id === `doc_${doc.id}`) : [];

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    if (allFolders.includes(newFolderName.trim())) {
      toast({ title: "Folder already exists", variant: "destructive" });
      return;
    }
    setCustomFolders([...customFolders, newFolderName.trim()]);
    setNewFolderName("");
    setShowNewFolder(false);
    toast({ title: "Folder created" });
  };

  const handleDeleteFolder = (name: string) => {
    const docsInFolder = documents.filter(d => d.folder === name);
    if (docsInFolder.length > 0) {
      setDocuments(documents.map(d => d.folder === name ? { ...d, folder: "Other" as any } : d));
    }
    setCustomFolders(customFolders.filter(f => f !== name));
    setConfirmDeleteFolder(null);
    toast({ title: "Folder deleted" });
  };

  const handleRenameFolder = (oldName: string) => {
    if (!editFolderValue.trim() || editFolderValue === oldName) {
      setEditingFolderName(null);
      return;
    }
    setCustomFolders(customFolders.map(f => f === oldName ? editFolderValue.trim() : f));
    setDocuments(documents.map(d => d.folder === oldName ? { ...d, folder: editFolderValue.trim() as any } : d));
    setEditingFolderName(null);
    toast({ title: "Folder renamed" });
  };

  const handleAddDoc = async () => {
    if (!addForm.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (!addForm.file) { toast({ title: "File attachment is mandatory", variant: "destructive" }); return; }
    if (!addForm.event_id) { toast({ title: "Please select an event", variant: "destructive" }); return; }
    
    await addDocument({
      event_id: addForm.event_id,
      dept_id: null,
      name: addForm.title.trim(),
      folder: addForm.folder || "Other",
      file_url: URL.createObjectURL(addForm.file),
      file_size: `${(addForm.file.size / 1024 / 1024).toFixed(1)} MB`,
      uploaded_by: currentUser.id,
      description: addForm.description,
      visibility: "internal",
    });
    setShowAddModal(false);
    setAddForm({ title: "", description: "", event_id: "", folder: "Other", file: null, tags: "" });
    toast({ title: "Document added" });
  };

  const handleSaveTitle = () => {
    if (doc && editTitle.trim()) {
      setDocuments(documents.map(d => d.id === doc.id ? { ...d, name: editTitle.trim() } : d));
      toast({ title: "Title updated" });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDesc = () => {
    if (doc) {
      setDocuments(documents.map(d => d.id === doc.id ? { ...d, description: editDesc } : d));
      toast({ title: "Description updated" });
    }
    setIsEditingDesc(false);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() || !doc) return;
    setTaskComments([...taskComments, {
      id: `dc_${Date.now()}`, task_id: `doc_${doc.id}`, author_id: currentUser.id,
      body: newComment.trim(), created_at: new Date().toISOString(),
    }]);
    setNewComment("");
  };

  const handleDeleteComment = (commentId: string) => {
    setTaskComments(taskComments.filter(c => c.id !== commentId));
    setConfirmDeleteComment(null);
    toast({ title: "Comment deleted" });
  };

  const openDoc = (docId: string) => {
    const d = documents.find(x => x.id === docId);
    setSelectedDoc(docId);
    setDetailTab("details");
    if (d) { setEditTitle(d.name); setEditDesc(d.description || ""); }
  };

  const getFileType = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
    return 'other';
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">{documents.length} documents</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
          <Plus size={14} /> Add Document
        </button>
      </div>

      {/* Document table */}
      <div className="flex-1 min-w-0">
        {folderFilter !== "all" && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-medium">
              📁 {folderFilter}
            </span>
          </div>
        )}

          <div className="rounded-xl border border-stroke overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-stroke">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Document</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Folder</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Event</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Uploaded By</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Size</th>
                <th className="w-12"></th>
              </tr></thead>
              <tbody>
                {filtered.map(d => {
                  const uploader = getProfile(d.uploaded_by);
                  const ev = events.find(e => e.id === d.event_id);
                  return (
                    <tr key={d.id} className="border-b border-stroke last:border-0 hover:bg-selected transition-colors cursor-pointer" onClick={() => openDoc(d.id)}>
                      <td className="px-4 py-3 font-medium flex items-center gap-2"><FileText size={14} className="text-muted-foreground shrink-0" /><span className="truncate">{d.name}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{d.folder}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{ev?.name || "—"}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{uploader && <button onClick={e => { e.stopPropagation(); setProfileUserId(uploader.id); }} className="flex items-center gap-1.5 hover:opacity-80"><UserAvatar name={uploader.name} color={uploader.avatar_color} size="sm" /><span>{uploader.name}</span></button>}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(d.uploaded_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{d.file_size}</td>
                      <td className="px-4 py-3">
                        <button onClick={e => { e.stopPropagation(); setPreviewDoc(d); }} className="text-muted-foreground hover:text-foreground" aria-label="Preview">
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <FolderOpen size={32} className="text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium mb-1">No documents found</p>
                <p className="text-sm text-muted-foreground mb-4">Upload your first document to get started.</p>
                <button onClick={() => setShowAddModal(true)}
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
                  <Plus size={14} className="inline mr-1" /> Add Document
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Document Detail Sidesheet */}
      {doc && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedDoc(null)} />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto bg-card border-l border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
            onKeyDown={e => e.key === "Escape" && setSelectedDoc(null)}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                {isEditingTitle ? (
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") setIsEditingTitle(false); }}
                    onBlur={handleSaveTitle} autoFocus
                    className="text-lg font-semibold w-full bg-secondary border border-stroke rounded-lg px-2 py-1 focus:outline-none" />
                ) : (
                  <h3 className="text-lg font-semibold cursor-pointer hover:bg-secondary/50 px-1 -mx-1 rounded transition-colors"
                    onClick={() => setIsEditingTitle(true)}>{doc.name}</h3>
                )}
                <button onClick={() => setSelectedDoc(null)} className="text-muted-foreground hover:text-foreground ml-4 shrink-0" aria-label="Close"><X size={20} /></button>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 border-b border-stroke">
                {(["details", "discussion"] as const).map(t => (
                  <button key={t} onClick={() => setDetailTab(t)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${detailTab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {t === "details" ? "Details" : `Discussion (${docComments.length})`}
                  </button>
                ))}
              </div>

              {/* Details */}
              {detailTab === "details" && (
                <>
                  {/* Preview area */}
                  <div className="flex items-center justify-center py-8 bg-secondary rounded-xl cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => setPreviewDoc(doc)}>
                    <div className="text-center">
                      <FileText size={48} className="text-muted-foreground/30 mx-auto" />
                      <p className="text-xs text-muted-foreground mt-2">Click to preview</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                    {isEditingDesc ? (
                      <div>
                        <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                          className="w-full text-sm bg-secondary border border-stroke rounded-lg px-3 py-2 focus:outline-none" />
                        <div className="flex gap-2 mt-1">
                          <button onClick={handleSaveDesc} className="rounded-full bg-foreground px-3 py-1 text-xs text-background font-medium">Save</button>
                          <button onClick={() => setIsEditingDesc(false)} className="text-xs text-muted-foreground">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground/90 cursor-pointer hover:bg-secondary/50 px-1 -mx-1 rounded transition-colors"
                        onClick={() => { setEditDesc(doc.description || ""); setIsEditingDesc(true); }}>
                        {doc.description || "Click to add description..."}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm border-t border-stroke pt-4">
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Folder</p>
                      <select value={doc.folder} onChange={e => setDocuments(documents.map(d => d.id === doc.id ? { ...d, folder: e.target.value as any } : d))}
                        className="rounded-lg border border-stroke bg-secondary px-2 py-1.5 text-sm focus:outline-none w-full">
                        {allFolders.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Size</p><p>{doc.file_size}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Event</p>
                      <p>{events.find(e => e.id === doc.event_id)?.name || "—"}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Uploaded By</p>
                      {(() => { const u = getProfile(doc.uploaded_by); return u ? <button onClick={() => setProfileUserId(u.id)} className="flex items-center gap-1.5 hover:opacity-80"><UserAvatar name={u.name} color={u.avatar_color} size="sm" /><span>{u.name}</span></button> : null; })()}</div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Date</p><p>{formatDate(doc.uploaded_at)}</p></div>
                  </div>

                  <div className="border-t border-stroke pt-3 flex gap-3">
                    <button onClick={() => setPreviewDoc(doc)} className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors">
                      <Eye size={14} /> Preview
                    </button>
                    <button className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors">
                      <FileText size={14} /> Replace file
                    </button>
                  </div>
                </>
              )}

              {/* Discussion */}
              {detailTab === "discussion" && (
                <div className="space-y-3">
                  {docComments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No comments yet.</p>}
                  {docComments.map(c => {
                    const author = getProfile(c.author_id);
                    return (
                      <div key={c.id} className="flex gap-3">
                        {author && <button onClick={() => setProfileUserId(author.id)} className="shrink-0"><UserAvatar name={author.name} color={author.avatar_color} size="sm" /></button>}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{author?.name}</span>
                            <span className="text-[11px] text-muted-foreground">{formatTimeAgo(c.created_at)}</span>
                            {c.author_id === currentUser.id && (
                              <button onClick={() => setConfirmDeleteComment(c.id)} className="text-muted-foreground hover:text-red-600 ml-auto"><Trash size={13} /></button>
                            )}
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed mt-0.5">{c.body}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-3 mt-4">
                    <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
                    <div className="flex-1 flex gap-2">
                      <input value={newComment} onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmitComment()}
                        placeholder="Write a comment..." className="flex-1 rounded-full border border-stroke bg-secondary px-4 py-2 text-sm focus:outline-none" />
                      <button onClick={handleSubmitComment} disabled={!newComment.trim()}
                        className="rounded-full bg-foreground px-3 py-2 text-background hover:bg-foreground/90 disabled:opacity-40 transition-colors" aria-label="Send">
                        <PaperPlaneRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Document Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-card border border-stroke p-6 shadow-[0_8px_40px_rgba(0,0,0,0.15)] space-y-4 max-h-[90vh] overflow-y-auto"
              onKeyDown={e => e.key === "Escape" && setShowAddModal(false)}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Document</h3>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X size={20} /></button>
              </div>
              <div><label className="text-sm font-medium">Title <span className="text-red-500">*</span></label>
                <input value={addForm.title} onChange={e => setAddForm({ ...addForm, title: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" placeholder="Document title" /></div>
              <div><label className="text-sm font-medium">Description</label>
                <textarea value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none" rows={2} placeholder="Brief description" /></div>
              <div><label className="text-sm font-medium">File Attachment <span className="text-red-500">*</span></label>
                <label className="mt-1 flex items-center justify-center w-full h-20 border-2 border-dashed border-stroke rounded-lg bg-secondary hover:bg-selected transition-colors cursor-pointer">
                  {addForm.file ? (
                    <p className="text-sm font-medium">{addForm.file.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Click to upload</p>
                  )}
                  <input type="file" className="hidden" onChange={e => setAddForm({ ...addForm, file: e.target.files?.[0] || null })} />
                </label>
              </div>
              <div><label className="text-sm font-medium">Event <span className="text-red-500">*</span></label>
                <select value={addForm.event_id} onChange={e => setAddForm({ ...addForm, event_id: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none">
                  <option value="">Select event</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select></div>
              <div><label className="text-sm font-medium">Folder</label>
                <select value={addForm.folder} onChange={e => setAddForm({ ...addForm, folder: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none">
                  {allFolders.map(f => <option key={f} value={f}>{f}</option>)}
                  <option value="__new__">+ Create new folder</option>
                </select></div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddModal(false)} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">Cancel</button>
                <button onClick={handleAddDoc}
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">Save</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/60" onClick={() => setPreviewDoc(null)} />
          <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
            <div className="w-full max-w-3xl max-h-[90vh] rounded-xl bg-card border border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stroke">
                <div>
                  <h3 className="text-lg font-semibold">{previewDoc.name}</h3>
                  <p className="text-xs text-muted-foreground">{previewDoc.file_size} · {events.find(e => e.id === previewDoc.event_id)?.name || ""}</p>
                </div>
                <button onClick={() => setPreviewDoc(null)} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-[400px]">
                {previewDoc.file_url && getFileType(previewDoc.name) === 'image' ? (
                  <img src={previewDoc.file_url} alt={previewDoc.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
                ) : previewDoc.file_url && getFileType(previewDoc.name) === 'pdf' ? (
                  <iframe src={previewDoc.file_url} className="w-full h-[70vh] rounded-lg border border-stroke" title={previewDoc.name} />
                ) : (
                  <div className="text-center">
                    <FileText size={64} className="text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm font-medium mb-1">{previewDoc.name}</p>
                    <p className="text-xs text-muted-foreground mb-4">{previewDoc.description || "No preview available for this file type"}</p>
                    {previewDoc.file_url && (
                      <a href={previewDoc.file_url} target="_blank" rel="noopener noreferrer"
                        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors inline-block">
                        Download File
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog open={!!confirmDeleteFolder} title="Delete Folder"
        message={`Delete "${confirmDeleteFolder}"? Documents will be moved to "Other".`}
        confirmLabel="Delete" destructive
        onConfirm={() => confirmDeleteFolder && handleDeleteFolder(confirmDeleteFolder)}
        onCancel={() => setConfirmDeleteFolder(null)} />

      <ConfirmDialog open={!!confirmDeleteComment} title="Delete Comment"
        message="Delete this comment? This cannot be undone."
        confirmLabel="Delete" destructive
        onConfirm={() => confirmDeleteComment && handleDeleteComment(confirmDeleteComment)}
        onCancel={() => setConfirmDeleteComment(null)} />

      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
