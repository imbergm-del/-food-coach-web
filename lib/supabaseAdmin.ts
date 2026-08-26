import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-only jobs (cron) that must read across all users,
// bypassing RLS. Never import this from client or user-facing request code.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
