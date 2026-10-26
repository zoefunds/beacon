"use client";
import { FormEvent, useMemo, useState } from "react";
import { openRelease, parseGen } from "@/lib/beacon-client";
import { connectStudionet } from "@/lib/wallet";

const steps = ["Source", "Obligations", "Safeguards", "Fund"];
const DEMO_BASELINE = "d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9";
const localDateTime = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

export default function LaunchRelease() {
  const [step, setStep] = useState(0);
  const [repo, setRepo] = useState("");
  const [ref, setRef] = useState("main");
  const [scope, setScope] = useState("src");
  const [objective, setObjective] = useState("");
  const [baseline, setBaseline] = useState("");
  const [implementer, setImplementer] = useState("");
  const [deadline, setDeadline] = useState("");
  const [funding, setFunding] = useState("1");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [obligations, setObligations] = useState([""]);
  const canContinue = useMemo(() => [
    /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(repo) && ref.length > 0 && ref.length <= 120 && /^[0-9a-f]{40}$/i.test(baseline),
    objective.trim().length >= 12 && objective.trim().length <= 1000 && obligations.every(item => item.trim().length > 0 && item.trim().length <= 1000),
    scope.trim().length > 0 && /^0x[0-9a-f]{40}$/i.test(implementer) && new Date(deadline).getTime() > Date.now() + 5 * 60_000,
    (() => { try { return parseGen(funding) >= 10n ** 18n; } catch { return false; } })(),
  ][step], [repo, ref, baseline, objective, obligations, scope, implementer, deadline, funding, step]);
  async function fillDemo() {
    try {
      const account = await connectStudionet();
      setRepo("octocat/Spoon-Knife"); setRef("main"); setBaseline(DEMO_BASELINE); setScope("index.html");
      setObjective("Confirm that the documented demo page is present and readable.");
      setObligations(["The sealed index.html file remains present and readable in the selected commit."]);
      setImplementer(account); setDeadline(localDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000))); setFunding("1");
      setNotice("Demo values are ready. Review them, then continue to submit a 1 GEN test release.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Connect a Studionet wallet to use demo values"); }
  }
  async function next(event: FormEvent) {
    event.preventDefault(); if (!canContinue || pending) return;
    if (step !== 3) { setStep(step + 1); return; }
    setPending(true); setCreatedId(null); setNotice("Waiting for wallet confirmation and Studionet finality…");
    try {
      const account = await connectStudionet();
      if (!baseline.match(/^[0-9a-f]{40}$/i) || !implementer.match(/^0x[0-9a-f]{40}$/) || !deadline) throw new Error("Add a valid baseline, implementer wallet, and seal deadline.");
      const transaction = await openRelease({ account, provider: window.ethereum!, repo, ref, baseline, implementer, title: objective.slice(0, 120), obligations: [objective, ...obligations].map(item => item.trim()).filter(Boolean), scope: scope.split(",").map(item => item.trim()).filter(Boolean), sealBy: Math.floor(new Date(deadline).getTime() / 1000), escrowWei: parseGen(funding) });
      const id = transaction.releaseId?.toString() || null;
      setCreatedId(id); setNotice(`Release finalized on Studionet · ${transaction.hash.slice(0, 14)}…`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to submit release"); }
    finally { setPending(false); }
  }
  return <main className="launchShell">
    <aside className="launchRail"><a href="/" className="back">← Mission control</a><div className="launchBrand">✦ <b>beacon</b></div><ol>{steps.map((name, index) => <li key={name} className={index === step ? "current" : index < step ? "complete" : ""}><span>{index < step ? "✓" : index + 1}</span>{name}</li>)}</ol><p>A release agreement becomes reviewable only after the implementer seals a reachable commit before the close time.</p></aside>
    <section className="launchBody"><header><span>CREATE RELEASE</span><b>Step {step + 1} of {steps.length}</b></header><form onSubmit={next}>
      {step === 0 && <><h1>Where does this release live?</h1><p>Use a public Git repository and the baseline commit that the work begins from.</p><button type="button" className="demoFill" onClick={fillDemo} disabled={pending}>Use contract-ready demo values</button><p className="demoHint">Connects your Studionet wallet as implementer and prepares a 1 GEN test release.</p><label>Repository <input autoFocus value={repo} onChange={e => setRepo(e.target.value)} placeholder="org/repository" /></label><label>Target branch <input value={ref} onChange={e => setRef(e.target.value)} placeholder="main" /></label><label>Baseline commit <input value={baseline} onChange={e => setBaseline(e.target.value)} placeholder="40-character Git commit SHA" /></label></>}
      {step === 1 && <><h1>Define the outcome.</h1><p>Write measurable obligations. They become the validator’s decision frame.</p><label>Release objective <textarea value={objective} onChange={e => setObjective(e.target.value)} placeholder="Describe the durable outcome this release must achieve." /></label>{obligations.map((obligation, index) => <label key={index}>Acceptance obligation {index + 1}<textarea value={obligation} onChange={event => setObligations(current => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} placeholder="Example: Calls preserve authorization behaviour through the new boundary." /></label>)}<button type="button" className="add" onClick={() => setObligations(current => current.length < 5 ? [...current, ""] : current)}>+ Add another obligation</button></>}
      {step === 2 && <><h1>Set the evidence boundary.</h1><p>Beacon inventories every path inside these areas of the sealed release.</p><label>Review scope <input value={scope} onChange={e => setScope(e.target.value)} placeholder="src, packages/auth" /></label><label>Implementer wallet <input value={implementer} onChange={e => setImplementer(e.target.value)} placeholder="0x…" /></label><label>Seal deadline <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} /></label><div className="safetyNote"><b>Automatic safeguards</b><span>The sealed tree, every eligible blob, and all resolvable local dependency edges are committed before settlement.</span></div></>}
      {step === 3 && <><h1>Fund the agreement.</h1><p>Your GEN stays in the contract until the sealed release reaches an attested outcome.</p><label>Escrow amount <input type="number" min="1" value={funding} onChange={e => setFunding(e.target.value)} /><small>Minimum 1 GEN</small></label><div className="fundCard"><span>Settlement route</span><b>Accepted → implementer</b><b>Rejected / unsealed → sponsors</b><b>Indeterminate → sponsors after 7 days</b></div></>}
      <div className="formFooter"><button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || pending}>Back</button><button type="submit" className="primary" disabled={!canContinue || pending}>{pending ? "Finalizing…" : step === 3 ? "Confirm with wallet" : "Continue"} →</button></div>{notice && <p className="launchNotice" role="status">{notice}</p>}{createdId && <a className="createdLink" href={`/?release=${createdId}`}>Open release #{createdId} in Mission Control →</a>}
    </form></section>
  </main>;
}
