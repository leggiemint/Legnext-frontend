import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import config from "@/config";

// This is a server-side component to ensure the user is logged in.
// If not, it will redirect to the login page.
// It's applied to all subpages of /dashboard in /app/dashboard/*** pages
// You can also add custom static UI elements like a Navbar, Sidebar, Footer, etc..
// See https://shipfa.st/docs/tutorials/private-page
export default async function LayoutPrivate({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  console.log("🔍 [DEBUG] Dashboard layout - Session check:", {
    hasSession: !!session,
    userId: session?.user?.id,
    email: session?.user?.email
  });

  if (!session) {
    console.log("🔍 [DEBUG] No session, redirecting to signin");
    // Use absolute URL to avoid redirect loops
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  console.log("🔍 [DEBUG] Session valid, rendering dashboard");
  return <>{children}</>;
}
