# AWS AgentCore SDK - Privy Frontend

A reference frontend for agent developers integrating [AWS AgentCore SDK](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html) with [Privy](https://privy.io) as the embedded wallet provider.

> **Note:** This is an open source repository jointly maintained by the [Privy](https://privy.io) team and the AWS AgentCore Bedrock team. It is a representative example of an integration flow intended to help agent developers with their integration. It is **not** a fully productionized codebase.

## Overview

This app is the user-facing frontend that agent developers can deploy alongside their AgentCore-powered application. Users arrive here to:

1. **Log in** - authenticate via Privy (email, social, or wallet)
2. **View their wallets** - see USDC balances on Base and Solana
3. **Delegate access to the agent** - grant your agent application permission to sign transactions on their behalf
4. **Fund their wallets** - add USDC via card (Stripe hosted onramp), receiving funds (QR code), or transfer from an external wallet

- **Framework:** Next.js 15.5.x (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Auth + Wallets:** `@privy-io/react-auth`
- **Balance data:** Direct on-chain queries (viem for Base, `@solana/web3.js` for Solana)
- **Package manager:** `pnpm`

---

## Prerequisites

Before starting development on this frontend, please begin onboarding to the [AWS AgentCore SDK](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html). In that onboarding flow, you will be asked to provide the credentials created in the flow below.

## Getting Your Privy Credentials

### 1. App ID and App Secret

1. Go to the [Privy Dashboard](https://dashboard.privy.io)
2. Select your app (or create one)
3. Navigate to **Settings → API keys**
4. Copy the **App ID** → `NEXT_PUBLIC_PRIVY_APP_ID`
5. Copy the **App secret** → `PRIVY_APP_SECRET` (treat this like a password - never expose it client-side)

### 2. Authorization Key (Signer ID)

The signer ID is the ID of an [**authorization key**](https://docs.privy.io/controls/authorization-keys/keys/create/key#authorization-keys) you create in the Privy dashboard. This is used to grant an agent permission to sign transactions on behalf of a user's wallet.

1. In the Privy Dashboard, go to **Wallet infrastructure → Authorization**
2. Click **New key**
3. Give it a name (e.g. `aws-agent`)
4. Copy the **Key ID** that is generated → `NEXT_PUBLIC_PRIVY_SIGNER_ID`

> The key ID looks like `zr17anh9dpiqno1iaref9jpx`. It is safe to expose publicly -it is just an identifier, not a secret.

## Paste the `App ID`, `App Secret` and `Signer ID` into the environment file created below.

## Environment Variables

Create a `.env.local` file in the project root with the following:

```bash
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=        # Your Privy app ID (public)
PRIVY_APP_SECRET=                # Your Privy app secret (server-only)
NEXT_PUBLIC_PRIVY_SIGNER_ID=     # Authorization key ID from Privy dashboard (public)

# Network mode — optional. One of: mainnet | testnet. Defaults to mainnet.
NEXT_PUBLIC_NETWORK_MODE=testnet
```

### Network mode (`NEXT_PUBLIC_NETWORK_MODE`)

Controls which chains the app reads balances from, which chains external-wallet
transfers target, and whether card funding is enabled. Defaults
to `mainnet` if unset, so upgrading without changing your env leaves
behavior unchanged.

| Value               | Base                          | Solana              | Card funding (Stripe)                       |
| :------------------ | :---------------------------- | :------------------ | :------------------------------------------ |
| `mainnet` (default) | Base (chain id 8453)          | Solana mainnet-beta | ✅ enabled                                  |
| `testnet`           | Base Sepolia (chain id 84532) | Solana Devnet       | ❌ disabled (Stripe onramp is mainnet-only) |

Start in `testnet` to develop against faucet USDC. See
[Running in testnet](#running-in-testnet) below for faucet links. Switch to
`mainnet` for production deployments.

---

## Funding Wallets

This frontend includes flows for allowing the user to add funds to their Ethereum and Solana wallets. At the moment, the flow only reads the balance of USDC on Base in their Ehtereum wallet and USDC on Solana in their Solana wallet. The onramp methods below only support funding with USDC on these chains.

The "Add funds" flow supports three methods:

### Pay with card (Stripe hosted onramp)

Clicking "Pay with card" opens [Stripe's hosted onramp](https://docs.stripe.com/crypto/onramp/stripe-hosted) in a new tab. The user selects their destination currency (USDC) and network (Base or Solana) directly in the Stripe UI.

The hosted onramp requires no server-side secret key -it accepts `destination_currency` and `destination_network` as URL query parameters. See the [Stripe hosted onramp docs](https://docs.stripe.com/crypto/onramp/stripe-hosted) for available parameters and customization options.

### Receive (QR code)

Displays a QR code and copyable address for the selected wallet. The QR value uses [EIP-681](https://eips.ethereum.org/EIPS/eip-681) format for Base and the [Solana Pay](https://docs.solanapay.com) SPL token format for Solana.

### Transfer from external wallet

Connects an external wallet (MetaMask, Phantom, etc.) via Privy's `useConnectWallet` hook and executes a USDC transfer programmatically -ERC-20 `transfer` on Base, SPL token transfer on Solana.

---

## Login Methods

Currently, the default login options are SMS, Email, and Google Auth. These are set in the `loginMethods` config in `providers.tsx`. The full list of login methods can be found here. Some login methods such as SMS and Google Auth need to be explicitly enabled in your Privy Dashboard by going to **User management → Authentication**.

## Setup

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Running in testnet

Set `NEXT_PUBLIC_NETWORK_MODE=testnet` in `.env.local` (the default in
`.env.example`) and use these faucets to fund wallets:

| Asset                     | Network       | Faucet                                                                                                          |
| :------------------------ | :------------ | :-------------------------------------------------------------------------------------------------------------- |
| USDC                      | Base Sepolia  | [Circle Faucet](https://faucet.circle.com) → select "Base Sepolia"                                              |
| USDC                      | Solana Devnet | [Circle Faucet](https://faucet.circle.com) → select "Solana Devnet"                                             |
| ETH (gas on Base)         | Base Sepolia  | [Alchemy](https://www.alchemy.com/faucets/base-sepolia), [QuickNode](https://faucet.quicknode.com/base/sepolia) |
| SOL (rent/fees on Solana) | Solana Devnet | [Solana Faucet](https://faucet.solana.com), [Sol Faucet](https://solfaucet.com)                                 |

Base Sepolia gas is microscopic (~0.01 ETH is plenty); Solana rent needs
a fraction of a SOL per active account. Funding takes ~30 seconds end to
end.

The "Pay with card" option in Add Funds is disabled in testnet — Stripe's
hosted onramp only deals in real mainnet USDC. Use the "Transfer from
wallet" or "Receive funds" options instead.

---

## Available Commands

```bash
pnpm dev      # Start dev server with Turbopack
pnpm build    # Production build
pnpm lint     # ESLint
```

---

## Maintainers

This repository is jointly maintained by the [Privy](https://privy.io) team and the AWS AgentCore Bedrock team. See [MAINTAINERS.md](./MAINTAINERS.md) for the full list of maintainers and contact information.

## Contributions

This repository is not currently open to external contributions.

Please submit an Issue and fill out the issue with as much information as possible if you have found a bug in need of fixing.

You can also submit an Issue to request new features, or to suggest changes to existing features.

## License

Apache-2.0. See [LICENSE.md](./LICENSE.md).
