interface Props {
  faucetBalance: string;
  dripAmount: string;
  cooldownSeconds: number;
  secondsUntilNext: number;
  hasAccount: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

export function FaucetInfo({
  faucetBalance,
  dripAmount,
  cooldownSeconds,
  secondsUntilNext,
  hasAccount,
}: Props) {
  const balanceNum = parseFloat(faucetBalance);
  const dripNum = parseFloat(dripAmount);
  const drips = dripNum > 0 ? Math.floor(balanceNum / dripNum) : 0;

  return (
    <div className="card token-info">
      <h2>Faucet Status</h2>
      <div className="info-row">
        <div className="info-item">
          <span className="label">Balance</span>
          <span className="value">{balanceNum.toFixed(4)} ETH</span>
        </div>
        <div className="info-item">
          <span className="label">Drip Amount</span>
          <span className="value">{dripAmount} ETH</span>
        </div>
        <div className="info-item">
          <span className="label">Cooldown</span>
          <span className="value">{formatDuration(cooldownSeconds)}</span>
        </div>
        <div className="info-item">
          <span className="label">Drips Left</span>
          <span className="value">{drips}</span>
        </div>
        {hasAccount && (
          <div className="info-item">
            <span className="label">Your Cooldown</span>
            <span className="value">
              {secondsUntilNext > 0 ? formatDuration(secondsUntilNext) : "Ready"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
