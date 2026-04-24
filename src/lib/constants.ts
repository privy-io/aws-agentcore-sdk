/**
 * Backwards-compatibility shim. The app now reads chain-specific values
 * from `@/lib/network`, which selects mainnet or testnet based on
 * `NEXT_PUBLIC_NETWORK_MODE`. These named exports are preserved so any
 * code that still imports from `@/lib/constants` keeps working — and
 * automatically picks up testnet support when the env flag is flipped.
 *
 * New code should import from `@/lib/network` directly.
 */
import { network } from "./network";

/** @deprecated Import `network.base.usdc` from `@/lib/network` instead. */
export const BASE_USDC_ADDRESS = network.base.usdc;

/** @deprecated Import `network.solana.usdcMint` from `@/lib/network` instead. */
export const SOLANA_USDC_MINT = network.solana.usdcMint;

/**
 * @deprecated Import `network.solana.rpcUrl` from `@/lib/network` instead.
 * Note: despite the name, this returns the Devnet RPC when
 * `NEXT_PUBLIC_NETWORK_MODE=testnet`.
 */
export const SOLANA_MAINNET_RPC = network.solana.rpcUrl;
