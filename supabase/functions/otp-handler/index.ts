
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, phone, code, name } = body
    
    // Use any cast for Deno to avoid environment type errors in the editor
    const env = (Deno as any).env
    const ARKESEL_API_KEY = env.get('ARKESEL_API_KEY')
    const SUPABASE_URL = env.get('SUPABASE_URL')
    const SERVICE_ROLE_KEY = env.get('SUPABASE_SERVICE_ROLE_KEY')

    // --- ACTION: PING (For Debugging) ---
    if (action === 'ping') {
      return new Response(JSON.stringify({ 
        status: 'online', 
        has_arkesel_key: !!ARKESEL_API_KEY,
        message: 'Edge Function is reachable' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (!ARKESEL_API_KEY) {
      throw new Error('ARKESEL_API_KEY is not set in Supabase Secrets')
    }

    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!)

    // Clean the phone number: remove any non-digit characters
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : ''

    // --- ACTION: SEND OTP ---
    if (action === 'send') {
      if (!cleanPhone) throw new Error('Phone number is required for send action')

      const response = await fetch('https://sms.arkesel.com/api/otp/generate', {
        method: 'POST',
        headers: {
          'api-key': ARKESEL_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expiry: 5,
          length: 6,
          medium: 'sms',
          message: 'Your DigiShe verification code is %otp_code%. It expires in %expiry% minutes.',
          number: cleanPhone,
          sender_id: 'DigiShe',
          type: 'numeric',
        }),
      })

      const result = await response.json()
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // --- ACTION: VERIFY OTP ---
    if (action === 'verify') {
      if (!cleanPhone || !code) throw new Error('Phone and code are required for verify action')

      const response = await fetch('https://sms.arkesel.com/api/otp/verify', {
        method: 'POST',
        headers: {
          'api-key': ARKESEL_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          number: cleanPhone,
        }),
      })

      const result = await response.json()

      // 1100 = Arkesel Success Code
      if (result.code === '1100' || result.code === 1100) {
        // Find or create profile using service role for admin access
        let { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', phone) // Keep original phone format for DB consistency or use cleanPhone
          .maybeSingle()

        if (!profile) {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ 
              phone: phone, 
              name: name || 'User', 
              has_completed_onboarding: false 
            })
            .select()
            .single()
          
          if (insertError) throw insertError
          profile = newProfile
        }

        return new Response(JSON.stringify({ success: true, profile }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      return new Response(JSON.stringify({ success: false, ...result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 but success: false to avoid catch blocks in frontend for "valid" business logic errors
      })
    }

    throw new Error(`Invalid action: ${action}`)
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      details: 'Check Edge Function logs in Supabase Dashboard'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
