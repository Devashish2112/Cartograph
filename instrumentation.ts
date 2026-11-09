export async function register() {
  // Importing these modules runs their validation before the server accepts
  // requests, so a missing value fails at boot instead of on first use.
  await import("./lib/env");

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/env.server");
  }
}
