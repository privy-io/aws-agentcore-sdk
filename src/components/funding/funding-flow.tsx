"use client";

import { useRef, useState } from "react";
import {
  useConnectWallet,
  type BaseConnectedWalletType,
  type EIP1193Provider,
  type WalletWithMetadata,
} from "@privy-io/react-auth";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import {
  createWalletClient,
  custom,
  encodeFunctionData,
  parseUnits,
} from "viem";
import bs58 from "bs58";

// Minimal duck-typed interfaces for connected wallet providers
type EvmWallet = {
  address: string;
  getEthereumProvider: () => Promise<EIP1193Provider>;
};
type ConnectedSolanaConnectorWallet = Extract<
  BaseConnectedWalletType,
  { type: "solana" }
>;
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  TokenAccountNotFoundError,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { WalletPickerModal } from "@/components/modals/wallet-picker-modal";
import {
  FundingMethodModal,
  type FundingMethod,
} from "@/components/modals/funding-method-modal";
import { ReceiveFundsModal } from "@/components/modals/receive-funds-modal";
import { TransferAmountModal } from "@/components/modals/transfer-amount-modal";
import {
  TransferPendingModal,
  type TransferStatus,
} from "@/components/modals/transfer-pending-modal";
import { type ChainType } from "@/types/wallet";
import { network, STRIPE_ONRAMP_BASE_NETWORK } from "@/lib/network";

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

async function executeEvmTransfer(
  wallet: EvmWallet,
  amount: string,
  to: string,
) {
  const provider = await wallet.getEthereumProvider();
  const chain = network.base.chain;
  const walletClient = createWalletClient({
    transport: custom(provider),
    chain,
    account: wallet.address as `0x${string}`,
  });

  try {
    await walletClient.switchChain({ id: chain.id });
  } catch {
    await walletClient.addChain({ chain });
    await walletClient.switchChain({ id: chain.id });
  }

  const data = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [to as `0x${string}`, parseUnits(amount, 6)],
  });

  await walletClient.sendTransaction({
    to: network.base.usdc,
    data,
    value: BigInt(0),
  });
}

function browserSolanaRpcEndpoint(): string {
  if (typeof window === "undefined") {
    return network.solana.rpcUrl;
  }
  return `${window.location.origin}/api/solana-rpc`;
}

const CONFIRM_TX_TIMEOUT_MS = 45_000;

/**
 * Waits until the signature reaches `confirmed` (or `finalized`) using HTTP polling.
 * `Connection.confirmTransaction` also tries `signatureSubscribe` over WebSocket; with our
 * same-origin JSON-RPC proxy there is no valid Solana WS endpoint, so confirmation can stall
 * even after the tx succeeds on-chain.
 */
async function waitForSignatureConfirmed(
  connection: Connection,
  signature: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await connection.getSignatureStatus(signature);
    const status = res?.value;
    if (status?.err) {
      throw new Error(
        `Transaction failed on-chain: ${JSON.stringify(status.err)}`,
      );
    }
    const cs = status?.confirmationStatus;
    if (cs === "confirmed" || cs === "finalized") {
      return;
    }
    await new Promise((r) => setTimeout(r, 800));
  }
}

/** SPL `Transfer` fails with `InvalidAccountData` if the source ATA is missing or wrong. */
function toSignatureBase58(signature: Uint8Array): string {
  if (signature.length === 64) return bs58.encode(signature);
  if (signature.length > 64 && signature.length % 64 === 0) {
    return bs58.encode(signature.subarray(0, 64));
  }
  return bs58.encode(signature);
}

async function executeSolanaTransfer(
  wallet: ConnectedSolanaConnectorWallet,
  amount: string,
  to: string,
  signAndSendTransaction: ReturnType<
    typeof useSignAndSendTransaction
  >["signAndSendTransaction"],
  opts?: { onSigned?: (signatureBase58: string) => void },
): Promise<{ transactionUrl: string }> {
  const connection = new Connection(browserSolanaRpcEndpoint(), "confirmed");
  const fromPubkey = new PublicKey(wallet.address);
  const toPubkey = new PublicKey(to);
  const mintPubkey = new PublicKey(network.solana.usdcMint);

  const fromATA = getAssociatedTokenAddressSync(mintPubkey, fromPubkey);
  const toATA = getAssociatedTokenAddressSync(mintPubkey, toPubkey);

  const transferLamports = parseUnits(amount, 6);

  let needsSenderAtaCreation = false;
  try {
    const fromTokenAccount = await getAccount(connection, fromATA);
    if (!fromTokenAccount.owner.equals(fromPubkey)) {
      throw new Error(
        "Connected wallet does not own the expected USDC token account.",
      );
    }
    if (fromTokenAccount.amount < transferLamports) {
      throw new Error(
        `Not enough USDC in your ${network.solana.specificLabel} wallet for a ${amount} USDC transfer (SPL USDC on ${network.solana.specificLabel}).`,
      );
    }
  } catch (e) {
    if (e instanceof TokenAccountNotFoundError) {
      needsSenderAtaCreation = true;
    } else {
      throw e;
    }
  }

  const tx = new Transaction();

  if (needsSenderAtaCreation) {
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        fromPubkey,
        fromATA,
        fromPubkey,
        mintPubkey,
      ),
    );
  }

  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(
      fromPubkey,
      toATA,
      toPubkey,
      mintPubkey,
    ),
  );

  tx.add(
    createTransferInstruction(fromATA, toATA, fromPubkey, transferLamports),
  );

  tx.feePayer = fromPubkey;

  await new Promise((r) => setTimeout(r, 300));

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  // `wallet.provider` matches Privy's runtime type; duplicate @privy-io/js-sdk-core
  // copies in the tree can confuse TypeScript on #private fields.
  const { signature } = await signAndSendTransaction({
    transaction: tx.serialize({ requireAllSignatures: false }),
    wallet: wallet.provider as never,
    chain: network.solana.cluster,
  });

  const signatureBase58 = toSignatureBase58(signature);
  const cluster = network.isTestnet ? "?cluster=devnet" : "";
  const transactionUrl = `https://solscan.io/tx/${signatureBase58}${cluster}`;
  opts?.onSigned?.(signatureBase58);

  await waitForSignatureConfirmed(
    connection,
    signatureBase58,
    CONFIRM_TX_TIMEOUT_MS,
  );

  return { transactionUrl };
}

// ─────────────────────────────────────────────

type FundingStep =
  | "wallet-picker"
  | "method-picker"
  | "receive"
  | "transfer-amount"
  | "transfer-pending";

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
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const signAndSendRef = useRef(signAndSendTransaction);
  signAndSendRef.current = signAndSendTransaction;

  /** True while Privy `connectWallet` is resolving — inner dialogs must not call `handleClose`. */
  const connectWalletDismissLockRef = useRef(false);
  /** True briefly after `setStep` closes a child dialog so Radix `onOpenChange(false)` does not end the flow. */
  const stepTransitionDismissLockRef = useRef(false);

  function withStepTransitionLock(run: () => void) {
    stepTransitionDismissLockRef.current = true;
    run();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        stepTransitionDismissLockRef.current = false;
      });
    });
  }

  function shouldIgnoreInnerDismiss(): boolean {
    return (
      connectWalletDismissLockRef.current ||
      stepTransitionDismissLockRef.current
    );
  }

  const [step, setStep] = useState<FundingStep>("wallet-picker");
  const [selectedWallet, setSelectedWallet] = useState<SelectedWallet | null>(
    null,
  );
  const [transferAmount, setTransferAmount] = useState("");
  const [transferStatus, setTransferStatus] =
    useState<TransferStatus>("sending");
  const [transferError, setTransferError] = useState<string | undefined>();
  const [transferTxUrl, setTransferTxUrl] = useState<string | undefined>();

  // Refs so the connectWallet onSuccess callback always reads the latest values
  // (the callback is registered once at mount and would otherwise capture stale closures)
  const transferAmountRef = useRef<string>("");
  const selectedWalletRef = useRef<SelectedWallet | null>(null);
  const transferStatusRef = useRef(transferStatus);
  transferStatusRef.current = transferStatus;

  const { connectWallet } = useConnectWallet({
    onSuccess: async ({ wallet }) => {
      setStep("transfer-pending");
      setTransferStatus("sending");
      setTransferTxUrl(undefined);
      try {
        const destination = selectedWalletRef.current!.address;
        if (wallet.type === "solana") {
          const { transactionUrl } = await executeSolanaTransfer(
            wallet,
            transferAmountRef.current,
            destination,
            signAndSendRef.current,
            {
              onSigned: (signatureBase58) => {
                const cluster = network.isTestnet ? "?cluster=devnet" : "";
                setTransferTxUrl(`https://solscan.io/tx/${signatureBase58}${cluster}`);
                setTransferStatus("confirming");
              },
            },
          );
          setTransferTxUrl(transactionUrl);
        } else {
          setTransferTxUrl(undefined);
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
      } finally {
        connectWalletDismissLockRef.current = false;
      }
    },
    onError: () => {
      connectWalletDismissLockRef.current = false;
    },
  });

  function handleClose() {
    connectWalletDismissLockRef.current = false;
    stepTransitionDismissLockRef.current = false;
    onOpenChange(false);
    setStep("wallet-picker");
    setSelectedWallet(null);
    setTransferAmount("");
    setTransferError(undefined);
    setTransferTxUrl(undefined);
  }

  function handleWalletSelect(address: string, chain: ChainType) {
    const wallet = { address, chain };
    withStepTransitionLock(() => {
      selectedWalletRef.current = wallet;
      setSelectedWallet(wallet);
      setStep("method-picker");
    });
  }

  function handleBack() {
    withStepTransitionLock(() => setStep("wallet-picker"));
  }

  function handleMethodSelect(method: FundingMethod) {
    if (!selectedWallet) return;

    switch (method) {
      case "card": {
        // Card is mainnet-only; modal disables the button in testnet — guard anyway.
        if (network.isTestnet) return;
        const params = new URLSearchParams({
          destination_currency: "usdc",
          destination_network:
            selectedWallet.chain === "base" ? STRIPE_ONRAMP_BASE_NETWORK : "solana",
        });
        handleClose();
        window.open(
          `https://crypto.link.com/?${params.toString()}`,
          "_blank",
          "noopener,noreferrer",
        );
        break;
      }
      case "transfer":
        withStepTransitionLock(() => setStep("transfer-amount"));
        break;
      case "receive":
        withStepTransitionLock(() => setStep("receive"));
        break;
    }
  }

  function handleTransferConnect(amount: string) {
    transferAmountRef.current = amount;
    setTransferAmount(amount);
    connectWalletDismissLockRef.current = true;
    connectWallet({
      walletChainType:
        selectedWallet?.chain === "base" ? "ethereum-only" : "solana-only",
    });
  }

  return (
    <>
      <WalletPickerModal
        open={open && step === "wallet-picker"}
        onOpenChange={(isOpen) => {
          if (!isOpen && !shouldIgnoreInnerDismiss()) handleClose();
        }}
        onClose={handleClose}
        wallets={wallets}
        onSelect={handleWalletSelect}
      />

      <FundingMethodModal
        open={open && step === "method-picker"}
        onOpenChange={(isOpen) => {
          if (!isOpen && !shouldIgnoreInnerDismiss()) handleClose();
        }}
        onClose={handleClose}
        onBack={handleBack}
        onSelect={handleMethodSelect}
        selectedChain={selectedWallet?.chain ?? null}
      />

      {selectedWallet && (
        <>
          <ReceiveFundsModal
            open={open && step === "receive"}
            onOpenChange={(isOpen) => {
              if (!isOpen && !shouldIgnoreInnerDismiss()) handleClose();
            }}
            onClose={handleClose}
            onBack={() =>
              withStepTransitionLock(() => setStep("method-picker"))
            }
            address={selectedWallet.address}
            chain={selectedWallet.chain}
          />

          <TransferAmountModal
            open={open && step === "transfer-amount"}
            onOpenChange={(isOpen) => {
              if (!isOpen && !shouldIgnoreInnerDismiss()) handleClose();
            }}
            onClose={handleClose}
            onBack={() =>
              withStepTransitionLock(() => setStep("method-picker"))
            }
            chain={selectedWallet.chain}
            onConnect={handleTransferConnect}
          />
        </>
      )}

      <TransferPendingModal
        open={open && step === "transfer-pending"}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            const s = transferStatusRef.current;
            if (s === "sending" || s === "confirming") return;
            handleClose();
          }
        }}
        amount={transferAmount}
        status={transferStatus}
        errorMessage={transferError}
        transactionUrl={transferTxUrl}
        onDone={handleClose}
      />
    </>
  );
}
