import { SignIn } from "@clerk/nextjs";
import { appearance } from "@/lib/clerkAppearance";

/**
 * Sign‑In page – uses Clerk's SignIn component with custom appearance and
 * built‑in redirect support.
 *
 * Query param `redirect` (e.g. `/auth/sign-in?redirect=/product/123`) tells Clerk
 * where to send the user after a successful sign‑in. If the value is missing or
 * unsafe, we fall back to the home page (`/`).
 */
export default function SignInPage({ searchParams }: { searchParams?: { redirect?: string, redirect_url?: string } }) {
  // Determine safe redirect URL – check for Clerk's default redirect_url first.
  const rawRedirect = searchParams?.redirect_url || searchParams?.redirect || "/account";
  const safeRedirect = /^\/[A-Za-z0-9/_-]*$/.test(rawRedirect) ? rawRedirect : "/account";

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div
        className="border-brutal border-3 border-brutal-black bg-cream p-8"
        style={{ boxShadow: "8px 8px 0 #0A0A0A" }}
      >
        <SignIn appearance={appearance} fallbackRedirectUrl={safeRedirect} />
      </div>
    </div>
  );
}
