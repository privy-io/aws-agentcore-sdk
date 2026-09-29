import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DepositFundsResult, WalletWithMetadata } from "@privy-io/react-auth";
import { FundingFlow } from "./funding-flow";

const mocks = {
  depositFunds: jest.fn(),
  connectWallet: jest.fn(),
  isTestnet: false,
  environment: "production" as "production" | "sandbox",
};

jest.mock("@privy-io/react-auth", () => ({
  useDepositFunds: () => ({ depositFunds: mocks.depositFunds }),
  useConnectWallet: () => ({ connectWallet: mocks.connectWallet }),
}));
jest.mock("@privy-io/react-auth/solana", () => ({
  useSignAndSendTransaction: () => ({ signAndSendTransaction: jest.fn() }),
}));
jest.mock("@/lib/env", () => ({
  env: { get fiatOnrampEnvironment() { return mocks.environment; } },
}));
jest.mock("@/lib/network", () => {
  const actual = jest.requireActual<typeof import("@/lib/network")>("@/lib/network");
  return {
    network: {
      ...actual.network,
      get isTestnet() { return mocks.isTestnet; },
    },
  };
});

const baseAddress = "0x1111111111111111111111111111111111111111";
const secondBaseAddress = "0x1234567890abcdef1234567890abcdef12345678";
const solanaAddress = "11111111111111111111111111111111";
const wallets = [
  { address: baseAddress, chainType: "ethereum", walletClientType: "privy" },
  { address: secondBaseAddress, chainType: "ethereum", walletClientType: "privy" },
  { address: solanaAddress, chainType: "solana", walletClientType: "privy" },
] as WalletWithMetadata[];

function Harness({ onFundingComplete = jest.fn() }: { onFundingComplete?: () => void }) {
  const [open, setOpen] = useState(true);
  return <FundingFlow wallets={wallets} open={open} onOpenChange={setOpen} onFundingComplete={onFundingComplete} />;
}

function deferredFunding() {
  let resolve!: (result: DepositFundsResult) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<DepositFundsResult>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  mocks.depositFunds.mockReturnValue(promise);
  return { resolve, reject };
}

function chooseWallet(address: string) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(` ${address}$`) }));
}

function chooseCard() {
  fireEvent.click(screen.getByRole("button", { name: /Pay with card/ }));
}

beforeEach(() => {
  mocks.depositFunds.mockReset();
  mocks.connectWallet.mockReset();
  mocks.isTestnet = false;
  mocks.environment = "production";
});
afterEach(cleanup);

describe("card funding", () => {
  it.each([
    [baseAddress, "base"],
    [secondBaseAddress, "base"],
    [solanaAddress, "solana"],
  ])("funds the selected wallet %s with USDC on %s", async (address, chain) => {
    const funding = deferredFunding();
    const onFundingComplete = jest.fn();
    render(<Harness onFundingComplete={onFundingComplete} />);
    chooseWallet(address);
    chooseCard();

    expect(mocks.depositFunds).toHaveBeenCalledTimes(1);
    expect(mocks.depositFunds).toHaveBeenCalledWith({
      destination: { wallet: address, asset: "usdc", chain },
      fiat: { source: { assets: ["usd", "eur"] }, environment: "production" },
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onFundingComplete).not.toHaveBeenCalled();

    await act(async () => funding.resolve({ method: "fiat", status: "submitted" }));
    expect(onFundingComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not open duplicate funding flows for rapid clicks", async () => {
    const funding = deferredFunding();
    render(<Harness />);
    chooseWallet(baseAddress);
    const cardButton = screen.getByRole("button", { name: /Pay with card/ });
    act(() => {
      cardButton.click();
      cardButton.click();
    });
    expect(mocks.depositFunds).toHaveBeenCalledTimes(1);
    await act(async () => funding.resolve({ method: "fiat", status: "confirmed" }));
  });

  it.each(["User cancelled funding", "User exited flow"])(
    "returns to the selected wallet's methods without an error after %s",
    async (message) => {
      const funding = deferredFunding();
      const onFundingComplete = jest.fn();
      render(<Harness onFundingComplete={onFundingComplete} />);
      chooseWallet(solanaAddress);
      chooseCard();
      await act(async () => funding.reject(new Error(message)));

      expect(screen.getByRole("dialog", { name: "Select funding method" })).toBeTruthy();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(onFundingComplete).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: /Receive funds/ }));
      expect(screen.getByRole("dialog", { name: "Receive USDC" })).toBeTruthy();
      expect(screen.getByText("Make sure to send funds on Solana.")).toBeTruthy();
    },
  );

  it("shows a retryable error and retains the selected destination", async () => {
    const funding = deferredFunding();
    render(<Harness />);
    chooseWallet(secondBaseAddress);
    chooseCard();
    await act(async () => funding.reject(new Error("Funding unavailable")));
    expect(screen.getByRole("alert").textContent).toContain("Could not complete card funding");

    mocks.depositFunds.mockResolvedValue({ method: "fiat", status: "confirmed" });
    chooseCard();
    await waitFor(() => expect(mocks.depositFunds).toHaveBeenCalledTimes(2));
    expect(mocks.depositFunds.mock.calls[1][0].destination.wallet).toBe(secondBaseAddress);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("uses the new selection after cancelling and switching wallets", async () => {
    const funding = deferredFunding();
    render(<Harness />);
    chooseWallet(baseAddress);
    chooseCard();
    await act(async () => funding.reject(new Error("User cancelled funding")));
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    chooseWallet(solanaAddress);
    mocks.depositFunds.mockResolvedValue({ method: "fiat", status: "confirmed" });
    chooseCard();
    await waitFor(() => expect(mocks.depositFunds).toHaveBeenCalledTimes(2));
    expect(mocks.depositFunds.mock.calls[1][0].destination).toEqual({
      wallet: solanaAddress, asset: "usdc", chain: "solana",
    });
  });

  it("uses mainnet destination identifiers for sandbox purchases", async () => {
    mocks.environment = "sandbox";
    mocks.depositFunds.mockResolvedValue({ method: "fiat", status: "confirmed" });
    render(<Harness />);
    chooseWallet(baseAddress);
    chooseCard();
    await waitFor(() => expect(mocks.depositFunds).toHaveBeenCalledTimes(1));
    expect(mocks.depositFunds.mock.calls[0][0]).toMatchObject({
      destination: { chain: "base" }, fiat: { environment: "sandbox" },
    });
  });

  it.each(["production", "sandbox"] as const)("disables card funding on testnets in %s", (environment) => {
    mocks.isTestnet = true;
    mocks.environment = environment;
    render(<Harness />);
    chooseWallet(solanaAddress);
    const cardButton = screen.getByRole("button", { name: /Pay with card/ }) as HTMLButtonElement;
    expect(cardButton.disabled).toBe(true);
    fireEvent.click(cardButton);
    expect(mocks.depositFunds).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Transfer from wallet/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(mocks.connectWallet).not.toHaveBeenCalled();
  });
});
