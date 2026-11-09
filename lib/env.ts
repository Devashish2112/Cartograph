function required(name: string, value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return trimmed;
}

function requiredUrl(name: string, value: string | undefined): string {
  const url = required(name, value);

  try {
    new URL(url);
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL`);
  }

  return url;
}

export const env = {
  clerkPublishableKey: required(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  ),
  supabaseUrl: requiredUrl(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabasePublishableKey: required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
} as const;
