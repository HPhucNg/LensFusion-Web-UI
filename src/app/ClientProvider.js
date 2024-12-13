"use client";

import { Auth0Provider } from "@auth0/auth0-react";

export default function ClientProvider({ children }) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/login/callback`,
      }}
    >
      {children}
    </Auth0Provider>
  );
}
