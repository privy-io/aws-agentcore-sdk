"use client";

import { useRef, useState } from "react";
import { useConnectWallet, type EIP1193Provider, type WalletWithMetadata } from "@privy-io/react-auth";
import { createWalletClient, custom, encodeFunctionData, parseUnits } from "viem";
import { base } from "viem/chains";

// Minimal duck-typed interfaces for connected wallet providers
type EvmWallet = {
  address: string;
  getEthereumProvider: () => Promise<EIP1193Provider>;
};
type SolanaWallet = {
  address: string;
  provider: {
    signAndSendTransaction: (input: {
      transaction: Uint8Array;
      chain: string;
    }) => Promise<{ signature: Uint8Array }>;
  };
};
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { WalletPickerModal } from "@/components/modals/wallet-picker-modal";
import { FundingMethodModal, type FundingMethod } from "@/components/modals/funding-method-modal";
import { ReceiveFundsModal } from "@/components/modals/receive-funds-modal";
import { TransferAmountModal } from "@/components/modals/transfer-amount-modal";
import { TransferPendingModal, type TransferStatus } from "@/components/modals/transfer-pending-modal";
import { type ChainType } from "@/types/wallet";
import { BASE_USDC_ADDRESS, SOLANA_USDC_MINT, SOLANA_MAINNET_RPC } from "@/lib/constants";

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

async function executeEvmTransfer(wallet: EvmWallet, amount: string, to: string) {
  const provider = await wallet.getEthereumProvider();
  const walletClient = createWalletClient({
    transport: custom(provider),
    chain: base,
    account: wallet.address as `0x${string}`,
  });

  try {
    await walletClient.switchChain({ id: base.id });
  } catch {
    await walletClient.addChain({ chain: base });
    await walletClient.switchChain({ id: base.id });
  }

  const data = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [to as `0x${string}`, parseUnits(amount, 6)],
  });

  await walletClient.sendTransaction({
    to: BASE_USDC_ADDRESS,
    data,
    value: BigInt(0),
  });
}

async function executeSolanaTransfer(wallet: SolanaWallet, amount: string, to: string) {
  const connection = new Connection(SOLANA_MAINNET_RPC, "confirmed");
  const fromPubkey = new PublicKey(wallet.address);
  const toPubkey = new PublicKey(to);
  const mintPubkey = new PublicKey(SOLANA_USDC_MINT);

  const fromATA = getAssociatedTokenAddressSync(mintPubkey, fromPubkey);
  const toATA = getAssociatedTokenAddressSync(mintPubkey, toPubkey);

  const tx = new Transaction();

  // Create recipient's associated token account if it doesn't exist yet
  try {
    await getAccount(connection, toATA);
  } catch {
    tx.add(
      createAssociatedTokenAccountInstruction(fromPubkey, toATA, toPubkey, mintPubkey),
    );
  }

  tx.add(createTransferInstruction(fromATA, toATA, fromPubkey, parseUnits(amount, 6)));

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = fromPubkey;

  await wallet.provider.signAndSendTransaction({
    transaction: tx.serialize({ requireAllSignatures: false }),
    chain: "solana:mainnet",
  });
}

// ─────────────────────────────────────────────

type FundingStep = "wallet-picker" | "method-picker" | "receive" | "transfer-amount" | "transfer-pending";

type SelectedWallet = {
  address: string;
  chain: ChainType;
};

type FundingFlowProps = {
  wallets: WalletWithMetadata[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FundingFlow({ wallets, open, onOpenChange }: FundingFlowProps) {
  const [step, setStep] = useState<FundingStep>("wallet-picker");
  const [selectedWallet, setSelectedWallet] = useState<SelectedWallet | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferStatus, setTransferStatus] = useState<TransferStatus>("sending");
  const [transferError, setTransferError] = useState<string | undefined>();

  // Refs so the connectWallet onSuccess callback always reads the latest values
  // (the callback is registered once at mount and would otherwise capture stale closures)
  const transferAmountRef = useRef<string>("");
  const selectedWalletRef = useRef<SelectedWallet | null>(null);

  const { connectWallet } = useConnectWallet({
    onSuccess: async ({ wallet }) => {
      setStep("transfer-pending");
      setTransferStatus("sending");
      try {
        const destination = selectedWalletRef.current!.address;
        if (wallet.type === "solana") {
          await executeSolanaTransfer(
            wallet as unknown as SolanaWallet,
            transferAmountRef.current,
            destination,
          );
        } else {
          await executeEvmTransfer(
            wallet as unknown as EvmWallet,
            transferAmountRef.current,
            destination,
          );
        }
        setTransferStatus("success");
      } catch (e) {
        setTransferStatus("error");
        setTransferError(e instanceof Error ? e.message : "Transfer failed.");
      }
    },
  });

  function handleClose() {
    onOpenChange(false);
    setStep("wallet-picker");
    setSelectedWallet(null);
    setTransferAmount("");
    setTransferError(undefined);
  }

  function handleWalletSelect(address: string, chain: ChainType) {
    const wallet = { address, chain };
    selectedWalletRef.current = wallet;
    setSelectedWallet(wallet);
    setStep("method-picker");
  }

  function handleBack() {
    setStep("wallet-picker");
  }

  function handleMethodSelect(method: FundingMethod) {
    if (!selectedWallet) return;

    switch (method) {
      case "card": {
        const params = new URLSearchParams({
          destination_currency: "usdc",
          destination_network: selectedWallet.chain,
        });
        handleClose();
        window.open(`https://crypto.link.com/?${params.toString()}`, "_blank", "noopener,noreferrer");
        break;
      }
      case "transfer":
        setStep("transfer-amount");
        break;
      case "receive":
        setStep("receive");
        break;
    }
  }

  function handleTransferConnect(amount: string) {
    transferAmountRef.current = amount;
    setTransferAmount(amount);
    connectWallet({
      walletChainType: selectedWallet?.chain === "base" ? "ethereum-only" : "solana-only",
    });
  }

  return (
    <>
      <WalletPickerModal
        open={open && step === "wallet-picker"}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleClose();
        }}
        wallets={wallets}
        onSelect={handleWalletSelect}
      />

      <FundingMethodModal
        open={open && step === "method-picker"}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleClose();
        }}
        onBack={handleBack}
        onSelect={handleMethodSelect}
      />

      {selectedWallet && (
        <>
          <ReceiveFundsModal
            open={open && step === "receive"}
            onOpenChange={(isOpen) => {
              if (!isOpen) handleClose();
            }}
            onBack={() => setStep("method-picker")}
            address={selectedWallet.address}
            chain={selectedWallet.chain}
          />

          <TransferAmountModal
            open={open && step === "transfer-amount"}
            onOpenChange={(isOpen) => {
              if (!isOpen) handleClose();
            }}
            onBack={() => setStep("method-picker")}
            chain={selectedWallet.chain}
            onConnect={handleTransferConnect}
          />
        </>
      )}

      <TransferPendingModal
        open={open && step === "transfer-pending"}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleClose();
        }}
        amount={transferAmount}
        status={transferStatus}
        errorMessage={transferError}
        onDone={handleClose}
      />
    </>
  );
}
