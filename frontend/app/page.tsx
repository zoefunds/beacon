"use client";

import { useMemo, useState } from "react";
import { explorerAddressUrl, formatGen, type ReleaseRecord } from "@/lib/beacon-client";
import { phases, statePosition } from "@/lib/release";
import { connectStudionet } from "@/lib/wallet";
import { ReleaseMonitor } from "@/components/ReleaseMonitor";

function numeric(value: unknown) { const number = Number(value || 0); return Number.isFinite(number) ? number : 0; }

export default function Console() {
  const [release, setRelease] = useState<ReleaseRecord | null>(null);
  const [selected, setSelected] = useState("Release seal");
  const [account, setAccount] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const state = String(release?.state || "DRAFT");
  const position = statePosition(state);
  const certificate = release?.certificate && typeof release.certificate === "object" ? release.certificate as ReleaseRecord : null;
  const seal = release?.seal && typeof release.seal === "object" ? release.seal as ReleaseRecord : null;
  const releaseId = release ? String(release.id) : "—";
  const checks = useMemo(() => [
    ["Release seal", seal ? `Commit ${String(seal.commit).slice(0, 12)} is bound to ${String(release?.ref)}` : "Waiting for the implementer to seal a commit", seal ? "complete" : "idle", seal ? "verified" : "pending"],
    ["Source inventory", `${numeric(release?.inventory_count)} paths catalogued`, numeric(release?.inventory_count) > 0 ? "complete" : "idle", `${numeric(release?.inventory_count)} paths`],
    ["Byte materialization", `${numeric(release?.materialized_count)} / ${numeric(release?.inventory_count)} entries processed`, numeric(release?.materialized_count) === numeric(release?.inventory_count) && numeric(release?.inventory_count) > 0 ? "complete" : "running", `${numeric(release?.materialized_count)} / ${numeric(release?.inventory_count)}`],
    ["Dependency graph", `${numeric(release?.edge_count)} mandatory edges`, numeric(release?.component_count) > 0 ? "complete" : "idle", `${numeric(release?.edge_count)} edges`],
    ["Component attestations", `${numeric(release?.assessed_count)} / ${numeric(release?.component_count)} components assessed`, numeric(release?.assessed_count) === numeric(release?.component_count) && numeric(release?.component_count) > 0 ? "complete" : "running", `${numeric(release?.assessed_count)} / ${numeric(release?.component_count)}`],
    ["Certificate", certificate ? `${String(certificate.outcome)} certificate proposed` : "Waiting for complete coverage", certificate ? "complete" : "idle", certificate ? String(certificate.outcome) : "pending"],
  ], [release, seal, certificate]);

  async function connect() {
    try { const current = await connectStudionet(); setAccount(current); setWalletError(null); }
    catch (error) { setWalletError(error instanceof Error ? error.message : "Unable to connect wallet"); }
  }

  const selectedCheck = checks.find(item => item[0] === selected) || checks[0];
  return <main className="shell">
    <aside className="rail">
      <div className="brand"><span className="beacon">✦</span><span>beacon</span></div>
      <nav><a className="active" href="#monitor">Mission control</a><a href="/launch">New release</a><a href={`/attestations${release ? `?release=${releaseId}` : ""}`}>Attestation log</a><a href="/vault">Vault</a></nav>
      <div className="network"><i></i><div><b>Studionet</b><small>live RPC</small></div></div>
    </aside>
    <section className="workbench">
      <header><div className="crumb">RELEASES / <strong>{releaseId}</strong></div><button className="wallet" onClick={connect}>{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Connect wallet"} <span>↗</span></button></header>
      {walletError && <p className="walletError" role="alert">{walletError}</p>}
      <div className="titleRow"><div><p className="eyebrow">{release ? `${state} · LIVE ON-CHAIN` : "SELECT A RELEASE"}</p><h1>{release ? String(release.title) : "Release mission control"}</h1><p className="repo">⌘ {release ? `${String(release.repo)} · ${String(release.ref)}` : "Enter a release ID below"}{seal && <> <span>•</span> sealed commit <code>{String(seal.commit).slice(0, 12)}</code></>}</p></div><div className="idCard"><span>ESCROW</span><b>{release ? formatGen(release.escrow) : "0"} GEN</b><small>{release ? `${Object.keys((release.sponsors as Record<string, unknown>) || {}).length} sponsor(s)` : "No release selected"}</small></div></div>
      <section className="flight"><div className="flightHead"><div><span className="liveDot"></span> Evidence flight path</div><span>{certificate ? String(certificate.outcome) : state}</span></div><div className="timeline">{phases.map((phase, index) => <div key={phase} className={`phase ${index <= position ? "done" : ""} ${phase === state ? "current" : ""}`}><em>{index < position ? "✓" : String(index + 1).padStart(2, "0")}</em><label>{phase.replace("_", " ")}</label></div>)}</div></section>
      <ReleaseMonitor onRelease={setRelease} />
      {release && <div className="columns"><section className="panel mission"><div className="panelHead"><h2>Verification matrix</h2><span>LIVE EVIDENCE</span></div>{checks.map(([name, description, status, result]) => <button key={name} onClick={() => setSelected(name)} className={`check ${selected === name ? "selected" : ""}`}><span className={`status ${status}`}></span><span><b>{name}</b><small>{description}</small></span><strong>{result}</strong></button>)}</section>
      <section className="panel inspector"><div className="panelHead"><h2>Inspector</h2><span>ON-CHAIN</span></div><p className="eyebrow">{selected.toUpperCase()}</p><h3>{selectedCheck[3]}</h3><p className="muted">{selectedCheck[1]}</p><div className="codebox"><span>baseline</span><code>{String(release.baseline)}</code><span>tree</span><code>{String(seal?.tree || "not sealed")}</code><span>scope</span><code>{Array.isArray(release.scope) ? release.scope.join(" · ") : ""}</code></div><a className="proof" href="#evidence">Open evidence receipt <span>→</span></a></section></div>}
      <footer><span>Polling <b>every 12 seconds</b></span><span>Certificate root <code>{String(certificate?.agreement_root || certificate?.seal_root || "not proposed").slice(0, 16)}</code></span><a className="footerButton" href={explorerAddressUrl()} target="_blank" rel="noreferrer">View contract on explorer ↗</a></footer>
    </section>
  </main>;
}
