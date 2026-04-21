"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, X } from "lucide-react";

import { PrivyBadge } from "@/components/ui/privy-badge";
import { type ChainType } from "@/types/wallet";

type TransferAmountModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  chain: ChainType;
  onConnect: (amount: string) => void;
};

export function TransferAmountModal({
  open,
  onOpenChange,
  onBack,
  chain,
  onConnect,
}: TransferAmountModalProps) {
  const [amount, setAmount] = useState("");

  const chainName = chain === "base" ? "Base" : "Solana";
  const amountIsValid = parseFloat(amount) > 0;

  function handleConnect() {
    if (!amountIsValid) return;
    onConnect(amount);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-[0px_8px_36px_rgba(55,65,81,0.15)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          {/* Header */}
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
              Transfer from wallet
            </Dialog.Title>
            <Dialog.Description className="text-sm text-[#64668b]">
              Enter the amount of USDC to send from your external wallet.
            </Dialog.Description>
          </div>

          {/* Amount input + network badge + button */}
          <div className="flex flex-col gap-4 px-6 py-6">
            {/* Amount input */}
            <div className="flex items-center gap-3 rounded-xl border border-[#e2e3f0] px-4 py-3 focus-within:border-[#040217]">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-lg font-medium text-[#040217] outline-none placeholder:text-[#c0c2d8] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="shrink-0 text-sm font-medium text-[#64668b]">USDC</span>
            </div>

            {/* Network badge */}
            <div className="flex items-center justify-center">
              <span className="rounded-full bg-[#f1f2f9] px-3 py-1.5 text-xs font-medium text-[#64668b]">
                Sending on {chainName}
              </span>
            </div>

            {/* Connect wallet button */}
            <button
              type="button"
              onClick={handleConnect}
              disabled={!amountIsValid}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#111826] text-sm font-medium text-white transition-colors hover:bg-[#1a2436] active:bg-[#0d1520] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Connect wallet
            </button>
          </div>
          <PrivyBadge />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
