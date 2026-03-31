import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Buildings, LinkSimple, ArrowRight, Plus } from "@phosphor-icons/react";

type Mode = "choose" | "create" | "join";

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("choose");
  const [orgName, setOrgName] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [displayName, setDisplayName] = useState(profile?.name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateOrg = async () => {
    if (!user) return;
    if (!orgName.trim()) { setError("Organisation name is required"); return; }
    setLoading(true);
    setError("");

    // Update display name if changed
    if (displayName.trim() && displayName !== profile?.name) {
      await supabase.from("profiles").update({ name: displayName.trim() }).eq("id", user.id);
    }

    // Create org
    const { data: org, error: orgErr } = await supabase
      .from("organisations")
      .insert({ name: orgName.trim(), created_by: user.id })
      .select("id")
      .single();

    if (orgErr) {
      setError(orgErr.message);
      setLoading(false);
      return;
    }

    // Add as admin member
    await supabase.from("team_members").insert({
      user_id: user.id,
      org_id: org.id,
      role: "admin",
      invited_by: user.id,
    });

    await refreshProfile();
    toast({ title: "Welcome!", description: `"${orgName.trim()}" created successfully.` });
    navigate("/dashboard");
  };

  const handleJoinOrg = async () => {
    if (!user) return;
    if (!inviteLink.trim()) { setError("Paste the invite link"); return; }
    setLoading(true);
    setError("");

    // Update display name if changed
    if (displayName.trim() && displayName !== profile?.name) {
      await supabase.from("profiles").update({ name: displayName.trim() }).eq("id", user.id);
    }

    // Extract token from link - supports /join/TOKEN or raw TOKEN
    let token = inviteLink.trim();
    const joinMatch = token.match(/\/join\/([a-zA-Z0-9]+)/);
    if (joinMatch) token = joinMatch[1];

    // Use the accept_join_token RPC
    const { data, error: rpcErr } = await supabase.rpc("accept_join_token", { _token: token });

    if (rpcErr) {
      setError(rpcErr.message || "Invalid or expired invite link");
      setLoading(false);
      return;
    }

    await refreshProfile();
    toast({ title: "Joined!", description: "You've joined the organisation." });
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-rose-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 text-lg font-bold text-white shadow-lg shadow-rose-500/25">
            EH
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Set up your workspace
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            One last step before you get started.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 backdrop-blur-sm shadow-2xl space-y-5">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Your name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors"
            />
          </div>

          {mode === "choose" && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-zinc-400">How would you like to start?</p>
              <button
                onClick={() => setMode("create")}
                className="group flex w-full items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 text-left transition-all hover:border-rose-500/50 hover:bg-zinc-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20">
                  <Plus size={20} weight="bold" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Create an organisation</p>
                  <p className="text-xs text-zinc-500">Start fresh with your own workspace</p>
                </div>
                <ArrowRight size={16} className="ml-auto text-zinc-600 group-hover:text-zinc-400" />
              </button>

              <button
                onClick={() => setMode("join")}
                className="group flex w-full items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 text-left transition-all hover:border-violet-500/50 hover:bg-zinc-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20">
                  <LinkSimple size={20} weight="bold" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Join with invite link</p>
                  <p className="text-xs text-zinc-500">Paste a link shared by your team admin</p>
                </div>
                <ArrowRight size={16} className="ml-auto text-zinc-600 group-hover:text-zinc-400" />
              </button>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Organisation name</label>
                <div className="relative">
                  <Buildings size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="e.g. Acme Events"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setMode("choose"); setError(""); }}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateOrg}
                  disabled={loading || !orgName.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 transition-all"
                >
                  {loading ? "Creating…" : "Create & Continue"}
                </button>
              </div>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Invite link</label>
                <div className="relative">
                  <LinkSimple size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={inviteLink}
                    onChange={e => setInviteLink(e.target.value)}
                    placeholder="Paste your invite link here"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setMode("choose"); setError(""); }}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleJoinOrg}
                  disabled={loading || !inviteLink.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-violet-600 hover:to-violet-700 disabled:opacity-50 transition-all"
                >
                  {loading ? "Joining…" : "Join & Continue"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
