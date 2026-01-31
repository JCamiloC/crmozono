import { createSupabaseBrowserClient } from "../../lib/supabase/client";
import type { UserProfile } from "../../types";

type SignInPayload = {
  email: string;
  password: string;
};

export const signInWithPassword = async ({ email, password }: SignInPayload) => {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.signOut();
};

export const fetchUserProfile = async (userId: string) => {
  const supabase = createSupabaseBrowserClient();

  const result = await supabase
    .from("profiles")
    .select("id, email, role, country_id, created_at")
    .eq("id", userId)
    .single();

  if (result.error || !result.data) {
    return result;
  }

  const profile: UserProfile = {
    id: result.data.id,
    email: result.data.email,
    role: result.data.role,
    countryId: result.data.country_id,
    createdAt: result.data.created_at,
  };

  return { ...result, data: profile };
};
