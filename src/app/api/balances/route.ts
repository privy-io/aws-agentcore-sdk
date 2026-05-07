import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbi } from "viem";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { type PositionView } from "@/types/wallet";
import { network } from "@/lib/network";

const USDC_DECIMALS = 6;

const baseClient = createPublicClient({
  chain: network.base.chain,
  transport: http(),
});

const solanaConnection = new Connection(network.solana.rpcUrl);

const erc20Abi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
]);

async function getBaseUsdcBalance(address: string): Promise<PositionView[]> {
  const raw = await baseClient.readContract({
    address: network.base.usdc,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });
  const amount = Number(raw) / 10 ** USDC_DECIMALS;
  return [
    {
      icon: null,
      chain: "base",
      symbol: "USDC",
      name: "USD Coin",
      amount,
      value: amount,
    },
  ];
}

async function getSolanaUsdcBalance(address: string): Promise<PositionView[]> {
  const mint = new PublicKey(network.solana.usdcMint);
  const owner = new PublicKey(address);
  const tokenAccount = getAssociatedTokenAddressSync(mint, owner);

  try {
    const balance = await solanaConnection.getTokenAccountBalance(tokenAccount);
    const amount = balance.value.uiAmount ?? 0;
    return [
      {
        icon: null,
        chain: "solana",
        symbol: "USDC",
        name: "USD Coin",
        amount,
        value: amount,
      },
    ];
  } catch {
    // Token account doesn't exist — wallet holds no USDC.
    return [
      {
        icon: null,
        chain: "solana",
        symbol: "USDC",
        name: "USD Coin",
        amount: 0,
        value: 0,
      },
    ];
  }
}

export async function GET(req: NextRequest) {
  const addressesParam = req.nextUrl.searchParams.get("addresses");
  if (!addressesParam) {
    return NextResponse.json(
      { error: "Missing addresses param" },
      { status: 400 },
    );
  }

  const addresses = addressesParam.split(",").filter(Boolean);

  const results = await Promise.allSettled(
    addresses.map(async (address) => {
      // EVM addresses start with 0x; everything else is treated as Solana.
      const positions = address.startsWith("0x")
        ? await getBaseUsdcBalance(address)
        : await getSolanaUsdcBalance(address);
      return { address, positions };
    }),
  );

  const positions = results
    .filter((r) => r.status === "fulfilled")
    .map(
      (r) =>
        (
          r as PromiseFulfilledResult<{
            address: string;
            positions: PositionView[];
          }>
        ).value,
    );

  return NextResponse.json({ positions });
}
