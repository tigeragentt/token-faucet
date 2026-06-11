interface Props {
  account: string | null;
  connecting: boolean;
  error: string | null;
  onConnect: () => void;
}

export function ConnectWallet({ account, connecting, error, onConnect }: Props) {
  if (account) {
    return (
      <div className="wallet-connected">
        <span className="dot" />
        {account.slice(0, 6)}...{account.slice(-4)}
      </div>
    );
  }

  return (
    <div className="connect-section">
      <button onClick={onConnect} disabled={connecting} className="btn btn-primary">
        {connecting ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
