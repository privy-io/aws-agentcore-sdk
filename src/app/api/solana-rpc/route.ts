import { NextRequest, NextResponse } from "next/server";
import { network } from "@/lib/network";
import { verifyPrivyToken } from "@/lib/privy-server";

/**
 * Proxies Solana JSON-RPC POSTs to the configured cluster from the server so
 * the browser avoids 403 from the public endpoint.
 */
export async function POST(req: NextRequest) {
  const userId = await verifyPrivyToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.text();
  const upstream = await fetch(network.solana.rpcUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
