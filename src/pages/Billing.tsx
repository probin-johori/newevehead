import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Billing() {
  const { orgId, user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [filterEvent, setFilterEvent] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [vendor, setVendor] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [eventId, setEventId] = useState("");

  useEffect(() => {
    if (!orgId) return;
    supabase.from("events").select("*").eq("org_id", orgId).then(({ data }) => setEvents(data || []));
  }, [orgId]);

  const loadBills = () => {
    if (events.length === 0) return;
    const ids = filterEvent === "all" ? events.map(e => e.id) : [filterEvent];
    supabase.from("bills").select("*").in("event_id", ids).order("submitted_at", { ascending: false })
      .then(({ data }) => setBills(data || []));
  };

  useEffect(() => { loadBills(); }, [events, filterEvent]);

  useEffect(() => {
    const ch = supabase.channel("bills-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "bills" }, loadBills)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [events, filterEvent]);

  const handleAdd = async () => {
    if (!vendor.trim() || !eventId || !user) return;
    const { error } = await supabase.from("bills").insert({
      vendor_name: vendor, description: desc, amount: parseFloat(amount) || 0,
      event_id: eventId, submitted_by: user.id,
    });
    if (error) toast.error(error.message);
    else { toast.success("Bill added"); setShowAdd(false); setVendor(""); setDesc(""); setAmount(""); }
  };

  const statusColor = (s: string) => {
    if (s === "paid" || s === "approved") return "bg-emerald-100 text-emerald-700";
    if (s === "pending") return "bg-amber-100 text-amber-700";
    if (s === "rejected") return "bg-red-100 text-red-700";
    return "bg-muted text-muted-foreground";
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Billing</h1>
          <div className="flex gap-2">
            <Select value={filterEvent} onValueChange={setFilterEvent}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Events" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild><Button><Plus size={14} className="mr-1" />Add Bill</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Bill</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div><Label>Event *</Label>
                    <Select value={eventId} onValueChange={setEventId}>
                      <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                      <SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Vendor</Label><Input value={vendor} onChange={e => setVendor(e.target.value)} /></div>
                  <div><Label>Description</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
                  <div><Label>Amount</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
                  <Button onClick={handleAdd} className="w-full">Add Bill</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="space-y-1">
          {bills.length === 0 && <p className="py-8 text-center text-muted-foreground">No bills found</p>}
          {bills.map(bill => (
            <div key={bill.id} onClick={() => setSelectedBill(bill)}
              className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 hover:bg-accent/50">
              <div className="flex-1">
                <p className="text-sm font-medium">{bill.description || bill.vendor_name}</p>
                <p className="text-xs text-muted-foreground">{bill.vendor_name} · {format(new Date(bill.submitted_at), "MMM d, yyyy")}</p>
              </div>
              <p className="text-sm font-semibold">₹{bill.amount.toLocaleString()}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(bill.status)}`}>{bill.status}</span>
            </div>
          ))}
        </div>
      </div>

      <Sheet open={!!selectedBill} onOpenChange={o => { if (!o) setSelectedBill(null); }}>
        <SheetContent>
          {selectedBill && (
            <>
              <SheetHeader><SheetTitle>{selectedBill.description}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-3">
                <div><span className="text-sm text-muted-foreground">Vendor:</span> <span className="text-sm font-medium">{selectedBill.vendor_name}</span></div>
                <div><span className="text-sm text-muted-foreground">Amount:</span> <span className="text-sm font-semibold">₹{selectedBill.amount.toLocaleString()}</span></div>
                <div><span className="text-sm text-muted-foreground">Status:</span> <Badge>{selectedBill.status}</Badge></div>
                {(selectedBill.invoice_files?.length > 0 || selectedBill.invoice_file || selectedBill.bill_file_url) && (
                  <div>
                    <p className="text-sm font-medium mb-2">Attachments</p>
                    {selectedBill.bill_file_url && <a href={selectedBill.bill_file_url} target="_blank" rel="noreferrer" className="block text-sm text-blue-600 hover:underline">Bill File</a>}
                    {selectedBill.invoice_file && <a href={selectedBill.invoice_file} target="_blank" rel="noreferrer" className="block text-sm text-blue-600 hover:underline">Invoice</a>}
                    {selectedBill.invoice_files?.map((f: string, i: number) => (
                      <a key={i} href={f} target="_blank" rel="noreferrer" className="block text-sm text-blue-600 hover:underline">Attachment {i + 1}</a>
                    ))}
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
