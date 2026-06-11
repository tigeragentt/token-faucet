import { useEffect, useState } from "react";
import { isAddress } from "ethers";

interface Props {
  loading: boolean;
  txStatus: string | null;
  account: string;
  dripAmount: string;
  onDrip: (recipient: string) => Promise<void>;
}

export function RequestDrip({ loading, txStatus, account, dripAmount, onDrip }: Props) {
  const [recipient, setRecipient] = useState(account);

  useEffect(() => {
    setRecipient((prev) => (prev === "" ? account : prev));
  }, [account]);

  const valid = recipient.trim().length > 0 && isAddress(recipient.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    await onDrip(recipient.trim());
  };

  return (
    <div className="card buy-tokens">
      <h2>Request {dripAmount} ETH</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            placeholder="0x... recipient address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={loading}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        {recipient.trim() !== "" && !valid && (
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
            txStatus.startsWith("Error") ? "error" : "success"
          }`}
        >
          {txStatus}
        </p>
      )}
      <p className="hint">
        Leave the address as-is to send to your connected wallet, or paste any
        address to drip there. Caller pays gas; recipient gets the ETH.
      </p>
    </div>
  );
}
