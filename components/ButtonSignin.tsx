/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import config from "@/config";

// A simple button to sign in with our providers (Google & Magic Links).
// It automatically redirects user to callbackUrl (config.auth.callbackUrl) after login, which is normally a private page for users to manage their accounts.
// If the user is already logged in, it will show their profile picture & redirect them to callbackUrl immediately.
const ButtonSignin = ({
  text = "Get Started",
}: {
  text?: string;
}) => {
  const router = useRouter();
  const sessionResponse = useSession();
  const status = sessionResponse?.status;

  const handleClick = () => {
    if (status === "authenticated") {
      router.push(config.auth.callbackUrl);
    } else {
      signIn(undefined, { callbackUrl: config.auth.callbackUrl });
    }
  };

  if (status === "authenticated") {
    return null; // Don't show anything when authenticated, let AppHeader handle user display
  }

  return (
    <button
      className="inline-flex items-center justify-center px-4 py-2 bg-[#4f46e5] text-white font-medium rounded-lg hover:bg-[#4f46e5]/90 transition-colors duration-200 shadow-sm"
      onClick={handleClick}
    >
      {text}
    </button>
  );
};

export default ButtonSignin;
