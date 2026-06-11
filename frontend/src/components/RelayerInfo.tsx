interface Props {
  balance: string;
}

export function RelayerInfo({ balance }: Props) {
  const balanceNum = parseFloat(balance);
  const low = balanceNum < 0.005;

  return (
    <div className="card">
      <h2>Relayer wallet</h2>
      <p className="hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
        Anyone can send Sepolia ETH to the relayer address (shown above) to keep
        the faucet running — each drip costs roughly 21 000 gas.
      </p>
      <div className="info-row">
        <div className="info-item">
          <span className="label">Balance</span>
          <span className="value">
            <strong style={{ color: low ? "var(--warning)" : undefined }}>
              {balanceNum.toFixed(4)} ETH
            </strong>
            {low && (
              <span
                className="muted"
                style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }}
              >
                (low — please fund)
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
