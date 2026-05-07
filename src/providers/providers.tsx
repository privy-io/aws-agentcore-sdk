"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import {
  toSolanaWalletConnectors,
  defaultSolanaRpcsPlugin,
} from "@privy-io/react-auth/solana";
import { env } from "@/lib/env";

const AWS_HOSTED_LOGO_URL = "/aws-logo.png";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={env.privyAppId}
      config={{
        plugins: [defaultSolanaRpcsPlugin()],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "off",
          },
          solana: {
            createOnLogin: "off",
          },
        },
        appearance: {
          walletChainType: "ethereum-and-solana",
          logo: AWS_HOSTED_LOGO_URL,
          landingHeader: " ",
        },
        externalWallets: { solana: { connectors: toSolanaWalletConnectors() } },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
