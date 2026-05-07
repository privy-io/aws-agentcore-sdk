/**
 * Network configuration for the app, driven by `NEXT_PUBLIC_NETWORK_MODE`.
 * Every chain reference, USDC address, and RPC URL in the app reads from
 * the `network` object exported below — nothing else should hardcode one.
 */
import { base, baseSepolia, type Chain } from "viem/chains";

// ── Mode resolution ───────────────────────────────────────────────────────

export type NetworkMode = "mainnet" | "testnet";

function resolveMode(): NetworkMode {
  // Read at module scope. Next.js inlines `NEXT_PUBLIC_*` refs at build time
  // via static analysis, so the literal string must appear here.
  const raw = (process.env.NEXT_PUBLIC_NETWORK_MODE ?? "").toLowerCase();
  if (raw === "mainnet" || raw === "testnet") return raw;
  // Unset → default to mainnet so pulling this change does not alter
  // behavior for existing deployments that haven't set the flag.
  if (raw === "") return "mainnet";
  throw new Error(
    `Invalid NEXT_PUBLIC_NETWORK_MODE="${raw}". Must be "mainnet" or "testnet".`,
  );
}

const MODE: NetworkMode = resolveMode();

// ── Per-mode values ───────────────────────────────────────────────────────

// Base (EVM) USDC contract addresses.
// Mainnet: https://basescan.org/token/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913
// Sepolia: https://sepolia.basescan.org/token/0x036CbD53842c5426634e7929541eC2318f3dCF7e
const BASE_USDC: Record<NetworkMode, `0x${string}`> = {
  mainnet: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  testnet: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

// Solana USDC SPL token mints.
//   mainnet-beta: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
//   devnet      : 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
const SOLANA_USDC_MINT: Record<NetworkMode, string> = {
  mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  testnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
};

// Solana RPC endpoints. For production traffic, swap the mainnet entry for a
// dedicated RPC provider (Helius, Triton, Alchemy) — the public endpoint has
// aggressive rate limits.
const SOLANA_RPC: Record<NetworkMode, string> = {
  mainnet: "https://api.mainnet-beta.solana.com",
  testnet: "https://api.devnet.solana.com",
};

const BASE_CHAIN: Record<NetworkMode, Chain> = {
  mainnet: base,
  testnet: baseSepolia,
};

// Solana cluster handles used by Privy's signAndSendTransaction.
const SOLANA_CLUSTER: Record<NetworkMode, "solana:mainnet" | "solana:devnet"> = {
  mainnet: "solana:mainnet",
  testnet: "solana:devnet",
};

// `label` is the short family name ("Base", "Solana"); `specificLabel`
// names the network ("Base Sepolia", "Solana Devnet" in testnet) and is
// used on surfaces where sending to the wrong network would cost funds.
const BASE_LABEL = "Base";
const SOLANA_LABEL = "Solana";

const BASE_SPECIFIC_LABEL: Record<NetworkMode, string> = {
  mainnet: "Base",
  testnet: "Base Sepolia",
};

const SOLANA_SPECIFIC_LABEL: Record<NetworkMode, string> = {
  mainnet: "Solana",
  testnet: "Solana Devnet",
};

// ── Public surface ────────────────────────────────────────────────────────

/** Every call site reads from this. Do not hardcode a chain reference elsewhere. */
export const network = Object.freeze({
  mode: MODE,
  isTestnet: MODE === "testnet",
  base: Object.freeze({
    chain: BASE_CHAIN[MODE],
    usdc: BASE_USDC[MODE],
    label: BASE_LABEL,
    specificLabel: BASE_SPECIFIC_LABEL[MODE],
  }),
  solana: Object.freeze({
    cluster: SOLANA_CLUSTER[MODE],
    rpcUrl: SOLANA_RPC[MODE],
    usdcMint: SOLANA_USDC_MINT[MODE],
    label: SOLANA_LABEL,
    specificLabel: SOLANA_SPECIFIC_LABEL[MODE],
  }),
});

/** Stripe's hosted onramp only accepts mainnet destinations. */
export const STRIPE_ONRAMP_BASE_NETWORK = "base";
