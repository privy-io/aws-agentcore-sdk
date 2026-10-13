// Validates public environment variables at module load time.
// If any required variable is missing, an error is thrown immediately
// rather than surfacing as a cryptic runtime failure later.
//
// NOTE: Next.js inlines NEXT_PUBLIC_* vars via static analysis on literal
// strings. Dynamic access (process.env[key]) is not replaced, so each var
// must be referenced by its exact literal name here.

function require(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Add it to your .env.local file.`,
    );
  }
  return value;
}

function resolveFiatOnrampEnvironment(): "production" | "sandbox" {
  const value = process.env.NEXT_PUBLIC_FIAT_ONRAMP_ENVIRONMENT ?? "production";
  if (value === "production" || value === "sandbox") return value;
  throw new Error(
    `Invalid NEXT_PUBLIC_FIAT_ONRAMP_ENVIRONMENT="${value}". Must be "production" or "sandbox".`,
  );
}

export const env = {
  privyAppId: require("NEXT_PUBLIC_PRIVY_APP_ID", process.env.NEXT_PUBLIC_PRIVY_APP_ID),
  privySignerId: require("NEXT_PUBLIC_PRIVY_SIGNER_ID", process.env.NEXT_PUBLIC_PRIVY_SIGNER_ID),
  fiatOnrampEnvironment: resolveFiatOnrampEnvironment(),
} as const;
