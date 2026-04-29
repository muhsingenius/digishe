
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Normalizes phone numbers specifically for Ghana (233).
 * Identical logic to the frontend to prevent duplicate accounts.
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('233')) {
    cleaned = cleaned.substring(3);
  }
  
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  return '233' + cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}));
    const { action, phone, code, name, mode } = body;
    
    const env = (globalThis as any).Deno.env
    const ARKESEL_KEY = env.get('ARKESEL_API_KEY')
    const SUPABASE_URL = env.get('SUPABASE_URL')
    const SERVICE_KEY = env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!ARKESEL_KEY) throw new Error('ARKESEL_API_KEY is missing in Supabase Secrets.')
    if (!SUPABASE_URL) throw new Error('SUPABASE_URL is missing in Supabase Secrets.')
    if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in Supabase Secrets.')

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    if (!phone) throw new Error('Phone number is required.')

    // Strictly normalize the phone number before any logic
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      throw new Error(`Invalid phone number format: ${phone}`);
    }

    if (action === 'send') {
      // Step 1: Check if user exists
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (pErr) console.error('Profile lookup error:', pErr);

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
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error(`Arkesel Send Response was not JSON: ${text.substring(0, 100)}`);
      }
      
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'verify') {
      if (!code) throw new Error('OTP code is required for verification.');
      
      console.log(`Verifying OTP for normalized number: ${normalizedPhone} with code: ${code}`);
      const response = await fetch('https://sms.arkesel.com/api/otp/verify', {
        method: 'POST',
        headers: { 'api-key': ARKESEL_KEY, 'Content-Type': 'application/json' },
        // Try both 'code' and 'otp' just in case Arkesel changed their API
        body: JSON.stringify({ otp: code, code, number: normalizedPhone }),
      })
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error(`Arkesel Verify Response was not JSON: ${text.substring(0, 100)}`);
      }

      // Arkesel success code is 1100.
      if (result.code === '1100' || result.code === 1100 || result.status === 'success') {
        // ALWAYS use normalizedPhone for DB lookups and inserts
        let { data: profile, error: fErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', normalizedPhone)
          .maybeSingle()

        if (fErr) {
          console.error('Fetch profile error during verify:', fErr);
          throw new Error(`Database error fetching profile: ${fErr.message}`);
        }

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
          
          if (iErr) {
            console.error('Insert profile error:', iErr);
            throw new Error(`Database error creating profile: ${iErr.message}`);
          }
          profile = newP
        }
        
        return new Response(JSON.stringify({ success: true, profile }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }
      
      // If code is not successful, return 200 with success: false
      return new Response(JSON.stringify({ success: false, ...result }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    throw new Error(`Invalid action requested: ${action}`);
  } catch (error) {
    console.error(`Edge Function Error: ${error.message}`);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: error.stack
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})
