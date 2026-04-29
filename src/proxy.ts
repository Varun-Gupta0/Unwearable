import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const session = await auth();
    const adminEmail = process.env.ADMIN_EMAIL;
    
    // If user is not signed in, protect() handles the redirect
    if (!session.userId) {
      await auth.protect();
      return;
    }

    // Fetch user details to check email
    const user = await session.getUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress;

    if (!adminEmail || userEmail !== adminEmail) {
      // Redirect unauthorized users to home or a 403 page
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