import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Stripe Embedded Components / Link: https://docs.stripe.com/security/guide
      "script-src 'self' 'unsafe-inline' https://*.privy.io https://crypto-js.stripe.com https://js.stripe.com https://*.js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      // USDC and destination network icons returned by Privy's funding API.
      "img-src 'self' data: https://*.link.com https://coin-images.coingecko.com https://home.privy.io",
      "font-src 'self'",
      "frame-src https://*.privy.io https://crypto-js.stripe.com https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://link.com https://*.link.com",
      "connect-src 'self' https://*.privy.io https://api.stripe.com https://link.com https://*.link.com https://explorer-api.walletconnect.com https://api.mainnet-beta.solana.com https://api.devnet.solana.com https://mainnet.base.org https://sepolia.base.org",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
