"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth0 } from "@auth0/auth0-react";

export default function Callback() {
  const { handleRedirectCallback } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    const processCallback = async () => {
      try {
        await handleRedirectCallback();
        router.push("/"); 
      } catch (error) {
        console.error("Error during callback:", error);
      }
    };

    processCallback();
  }, [handleRedirectCallback, router]);

  return <p>Loading...</p>;
}
