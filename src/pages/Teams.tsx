import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Teams() {
  const { orgId, user, orgName } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    if (!orgId) return;
    supabase.from("team_members").select("*").eq("org_id", orgId).then(({ data }) => setMembers(data || []));
    supabase.from("profiles").select("*").then(({ data }) => setProfiles(data || []));
  }, [orgId]);

  const getProfile = (uid: string) => profiles.find(p => p.id === uid);

  const generateLink = async () => {
    if (!orgId || !user) return;
    const { data, error } = await supabase.from("join_tokens").insert({
      org_id: orgId, created_by: user.id, role: inviteRole,
    }).select("token").single();
    if (error) { toast.error("Failed to generate link: " + error.message); return; }
    const link = `${window.location.origin}/join/${data.token}`;
    setInviteLink(link);
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Team</h1>
          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogTrigger asChild><Button><Plus size={14} className="mr-1" />Invite Member</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
              <Tabs defaultValue="link">
                <TabsList className="w-full">
                  <TabsTrigger value="link" className="flex-1">Share Link</TabsTrigger>
                  <TabsTrigger value="email" className="flex-1">Email Invite</TabsTrigger>
                </TabsList>
                <TabsContent value="link" className="space-y-3 pt-3">
                  <div><Label>Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={generateLink} className="w-full"><Link2 size={14} className="mr-1" />Generate Invite Link</Button>
                  {inviteLink && (
                    <div className="flex items-center gap-2 rounded-lg border bg-muted p-2">
                      <Input value={inviteLink} readOnly className="text-xs" />
                      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Copied!"); }}>
                        <Copy size={14} />
                      </Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="email" className="space-y-3 pt-3">
                  <div><Label>Email</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" /></div>
                  <div><Label>Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Send Invitation</Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1">
          {members.map(m => {
            const p = getProfile(m.user_id);
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: p?.avatar_color || "#6b21a8" }}>
                  {p?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{p?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{p?.email}</p>
                </div>
                <Badge variant="secondary">{m.role}</Badge>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
