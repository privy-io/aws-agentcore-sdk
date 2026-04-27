import { PrivyClient } from "@privy-io/node";

const privy = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

/**
 * Verifies the Privy access token from the Authorization header.
 * Returns the authenticated userId, or null if the token is missing or invalid.
 */
export async function verifyPrivyToken(req: Request): Promise<string | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const { user_id } = await privy.utils().auth().verifyAccessToken(token);
    return user_id;
  } catch {
    return null;
  }
}
