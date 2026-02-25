import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    // Try both the manual secret and the built-in one
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing ENV:", { url: !!supabaseUrl, key: !!serviceRoleKey })
      return new Response(JSON.stringify({ error: "Server configuration error (missing keys)" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get user from token to verify identity
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token)

    if (authError || !user) {
      console.error("Token verification failed:", authError)
      return new Response(JSON.stringify({ error: "Invalid session or user not found" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = user.id
    console.log(`Deleting account for: ${userId}`)

    // 1. Manually clean up things that MIGHT NOT have cascade delete
    // (Storage and any loose tables)

    console.log("Cleaning up manual tables...")
    await adminClient.from('deletion_codes').delete().eq('user_id', userId)

    console.log("Cleaning up storage...")
    try {
      const { data: avatarFiles } = await adminClient.storage.from('avatars').list(userId)
      if (avatarFiles && avatarFiles.length > 0) {
        await adminClient.storage.from('avatars').remove(avatarFiles.map(f => `${userId}/${f.name}`))
      }
    } catch (e) {
      console.error("Non-fatal storage error:", e)
    }

    // 2. DELETE THE AUTH USER
    // This triggers the database "ON DELETE CASCADE" for profiles, listings, bookings, etc.
    console.log("Performing final auth deletion...")
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("Auth deletion error:", deleteError)
      return new Response(JSON.stringify({ error: `Auth Delete Error: ${deleteError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log("Deletion complete.")
    return new Response(JSON.stringify({ success: true, message: "Account successfully deleted" }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error("Global error in function:", err)
    return new Response(JSON.stringify({ error: `System Error: ${err.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
