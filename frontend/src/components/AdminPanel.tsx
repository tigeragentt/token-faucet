import { useState } from "react";
import { isAddress } from "ethers";

interface Props {
  loading: boolean;
  faucetBalance: string;
  dripAmount: string;
  cooldownSeconds: number;
  onSetDripAmount: (amountEth: string) => Promise<void>;
  onSetCooldown: (seconds: number) => Promise<void>;
  onDrain: (to: string) => Promise<void>;
}

export function AdminPanel({
  loading,
  faucetBalance,
  dripAmount,
  cooldownSeconds,
  onSetDripAmount,
  onSetCooldown,
  onDrain,
}: Props) {
  const [newDrip, setNewDrip] = useState(dripAmount);
  const [newCooldown, setNewCooldown] = useState(String(cooldownSeconds));
  const [drainTo, setDrainTo] = useState("");

  return (
    <div className="card admin-panel">
      <h2>Owner Panel</h2>
      <p>
        Faucet balance: <strong>{faucetBalance} ETH</strong>
      </p>

      <div className="mint-form">
        <h3>Set drip amount</h3>
        <div className="input-group">
          <input
            type="number"
            step="0.0001"
            min="0"
            placeholder="0.1"
            value={newDrip}
            onChange={(e) => setNewDrip(e.target.value)}
            disabled={loading}
          />
          <span className="input-suffix">ETH</span>
        </div>
        <button
          onClick={() => onSetDripAmount(newDrip)}
          disabled={loading || !newDrip || parseFloat(newDrip) <= 0}
          className="btn btn-secondary"
        >
          {loading ? "Processing..." : "Update drip amount"}
        </button>
      </div>

      <div className="mint-form">
        <h3>Set cooldown (seconds)</h3>
        <div className="input-group">
          <input
            type="number"
            min="0"
            placeholder="86400"
            value={newCooldown}
            onChange={(e) => setNewCooldown(e.target.value)}
            disabled={loading}
          />
          <span className="input-suffix">sec</span>
        </div>
        <button
          onClick={() => onSetCooldown(Number(newCooldown))}
          disabled={loading || !newCooldown || Number(newCooldown) < 0}
          className="btn btn-secondary"
        >
          {loading ? "Processing..." : "Update cooldown"}
        </button>
      </div>

      <div className="mint-form">
        <h3>Drain faucet</h3>
        <div className="input-group">
          <input
            type="text"
            placeholder="0x... recipient"
            value={drainTo}
            onChange={(e) => setDrainTo(e.target.value)}
            disabled={loading}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <button
          onClick={() => onDrain(drainTo.trim())}
          disabled={loading || !isAddress(drainTo.trim())}
          className="btn btn-secondary"
        >
          {loading ? "Processing..." : "Drain all ETH"}
        </button>
      </div>
    </div>
  );
}
