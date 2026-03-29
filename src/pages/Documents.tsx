import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Documents() {
  const { orgId, user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [filterEvent, setFilterEvent] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [eventId, setEventId] = useState("");
  const [folder, setFolder] = useState("General");

  useEffect(() => {
    if (!orgId) return;
    supabase.from("events").select("*").eq("org_id", orgId).then(({ data }) => setEvents(data || []));
  }, [orgId]);

  const loadDocs = () => {
    if (events.length === 0) return;
    const ids = filterEvent === "all" ? events.map(e => e.id) : [filterEvent];
    supabase.from("documents").select("*").in("event_id", ids).order("uploaded_at", { ascending: false })
      .then(({ data }) => setDocuments(data || []));
  };

  useEffect(() => { loadDocs(); }, [events, filterEvent]);

  const handleAdd = async () => {
    if (!docName.trim() || !eventId || !user) return;
    const { error } = await supabase.from("documents").insert({
      name: docName, file_url: docUrl, event_id: eventId, folder,
      uploaded_by: user.id, file_size: "0 KB",
    });
    if (error) toast.error(error.message);
    else { toast.success("Document added"); setShowAdd(false); setDocName(""); setDocUrl(""); }
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPdf = (url: string) => /\.pdf$/i.test(url);

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Documents</h1>
          <div className="flex gap-2">
            <Select value={filterEvent} onValueChange={setFilterEvent}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Events" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild><Button><Plus size={14} className="mr-1" />Add Document</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div><Label>Event *</Label>
                    <Select value={eventId} onValueChange={setEventId}>
                      <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                      <SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Name</Label><Input value={docName} onChange={e => setDocName(e.target.value)} /></div>
                  <div><Label>File URL</Label><Input value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://..." /></div>
                  <div><Label>Folder</Label><Input value={folder} onChange={e => setFolder(e.target.value)} /></div>
                  <Button onClick={handleAdd} className="w-full">Add Document</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="space-y-1">
          {documents.length === 0 && <p className="py-8 text-center text-muted-foreground">No documents found</p>}
          {documents.map(doc => (
            <div key={doc.id} onClick={() => setSelectedDoc(doc)}
              className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 hover:bg-accent/50">
              <FileText size={16} className="text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.folder} · {doc.file_size}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Sheet open={!!selectedDoc} onOpenChange={o => { if (!o) setSelectedDoc(null); }}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          {selectedDoc && (
            <>
              <SheetHeader><SheetTitle>{selectedDoc.name}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">{selectedDoc.description || "No description"}</p>
                <p className="text-xs text-muted-foreground">Folder: {selectedDoc.folder} · Size: {selectedDoc.file_size}</p>
                {selectedDoc.file_url && (
                  <div className="mt-4">
                    {isImage(selectedDoc.file_url) && <img src={selectedDoc.file_url} alt={selectedDoc.name} className="max-h-96 rounded-lg" />}
                    {isPdf(selectedDoc.file_url) && <iframe src={selectedDoc.file_url} className="h-96 w-full rounded-lg border" />}
                    <a href={selectedDoc.file_url} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-blue-600 hover:underline">Open in new tab</a>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
