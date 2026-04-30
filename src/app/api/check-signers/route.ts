import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  const signerId = process.env.NEXT_PUBLIC_PRIVY_SIGNER_ID;

  if (!appId || !appSecret || !signerId) {
    return NextResponse.json(
      { error: "Missing server configuration" },
      { status: 500 },
    );
  }

  const { walletIds } = (await req.json()) as { walletIds: string[] };

  if (!Array.isArray(walletIds) || walletIds.length === 0) {
    return NextResponse.json({ connected: false });
  }

  const credentials = Buffer.from(`${appId}:${appSecret}`).toString("base64");

  const results = await Promise.all(
    walletIds.map(async (walletId) => {
      const url = `https://auth.privy.io/api/v1/wallets/${walletId}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Basic ${credentials}`,
          "privy-app-id": appId,
        },
      });
      if (!res.ok) return false;
      const wallet = (await res.json()) as {
        additional_signers?: { signer_id: string }[];
      };
      return (wallet.additional_signers ?? []).some(
        (s) => s.signer_id === signerId,
      );
    }),
  );

  return NextResponse.json({ connected: results.every(Boolean) });
}
