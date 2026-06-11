import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Contract,
  JsonRpcProvider,
  JsonRpcSigner,
  formatEther,
  parseEther,
} from "ethers";
import { FAUCET_ABI, ADDRESSES, RELAYER_URL } from "../contracts/abis";
import { SEPOLIA_RPC } from "../config";

export function useFaucet(signer: JsonRpcSigner | null, account: string | null) {
  const [faucetAddress, setFaucetAddress] = useState<string>(ADDRESSES.faucet);
  const [faucetBalance, setFaucetBalance] = useState<string>("0");
  const [dripAmount, setDripAmount] = useState<string>("0");
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [secondsUntilNext, setSecondsUntilNext] = useState<number>(0);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const publicProvider = useMemo(() => new JsonRpcProvider(SEPOLIA_RPC), []);

  const getReadContract = useCallback(() => {
    if (!faucetAddress) return null;
    const provider = signer ?? publicProvider;
    return new Contract(faucetAddress, FAUCET_ABI, provider);
  }, [signer, publicProvider, faucetAddress]);

  const getWriteContract = useCallback(() => {
    if (!signer || !faucetAddress) return null;
    return new Contract(faucetAddress, FAUCET_ABI, signer);
  }, [signer, faucetAddress]);

  const refresh = useCallback(async () => {
    const contract = getReadContract();
    if (!contract) return;

    try {
      const provider = signer?.provider ?? publicProvider;
      const promises: Promise<unknown>[] = [
        provider.getBalance(faucetAddress),
        contract.dripAmount(),
        contract.cooldown(),
      ];
      if (account) {
        promises.push(contract.secondsUntilNextDrip(account));
        promises.push(contract.owner());
      }

      const results = await Promise.all(promises);
      setFaucetBalance(formatEther(results[0] as bigint));
      setDripAmount(formatEther(results[1] as bigint));
      setCooldownSeconds(Number(results[2] as bigint));

      if (account) {
        setSecondsUntilNext(Number(results[3] as bigint));
        setIsOwner(
          (results[4] as string).toLowerCase() === account.toLowerCase()
        );
      } else {
        setSecondsUntilNext(0);
        setIsOwner(false);
      }
    } catch (err) {
      console.error("Failed to fetch faucet data:", err);
    }
  }, [getReadContract, account, signer, publicProvider, faucetAddress]);

  const updateFaucetAddress = useCallback(
    async (newAddress: string) => {
      const provider = signer ?? publicProvider;
      const contract = new Contract(newAddress, FAUCET_ABI, provider);
      try {
        await contract.dripAmount();
      } catch {
        throw new Error("This address does not look like a TokenFaucet contract");
      }
      setFaucetAddress(newAddress);
    },
    [signer, publicProvider]
  );

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const dripViaRelayer = useCallback(
    async (recipient: string) => {
      if (!RELAYER_URL) {
        setTxStatus("Error: relayer not configured (set TOKEN_RELAYER_URL in .env)");
        return;
      }
      setLoading(true);
      setTxStatus("Submitting via relayer…");
      try {
        const res = await fetch(`${RELAYER_URL.replace(/\/+$/, "")}/api/drip`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ to: recipient }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          txHash?: string;
          error?: string;
          secondsRemaining?: number;
        };
        if (!res.ok) {
          if (res.status === 429 && typeof data.secondsRemaining === "number") {
            const mins = Math.max(1, Math.round(data.secondsRemaining / 60));
            setTxStatus(
              `Recipient is on cooldown — try again in ~${mins} minute${mins === 1 ? "" : "s"}.`
            );
          } else {
            setTxStatus(`Error: ${data.error ?? "request failed"}`);
          }
          return;
        }
        setTxStatus(
          `Drip submitted — tx ${data.txHash} (refresh will pick up the balance in a few seconds).`
        );
        // Refresh once the block usually lands.
        setTimeout(() => {
          void refresh();
        }, 15000);
      } catch (err: unknown) {
        setTxStatus(`Error: ${(err as Error).message ?? String(err)}`);
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const setDripAmountTx = useCallback(
    async (amountEth: string) => {
      const contract = getWriteContract();
      if (!contract) return;

      setLoading(true);
      setTxStatus("Updating drip amount...");
      try {
        const tx = await contract.setDripAmount(parseEther(amountEth));
        setTxStatus("Waiting for confirmation...");
        await tx.wait();
        setTxStatus(`Drip amount set to ${amountEth} ETH`);
        await refresh();
      } catch (err: unknown) {
        setTxStatus(`Error: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    },
    [getWriteContract, refresh]
  );

  const setCooldownTx = useCallback(
    async (seconds: number) => {
      const contract = getWriteContract();
      if (!contract) return;

      setLoading(true);
      setTxStatus("Updating cooldown...");
      try {
        const tx = await contract.setCooldown(seconds);
        setTxStatus("Waiting for confirmation...");
        await tx.wait();
        setTxStatus(`Cooldown set to ${seconds} seconds`);
        await refresh();
      } catch (err: unknown) {
        setTxStatus(`Error: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    },
    [getWriteContract, refresh]
  );

  const drain = useCallback(
    async (to: string) => {
      const contract = getWriteContract();
      if (!contract) return;

      setLoading(true);
      setTxStatus("Draining faucet...");
      try {
        const tx = await contract.drain(to);
        setTxStatus("Waiting for confirmation...");
        await tx.wait();
        setTxStatus(`Drained to ${to.slice(0, 6)}…${to.slice(-4)}`);
        await refresh();
      } catch (err: unknown) {
        setTxStatus(`Error: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    },
    [getWriteContract, refresh]
  );

  return {
    faucetAddress,
    faucetBalance,
    dripAmount,
    cooldownSeconds,
    secondsUntilNext,
    isOwner,
    loading,
    txStatus,
    dripViaRelayer,
    setDripAmountTx,
    setCooldownTx,
    drain,
    updateFaucetAddress,
    refresh,
    configured: Boolean(faucetAddress),
    relayerConfigured: Boolean(RELAYER_URL),
  };
}
