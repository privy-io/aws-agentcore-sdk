import useSWR from "swr";
import {
  type ChainType,
  type PositionView,
  type WalletBalance,
} from "@/types/wallet";

type BalancesResponse = {
  positions: { address: string; positions: PositionView[] }[];
};

async function fetchBalances(url: string): Promise<BalancesResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch balances: ${res.status}`);
  return (await res.json()) as BalancesResponse;
}

export function useFetchBalance(
  addresses: { address: string; chainType: ChainType }[],
) {
  const addressKey = addresses.map((a) => a.address).join(",");

  const { data, isLoading } = useSWR<BalancesResponse>(
    addressKey ? `/api/balances?addresses=${addressKey}` : null,
    fetchBalances,
    {
      refreshInterval: 15_000,
      revalidateOnFocus: false,
      keepPreviousData: true,
      shouldRetryOnError: false,
    },
  );

  const wallets: WalletBalance[] = (data?.positions ?? []).map((wallet) => {
    const positions = (wallet.positions ?? []).sort(
      (a, b) => b.value - a.value,
    );
    const total = positions.reduce((acc, p) => acc + (p.value ?? 0), 0);
    const chainType =
      addresses.find((a) => a.address === wallet.address)?.chainType ?? "base";
    return {
      address: wallet.address,
      chainType,
      total,
      positions,
    };
  });

  // Treat empty-address case as not-loading so callers don't spin forever.
  const loading = addressKey.length > 0 && isLoading;

  return { wallets, loading };
}
