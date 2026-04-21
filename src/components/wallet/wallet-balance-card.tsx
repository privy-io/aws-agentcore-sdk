import { type ChainType } from "@/types/wallet";
import { CopyButton } from "@/components/ui/copy-button";
import { formatUsd } from "@/lib/format";

type WalletBalanceCardProps = {
  address: string;
  chainType: ChainType;
  balance: number | undefined;
  loading: boolean;
};

export function WalletBalanceCard({
  address,
  chainType,
  balance,
  loading,
}: WalletBalanceCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-[#e2e3f0] bg-white px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#64668b]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/${chainType}.png`}
            alt={chainType}
            className="size-4 rounded-full"
          />
          <span>Total balance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#64668b]">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <CopyButton value={address} />
        </div>
      </div>

      <p className="text-4xl font-semibold leading-none tracking-[-0.019em] text-[#040217]">
        {loading ? "—" : formatUsd(balance ?? 0)}
      </p>
    </article>
  );
}
