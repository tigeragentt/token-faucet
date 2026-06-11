import {
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  http,
  isAddress,
  type Address,
} from 'viem'
import { sepolia } from 'viem/chains'
import { FAUCET_ABI, FAUCET_ADDRESS } from './contract'

declare global {
  interface Window {
    ethereum?: any
  }
}

const SEPOLIA_PUBLIC_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'

// ── DOM ────────────────────────────────────────────────────────────────────
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T

const connectBtn = $<HTMLButtonElement>('connectBtn')
const walletInfo = $<HTMLSpanElement>('walletInfo')
const recipientInput = $<HTMLInputElement>('recipient')
const dripBtn = $<HTMLButtonElement>('dripBtn')
const statusEl = $<HTMLElement>('status')
const faucetAddrEl = $<HTMLElement>('faucetAddr')
const faucetBalanceEl = $<HTMLElement>('faucetBalance')
const dripAmountEl = $<HTMLElement>('dripAmount')

faucetAddrEl.textContent = FAUCET_ADDRESS

// ── Clients ───────────────────────────────────────────────────────────────
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_PUBLIC_RPC),
})

let walletAddress: Address | null = null
let walletClient: ReturnType<typeof createWalletClient> | null = null

// ── Status helpers ────────────────────────────────────────────────────────
type Tone = 'info' | 'success' | 'error'
function setStatus(text: string, tone: Tone = 'info') {
  statusEl.className = `status status--${tone}`
  statusEl.textContent = text
}

// ── Wallet ────────────────────────────────────────────────────────────────
async function connectWallet() {
  if (!window.ethereum) {
    setStatus('No injected wallet found. Install MetaMask (or similar).', 'error')
    return
  }
  try {
    const [account] = (await window.ethereum.request({
      method: 'eth_requestAccounts',
    })) as Address[]
    walletAddress = account
    walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: custom(window.ethereum),
    })

    // Make sure we're on Sepolia.
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // 11155111
      })
    } catch (e: any) {
      // 4902 = chain not added; let MetaMask handle it after we ask the user.
      if (e?.code !== 4902) {
        setStatus(`Could not switch to Sepolia: ${e?.message ?? e}`, 'error')
        return
      }
    }

    walletInfo.textContent = `${account.slice(0, 6)}…${account.slice(-4)}`
    connectBtn.textContent = 'Connected'
    connectBtn.disabled = true
    dripBtn.disabled = false
    if (!recipientInput.value) recipientInput.value = account
    setStatus('Wallet connected. You can request a drip now.', 'success')
  } catch (e: any) {
    setStatus(`Connect failed: ${e?.message ?? e}`, 'error')
  }
}

// ── Drip ──────────────────────────────────────────────────────────────────
async function requestDrip() {
  if (!walletClient || !walletAddress) {
    setStatus('Connect a wallet first.', 'error')
    return
  }
  const raw = recipientInput.value.trim() || walletAddress
  if (!isAddress(raw)) {
    setStatus('Recipient is not a valid Ethereum address.', 'error')
    return
  }
  const to = raw as Address

  // Quick read: enough balance? still on cooldown?
  try {
    const [balance, remaining, amount] = await Promise.all([
      publicClient.getBalance({ address: FAUCET_ADDRESS }),
      publicClient.readContract({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'secondsUntilNextDrip',
        args: [to],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'dripAmount',
      }) as Promise<bigint>,
    ])

    if (remaining > 0n) {
      const mins = Number(remaining) / 60
      setStatus(
        `Recipient is still on cooldown. Try again in ~${mins.toFixed(0)} minutes.`,
        'error',
      )
      return
    }
    if (balance < amount) {
      setStatus(
        `Faucet is empty (balance ${formatEther(balance)} ETH < ${formatEther(amount)} ETH).`,
        'error',
      )
      return
    }
  } catch (e: any) {
    setStatus(`Pre-flight read failed: ${e?.message ?? e}`, 'error')
    return
  }

  setStatus(`Submitting drip → ${to}…`)
  dripBtn.disabled = true
  try {
    const hash = await walletClient.writeContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: 'drip',
      args: [to],
      chain: sepolia,
      account: walletAddress,
    })
    setStatus(`Tx submitted: ${hash} — waiting for confirmation…`)

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (receipt.status === 'success') {
      setStatus(`✅ Drip confirmed in block ${receipt.blockNumber}. Tx ${hash}`, 'success')
      void refreshFaucetBalance()
    } else {
      setStatus(`Transaction reverted. Tx ${hash}`, 'error')
    }
  } catch (e: any) {
    setStatus(`Drip failed: ${e?.shortMessage ?? e?.message ?? e}`, 'error')
  } finally {
    dripBtn.disabled = false
  }
}

// ── Faucet status ─────────────────────────────────────────────────────────
async function refreshFaucetBalance() {
  try {
    const [bal, amount] = await Promise.all([
      publicClient.getBalance({ address: FAUCET_ADDRESS }),
      publicClient.readContract({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'dripAmount',
      }) as Promise<bigint>,
    ])
    faucetBalanceEl.textContent = ` — balance: ${formatEther(bal)} ETH`
    dripAmountEl.textContent = formatEther(amount)
    dripBtn.textContent = `Request ${formatEther(amount)} ETH`
  } catch {
    faucetBalanceEl.textContent = ' — balance: (read failed)'
  }
}

// ── Wire up ───────────────────────────────────────────────────────────────
connectBtn.addEventListener('click', () => void connectWallet())
dripBtn.addEventListener('click', () => void requestDrip())

if (FAUCET_ADDRESS === '0x0000000000000000000000000000000000000000') {
  setStatus(
    'Faucet address not set. Deploy TokenFaucet.sol and update FAUCET_ADDRESS in src/contract.ts.',
    'error',
  )
} else {
  void refreshFaucetBalance()
}
