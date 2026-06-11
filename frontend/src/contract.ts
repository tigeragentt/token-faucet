import { parseAbi, type Address } from 'viem'

/**
 * Set these after deploying TokenFaucet.sol to Sepolia.
 * The default address below is a placeholder — replace it with your deployment.
 */
export const FAUCET_ADDRESS: Address = '0x0000000000000000000000000000000000000000'

export const FAUCET_ABI = parseAbi([
  // reads
  'function dripAmount() view returns (uint256)',
  'function cooldown() view returns (uint256)',
  'function owner() view returns (address)',
  'function lastDripAt(address user) view returns (uint256)',
  'function nextDripAt(address user) view returns (uint256)',
  'function secondsUntilNextDrip(address user) view returns (uint256)',

  // writes
  'function drip(address to)',

  // events
  'event Dripped(address indexed to, uint256 amount, address indexed by)',
  'event Funded(address indexed from, uint256 amount)',

  // custom errors
  'error InvalidAddress()',
  'error CooldownActive(uint256 secondsRemaining)',
  'error InsufficientBalance()',
  'error TransferFailed()',
])
