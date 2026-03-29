import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Settings() {
  const { profile, user, orgId, orgName, refreshProfile, userRole } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [editOrgName, setEditOrgName] = useState(orgName || "");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const updateProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ name, phone }).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Profile updated"); refreshProfile(); }
  };

  const updateOrg = async () => {
    if (!orgId) return;
    const { error } = await supabase.from("organisations").update({ name: editOrgName }).eq("id", orgId);
    if (error) toast.error(error.message);
    else { toast.success("Organisation updated"); refreshProfile(); }
  };

  const deleteOrg = async () => {
    if (!orgId || deleteConfirm !== orgName) return;
    const { error } = await supabase.from("organisations").delete().eq("id", orgId);
    if (error) toast.error(error.message);
    else { toast.success("Organisation deleted"); window.location.href = "/"; }
  };

  const isSA = userRole === "sa" || userRole === "org";

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {isSA && <TabsTrigger value="organisation">Organisation</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Your Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                <div><Label>Email</Label><Input value={profile?.email || ""} disabled /></div>
                <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
                <Button onClick={updateProfile}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {isSA && (
            <TabsContent value="organisation" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle>Organisation Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label>Organisation Name</Label><Input value={editOrgName} onChange={e => setEditOrgName(e.target.value)} /></div>
                  <Button onClick={updateOrg}>Update Organisation</Button>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Deleting your organisation will permanently remove all events, tasks, bills, and documents.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete Organisation</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{orgName}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Type <strong>{orgName}</strong> to confirm.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={orgName || ""} />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteOrg} disabled={deleteConfirm !== orgName}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppShell>
  );
}
