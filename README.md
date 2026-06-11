# Token Faucet

A simple Sepolia ETH faucet — Solidity contract that drips a fixed amount of ETH
per request to any Ethereum address, plus a Vite + viem mini-dapp to use it.

## Flow

1. Owner deploys `TokenFaucet.sol` to Sepolia and funds it with test ETH.
2. A user opens the frontend, connects their wallet, types a recipient address.
3. Clicking **Request** sends a transaction calling `drip(recipient)`. The recipient
   receives 0.1 ETH; the caller pays the (tiny) gas fee.
4. Each recipient address is rate-limited by a 24-hour cooldown enforced on-chain.

## Project structure

```
contracts/
  TokenFaucet.sol            ← Solidity contract
frontend/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  src/
    main.ts                  ← UI + viem logic
    contract.ts              ← Faucet address + ABI (edit after deploy)
    style.css
```

## Prerequisites

- Node.js 18+
- A browser wallet (MetaMask or similar) on Ethereum Sepolia
- Some Sepolia ETH for the owner to fund the faucet

## 1. Deploy the contract

In Remix or Foundry, deploy `contracts/TokenFaucet.sol` to Sepolia with these
constructor arguments:

| Argument            | Value             | Meaning                  |
|---------------------|-------------------|--------------------------|
| `_dripAmount`       | `100000000000000000` | 0.1 ETH (in wei)      |
| `_cooldownSeconds`  | `86400`           | 24 hours                 |

After deployment, send some Sepolia ETH directly to the contract address to fund it
(the `receive()` function emits a `Funded` event).

## 2. Wire up the frontend

Open `frontend/src/contract.ts` and replace `FAUCET_ADDRESS` with your deployed
contract address.

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>, connect your wallet (will prompt to switch to Sepolia),
optionally edit the recipient address, and click **Request 0.1 ETH**.

## Owner controls (call on Sepolia from the deployer wallet)

- `setDripAmount(uint256 newAmount)` — change drip size (wei).
- `setCooldown(uint256 seconds)` — change rate-limit window.
- `drain(address payable to)` — pull all remaining ETH back out.

## Notes

- `drip(to)` is permissionless. Anyone can pay gas to trigger a drip to any address.
  This is the standard public-faucet UX.
- The 24-hour cooldown is per recipient, not per caller — so the same person can't
  refill a single address repeatedly, but they can drip to a fresh address each call.
- Contract uses Solidity custom errors (`CooldownActive`, `InsufficientBalance`,
  `TransferFailed`, `InvalidAddress`) — viem will surface these in the UI on failure.
