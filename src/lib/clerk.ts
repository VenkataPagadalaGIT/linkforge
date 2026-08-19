/**
 * Clerk is optional: the whole feature keys off the publishable key being
 * present, so local dev and CI run with the legacy password login and no
 * Clerk account. When the key is set, the admin layout mounts ClerkProvider,
 * the login page renders Clerk's SignIn, and the API client asks Clerk for
 * a session token per request instead of reading localStorage. That last
 * part also retires the localStorage credential, which was the standing
 * XSS-theft caveat in the security notes.
 */
export const CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

export const clerkEnabled = CLERK_PUBLISHABLE_KEY.length > 0;
