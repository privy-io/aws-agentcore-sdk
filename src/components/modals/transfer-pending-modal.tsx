"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, LoaderCircle, X } from "lucide-react";
import { PrivyBadge } from "@/components/ui/privy-badge";

export type TransferStatus = "sending" | "success" | "error";

type TransferPendingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  status: TransferStatus;
  errorMessage?: string;
  onDone: () => void;
};

export function TransferPendingModal({
  open,
  onOpenChange,
  amount,
  status,
  errorMessage,
  onDone,
}: TransferPendingModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-[0px_8px_36px_rgba(55,65,81,0.15)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          <div className="flex flex-col items-center gap-5 px-6 py-10">
            {status === "sending" && (
              <>
                <LoaderCircle className="size-12 animate-spin text-[#64668b]" />
                <div className="text-center">
                  <Dialog.Title className="text-lg font-bold tracking-[-0.019em] text-[#040217]">
                    Sending {amount} USDC…
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-[#64668b]">
                    Approve the transaction in your wallet.
                  </Dialog.Description>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-[#dcfce7]">
                  <Check className="size-6 text-[#16A34A]" strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <Dialog.Title className="text-lg font-bold tracking-[-0.019em] text-[#040217]">
                    Transfer complete!
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-[#64668b]">
                    {amount} USDC is on its way to your wallet.
                  </Dialog.Description>
                </div>
                <button
                  type="button"
                  onClick={onDone}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#111826] text-sm font-medium text-white transition-colors hover:bg-[#1a2436] active:bg-[#0d1520]"
                >
                  Done
                </button>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-[#fee2e2]">
                  <X className="size-6 text-[#dc2626]" strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <Dialog.Title className="text-lg font-bold tracking-[-0.019em] text-[#040217]">
                    Transfer failed
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-[#64668b]">
                    {errorMessage ?? "Something went wrong. Please try again."}
                  </Dialog.Description>
                </div>
                <button
                  type="button"
                  onClick={onDone}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#111826] text-sm font-medium text-white transition-colors hover:bg-[#1a2436] active:bg-[#0d1520]"
                >
                  Close
                </button>
              </>
            )}
          </div>
          <PrivyBadge />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
