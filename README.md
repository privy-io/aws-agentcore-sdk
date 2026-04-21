# AWS AgentCore SDK -Privy Frontend

A reference frontend for agent developers integrating [AWS AgentCore SDK](https://aws.amazon.com/agentcore/) with [Privy](https://privy.io) as the embedded wallet provider.

## Overview

This app is the user-facing frontend that agent developers deploy alongside their AgentCore-powered application. Users arrive here to:

1. **Log in** -authenticate via Privy (email, social, or wallet)
2. **View their wallets** -see USDC balances on Base and Solana
3. **Delegate access to the agent** -grant the agent application permission to sign transactions on their behalf using Privy session signers
4. **Fund their wallets** -add USDC via card (Stripe hosted onramp), receive (QR code), or transfer from an external wallet

- **Framework:** Next.js 15.5.x (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Auth + Wallets:** `@privy-io/react-auth`
- **Balance data:** Direct on-chain queries (viem for Base, `@solana/web3.js` for Solana)
- **Package manager:** `pnpm`

---

## Environment Variables

Create a `.env.local` file in the project root with the following:

```bash
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=        # Your Privy app ID (public)
PRIVY_APP_SECRET=                # Your Privy app secret (server-only)
NEXT_PUBLIC_PRIVY_SIGNER_ID=     # Authorization key ID from Privy dashboard (public)
```

---

## Getting Your Privy Credentials

### 1. App ID and App Secret

1. Go to the [Privy Dashboard](https://dashboard.privy.io)
2. Select your app (or create one)
3. Navigate to **Settings → API keys**
4. Copy the **App ID** → `NEXT_PUBLIC_PRIVY_APP_ID`
5. Copy the **App secret** → `PRIVY_APP_SECRET` (treat this like a password -never expose it client-side)

### 2. Authorization Key (Signer ID)

The signer ID is the ID of an **authorization key** you create in the Privy dashboard. This is used to grant an agent permission to sign transactions on behalf of a user's wallet.

1. In the Privy Dashboard, go to **Wallets → Authorization keys**
2. Click **Create key**
3. Give it a name (e.g. `aws-agent`)
4. Copy the **Key ID** that is generated → `NEXT_PUBLIC_PRIVY_SIGNER_ID`

> The key ID looks like `zr17anh9dpiqno1iaref9jpx`. It is safe to expose publicly -it is just an identifier, not a secret.

---

## Funding Wallets

The "Add funds" flow supports three methods:

### Pay with card (Stripe hosted onramp)

Clicking "Pay with card" opens [Stripe's hosted onramp](https://docs.stripe.com/crypto/onramp/stripe-hosted) in a new tab. The user selects their destination currency (USDC) and network (Base or Solana) directly in the Stripe UI.

The hosted onramp requires no server-side secret key -it accepts `destination_currency` and `destination_network` as URL query parameters. See the [Stripe hosted onramp docs](https://docs.stripe.com/crypto/onramp/stripe-hosted) for available parameters and customization options.

### Receive (QR code)

Displays a QR code and copyable address for the selected wallet. The QR value uses [EIP-681](https://eips.ethereum.org/EIPS/eip-681) format for Base and the [Solana Pay](https://docs.solanapay.com) SPL token format for Solana.

### Transfer from external wallet

Connects an external wallet (MetaMask, Phantom, etc.) via Privy's `useConnectWallet` hook and executes a USDC transfer programmatically -ERC-20 `transfer` on Base, SPL token transfer on Solana.

---

## Setup

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Commands

```bash
pnpm dev      # Start dev server with Turbopack
pnpm build    # Production build
pnpm lint     # ESLint
```

---

## Key Files

| File | Description |
|---|---|
| `src/app/page.tsx` | Auth-gated home page, splash + login auto-open |
| `src/app/layout.tsx` | Root layout, font registration |
| `src/app/globals.css` | Tailwind imports and shared component classes |
| `src/app/error.tsx` | App-level error boundary page |
| `src/app/not-found.tsx` | 404 page |
| `src/app/api/balances/route.ts` | Server-side USDC balance queries (Base + Solana) |
| `src/app/api/check-signers/route.ts` | Server-side signer presence check |
| `src/components/sections/home-screen.tsx` | Authenticated home screen orchestrator |
| `src/components/layout/app-header.tsx` | Top navigation bar |
| `src/components/layout/user-menu.tsx` | User dropdown (email + logout) |
| `src/components/modals/connect-agent-modal.tsx` | Grant agent wallet access flow |
| `src/components/modals/wallet-picker-modal.tsx` | Select wallet to fund |
| `src/components/ui/aws-wordmark.tsx` | AWS SVG logo |
| `src/components/ui/copy-button.tsx` | Copy-to-clipboard icon button |
| `src/components/ui/setup-card.tsx` | Onboarding step card |
| `src/components/ui/fullscreen-loader.tsx` | Loading spinner shown during Privy init |
| `src/components/wallet/wallet-balance-card.tsx` | Per-wallet balance display |
| `src/hooks/use-fetch-balance.ts` | Client hook for wallet balances |
| `src/lib/env.ts` | Public environment variable validation |
| `src/lib/format.ts` | USD formatting utility |
| `src/types/wallet.ts` | Shared wallet type definitions |
| `src/providers/providers.tsx` | PrivyProvider config and modal appearance |
