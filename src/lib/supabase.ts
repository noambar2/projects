import { createClient } from '@supabase/supabase-js'

// The publishable key is meant for browsers, so it is safe in a public repo.
// Access to data is enforced by the database's grants and RLS policies.
const SUPABASE_URL = 'https://sdnnbqinaslhtdcclioj.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_DvqMDk7QaTq93jphXjiLnQ_y5ailnbm'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
