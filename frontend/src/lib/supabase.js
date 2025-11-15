import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lmraybypqymqkplwgqer.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcmF5YnlwcXltcWtwbHdncWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTU3ODAsImV4cCI6MjA3NTE5MTc4MH0.6Hah2IpCKvQI-x_zspLVZ6LVhloym63hG2mOyhI-dyY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

