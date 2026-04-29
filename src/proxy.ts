import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const session = await auth();
    const adminEmail = (process.env.ADMIN_EMAIL || 'varungupta010307@gmail.com').toLowerCase();

    // If user is not signed in, protect() handles the redirect to sign-in
    if (!session.userId) {
      await auth.protect();
      return;
    }

    // Fetch full user object to check primary email
    const client = await clerkClient();
    const user = await client.users.getUser(session.userId);
    const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

    if (userEmail !== adminEmail) {
      // Redirect unauthorized users to home
      return Response.redirect(new URL('/', req.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};