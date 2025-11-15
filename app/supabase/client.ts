import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

// Add validation to ensure environment variables are defined
if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable')
}
if (!supabaseKey) {
  throw new Error('Missing SUPABASE_KEY environment variable')
}

// FRONTEND-SAFE CLIENT - uses anon key, respects RLS
export const supabase = createClient(supabaseUrl, supabaseKey)