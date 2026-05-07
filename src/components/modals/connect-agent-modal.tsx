"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Info, LoaderCircle, X } from "lucide-react";
import {
  usePrivy,
  useSessionSigners,
  type LinkedAccountWithMetadata,
  type WalletWithMetadata,
} from "@privy-io/react-auth";
import { env } from "@/lib/env";

type ConnectAgentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function ConnectAgentModal({
  open,
  onOpenChange,
  onSuccess,
}: ConnectAgentModalProps) {
  const { user } = usePrivy();
  const { addSessionSigners } = useSessionSigners();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const privyWallets = (
    user?.linkedAccounts ?? ([] as LinkedAccountWithMetadata[])
  ).filter(
    (a: LinkedAccountWithMetadata): a is WalletWithMetadata =>
      a.type === "wallet" &&
      (a as WalletWithMetadata).walletClientType === "privy",
  );

  async function handleGiveAccess() {
    const signerId = env.privySignerId;
    if (!signerId) {
      setError("Signer ID is not configured.");
      return;
    }
    if (privyWallets.length === 0) {
      setError("No wallets found. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await Promise.all(
        privyWallets.map((wallet) =>
          addSessionSigners({
            address: wallet.address,
            signers: [{ signerId, policyIds: [] }],
          }).catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            // addSessionSigners is idempotent from the caller's perspective:
            // Privy throws "signer already exists" when the signer was previously
            // added — suppressing that error makes it safe to re-call this for
            // wallets that are already covered (e.g. after a new wallet is provisioned).
            if (!msg.toLowerCase().includes("already")) throw err;
          }),
        ),
      );
      onSuccess();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect agent. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay — matches Privy: bg-black/10 with fade */}
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[100] w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-[0px_5px_5px_0px_rgba(0,0,0,0.05),0px_4px_13px_0px_rgba(0,0,0,0.1)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onInteractOutside={(e) => {
            if (loading) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (loading) e.preventDefault();
          }}
        >
          {loading ? (
            <div className="flex h-[320px] flex-col items-center justify-center gap-4">
              <LoaderCircle className="size-12 animate-spin text-[#040217]" />
              <p className="text-sm text-[#64668b]">Connecting your agent…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Close button */}
              <div className="flex h-14 w-full items-start justify-end p-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-full bg-[#f1f2f9] p-1.5 text-[#64668b] transition-colors hover:bg-[#e2e3f0]"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="flex w-full flex-col items-center gap-6 px-6 pb-6">
                {/* Header */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <Dialog.Title className="text-xl font-semibold tracking-[-0.019em] text-[#040217]">
                    Give your agent access to your wallets
                  </Dialog.Title>
                  <Dialog.Description className="text-sm leading-snug text-[#64668b]">
                    Your agent will be able to send transactions and spend funds
                    from your wallets on your behalf. You can revoke access at
                    any time.
                  </Dialog.Description>
                </div>

                {/* Warning box */}
                <div className="flex w-full items-start gap-2.5 rounded-xl border border-[#e2e3f0] bg-[#f8f9fc] px-3.5 py-3">
                  <Info className="mt-px size-4 shrink-0 text-[#64668b]" />
                  <p className="text-sm leading-snug text-[#64668b]">
                    Transactions initiated by your agent cannot be reversed.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <p className="w-full rounded-lg border border-[#f69393] bg-[#fee2e2] px-3 py-2 text-xs text-[#991b1b]">
                    {error}
                  </p>
                )}

                {/* Action */}
                <button
                  type="button"
                  onClick={handleGiveAccess}
                  className="inline-flex h-13 w-full items-center justify-center rounded-2xl bg-[#111826] text-sm font-medium text-white transition-colors hover:bg-[#1a2436] active:bg-[#0d1520]"
                >
                  Give access
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
