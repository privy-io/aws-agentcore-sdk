"use client";

import { useState, useEffect } from "react";
import { Bot, Check, CircleDollarSign } from "lucide-react";
import {
  usePrivy,
  type LinkedAccountWithMetadata,
  type WalletWithMetadata,
} from "@privy-io/react-auth";

import { AppHeader } from "@/components/layout/app-header";
import { TestnetBanner } from "@/components/ui/testnet-banner";
import { ConnectAgentModal } from "@/components/modals/connect-agent-modal";
import { FundingFlow } from "@/components/funding/funding-flow";
import { SetupCard } from "@/components/ui/setup-card";
import { WalletBalanceCard } from "@/components/wallet/wallet-balance-card";
import { useFetchBalance } from "@/hooks/use-fetch-balance";
import { toChainType } from "@/lib/chain";

export default function AuthenticatedHome() {
  const [agentConnected, setAgentConnected] = useState(false);
  const [signerCheckLoading, setSignerCheckLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showFunding, setShowFunding] = useState(false);

  const { user } = usePrivy();

  const privyWallets = (user?.linkedAccounts ?? []).filter(
    (a: LinkedAccountWithMetadata): a is WalletWithMetadata =>
      a.type === "wallet" &&
      (a as WalletWithMetadata).walletClientType === "privy",
  );

  // Check whether the signer is already connected to the wallets on mount.
  useEffect(() => {
    const walletIds = privyWallets
      .map((w) => w.id)
      .filter((id): id is string => Boolean(id));
    if (walletIds.length === 0) {
      setSignerCheckLoading(false);
      return;
    }

    fetch("/api/check-signers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletIds }),
    })
      .then((r) => r.json())
      .then((data: { connected?: boolean }) => {
        if (data.connected) setAgentConnected(true);
      })
      .catch(() => {
        // Signer check failed — agent treated as disconnected until next load.
      })
      .finally(() => {
        setSignerCheckLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const { wallets: walletBalances, loading: balancesLoading } = useFetchBalance(
    privyWallets.map((w) => ({
      address: w.address,
      chainType: toChainType(w.chainType),
    })),
  );
  const hasFunds = !balancesLoading && walletBalances.some((b) => b.total > 0);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#FAFAFA]">
      <AppHeader />
      <TestnetBanner />

      {/* Success toast */}
      <div
        className={`pointer-events-none fixed left-1/2 top-16 z-[200] -translate-x-1/2 transition-all duration-300 ease-out ${
          showSuccessBanner
            ? "translate-y-3 opacity-100"
            : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="flex w-96 items-center gap-3 rounded-lg border border-[#87d7b7] bg-[#dcfce7] px-5 py-3 shadow-md">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#16A34A]">
            <Check className="size-3 text-[#16A34A]" strokeWidth={3} />
          </div>
          <p className="text-sm text-[#040217]">
            Agent connected successfully.
          </p>
        </div>
      </div>

      {/* Page content */}
      <div className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-8">
        {/* Complete setup — hidden once all steps are done.
            Deferred until both /api/check-signers and /api/balances have
            resolved at least once to avoid a flash on every page load. */}
        {!signerCheckLoading &&
          !balancesLoading &&
          !(agentConnected && hasFunds) && (
            <section>
              <h1 className="text-2xl font-semibold tracking-[-0.019em] text-[#040217]">
                Complete setup
              </h1>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <SetupCard
                  title="Create wallets"
                  description="Set up your account and create your crypto wallets."
                  icon={<Check className="size-5 text-[#040217]" />}
                  completed
                />
                <SetupCard
                  title="Connect agent"
                  description="Give your agent permission to transact using your wallets."
                  icon={<Bot className="size-5 text-[#040217]" />}
                  completed={agentConnected}
                  onClick={
                    agentConnected ? undefined : () => setShowConnectModal(true)
                  }
                />
                <SetupCard
                  title="Add funds"
                  description="Fund your wallets so your agent could use it."
                  icon={<CircleDollarSign className="size-5 text-[#040217]" />}
                  completed={hasFunds}
                  onClick={hasFunds ? undefined : () => setShowFunding(true)}
                />
              </div>
            </section>
          )}

        {/* Your wallets */}
        <section
          className={
            !signerCheckLoading &&
            !balancesLoading &&
            !(agentConnected && hasFunds)
              ? "mt-14"
              : ""
          }
        >
          <h2 className="text-2xl font-semibold tracking-[-0.019em] text-[#040217]">
            Your wallets
          </h2>

          <div className="mt-3 flex flex-col gap-3">
            {privyWallets.map((wallet) => (
              <WalletBalanceCard
                key={wallet.address}
                address={wallet.address}
                chainType={toChainType(wallet.chainType)}
                balance={
                  walletBalances.find((b) => b.address === wallet.address)
                    ?.total
                }
                loading={balancesLoading}
              />
            ))}
          </div>

          <div className="mt-12">
            <button
              type="button"
              className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[#111826] text-base font-medium text-white transition-colors hover:bg-[#1a2436] active:bg-[#0d1520]"
              onClick={() => setShowFunding(true)}
            >
              Add funds
            </button>
          </div>
        </section>
      </div>

      <ConnectAgentModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
        onSuccess={() => {
          setAgentConnected(true);
          setShowConnectModal(false);
          setShowSuccessBanner(true);
          setTimeout(() => setShowSuccessBanner(false), 4000);
        }}
      />

      {privyWallets.length > 0 && (
        <FundingFlow
          open={showFunding}
          onOpenChange={setShowFunding}
          wallets={privyWallets}
        />
      )}
    </main>
  );
}
