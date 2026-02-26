import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("Delete-account started (Dual Verification Mode)")

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Missing Authorization")

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    console.log(`Verifying user using Anon Key (${anonKey.substring(0, 10)}...)`)

    // 1. Use ANON key to verify the user (this is what the token was issued for)
    const verificationClient = createClient(supabaseUrl, anonKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await verificationClient.auth.getUser(token)

    if (authError || !user) {
      console.error("User identity verification failed:", authError?.message)
      return new Response(JSON.stringify({ error: `User identity check failed: ${authError?.message || "Invalid session"}` }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = user.id
    console.log(`Verified user: ${userId}. Proceeding to delete using Service Key (${serviceKey.substring(0, 10)}...)`)

    // 2. Use SERVICE key for the actual deletion
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Clean up storage (it doesn't cascade)
    try {
      const { data: files } = await adminClient.storage.from('avatars').list(userId)
      if (files && files.length > 0) {
        await adminClient.storage.from('avatars').remove(files.map(f => `${userId}/${f.name}`))
      }
    } catch (e) {
      console.warn("Storage cleanup failed:", e.message)
    }

    // Attempt the deletion
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error("Service key failed to delete user:", deleteError.message)
      throw new Error(`Permission Denied: ${deleteError.message}`)
    }

    console.log("Account wiped successfully")
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error("Function fatal error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
