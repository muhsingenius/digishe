
import { createClient } from '@supabase/supabase-js';

/**
 * Robustly fetch environment variables with hardcoded fallbacks 
 * using the credentials provided by the user.
 */
const getEnvVar = (key: string): string | undefined => {
  // Check global process
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Check window.process
  const windowProcess = (window as any).process;
  if (windowProcess && windowProcess.env && windowProcess.env[key]) {
    return windowProcess.env[key];
  }
  return undefined;
};

// Use provided credentials as primary values or fallbacks
const SUPABASE_URL = getEnvVar('SUPABASE_URL') || 'https://hxpkierzfyotsdtldmej.supabase.co';
const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cGtpZXJ6ZnlvdHNkdGxkbWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTUwMzcsImV4cCI6MjA4NDkzMTAzN30.y-4LTmjjiAlItWK0jQc0rRwChG2goLmg40LjdDL0TCg';

// Initialize the client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Checks if the Supabase configuration is valid
 */
export const isSupabaseConfigured = () => {
  return !!SUPABASE_URL && 
         !!SUPABASE_ANON_KEY && 
         SUPABASE_URL.includes('supabase.co');
};
