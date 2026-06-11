import { useCallback, useEffect, useMemo, useState } from "react";
import { JsonRpcProvider, formatEther } from "ethers";
import { RELAYER_URL } from "../contracts/abis";
import { SEPOLIA_RPC } from "../config";

type Health = {
  ok?: boolean;
  configured?: boolean;
  address?: string | null;
};

export function useRelayer() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [reachable, setReachable] = useState(false);

  const publicProvider = useMemo(() => new JsonRpcProvider(SEPOLIA_RPC), []);

  const fetchHealth = useCallback(async () => {
    if (!RELAYER_URL) return;
    try {
      const res = await fetch(`${RELAYER_URL.replace(/\/+$/, "")}/api/health`);
      if (!res.ok) {
        setReachable(false);
        return;
      }
      const data = (await res.json()) as Health;
      setReachable(true);
      setAddress(data.address ?? null);
    } catch {
      setReachable(false);
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!address) return;
    try {
      const bal = await publicProvider.getBalance(address);
      setBalance(formatEther(bal));
    } catch {
      // network glitch — leave the last value in place
    }
  }, [address, publicProvider]);

  useEffect(() => {
    void fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    if (!address) return;
    void fetchBalance();
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, [address, fetchBalance]);

  return {
    address,
    balance,
    reachable,
    configured: Boolean(RELAYER_URL),
  };
}
