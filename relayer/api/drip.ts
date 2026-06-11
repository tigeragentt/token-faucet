import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Contract, JsonRpcProvider, Wallet, isAddress } from 'ethers'

const FAUCET_ABI = [
  'function drip(address to)',
  'function dripAmount() view returns (uint256)',
  'function secondsUntilNextDrip(address) view returns (uint256)',
]

const RPC = process.env.SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com'

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  const FAUCET = process.env.FAUCET_ADDRESS
  const KEY = process.env.RELAYER_PRIVATE_KEY
  if (!FAUCET) return res.status(500).json({ error: 'FAUCET_ADDRESS not configured' })
  if (!KEY) return res.status(500).json({ error: 'RELAYER_PRIVATE_KEY not configured' })

  const to = String((req.body as any)?.to ?? '').trim()
  if (!isAddress(to)) {
    return res.status(400).json({ error: 'invalid recipient address' })
  }

  try {
    const provider = new JsonRpcProvider(RPC)
    const wallet = new Wallet(KEY, provider)
    const faucet = new Contract(FAUCET, FAUCET_ABI, wallet)

    // Pre-flight cooldown check — bounce early with a clear error so the
    // operator wallet doesn't waste gas on a revert.
    const remaining = (await faucet.secondsUntilNextDrip(to)) as bigint
    if (remaining > 0n) {
      return res.status(429).json({
        error: 'recipient is on cooldown',
        secondsRemaining: Number(remaining),
      })
    }

    const tx = await faucet.drip(to)
    return res.status(200).json({
      ok: true,
      txHash: tx.hash,
      to,
      from: wallet.address,
    })
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: err?.shortMessage ?? err?.message ?? String(err) })
  }
}
