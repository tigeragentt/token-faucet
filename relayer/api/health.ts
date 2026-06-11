import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const hasKey = Boolean(process.env.RELAYER_PRIVATE_KEY)
  const hasFaucet = Boolean(process.env.FAUCET_ADDRESS)
  res.status(200).json({
    ok: true,
    configured: hasKey && hasFaucet,
    ts: new Date().toISOString(),
  })
}
