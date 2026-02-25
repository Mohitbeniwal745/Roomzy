import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user via their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Deleting account for user:", user.id);

    // Use admin client for all deletions
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Get all listings by this host
    const { data: listings } = await adminClient
      .from("listings")
      .select("id")
      .eq("host_id", user.id);

    const listingIds = (listings ?? []).map((l: { id: string }) => l.id);
    console.log("Found listings:", listingIds.length);

    if (listingIds.length > 0) {
      // Delete listing images
      const { error: imgErr } = await adminClient
        .from("listing_images")
        .delete()
        .in("listing_id", listingIds);
      if (imgErr) console.error("listing_images delete error:", imgErr);

      // Delete rooms
      const { error: roomsErr } = await adminClient
        .from("rooms")
        .delete()
        .in("listing_id", listingIds);
      if (roomsErr) console.error("rooms delete error:", roomsErr);

      // Cancel active bookings for these listings (by guests)
      const { error: bookingsHostErr } = await adminClient
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_by: user.id,
          cancellation_reason: "Host account deleted",
        })
        .in("listing_id", listingIds)
        .neq("status", "cancelled");
      if (bookingsHostErr) console.error("host bookings cancel error:", bookingsHostErr);

      // Delete the listings themselves
      const { error: listingsErr } = await adminClient
        .from("listings")
        .delete()
        .eq("host_id", user.id);
      if (listingsErr) console.error("listings delete error:", listingsErr);
    }

    // 2. Cancel this user's guest bookings
    const { error: guestBookingsErr } = await adminClient
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_by: user.id,
        cancellation_reason: "Guest account deleted",
      })
      .eq("guest_id", user.id)
      .neq("status", "cancelled");
    if (guestBookingsErr) console.error("guest bookings cancel error:", guestBookingsErr);

    // Also delete any purely guest bookings rows
    await adminClient.from("bookings").delete().eq("guest_id", user.id);

    // 3. Delete messages in conversations
    const { data: conversations } = await adminClient
      .from("conversations")
      .select("id")
      .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`);

    const convIds = (conversations ?? []).map((c: { id: string }) => c.id);
    if (convIds.length > 0) {
      await adminClient.from("messages").delete().in("conversation_id", convIds);
    }

    // 4. Delete conversations
    const { error: convErr } = await adminClient
      .from("conversations")
      .delete()
      .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`);
    if (convErr) console.error("conversations delete error:", convErr);

    // 5. Delete deletion_codes if exists
    await adminClient.from("deletion_codes").delete().eq("user_id", user.id);

    // 6. Delete user_roles
    const { error: rolesErr } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", user.id);
    if (rolesErr) console.error("user_roles delete error:", rolesErr);

    // 7. Delete profile
    const { error: profileErr } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", user.id);
    if (profileErr) console.error("profiles delete error:", profileErr);

    // 8. Delete avatar from storage
    try {
      const { data: avatarFiles } = await adminClient.storage
        .from("avatars")
        .list(user.id);
      if (avatarFiles && avatarFiles.length > 0) {
        await adminClient.storage
          .from("avatars")
          .remove(avatarFiles.map((f: { name: string }) => `${user.id}/${f.name}`));
      }
    } catch (storageErr) {
      console.error("Avatar storage delete error:", storageErr);
    }

    // 9. Finally delete the auth user
    const { error: deleteUserErr } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteUserErr) {
      console.error("Delete auth user error:", deleteUserErr);
      return new Response(JSON.stringify({ error: deleteUserErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Successfully deleted user:", user.id);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
