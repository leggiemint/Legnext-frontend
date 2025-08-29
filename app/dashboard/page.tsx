"use client";

import { useSession } from "next-auth/react";
import ButtonAccount from "@/components/ButtonAccount";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's now a client component to avoid hydration issues with the Header component.
// See https://shipfa.st/docs/tutorials/private-page
export default function Dashboard() {
  const { status } = useSession();

  // Show loading state while session is being fetched
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-[#06b6d4]"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen p-8 pb-24">
        <section className="max-w-xl mx-auto space-y-8">
          <ButtonAccount />
          <h1 className="text-3xl md:text-4xl font-extrabold">Private Page</h1>
        </section>
      </main>
    </>
  );
}
