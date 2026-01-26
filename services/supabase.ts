
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hxpkierzfyotsdtldmej.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cGtpZXJ6ZnlvdHNkdGxkbWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTUwMzcsImV4cCI6MjA4NDkzMTAzN30.y-4LTmjjiAlItWK0jQc0rRwChG2goLmg40LjdDL0TCg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
