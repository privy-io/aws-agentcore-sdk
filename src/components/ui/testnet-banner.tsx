import { network } from "@/lib/network";

/**
 * Thin yellow strip that renders under the app header in testnet mode.
 * Renders null in mainnet.
 */
export function TestnetBanner() {
  if (!network.isTestnet) return null;

  return (
    <div
      role="status"
      aria-label="Testnet mode active"
      className="flex items-center justify-center gap-2 border-b border-[#facd63] bg-[#fef3c7] px-4 py-1.5 text-xs font-medium text-[#906218]"
    >
      <span
        aria-hidden="true"
        className="inline-block size-1.5 rounded-full bg-[#d97706]"
      />
      <span>Testnet mode — no real funds are at stake</span>
    </div>
  );
}
