import { auth, currentUser } from '@clerk/nextjs/server';
import { AuthenticationError, AuthorizationError } from './errors';

/**
 * Ensures the request is authenticated. Throws AuthenticationError if not.
 */
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new AuthenticationError('User not authenticated');
  }
  return userId;
}

/**
 * Retrieves the current user object from Clerk.
 */
export async function getCurrentUser() {
  const user = await currentUser();
  if (!user) {
    throw new AuthenticationError('User not authenticated');
  }
  return user;
}

/**
 * Checks if the current user has admin role based on publicMetadata.role.
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  const role = (user.publicMetadata as any)?.role;
  return role === 'admin';
}

/**
 * Enforces admin role. Throws AuthorizationError if not admin.
 */
export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new AuthorizationError('Admin privileges required');
  }
  return true;
}
