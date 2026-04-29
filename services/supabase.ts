
import { createClient } from '@supabase/supabase-js';

/**
 * Robustly fetch environment variables.
 * Standardizes on Vite's import.meta.env but falls back to process.env
 * which is often defined via Vite's 'define' config in production.
 */
const getEnvVar = (key: string): string | undefined => {
  const viteKey = `VITE_${key}`;
  
  // 1. Try import.meta.env (Vite standard)
  // We use the literal to ensure Vite's static replacement works
  try {
    if (import.meta.env[viteKey]) return import.meta.env[viteKey];
    if (import.meta.env[key]) return import.meta.env[key];
  } catch (e) {
    // import.meta might fail in some contexts, fallback gracefully
  }

  // 2. Try process.env (Standard Node/Defined via Vite config)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[viteKey]) return process.env[viteKey];
    if (process.env[key]) return process.env[key];
  }
  
  // 3. Try window.process (Legacy fallback)
  const windowProcess = (window as any).process;
  if (windowProcess && windowProcess.env) {
    if (windowProcess.env[viteKey]) return windowProcess.env[viteKey];
    if (windowProcess.env[key]) return windowProcess.env[key];
  }
  
  return undefined;
};

// Use provided credentials as primary values or fallbacks
// We use static access to allow Vite's 'define' or static replacement to work
const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 
                   import.meta.env.VITE_SUPABASE_URL || 
                   'https://hxpkierzfyotsdtldmej.supabase.co';

const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || 
                        import.meta.env.VITE_SUPABASE_ANON_KEY || 
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cGtpZXJ6ZnlvdHNkdGxkbWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTUwMzcsImV4cCI6MjA4NDkzMTAzN30.y-4LTmjjiAlItWK0jQc0rRwChG2goLmg40LjdDL0TCg';

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
