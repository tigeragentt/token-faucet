# Token Faucet

A simple Sepolia ETH faucet — Solidity 0.8.34 contract + React/ethers frontend
styled after [sol-token-shop](https://github.com/solangegueiros/sol-token-shop).

## Flow

1. Owner deploys `TokenFaucet.sol` to Ethereum Sepolia and funds it by sending some
   test ETH to the contract address.
2. A user opens the frontend, connects their wallet, optionally edits the recipient
   address, and clicks **Request 0.1 ETH**.
3. The contract sends 0.1 ETH (configurable) to the recipient. Each recipient address
   is rate-limited by a 24-hour cooldown enforced on-chain.

## Project structure

```
contracts/
  TokenFaucet.sol           ← Solidity 0.8.34
frontend/
  index.html
  package.json              ← React 19 + ethers v6 + Vite
  tsconfig.json
  vite.config.ts            ← envPrefix "TOKEN_"
  .env.example
  src/
    main.tsx
    App.tsx
    App.css
    index.css
    config.ts
    contracts/
      abis.ts               ← FAUCET_ABI + addresses from .env
    hooks/
      useWallet.ts          ← wallet connect + Sepolia switching
      useFaucet.ts          ← reads + writes against TokenFaucet
    components/
      ConnectWallet.tsx
      CopyAddress.tsx
      FaucetInfo.tsx        ← balance / drip amount / cooldown / your cooldown
      RequestDrip.tsx       ← recipient input + request button
      AdminPanel.tsx        ← owner-only: setDripAmount / setCooldown / drain
```

## Prerequisites

- Node.js 18+
- A browser wallet (MetaMask or similar)
- Some Sepolia ETH for the owner to fund the faucet

## 1. Deploy the contract

In Remix or Foundry, deploy `contracts/TokenFaucet.sol` to Sepolia with these
constructor arguments:

| Argument            | Value                 | Meaning   |
|---------------------|-----------------------|-----------|
| `_dripAmount`       | `100000000000000000`  | 0.1 ETH   |
| `_cooldownSeconds`  | `86400`               | 24 hours  |

After deployment, send some Sepolia ETH directly to the contract address to fund it
(`receive()` will emit a `Funded` event).

## 2. Configure the frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```
TOKEN_FAUCET_ADDRESS=0xYourDeployedFaucetAddress
```

## 3. Run

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173/> — the wallet button will prompt you to switch to
Sepolia automatically.

## 4. Production build

```bash
npm run build
```

## Owner controls (visible in the UI when connected as the deployer)

- **Set drip amount** — change the per-request amount (ETH).
- **Set cooldown** — change the per-recipient rate-limit (seconds).
- **Drain faucet** — pull all remaining ETH to any address.

## Notes

- `drip(to)` is permissionless — anyone can pay gas to trigger a drip to any address.
  The 24-hour cooldown is per recipient, not per caller.
- Contract uses Solidity custom errors (`CooldownActive`, `InsufficientBalance`,
  `TransferFailed`, `InvalidAddress`); ethers surfaces them on failure.
