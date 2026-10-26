"use client";

import { useState } from "react";
import { fetchBalance, formatGen, writeBeacon } from "@/lib/beacon-client";
import { connectStudionet } from "@/lib/wallet";

export default function Vault() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [balance, setBalance] = useState(0n);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("Connect the wallet that owns a Beacon credit balance.");

  async function connect() {
    setPending(true);
    try {
      const current = await connectStudionet();
      const amount = await fetchBalance(current);
      setAccount(current); setBalance(amount); setMessage("Balance loaded from the Beacon contract.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load vault"); }
    finally { setPending(false); }
  }

  async function withdraw() {
    if (!account || !window.ethereum) return;
    setPending(true); setMessage("Waiting for withdrawal finality…");
    try {
      const transaction = await writeBeacon({ account, provider: window.ethereum, functionName: "withdraw" });
      const amount = await fetchBalance(account); setBalance(amount); setMessage(`Withdrawal finalized · ${transaction.hash.slice(0, 14)}…`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Withdrawal failed"); }
    finally { setPending(false); }
  }

  return <main className="utilityPage">
    <header className="utilityHeader"><a href="/">← Mission control</a><span>BEACON / VAULT</span></header>
    <section className="utilityIntro"><p className="eyebrow">PULL-PAYMENT VAULT</p><h1>Withdraw settled GEN safely.</h1><p>Accepted implementers and refunded sponsors receive contract credit before transferring funds. This page reads and withdraws that credit directly from Studionet.</p></section>
    <section className="panel vaultPagePanel">
      <div><span>CONNECTED ACCOUNT</span><code>{account || "Not connected"}</code></div>
      <div><span>AVAILABLE CREDIT</span><strong>{formatGen(balance)} GEN</strong></div>
      <div className="vaultActions"><button onClick={connect} disabled={pending}>{account ? "Refresh balance" : "Connect wallet"}</button><button onClick={withdraw} disabled={pending || !account || balance === 0n}>Withdraw credit</button></div>
      <p className="muted" role="status">{message}</p>
    </section>
  </main>;
}
