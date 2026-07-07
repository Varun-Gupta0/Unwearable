import { SignUp } from "@clerk/nextjs";
import { appearance } from "@/lib/clerkAppearance";

/**
 * Sign‑Up page – custom appearance and safe redirect after successful registration.
 */
export default function SignUpPage({ searchParams }: { searchParams?: { redirect?: string, redirect_url?: string } }) {
  const rawRedirect = searchParams?.redirect_url || searchParams?.redirect || "/account";
  const safeRedirect = /^\/[A-Za-z0-9/_-]*$/.test(rawRedirect) ? rawRedirect : "/account";

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div
        className="border-brutal border-3 border-brutal-black bg-cream p-8"
        style={{ boxShadow: "8px 8px 0 #0A0A0A" }}
      >
        <SignUp appearance={appearance} fallbackRedirectUrl={safeRedirect} />
      </div>
    </div>
  );
}
