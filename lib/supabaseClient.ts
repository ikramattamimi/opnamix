
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not set. Please check your .env file.');
}
if (!supabaseKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not set. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin operations (create/delete user, set password) run in the
// admin-users Edge Function so the service role key never reaches the browser.