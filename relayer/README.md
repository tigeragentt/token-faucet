# Token Faucet Relayer

Tiny Vercel serverless function that lets users request a drip **without holding
any ETH for gas**. The relayer holds a single funded Sepolia wallet (the "operator")
which pays gas for every `drip(to)` call.

## Endpoints

```
GET  /api/health
POST /api/drip      body: { to: "0x..." }
```

`POST /api/drip` responses:

| Status | Body                                                          | Meaning                              |
|--------|---------------------------------------------------------------|--------------------------------------|
| 200    | `{ ok, txHash, to, from }`                                    | Submitted on-chain                   |
| 400    | `{ error: "invalid recipient address" }`                      | Bad input                            |
| 429    | `{ error: "recipient is on cooldown", secondsRemaining }`     | On-chain 24h cooldown still active   |
| 500    | `{ error: "<details>" }`                                      | RPC, wallet, or contract error       |

CORS is open (`*`), so the frontend can call from any origin.

## No per-IP rate limit

By design — the on-chain `secondsUntilNextDrip(to)` check + the contract's 24-hour
per-recipient cooldown is the only throttle. Anyone can submit, but the same
recipient address can only receive once per cooldown window.

## Local development

```bash
cd relayer
cp .env.example .env   # set RELAYER_PRIVATE_KEY + FAUCET_ADDRESS
npm install
npx vercel dev
```

```bash
curl -X POST http://localhost:3000/api/drip \
  -H 'content-type: application/json' \
  -d '{"to":"0xRecipient"}'
```

## Deploy

```bash
npx vercel login
npx vercel --prod
```

Then in the Vercel dashboard set the production environment variables:

| Variable                | Value                                                   |
|-------------------------|---------------------------------------------------------|
| `RELAYER_PRIVATE_KEY`   | Sepolia private key of a funded operator wallet         |
| `RELAYER_ADDRESS` *(opt)* | Address of the operator wallet (derived from key if blank) |
| `FAUCET_ADDRESS`        | Deployed `TokenFaucet.sol` address                      |
| `SEPOLIA_RPC` *(opt)*   | Custom RPC URL (defaults to publicnode)                 |

After deploy, copy the deployment URL into the frontend `.env`:

```
TOKEN_RELAYER_URL=https://your-relayer.vercel.app
```

## Operations

- **Refill the operator wallet** whenever its balance gets low — every drip costs
  ~21 000 gas for the value transfer + a bit more for the cooldown bookkeeping.
- **Rotate the key** by updating `RELAYER_PRIVATE_KEY` in Vercel; no contract
  change is needed (the operator is just an EOA caller).
