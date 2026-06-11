import { CopyAddress } from "./CopyAddress";

interface Props {
  address: string;
  balance: string;
}

export function RelayerInfo({ address, balance }: Props) {
  const balanceNum = parseFloat(balance);
  const low = balanceNum < 0.005;

  return (
    <div className="card">
      <h2>Relayer wallet</h2>
      <p className="hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
        Anyone can send Sepolia ETH to this address to keep the faucet running —
        each drip costs roughly 21 000 gas.
      </p>
      <div className="contracts-box">
        <div className="contract-row">
          <span className="label">Address:</span>
          <CopyAddress address={address} />
        </div>
        <div className="contract-row">
          <span className="label">Balance:</span>
          <span>
            <strong style={{ color: low ? "var(--warning)" : undefined }}>
              {balanceNum.toFixed(4)} ETH
            </strong>
            {low && (
              <span className="muted" style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }}>
                (low — please fund)
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
