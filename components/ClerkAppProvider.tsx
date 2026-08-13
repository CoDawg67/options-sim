import { ClerkProvider } from "@clerk/nextjs";

// Employer accounts are optional (Phase 5) — wrapping in ClerkProvider only
// when a publishable key is configured means the site still runs before
// Clerk is set up, instead of throwing on every request.
export function ClerkAppProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return <>{children}</>;
  return <ClerkProvider>{children}</ClerkProvider>;
}
