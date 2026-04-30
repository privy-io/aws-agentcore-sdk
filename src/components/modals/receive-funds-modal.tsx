"use client";

import * as Dialog from "@radix-ui/react-dialog";
import QRCode from "react-qr-code";
import { ArrowLeft, X } from "lucide-react";

import { CopyButton } from "@/components/ui/copy-button";
import { PrivyBadge } from "@/components/ui/privy-badge";
import { type ChainType } from "@/types/wallet";
import { network } from "@/lib/network";

type ReceiveFundsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onBack: () => void;
  address: string;
  chain: ChainType;
};

function buildQrValue(address: string, chain: ChainType): string {
  if (chain === "solana") {
    // Solana Pay SPL-token URI. Mint changes per network; address is the same.
    return `solana:${address}?spl-token=${network.solana.usdcMint}`;
  }
  // EIP-681: including the chain ID ensures wallets targeting Base mainnet vs
  // Base Sepolia don't accidentally send on the wrong chain.
  return `ethereum:${address}@${network.base.chain.id}`;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ReceiveFundsModal({
  open,
  onOpenChange,
  onClose,
  onBack,
  address,
  chain,
}: ReceiveFundsModalProps) {
  const chainLabel = chain === "base" ? network.base.specificLabel : network.solana.specificLabel;
  const qrValue = buildQrValue(address, chain);

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
              Receive USDC
            </Dialog.Title>
            <Dialog.Description className="text-sm text-[#64668b]">
              Scan this code or copy your wallet address to receive funds on {chainLabel}.
            </Dialog.Description>
          </div>

          {/* QR code */}
          <div className="flex justify-center px-6 pt-5">
            <div className="rounded-2xl border border-[#e2e3f0] p-4">
              <QRCode value={qrValue} size={180} />
            </div>
          </div>

          {/* Network warning */}
          <div className="mx-6 mt-4 rounded-xl bg-[#f1f2f9] px-4 py-3">
            <p className="text-center text-xs text-[#64668b]">
              Make sure to send funds on {chainLabel}.
            </p>
          </div>

          {/* Address row */}
          <div className="mx-6 mt-3 flex items-center justify-between rounded-xl border border-[#e2e3f0] px-4 py-3">
            <div>
              <p className="text-xs text-[#64668b]">Your wallet</p>
              <p className="mt-0.5 font-mono text-sm text-[#040217]">
                {truncateAddress(address)}
              </p>
            </div>
            <CopyButton value={address} />
          </div>
          <PrivyBadge />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
