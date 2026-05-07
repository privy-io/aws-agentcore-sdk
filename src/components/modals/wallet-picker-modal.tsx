"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, X } from "lucide-react";
import { type WalletWithMetadata } from "@privy-io/react-auth";
import { type ChainType } from "@/types/wallet";
import { toChainType } from "@/lib/chain";
import { network } from "@/lib/network";
import { PrivyBadge } from "@/components/ui/privy-badge";

type WalletPickerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  wallets: WalletWithMetadata[];
  onSelect: (address: string, chain: ChainType) => void;
};

export function WalletPickerModal({
  open,
  onOpenChange,
  onClose,
  wallets,
  onSelect,
}: WalletPickerModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-[0px_5px_5px_0px_rgba(0,0,0,0.05),0px_4px_13px_0px_rgba(0,0,0,0.1)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-full items-center justify-between p-4">
              <button
                type="button"
                aria-label="Go back"
                onClick={onClose}
                className="rounded-full bg-[#f1f2f9] p-1.5 text-[#64668b] transition-colors hover:bg-[#e2e3f0]"
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="rounded-full bg-[#f1f2f9] p-1.5 transition-colors hover:bg-[#e2e3f0]"
              >
                <X className="size-4 text-[#64668b]" />
              </button>
            </div>

            <div className="flex w-full flex-col items-center gap-8 px-6 pb-6">
              {/* Header */}
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col gap-1 text-center">
                  <Dialog.Title className="text-xl font-semibold text-[#040217]">
                    Select wallet to fund
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-[#64668b]">
                    Select a wallet based on the network you would like to have
                    the funds sent in.
                  </Dialog.Description>
                </div>
              </div>

              {/* Wallet buttons */}
              <div className="flex w-full flex-col gap-3">
                {wallets.map((wallet) => {
                  const chain: ChainType = toChainType(wallet.chainType);
                  const label =
                    chain === "base"
                      ? network.base.label
                      : network.solana.label;
                  return (
                    <button
                      key={wallet.address}
                      type="button"
                      onClick={() => onSelect(wallet.address, chain)}
                      className="flex h-14 items-center gap-3 rounded-xl border border-[#e2e3f0] py-3 pl-3 pr-4 text-left transition-colors hover:bg-[#f8f9fc]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/${chain}.png`}
                        alt={chain}
                        className="size-8 shrink-0 rounded-full"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#040217]">
                          {label}
                        </p>
                        <p className="truncate text-xs text-[#64668b]">
                          {wallet.address}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <PrivyBadge />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
