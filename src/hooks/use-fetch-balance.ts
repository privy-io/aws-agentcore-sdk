import { useEffect, useState } from "react";
import { type ChainType, type PositionView, type WalletBalance } from "@/types/wallet";

export function useFetchBalance(
  addresses: { address: string; chainType: ChainType }[],
) {
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(true);

  // Joining addresses into a single string avoids using an array as a useEffect
  // dependency, which would trigger on every render (new array reference each time).
  const addressKey = addresses.map((a) => a.address).join(",");

  useEffect(() => {
    if (addresses.length === 0) {
      setLoading(false);
      return;
    }

    async function fetchBalance() {
      setLoading(true);
      try {
        const res = await fetch(`/api/balances?addresses=${addressKey}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          positions: { address: string; positions: PositionView[] }[];
        };

        const walletBalances: WalletBalance[] = [];

        for (const wallet of data.positions ?? []) {
          const positions = (wallet.positions ?? []).sort(
            (a, b) => b.value - a.value,
          );
          const walletTotal = positions.reduce(
            (acc, p) => acc + (p.value ?? 0),
            0,
          );

          const chainType =
            addresses.find((a) => a.address === wallet.address)?.chainType ??
            "base";

          walletBalances.push({
            address: wallet.address,
            chainType,
            total: walletTotal,
            positions,
          });
        }

        setWallets(walletBalances);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    void fetchBalance();
    const interval = setInterval(() => void fetchBalance(), 15_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressKey]);

  return { wallets, loading };
}
