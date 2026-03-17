import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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

    // Use Supabase Admin API to invite user by email
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { name, role, department },
    });

    if (error) {
      console.error("Invite error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If user was created, also create their profile
    if (data?.user) {
      const avatarColors = ["#4338ca", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"];
      const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
      
      await supabase.from("profiles").upsert({
        id: data.user.id,
        name,
        email,
        avatar_color: randomColor,
        dept_name: department || null,
      }, { onConflict: "id" });

      // Set role if provided
      if (role) {
        const roleMap: Record<string, string> = {
          "Admin": "sa",
          "Manager": "org",
          "Member": "dept_member",
          "Guest": "dept_member",
          "Dept Head": "dept_head",
        };
        const dbRole = roleMap[role] || "dept_member";
        await supabase.from("user_roles").upsert({
          user_id: data.user.id,
          role: dbRole,
        }, { onConflict: "user_id,role" });
      }
    }

    return new Response(JSON.stringify({ success: true, user_id: data?.user?.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
