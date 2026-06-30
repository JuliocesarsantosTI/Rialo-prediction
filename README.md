# Rialo Prediction

**An on-chain prediction market where each market settles itself from a primary web source, with no oracle committee and no admin button.**

Live on Base Sepolia as a stand-in until Rialo devnet opens. The whole project is built around one idea: the hardest part of a prediction market is **resolution**, and on Rialo that part gets simple.

🔗 **Live:** https://rialo-jet.vercel.app

---

## Why this exists

Plenty of people build prediction markets. The interesting question isn't "can you make one." It's **"who decides what actually happened?"**

Most designs bolt on an oracle: a committee, a multisig, a dispute game, or an admin button. Rialo's thesis is the opposite. A contract can read a primary web source directly (**Rialo Edge**) and settle itself, with automation handled natively (**Rialo Workflow**). No keeper bots, no oracle quorum.

Rialo Prediction is built to prove that thesis end to end.

## How it works

- **Markets:** binary YES/NO, parimutuel pools. Odds equal each side's share of the pool. Winners split the whole pool pro-rata.
- **Collateral:** test `gUSDC` (faucet token, no real value).
- **Resolution:** each market reads a real web source at close (price feeds today) and settles from it, with no manual outcome entry.
- **Ask Rialo:** a docs-grounded chatbot tab that answers only from the Rialo docs.

## The Rialo angle (the part that matters)

The resolution and automation layer is deliberately isolated, because that's exactly what Rialo removes:

| Piece | On Base Sepolia (now) | On Rialo |
|---|---|---|
| Read the outcome from the web | a keeper does an HTTPS fetch off-chain | on-chain **Rialo Edge** web call |
| Trigger settlement | an interval loop submits the `resolve()` tx | **Rialo Workflow** fires it natively |

Migrating means "delete the keeper, move the web read on-chain." Nothing else changes. That's the differentiator: this isn't a betting app with a Rialo logo on it. It's a working demonstration of why Rialo makes resolution trustless and simple.

## Stack

- **Contracts (Base Sepolia):** `TestUSDC` (faucet ERC20) and `PredictionMarket` (parimutuel, pull-payout).
- **Frontend:** static site on Vercel with wallet connect (injected + WalletConnect), live odds, and Active / Ended / Ask Rialo tabs.
- **Backend keeper:** reads the web source and submits `resolve()` on-chain (the piece Rialo Edge replaces).
- **Ask Rialo:** Vercel serverless function calling an LLM, grounded strictly in the Rialo docs.

## Status

- Contracts deployed on Base Sepolia
- Live markets, auto-resolved from price feeds
- Wallet connect + betting + claim
- Docs-grounded "Ask Rialo" chat
- Migration to Rialo Edge / Workflow, pending devnet access

## What I'd want from Rialo

Devnet access, plus SDK and docs for **Rialo Edge** (on-chain web calls) and **Rialo Workflow** (native automation), so the off-chain keeper can be removed and resolution can happen fully on-chain.

---

*Test network only. gUSDC is a faucet token with no value.*
