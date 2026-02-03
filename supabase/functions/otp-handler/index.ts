import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Normalizes phone numbers to a standard format (e.g., 233503088600).
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 0 and is 10 digits, it's a local Ghana number
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '233' + cleaned.substring(1);
  } 
  // If it's 9 digits, it's likely a local number without the leading zero
  else if (cleaned.length === 9) {
    cleaned = '233' + cleaned;
  }
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, phone, code, name, mode } = await req.json()
    // Fix: Access Deno through globalThis to avoid "Cannot find name 'Deno'" compiler error
    const env = (globalThis as any).Deno.env
    const ARKESEL_KEY = env.get('ARKESEL_API_KEY')
    const SUPABASE_URL = env.get('SUPABASE_URL')
    const SERVICE_KEY = env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!ARKESEL_KEY) throw new Error('ARKESEL_API_KEY is missing in Supabase Secrets.')

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    // Strictly normalize the phone number before any logic
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      throw new Error('Invalid phone number format provided.');
    }

    if (action === 'send') {
      // Step 1: Check if user exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      // Step 2: Validate against the requested mode
      if (mode === 'login' && !profile) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Account not found. Please register first.', 
            code: 'USER_NOT_FOUND' 
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      if (mode === 'register' && profile) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'This number is already registered. Please login.', 
            code: 'USER_ALREADY_EXISTS' 
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      console.log(`Sending OTP to normalized number: ${normalizedPhone}`);
      const response = await fetch('https://sms.arkesel.com/api/otp/generate', {
        method: 'POST',
        headers: { 'api-key': ARKESEL_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiry: 5, 
          length: 6, 
          medium: 'sms', 
          sender_id: 'DigiShe',
          message: 'Your DigiShe code is %otp_code%. It expires in %expiry% min.',
          number: normalizedPhone, 
          type: 'numeric'
        }),
      })
      const result = await response.json();
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'verify') {
      console.log(`Verifying OTP for normalized number: ${normalizedPhone}`);
      const response = await fetch('https://sms.arkesel.com/api/otp/verify', {
        method: 'POST',
        headers: { 'api-key': ARKESEL_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, number: normalizedPhone }),
      })
      const result = await response.json()

      if (result.code === '1100' || result.code === 1100) {
        // ALWAYS use normalizedPhone for DB lookups and inserts
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', normalizedPhone)
          .maybeSingle()

        if (!profile) {
          console.log(`Creating new profile with normalized number: ${normalizedPhone}`);
          const { data: newP, error: iErr } = await supabase
            .from('profiles')
            .insert({ 
              phone: normalizedPhone, 
              name: name || 'User',
              has_completed_onboarding: false
            })
            .select()
            .single()
          
          if (iErr) throw iErr
          profile = newP
        }
        
        return new Response(JSON.stringify({ success: true, profile }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }
      
      return new Response(JSON.stringify({ success: false, ...result }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    throw new Error('Invalid action requested.');
  } catch (error) {
    console.error(`Edge Function Error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})