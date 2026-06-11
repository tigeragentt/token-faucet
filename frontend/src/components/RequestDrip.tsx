import { useState } from "react";
import { isAddress } from "ethers";

interface Props {
  loading: boolean;
  txStatus: string | null;
  account: string | null;
  dripAmount: string;
  onRequest: (recipient: string) => Promise<void>;
}

export function RequestDrip({
  loading,
  txStatus,
  account,
  dripAmount,
  onRequest,
}: Props) {
  const [recipient, setRecipient] = useState(account ?? "");

  const trimmed = recipient.trim();
  const valid = trimmed.length > 0 && isAddress(trimmed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    await onRequest(trimmed);
  };

  return (
    <div className="card buy-tokens">
      <h2>Request {dripAmount} ETH</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            placeholder="0x... Ethereum address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={loading}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        {trimmed !== "" && !valid && (
          <p className="estimate">Not a valid Ethereum address</p>
        )}
        <button
          type="submit"
          disabled={loading || !valid}
          className="btn btn-primary"
        >
          {loading ? "Processing..." : `Request ${dripAmount} ETH`}
        </button>
      </form>
      {txStatus && (
        <p
          className={`tx-status ${
            txStatus.startsWith("Error") || txStatus.includes("cooldown")
              ? "error"
              : "success"
          }`}
        >
          {txStatus}
        </p>
      )}
      <p className="hint">
        No wallet needed — a relayer pays the gas. You will receive {dripAmount}{" "}
        ETH directly to the address above.
      </p>
    </div>
  );
}
