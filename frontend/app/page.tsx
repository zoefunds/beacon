"use client";
import { useState } from "react";
import { demoRelease, phases, statePosition } from "@/lib/release";
import { assertStudionet, requestAccount } from "@/lib/wallet";
import { ReleaseMonitor } from "@/components/ReleaseMonitor";

const checks = [
  ["Release seal", "e4c91af is bound to main before the deadline", "complete"],
  ["Source inventory", "64 / 64 paths catalogued from the sealed tree", "complete"],
  ["Byte materialization", "61 text blobs hash-verified; 3 classified assets", "watch"],
  ["Dependency lattice", "18 local edges extracted without model filtering", "complete"],
  ["Component attestations", "49 / 64 bounded packets assessed", "running"],
  ["Edge review", "Waiting for attestation packets to finish", "idle"],
];

export default function Console() {
  const [selected, setSelected] = useState("Release seal");
  const [account, setAccount] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const position = statePosition(demoRelease.state);
  async function connect() {
    try {
      const current = await requestAccount();
      await assertStudionet(window.ethereum!);
      setAccount(current); setWalletError(null);
    } catch (error) { setWalletError(error instanceof Error ? error.message : "Unable to connect wallet"); }
  }
  return <main className="shell">
    <aside className="rail">
      <div className="brand"><span className="beacon">✦</span><span>beacon</span></div>
      <nav><a className="active">Mission control</a><a href="/launch">New release</a><a>Attestation log</a><a>Vault</a></nav>
      <div className="network"><i></i><div><b>Studionet</b><small>consensus online</small></div></div>
    </aside>
    <section className="workbench">
      <header><div className="crumb">RELEASES / <strong>{demoRelease.id}</strong></div><button className="wallet" onClick={connect}>{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Connect wallet"} <span>↗</span></button></header>
      {walletError && <p className="walletError" role="alert">{walletError}</p>}
      <div className="titleRow"><div><p className="eyebrow">ATTESTATION IN PROGRESS</p><h1>{demoRelease.title}</h1><p className="repo">⌘ {demoRelease.repo} <span>•</span> sealed commit <code>{demoRelease.seal}</code></p></div><div className="idCard"><span>ESCROW</span><b>12.00 GEN</b><small>2 sponsors</small></div></div>
      <section className="flight"><div className="flightHead"><div><span className="liveDot"></span> Evidence flight path</div><span>{demoRelease.coverage}% accountable</span></div><div className="timeline">{phases.map((phase, index) => <div key={phase} className={`phase ${index <= position ? "done" : ""} ${phase === demoRelease.state ? "current" : ""}`}><em>{index < position ? "✓" : String(index + 1).padStart(2, "0")}</em><label>{phase.replace("_", " ")}</label></div>)}</div></section>
      <ReleaseMonitor />
      <div className="columns"><section className="panel mission"><div className="panelHead"><h2>Verification matrix</h2><span>BOUND TO SEAL</span></div>{checks.map(([name, description, status], index) => <button key={name} onClick={() => setSelected(name)} className={`check ${selected === name ? "selected" : ""}`}><span className={`status ${status}`}></span><span><b>{name}</b><small>{description}</small></span><strong>{index < 3 ? "verified" : index === 4 ? "49 / 64" : "pending"}</strong></button>)}</section>
      <section className="panel inspector"><div className="panelHead"><h2>Inspector</h2><span>LIVE</span></div><p className="eyebrow">{selected.toUpperCase()}</p><h3>{selected === "Release seal" ? "Pre-deadline source lock" : "Evidence detail"}</h3><p className="muted">{selected === "Release seal" ? "The contract will review only this immutable commit. Branch movement after sealing cannot alter this release." : "Every result is attached to a committed path, blob hash, and release certificate."}</p><div className="codebox"><span>commit</span><code>e4c91af8b6fc7d3a8a720a</code><span>tree</span><code>0a2a4e3c08f7b11d12d891</code><span>scope</span><code>apps/console · packages/auth</code></div><button className="proof">Open evidence receipt <span>→</span></button></section></div>
      <footer><span>Last consensus round <b>just now</b></span><span>Certificate root <code>9db7…74e2</code></span><button>View on explorer ↗</button></footer>
    </section>
  </main>;
}
