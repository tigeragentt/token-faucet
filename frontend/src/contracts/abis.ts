export const FAUCET_ABI = [
  // reads
  "function dripAmount() view returns (uint256)",
  "function cooldown() view returns (uint256)",
  "function owner() view returns (address)",
  "function lastDripAt(address user) view returns (uint256)",
  "function nextDripAt(address user) view returns (uint256)",
  "function secondsUntilNextDrip(address user) view returns (uint256)",

  // writes
  "function drip(address to)",
  "function setDripAmount(uint256 amount)",
  "function setCooldown(uint256 cooldownSeconds)",
  "function drain(address payable to)",

  // events
  "event Dripped(address indexed to, uint256 amount, address indexed by)",
  "event Funded(address indexed from, uint256 amount)",
];

// Update this in .env after deploying your contract to Sepolia
export const ADDRESSES = {
  faucet: import.meta.env.TOKEN_FAUCET_ADDRESS || "",
};

export const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111
