"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchBalance,
  fetchComponent,
  fetchEdge,
  fetchEntry,
  fundRelease,
  fetchRelease,
  formatGen,
  parseGen,
  writeBeacon,
  type ReleaseRecord,
} from "@/lib/beacon-client";
import { connectStudionet } from "@/lib/wallet";

type Props = { onRelease?: (release: ReleaseRecord | null) => void };
type IndexedEvidence = { index: number; value: ReleaseRecord };

function initialReleaseId() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("release") || "";
}

function count(record: ReleaseRecord | null, key: string) {
  const value = Number(record?.[key] || 0);
  return Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 256) : 0;
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ReleaseRecord : null;
}

function textList(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

export function ReleaseMonitor({ onRelease }: Props) {
  const [releaseId, setReleaseId] = useState(initialReleaseId);
  const [activeId, setActiveId] = useState(initialReleaseId);
  const [release, setRelease] = useState<ReleaseRecord | null>(null);
  const [entries, setEntries] = useState<IndexedEvidence[]>([]);
  const [components, setComponents] = useState<IndexedEvidence[]>([]);
  const [edges, setEdges] = useState<IndexedEvidence[]>([]);
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [balance, setBalance] = useState<bigint>(0n);
  const [message, setMessage] = useState("Enter a release ID to read its on-chain evidence.");
  const [pending, setPending] = useState<string | null>(null);
  const [latestTx, setLatestTx] = useState<string | null>(null);
  const [commit, setCommit] = useState("");
  const [sponsorAmount, setSponsorAmount] = useState("1");
  const [challengeIndex, setChallengeIndex] = useState("0");
  const [challengeReason, setChallengeReason] = useState("");
  const accountRef = useRef<`0x${string}` | null>(null);

  const numericId = useMemo(() => /^\d+$/.test(activeId) ? BigInt(activeId) : null, [activeId]);

  const load = useCallback(async (id: bigint, announce = true) => {
    try {
      const next = await fetchRelease(id);
      setRelease(next); onRelease?.(next);
      if (!next) {
        setEntries([]); setComponents([]); setEdges([]);
        if (announce) setMessage(`Release #${id} does not exist on Beacon yet.`);
        return;
      }
      const entryValues = await Promise.all(Array.from({ length: count(next, "inventory_count") }, async (_, index) => ({ index, value: await fetchEntry(id, index) })));
      const componentValues = await Promise.all(Array.from({ length: count(next, "component_count") }, async (_, index) => ({ index, value: await fetchComponent(id, index) })));
      const edgeValues = await Promise.all(Array.from({ length: count(next, "edge_count") }, async (_, index) => ({ index, value: await fetchEdge(id, index) })));
      setEntries(entryValues.filter((item): item is IndexedEvidence => Boolean(item.value)));
      setComponents(componentValues.filter((item): item is IndexedEvidence => Boolean(item.value)));
      setEdges(edgeValues.filter((item): item is IndexedEvidence => Boolean(item.value)));
      if (accountRef.current) setBalance(await fetchBalance(accountRef.current));
      if (announce) setMessage(`Live chain read · refreshed ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to read the release record.");
    }
  }, [onRelease]);

  useEffect(() => { accountRef.current = account; }, [account]);

  useEffect(() => {
    if (numericId === null) return;
    void load(numericId);
    const interval = window.setInterval(() => void load(numericId, false), 12_000);
    return () => window.clearInterval(interval);
  }, [numericId, load]);

  function watch(event: FormEvent) {
    event.preventDefault();
    const trimmed = releaseId.trim();
    if (!/^\d+$/.test(trimmed)) { setMessage("Use a non-negative numeric release ID."); return; }
    setActiveId(trimmed);
    const url = new URL(window.location.href); url.searchParams.set("release", trimmed); window.history.replaceState({}, "", url);
    void load(BigInt(trimmed));
  }

  async function connect() {
    try {
      const current = await connectStudionet(); setAccount(current); setBalance(await fetchBalance(current)); setMessage("Wallet connected to Studionet.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to connect wallet"); }
  }

  async function act(label: string, functionName: string, args: Array<string | number | bigint> = [], value = 0n) {
    if (numericId === null && functionName !== "withdraw") { setMessage("Watch a release first."); return; }
    setPending(label); setMessage(`${label}: waiting for wallet confirmation and consensus…`);
    try {
      const current = account || await connectStudionet(); setAccount(current);
      const transaction = await writeBeacon({ account: current, provider: window.ethereum!, functionName, args, value });
      setLatestTx(transaction.hash); setMessage(`${label} finalized · ${transaction.hash.slice(0, 14)}…`);
      if (numericId !== null) await load(numericId, false);
      setBalance(await fetchBalance(current));
    } catch (error) { setMessage(error instanceof Error ? error.message : `${label} failed`); }
    finally { setPending(null); }
  }

  async function sponsor() {
    if (numericId === null) { setMessage("Watch a release first."); return; }
    let amount: bigint;
    try { amount = parseGen(sponsorAmount); } catch (error) { setMessage(error instanceof Error ? error.message : "Invalid amount"); return; }
    setPending("Sponsor release"); setMessage("Sponsor release: finalizing the safe deposit before escrow allocation…");
    try {
      const current = account || await connectStudionet(); setAccount(current);
      const transaction = await fundRelease({ account: current, provider: window.ethereum!, releaseId: numericId, amount });
      setLatestTx(transaction.hash); setMessage(`Sponsor release finalized · ${transaction.hash.slice(0, 14)}…`);
      await load(numericId, false); setBalance(await fetchBalance(current));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Sponsor release failed"); }
    finally { setPending(null); }
  }

  const state = String(release?.state || "");
  const certificate = objectValue(release?.certificate);
  const seal = objectValue(release?.seal);
  const challenge = objectValue(release?.challenge);
  const outcome = String(certificate?.outcome || "");
  const busy = pending !== null;
  const allMaterialized = count(release, "materialized_count") === count(release, "inventory_count");
  const allAssessed = count(release, "assessed_count") === count(release, "component_count");
  const allEdgesReviewed = count(release, "reviewed_edges") === count(release, "edge_count");

  return <section className="panel monitor" id="monitor" aria-labelledby="monitor-title">
    <div className="panelHead"><h2 id="monitor-title">On-chain release monitor</h2><span>12s POLL</span></div>
    <form onSubmit={watch} className="monitorForm">
      <label htmlFor="release-id">Release ID</label>
      <input id="release-id" inputMode="numeric" value={releaseId} onChange={event => setReleaseId(event.target.value)} placeholder="e.g. 1" />
      <button type="submit">Watch release</button>
      <button type="button" onClick={connect}>{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Connect wallet"}</button>
    </form>
    <p className="muted" role="status">{message}</p>
    <div className="vaultBar" id="vault"><span>Connected wallet credit: <b>{formatGen(balance)} GEN</b></span><button type="button" disabled={busy || !account || balance === 0n} onClick={() => act("Withdraw credit", "withdraw")}>Withdraw credit</button></div>

    {release && <>
      <dl className="releaseData">
        <div><dt>State</dt><dd>{state}</dd></div>
        <div><dt>Repository</dt><dd>{String(release.repo)} · {String(release.ref)}</dd></div>
        <div><dt>Baseline</dt><dd><code>{String(release.baseline)}</code></dd></div>
        <div><dt>Implementer</dt><dd><code>{String(release.implementer)}</code></dd></div>
        <div><dt>Escrow</dt><dd>{formatGen(release.escrow)} GEN</dd></div>
        <div><dt>Scope</dt><dd>{textList(release.scope).join(", ")}</dd></div>
        <div><dt>Required checks</dt><dd>{Array.isArray(release.required_checks) ? release.required_checks.map(item => { const check = objectValue(item); return check ? `${String(check.name)}@${String(check.app_slug)}` : ""; }).filter(Boolean).join(" · ") : ""}</dd></div>
        <div><dt>Coverage</dt><dd>{count(release, "inventory_count")} inventory · {count(release, "materialized_count")} materialized · {count(release, "component_count")} components · {count(release, "assessed_count")} assessed · {count(release, "edge_count")} edges · {count(release, "reviewed_edges")} reviewed</dd></div>
        <div><dt>Blockers</dt><dd>{textList(release.blockers).join(" · ") || "None"}</dd></div>
        <div><dt>Obligations</dt><dd>{textList(release.obligations).join(" · ")}</dd></div>
        <div><dt>Wallet credit</dt><dd>{formatGen(balance)} GEN</dd></div>
      </dl>

      <section className="evidenceGrid" id="evidence">
        <article><h3>Seal</h3>{seal ? <pre>{JSON.stringify(seal, null, 2)}</pre> : <p>Not sealed.</p>}</article>
        <article><h3>Certificate</h3>{certificate ? <pre>{JSON.stringify(certificate, null, 2)}</pre> : <p>Not proposed.</p>}</article>
        <article><h3>Challenge</h3>{challenge ? <pre>{JSON.stringify(challenge, null, 2)}</pre> : <p>No active challenge.</p>}</article>
      </section>

      <section className="evidenceLists">
        <details open><summary>Inventory entries ({entries.length})</summary>{entries.map(({ index, value }) => <div className="evidenceRow" key={index}><code>#{index} {String(value.path)}</code><span>{String(value.status)}</span>{state === "MATERIALIZED" && value.status === "PENDING" && <button disabled={busy} onClick={() => act(`Materialize #${index}`, "materialize", [numericId!, index])}>Materialize</button>}</div>)}</details>
        <details><summary>Components ({components.length})</summary>{components.map(({ index, value }) => <div className="evidenceRow" key={index}><code>#{index} {textList(value.paths).join(", ")}</code><span>{String(value.status)}</span>{state === "ATTESTING" && !value.assessment && <button disabled={busy} onClick={() => act(`Assess component #${index}`, "assess_component", [numericId!, index])}>Assess</button>}</div>)}</details>
        <details><summary>Dependency edges ({edges.length})</summary>{edges.map(({ index, value }) => <div className="evidenceRow" key={index}><code>#{index} {String(value.from)} → {String(value.to)}</code><span>{String(value.status)}</span>{state === "ATTESTING" && value.status === "PENDING" && <button disabled={busy} onClick={() => act(`Review edge #${index}`, "review_edge", [numericId!, index])}>Review</button>}</div>)}</details>
      </section>

      <section className="operations" aria-label="Release operations">
        <h3>Available operations</h3>
        {state === "DRAFT" && <>
          <label>Additional sponsorship (GEN)<input value={sponsorAmount} onChange={event => setSponsorAmount(event.target.value)} /></label>
          <button disabled={busy} onClick={() => void sponsor()}>Sponsor</button>
          <label>Implementer commit<input value={commit} onChange={event => setCommit(event.target.value)} placeholder="40-character commit SHA" /></label>
          <button disabled={busy || !/^[0-9a-f]{40}$/i.test(commit)} onClick={() => act("Seal release", "seal_release", [numericId!, commit])}>Seal or replace seal</button>
          <button disabled={busy} onClick={() => act("Expire unsealed release", "expire_unsealed", [numericId!])}>Expire after deadline</button>
        </>}
        {state === "SEALED" && <><input value={commit} onChange={event => setCommit(event.target.value)} placeholder="Replacement commit SHA" /><button disabled={busy || !/^[0-9a-f]{40}$/i.test(commit)} onClick={() => act("Replace seal", "seal_release", [numericId!, commit])}>Replace seal before deadline</button><button disabled={busy} onClick={() => act("Begin inventory", "begin_inventory", [numericId!])}>Begin inventory after deadline</button></>}
        {state === "INVENTORY" && <><button disabled={busy || Boolean(release.inventory_discovered)} onClick={() => act("Discover inventory", "discover_inventory", [numericId!])}>Discover complete inventory</button><button disabled={busy || !release.inventory_discovered} onClick={() => act("Close inventory", "close_inventory", [numericId!])}>Close inventory</button></>}
        {state === "MATERIALIZED" && <button disabled={busy || !allMaterialized} onClick={() => act("Build review graph", "build_review_graph", [numericId!])}>Build review graph</button>}
        {state === "ATTESTING" && <button disabled={busy || !allAssessed || !allEdgesReviewed} onClick={() => act("Propose certificate", "propose", [numericId!])}>Propose certificate</button>}
        {state === "REVIEW" && outcome !== "INDETERMINATE" && <><label>Challenge entry<input inputMode="numeric" value={challengeIndex} onChange={event => setChallengeIndex(event.target.value)} /></label><label>Challenge reason<textarea value={challengeReason} onChange={event => setChallengeReason(event.target.value)} /></label><button disabled={busy || !/^\d+$/.test(challengeIndex) || !challengeReason.trim()} onClick={() => act("Challenge certificate", "challenge_certificate", [numericId!, Number(challengeIndex), challengeReason])}>Challenge</button><button disabled={busy} onClick={() => act("Finalize release", "finalize", [numericId!])}>Finalize after challenge window</button></>}
        {state === "REVIEW" && outcome === "INDETERMINATE" && <button disabled={busy} onClick={() => act("Refund indeterminate release", "refund_indeterminate", [numericId!])}>Refund after review period</button>}
        {state === "CHALLENGED" && <button disabled={busy} onClick={() => act("Review challenge", "review_challenge", [numericId!])}>Review challenge</button>}
      </section>
      {latestTx && <p className="txReceipt">Latest finalized transaction: <code>{latestTx}</code></p>}
    </>}
  </section>;
}
