import { type ChainType } from "@/types/wallet";

/**
 * Privy's SDK always returns "ethereum" for EVM wallets regardless of which
 * EVM chain the wallet lives on. This app only supports Base (EVM) and Solana,
 * so we normalize at the Privy boundary to our internal ChainType.
 */
export function toChainType(privyChainType: string): ChainType {
  if (privyChainType === "solana") return "solana";
  return "base";
}
