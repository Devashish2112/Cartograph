function required(name: string, value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return trimmed;
}

export const serverEnv = {
  clerkSecretKey: required("CLERK_SECRET_KEY", process.env.CLERK_SECRET_KEY),
} as const;
