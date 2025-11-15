import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Add validation to ensure environment variables are defined
if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable')
}
if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// SERVER-ONLY ADMIN CLIENT - uses service role key, bypasses RLS
// ⚠️ NEVER import this in client-side code!
// Remix guarantees .server.ts files are never bundled to the browser
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
