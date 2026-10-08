# Local funding sandbox evidence

## End-to-end Stripe sandbox recording

[Watch the recording (MP4)](stripe-sandbox-solana-flow.mp4)

[![Stripe sandbox checkout confirmation](stripe-sandbox-recording-poster.png)](stripe-sandbox-solana-flow.mp4)

Recorded from the PR's local production build on October 8, 2026. The recording follows **Add funds → Solana → Pay with card or bank → Link → sandbox verification → test-card entry → approval → Transaction confirmed → wallet dashboard** for 50 USDC on Solana.

The checkout uses Stripe sandbox, test identity details, and the documented `4242` test card. No real funds move. The confirmation screen reports that the purchase is processing; this does not demonstrate mainnet settlement. Wallet addresses are obscured and idle pauses are trimmed. Provider responses and application behavior are unmodified.

The recording covers Stripe. Completed Meld purchases and manual Base checkout remain untested.

## Earlier screenshots

Manually tested from the local frontend on September 29, 2026, using USDC on Solana. These screenshots were cropped to the checkout UI to remove browser chrome, personal information, wallet details, and URL parameters. They show sandbox behavior and do not demonstrate mainnet settlement or geographic coverage.

| Flow | Observed result |
| --- | --- |
| Stripe Embedded Components | Completed Link verification, identity verification, test-card entry, approval, and the transaction confirmation screen; returned to the app. |
| Meld → Transak | Opened Transak's staging checkout for a $50 USD purchase of USDC on Solana. Purchase completion remains untested. |

## Stripe payment entry

The embedded payment form identifies the sandbox environment and offers card and US bank account payment methods.

![Stripe embedded sandbox payment form](stripe-sandbox-payment-method.png)

## Stripe confirmation

The local Stripe sandbox test reached the transaction confirmation screen.

![Stripe sandbox transaction confirmation](stripe-sandbox-confirmation.png)

## Meld provider checkout

Meld routed the local test to Transak's staging checkout. Transak branding is expected because Meld aggregates providers. This screenshot shows the checkout handoff, not a completed purchase.

![Meld-routed Transak sandbox checkout](meld-transak-sandbox-checkout.png)

See the [funding setup and test instructions](../../../README.md#funding-wallets) to reproduce these flows. Manual Base checkout and a completed Meld sandbox purchase remain outstanding.
