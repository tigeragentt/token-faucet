import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Wallet } from 'ethers'

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const hasKey = Boolean(process.env.RELAYER_PRIVATE_KEY)
  const hasFaucet = Boolean(process.env.FAUCET_ADDRESS)

  // Prefer the explicit env var so the private key need not be loaded here.
  // Fall back to deriving from the key if the env var is missing.
  let address: string | null = process.env.RELAYER_ADDRESS || null
  if (!address && hasKey) {
    try {
      address = new Wallet(process.env.RELAYER_PRIVATE_KEY!).address
    } catch {
      address = null
    }
  }

  res.status(200).json({
    ok: true,
    configured: hasKey && hasFaucet,
    address,
    faucet: process.env.FAUCET_ADDRESS || null,
    ts: new Date().toISOString(),
  })
}
