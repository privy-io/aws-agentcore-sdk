import { NextRequest, NextResponse } from "next/server";
import { SOLANA_MAINNET_RPC } from "@/lib/constants";

/**
 * Proxies Solana JSON-RPC POSTs to mainnet from the server so the browser
 * avoids 403 from the public cluster endpoint.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await fetch(SOLANA_MAINNET_RPC, {
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
