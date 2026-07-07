import AdminForm from "@/app/admin/AdminForm";
import { auth, getUser } from "@clerk/nextjs/server";

/**
 * Server Component for the Admin panel.
 * Performs authentication and role validation on the server before rendering the UI.
 * The interactive form (state, file upload) is delegated to the client‑side AdminForm component.
 */
export default async function AdminPage() {
  // Authenticate the request using Clerk's server SDK
  const { userId } = auth();
  if (!userId) {
    // Not signed in – render a minimal unauthorized message (could also redirect)
    return <p>Unauthenticated – please sign in to access the admin dashboard.</p>;
  }

  // Retrieve the full user record to inspect the email address
  const user = await getUser(userId);
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  // Verify that the email matches the ADMIN_EMAIL env var (authorised admin)
  const adminEmail = process.env.ADMIN_EMAIL ?? "";
  if (email !== adminEmail) {
    // Authenticated but not authorized – render forbidden message
    return <p>Forbidden – you do not have permission to access the admin dashboard.</p>;
  }

  // Optional role validation – ADMIN_ROLE defaults to "admin"
  const adminRole = (process.env.ADMIN_ROLE ?? "admin").toLowerCase();
  // In this project role information is not stored on the user object;
  // we rely on email verification above. If a role were present, you could check it here.

  // All checks passed – render the client‑side AdminForm UI.
  return <AdminForm />;
}