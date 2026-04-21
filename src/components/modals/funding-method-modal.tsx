"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, CreditCard, Inbox, QrCode, X } from "lucide-react";
import { PrivyBadge } from "@/components/ui/privy-badge";

export type FundingMethod = "card" | "transfer" | "receive";

type FundingMethodModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  onSelect: (method: FundingMethod) => void;
};

const FUNDING_METHODS = [
  { method: "card" as FundingMethod, label: "Pay with card", icon: CreditCard },
  { method: "transfer" as FundingMethod, label: "Transfer from wallet", icon: Inbox },
  { method: "receive" as FundingMethod, label: "Receive funds", icon: QrCode },
] as const;

export function FundingMethodModal({
  open,
  onOpenChange,
  onBack,
  onSelect,
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
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="rounded-full bg-[#f1f2f9] p-2 text-[#64668b] transition-colors hover:bg-[#e2e3f0]"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
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
            {FUNDING_METHODS.map(({ method, label, icon: Icon }) => (
              <button
                key={method}
                type="button"
                onClick={() => onSelect(method)}
                className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-[#e2e3f0] px-3 py-2.5 text-left transition-colors hover:bg-[#f8f9fc]"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Icon className="size-5 text-[#64668b]" />
                </div>
                <span className="text-[15px] font-medium text-[#040217]">{label}</span>
              </button>
            ))}
          </div>
          <PrivyBadge />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
