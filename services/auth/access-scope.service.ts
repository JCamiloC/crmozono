import { createSupabaseBrowserClient } from "../../lib/supabase/client";
import type { Role } from "../../types";

export type AccessScope = {
  userId: string;
  role: Role;
  countryId: string | null;
  countryName: string | null;
};

type ProfileScopeRow = {
  role: Role;
  country_id: string | null;
};

type CountryRow = {
  name: string;
};

export const getCurrentAccessScope = async (): Promise<AccessScope | null> => {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role, country_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profileData) {
    return null;
  }

  const scopeRow = profileData as ProfileScopeRow;
  let countryName: string | null = null;

  if (scopeRow.country_id) {
    const { data: countryData } = await supabase
      .from("countries")
      .select("name")
      .eq("id", scopeRow.country_id)
      .maybeSingle();

    countryName = ((countryData as CountryRow | null)?.name ?? null)?.trim() || null;
  }

  return {
    userId: user.id,
    role: scopeRow.role,
    countryId: scopeRow.country_id,
    countryName,
  };
};
