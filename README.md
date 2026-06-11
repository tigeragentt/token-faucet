# Token Faucet

A simple Sepolia ETH faucet. Three pieces:

1. **Solidity 0.8.34 contract** that drips a fixed amount of ETH per request to any
   address, with a per-recipient cooldown.
2. **React + ethers v6 frontend**, styled after
   [sol-token-shop](https://github.com/solangegueiros/sol-token-shop).
3. **Tiny Vercel relayer** that calls `drip(to)` on-chain so **users don't need any
   ETH for gas**.

## Flow

1. Owner deploys `TokenFaucet.sol` to Ethereum Sepolia and funds it with test ETH.
2. Owner deploys the relayer (Vercel serverless), with a funded operator wallet.
3. A user opens the frontend, types any Ethereum address, clicks **Request 0.1 ETH**.
4. Frontend POSTs to the relayer → relayer calls `drip(to)` → recipient gets ETH.
5. Each recipient address is rate-limited by a 24-hour cooldown enforced on-chain.

```
       browser                       Vercel                Sepolia
   ┌────────────┐    POST /api/drip    ┌─────────┐  drip(to)  ┌──────────┐
   │ frontend   │ ─────────────────►   │ relayer │ ─────────► │ Faucet   │
   │ (no wallet │ ◄──── txHash ─────── │ (pays   │            │ contract │
   │  needed)   │                      │  gas)   │            └──────────┘
   └────────────┘                      └─────────┘
```

## Project structure

```
contracts/
  TokenFaucet.sol            ← Solidity 0.8.34, owner-funded escrow + drip(to)
frontend/
  index.html
  package.json               ← React 19 + ethers v6 + Vite
  vite.config.ts             ← envPrefix "TOKEN_"
  .env.example
  src/
    main.tsx, App.tsx, App.css, index.css
    config.ts
    contracts/abis.ts        ← ABI + env-driven addresses + RELAYER_URL
    hooks/
      useWallet.ts           ← wallet connect + Sepolia switching (owner only)
      useFaucet.ts           ← reads + POST to relayer + owner write txns
    components/
      ConnectWallet.tsx
      CopyAddress.tsx
      FaucetInfo.tsx
      RequestDrip.tsx        ← typed address → relayer (no wallet required)
      AdminPanel.tsx         ← owner-only: setDripAmount / setCooldown / drain
relayer/                     ← Vercel serverless
  api/
    drip.ts                  ← POST /api/drip { to } → submits drip(to) tx
    health.ts
  vercel.json
  .env.example
  README.md
```

## Prerequisites

- Node.js 18+
- Wallet (for the owner to deploy + manage)
- Sepolia ETH for the owner to (a) fund the faucet and (b) fund the relayer's
  operator wallet

## 1. Deploy the contract

In Remix or Foundry, deploy `contracts/TokenFaucet.sol` to Sepolia with these
constructor arguments:

| Argument            | Value                 | Meaning   |
|---------------------|-----------------------|-----------|
| `_dripAmount`       | `100000000000000000`  | 0.1 ETH   |
| `_cooldownSeconds`  | `86400`               | 24 hours  |

Then send some Sepolia ETH directly to the contract address to fund it (`receive()`
will emit a `Funded` event).

## 2. Deploy the relayer

```bash
cd relayer
cp .env.example .env   # set RELAYER_PRIVATE_KEY + FAUCET_ADDRESS
npm install
npx vercel --prod
```

Set the same env vars in the Vercel dashboard for the production deployment. Fund
the operator wallet (the address whose private key is `RELAYER_PRIVATE_KEY`) with
some Sepolia ETH — every drip costs ~21 000 gas.

See `relayer/README.md` for the full endpoint reference.

## 3. Configure + run the frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```
TOKEN_FAUCET_ADDRESS=0xYourFaucetContractAddress
TOKEN_RELAYER_URL=https://your-relayer.vercel.app
```

Then:

```bash
npm install
npm run dev
```

Open <http://localhost:5173/>. No wallet connection needed to request a drip — just
type an address and click. Connecting a wallet is only required for the owner panel.

## 4. Production build

```bash
cd frontend
npm run build
```

## Owner controls (visible only when connected as the deployer)

- **Set drip amount** — change the per-request amount (ETH).
- **Set cooldown** — change the per-recipient rate-limit (seconds).
- **Drain faucet** — pull all remaining ETH to any address.
- **Edit faucet address** — point the UI at a different deployed contract (the
  Edit button is hidden for non-owners).

## Notes

- `drip(to)` is permissionless on-chain — anyone with ETH could call it directly.
  The relayer just removes the "need ETH for gas" UX barrier.
- The 24-hour cooldown is **per recipient**, not per caller. The same address can't
  receive more than once per cooldown window, regardless of who submits.
- No per-IP rate limiting on the relayer (by design — the on-chain cooldown is the
  only throttle).
