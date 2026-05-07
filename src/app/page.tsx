"use client";

import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import AuthenticatedHome from "@/components/sections/home-screen";

function Home() {
  const { ready, authenticated, login } = usePrivy();
  // Ref (not state) so toggling it doesn't trigger a re-render, which would
  // create an infinite login() loop.
  const hasAutoOpenedLogin = useRef(false);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (authenticated) {
      // Reset so that if the user logs out and back in, the modal auto-opens again.
      hasAutoOpenedLogin.current = false;
      return;
    }

    if (!hasAutoOpenedLogin.current) {
      hasAutoOpenedLogin.current = true;
      login();
    }
  }, [ready, authenticated, login]);

  if (!ready) {
    return <FullScreenLoader />;
  }

  return (
    <div
      className={
        authenticated
          ? "min-h-screen bg-[#FAFAFA]"
          : "min-h-screen bg-gradient-to-b from-[#dadbfc] from-[8.44%] to-[#f6f6fe]"
      }
    >
      {authenticated ? <AuthenticatedHome /> : null}
    </div>
  );
}

export default Home;
