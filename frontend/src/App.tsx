import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { useFaucet } from "./hooks/useFaucet";
import { ConnectWallet } from "./components/ConnectWallet";
import { FaucetInfo } from "./components/FaucetInfo";
import { RequestDrip } from "./components/RequestDrip";
import { AdminPanel } from "./components/AdminPanel";
import { CopyAddress } from "./components/CopyAddress";
import "./App.css";

function App() {
  const { account, signer, error, connecting, connect } = useWallet();
  const {
    faucetAddress,
    faucetBalance,
    dripAmount,
    cooldownSeconds,
    secondsUntilNext,
    isOwner,
    loading,
    txStatus,
    drip,
    setDripAmountTx,
    setCooldownTx,
    drain,
    updateFaucetAddress,
    configured,
  } = useFaucet(signer, account);

  const [editing, setEditing] = useState(false);
  const [editAddress, setEditAddress] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const handleEdit = () => {
    setEditAddress(faucetAddress);
    setEditError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateFaucetAddress(editAddress);
      setEditing(false);
      setEditError(null);
    } catch (err: unknown) {
      setEditError((err as Error).message);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditError(null);
  };

  return (
    <>
      <header>
        <span className="header-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
            <path d="M12 2C9 6 5 10 5 14a7 7 0 0 0 14 0c0-4-4-8-7-12z" />
          </svg>
        </span>
        <div className="header-text">
          <h1>Sepolia ETH Faucet</h1>
          <p className="subtitle">Drips {dripAmount} ETH per request on Sepolia</p>
        </div>
      </header>
      <div className="app">
        {!configured && account && (
          <div className="card warning">
            <h2>Configuration Required</h2>
            <p>
              Set your contract address in <code>.env</code>:
            </p>
            <pre>
              TOKEN_FAUCET_ADDRESS=0x...
            </pre>
          </div>
        )}

        {configured && (
          <main>
            <div className="card contracts-box">
              <div className="contract-row">
                <span className="label">Faucet:</span>
                {editing ? (
                  <span className="edit-address">
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="0x..."
                    />
                    <button className="btn-copy" onClick={handleSave}>
                      Save
                    </button>
                    <button className="btn-copy" onClick={handleCancel}>
                      Cancel
                    </button>
                  </span>
                ) : (
                  <>
                    <CopyAddress address={faucetAddress} />
                    <button className="btn-copy" onClick={handleEdit}>
                      Edit
                    </button>
                  </>
                )}
              </div>
              {editError && <p className="error">{editError}</p>}
            </div>

            <FaucetInfo
              faucetBalance={faucetBalance}
              dripAmount={dripAmount}
              cooldownSeconds={cooldownSeconds}
              secondsUntilNext={secondsUntilNext}
              hasAccount={Boolean(account)}
            />

            {account ? (
              <>
                <RequestDrip
                  loading={loading}
                  txStatus={txStatus}
                  account={account}
                  dripAmount={dripAmount}
                  onDrip={drip}
                />
                {isOwner && (
                  <AdminPanel
                    loading={loading}
                    faucetBalance={faucetBalance}
                    dripAmount={dripAmount}
                    cooldownSeconds={cooldownSeconds}
                    onSetDripAmount={setDripAmountTx}
                    onSetCooldown={setCooldownTx}
                    onDrain={drain}
                  />
                )}
              </>
            ) : (
              <div className="card">
                <p>
                  Connect your wallet to request a drip. <br />
                  You can send the ETH to your wallet or any address you choose.
                </p>
              </div>
            )}
            <ConnectWallet
              account={account}
              connecting={connecting}
              error={error}
              onConnect={connect}
            />
          </main>
        )}
      </div>
    </>
  );
}

export default App;
