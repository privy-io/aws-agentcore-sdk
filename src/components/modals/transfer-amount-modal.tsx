"use client";

import { useCallback, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, X } from "lucide-react";

import { PrivyBadge } from "@/components/ui/privy-badge";
import { type ChainType } from "@/types/wallet";
import { network } from "@/lib/network";

type TransferAmountModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onBack: () => void;
  chain: ChainType;
  onConnect: (amount: string) => void;
};

export function TransferAmountModal({
  open,
  onOpenChange,
  onClose,
  onBack,
  chain,
  onConnect,
}: TransferAmountModalProps) {
  const [amount, setAmount] = useState("0");
  const inputRef = useRef<HTMLInputElement>(null);

  const chainLabel = chain === "base" ? network.base.specificLabel : network.solana.specificLabel;
  const amountIsValid = parseFloat(amount) > 0;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Strip non-numeric characters except decimal point
    input = input.replace(/[^\d.]/g, "");

    // Keep only the first decimal point, remove any extras
    const parts = input.split(".");
    if (parts.length > 2) {
      input = parts[0] + "." + parts.slice(1).join("");
    }

    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1]!.length > 2) {
      input = `${parts[0]}.${parts[1]!.slice(0, 2)}`;
    }

    // Strip leading zeros (but keep "0." for decimal input)
    if (input.length > 1 && input[0] === "0" && input[1] !== ".") {
      input = input.slice(1);
    }

    // Default to "0" for empty or lone decimal input
    if (input === "" || input === ".") {
      input = "0";
    }

    setAmount(input);
  }, []);

  function handleConnect() {
    if (!amountIsValid) return;
    onConnect(amount);
  }

  return (
    <Dialog.Root modal={false} open={open} onOpenChange={onOpenChange}>
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
              Transfer from wallet
            </Dialog.Title>
            <Dialog.Description className="text-sm text-[#64668b]">
              Enter the amount of USDC to send from your external wallet.
            </Dialog.Description>
          </div>

          {/* Amount input — Privy-style large centered number with hidden input */}
          <div
            className="flex w-full cursor-pointer items-start justify-center py-8"
            onClick={() => inputRef.current?.focus()}
          >
            {/* Currency symbol — small, top-aligned to the number */}
            <span className="mt-3 text-base font-semibold text-[#040217]">
              $
            </span>
            {/* Large number display */}
            <span className="text-[3.75rem] font-semibold leading-[5.375rem] tracking-tight text-[#040217]">
              {amount}
            </span>
            {/* Hidden input — captures all keystrokes */}
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleChange}
              autoFocus
              aria-label="Amount in USDC"
              style={{
                width: 1,
                height: "1rem",
                opacity: 0,
                alignSelf: "center",
                fontSize: "1rem",
              }}
            />
            {/* Invisible symbol to balance the layout */}
            <span className="mt-3 text-base font-semibold opacity-0">$</span>
          </div>

          {/* Network badge + button */}
          <div className="flex flex-col gap-4 px-6 pb-6">
            <div className="flex items-center justify-center">
              <span className="rounded-full bg-[#f1f2f9] px-3 py-1.5 text-xs font-medium text-[#64668b]">
                Sending on {chainLabel}
              </span>
            </div>

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
