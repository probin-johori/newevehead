import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is authenticated and get their user id
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, name, role, department } = await req.json();

    if (!email || !name) {
      return new Response(JSON.stringify({ error: "Email and name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine the caller's org_id (use their own id as org for now)
    const { data: callerTeam } = await supabase
      .from("team_members")
      .select("org_id")
      .eq("user_id", caller.id)
      .limit(1)
      .single();

    const orgId = callerTeam?.org_id || caller.id;

    // If caller has no team membership yet, create one as admin
    if (!callerTeam) {
      await supabase.from("team_members").insert({
        org_id: orgId,
        user_id: caller.id,
        role: "admin",
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

    let invitedUserId: string | null = null;

    if (existingUser) {
      // User already exists — just add to team
      invitedUserId = existingUser.id;
    } else {
      // Invite new user via email
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { name, role, department },
      });

      if (error) {
        console.error("Invite error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      invitedUserId = data?.user?.id || null;

      // Create profile for new user
      if (invitedUserId) {
        const avatarColors = ["#4338ca", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"];
        const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

        await supabase.from("profiles").upsert({
          id: invitedUserId,
          name,
          email,
          avatar_color: randomColor,
          dept_name: department || null,
        }, { onConflict: "id" });

        // Set role
        if (role) {
          const roleMap: Record<string, string> = {
            "Admin": "sa", "Manager": "org", "Member": "dept_member",
            "Guest": "dept_member", "Dept Head": "dept_head",
          };
          const dbRole = roleMap[role] || "dept_member";
          await supabase.from("user_roles").upsert({
            user_id: invitedUserId,
            role: dbRole,
          }, { onConflict: "user_id,role" });
        }
      }
    }

    // Add invited user to team_members
    if (invitedUserId) {
      const teamRole = role === "Admin" ? "admin" : role === "Manager" ? "manager" : "member";
      await supabase.from("team_members").upsert({
        org_id: orgId,
        user_id: invitedUserId,
        invited_by: caller.id,
        role: teamRole,
      }, { onConflict: "org_id,user_id" });
    }

    return new Response(JSON.stringify({ success: true, user_id: invitedUserId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
