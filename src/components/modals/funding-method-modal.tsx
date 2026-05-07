"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, CreditCard, Inbox, QrCode, X } from "lucide-react";
import { PrivyBadge } from "@/components/ui/privy-badge";
import { network } from "@/lib/network";
import { type ChainType } from "@/types/wallet";

export type FundingMethod = "card" | "transfer" | "receive";

type FundingMethodModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onBack: () => void;
  onSelect: (method: FundingMethod) => void;
  /** Chain picked in the previous step — drives network-aware subtitles. */
  selectedChain: ChainType | null;
};

type MethodDef = {
  method: FundingMethod;
  label: string;
  icon: typeof CreditCard;
};

const METHOD_DEFS: readonly MethodDef[] = [
  { method: "card", label: "Pay with card", icon: CreditCard },
  { method: "transfer", label: "Transfer from wallet", icon: Inbox },
  { method: "receive", label: "Receive funds", icon: QrCode },
] as const;

function chainLabel(chain: ChainType | null): string {
  if (chain === "base") return network.base.label;
  if (chain === "solana") return network.solana.label;
  return "";
}

function subtitleFor(method: FundingMethod, chain: ChainType | null): string {
  const label = chainLabel(chain);
  switch (method) {
    case "card":
      return network.isTestnet
        ? "Not available in testnet"
        : `USDC on ${label}`;
    case "transfer":
      return `Send USDC on ${label} from an external wallet`;
    case "receive":
      return `Share an address or QR code on ${label}`;
  }
}

function isDisabled(method: FundingMethod): boolean {
  return method === "card" && network.isTestnet;
}

export function FundingMethodModal({
  open,
  onOpenChange,
  onClose,
  onBack,
  onSelect,
  selectedChain,
}: FundingMethodModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-[0px_8px_36px_rgba(55,65,81,0.15)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          {/* Header: back button left, close button right */}
          <div className="flex items-center justify-between p-4">
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="rounded-full bg-[#f1f2f9] p-2 text-[#64668b] transition-colors hover:bg-[#e2e3f0]"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="rounded-full bg-[#f1f2f9] p-2 text-[#64668b] transition-colors hover:bg-[#e2e3f0]"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Title */}
          <div className="flex flex-col items-center gap-1.5 px-6 text-center">
            <Dialog.Title className="text-xl font-bold tracking-[-0.019em] text-[#040217]">
              Select funding method
            </Dialog.Title>
            <Dialog.Description className="text-sm text-[#64668b]">
              Select a method for funding your wallet.
            </Dialog.Description>
          </div>

          {/* Method buttons */}
          <div className="flex flex-col gap-3 px-6 pb-6 pt-6">
            {METHOD_DEFS.map(({ method, label, icon: Icon }) => {
              const disabled = isDisabled(method);
              const subtitle = subtitleFor(method, selectedChain);
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => !disabled && onSelect(method)}
                  disabled={disabled}
                  aria-disabled={disabled}
                  title={disabled ? subtitle : undefined}
                  className={
                    "flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-[#e2e3f0] px-3 py-2.5 text-left transition-colors " +
                    (disabled
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-[#f8f9fc]")
                  }
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-5 text-[#64668b]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-medium text-[#040217]">{label}</span>
                    {subtitle && (
                      <span className="text-xs text-[#64668b]">{subtitle}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <PrivyBadge />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
