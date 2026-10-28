"use client";
import { FormEvent, useMemo, useState } from "react";
import { openRelease, parseGen, type RequiredCheck } from "@/lib/beacon-client";
import { connectStudionet } from "@/lib/wallet";

const steps = ["Source", "Obligations", "Safeguards", "Fund"];
const DEMO_BASELINE = "a02a16ec36fbd58a0848e95598fb4913c54c7591";
const localDateTime = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
function parseChecks(value: string): RequiredCheck[] | null {
  const lines = value.split("\n").map(item => item.trim()).filter(Boolean);
  if (!lines.length || lines.length > 8) return null;
  const checks = lines.map(line => { const split = line.lastIndexOf("@"); return split > 0 ? { name: line.slice(0, split).trim(), app_slug: line.slice(split + 1).trim().toLowerCase() } : null; });
  if (checks.some(item => !item || !item.name || item.name.length > 120 || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(item.app_slug))) return null;
  const typed = checks as RequiredCheck[];
  return new Set(typed.map(item => `${item.name}\u0000${item.app_slug}`)).size === typed.length ? typed : null;
}

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
  const [requiredChecks, setRequiredChecks] = useState("tests@github-actions");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [obligations, setObligations] = useState([""]);
  const canContinue = useMemo(() => [
    /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(repo) && ref.length > 0 && ref.length <= 120 && /^[0-9a-f]{40}$/i.test(baseline),
    objective.trim().length >= 12 && objective.trim().length <= 1000 && obligations.every(item => item.trim().length > 0 && item.trim().length <= 1000),
    scope.trim().length > 0 && parseChecks(requiredChecks) !== null && /^0x[0-9a-f]{40}$/i.test(implementer) && new Date(deadline).getTime() > Date.now() + 5 * 60_000,
    (() => { try { return parseGen(funding) >= 10n ** 18n; } catch { return false; } })(),
  ][step], [repo, ref, baseline, objective, obligations, scope, requiredChecks, implementer, deadline, funding, step]);
  async function fillDemo() {
    try {
      const account = await connectStudionet();
      setRepo("sindresorhus/yoctocolors"); setRef("main"); setBaseline(DEMO_BASELINE); setScope(".github/security.md");
      setObjective("Confirm that the scoped security policy provides a private reporting channel.");
      setObligations(["The scoped security policy provides a private GitHub security advisory link for reporting vulnerabilities."]);
      setRequiredChecks("Node.js 18@github-actions\nNode.js 23@github-actions"); setImplementer(account); setDeadline(localDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000))); setFunding("1");
      setNotice("Demo values are ready. Review them, then continue to submit a 1 GEN test release.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Connect a Studionet wallet to use demo values"); }
  }
  async function next(event: FormEvent) {
    event.preventDefault(); if (!canContinue || pending) return;
    if (step !== 3) { setStep(step + 1); return; }
    setPending(true); setCreatedId(null); setNotice("Creating the agreement, depositing GEN, and allocating escrow in three finalized transactions…");
    try {
      const account = await connectStudionet();
      if (!baseline.match(/^[0-9a-f]{40}$/i) || !implementer.match(/^0x[0-9a-f]{40}$/) || !deadline) throw new Error("Add a valid baseline, implementer wallet, and seal deadline.");
      const checks = parseChecks(requiredChecks); if (!checks) throw new Error("Add valid required checks as check name@app-slug, one per line.");
      const transaction = await openRelease({ account, provider: window.ethereum!, repo, ref, baseline, implementer, title: objective.slice(0, 120), obligations: [objective, ...obligations].map(item => item.trim()).filter(Boolean), scope: scope.split(",").map(item => item.trim()).filter(Boolean), requiredChecks: checks, sealBy: Math.floor(new Date(deadline).getTime() / 1000), escrowWei: parseGen(funding) });
      const id = transaction.releaseId?.toString() || null;
      setCreatedId(id); setNotice(`Release #${id} created and funded on Studionet · ${transaction.hash.slice(0, 14)}…`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to submit release"); }
    finally { setPending(false); }
  }
  return <main className="launchShell">
    <aside className="launchRail"><a href="/" className="back">← Mission control</a><div className="launchBrand">✦ <b>beacon</b></div><ol>{steps.map((name, index) => <li key={name} className={index === step ? "current" : index < step ? "complete" : ""}><span>{index < step ? "✓" : index + 1}</span>{name}</li>)}</ol><p>A release agreement becomes reviewable only after the implementer seals a reachable commit before the close time.</p></aside>
    <section className="launchBody"><header><span>CREATE RELEASE</span><b>Step {step + 1} of {steps.length}</b></header><form onSubmit={next}>
      {step === 0 && <><h1>Where does this release live?</h1><p>Use a public Git repository and the baseline commit that the work begins from.</p><button type="button" className="demoFill" onClick={fillDemo} disabled={pending}>Use contract-ready demo values</button><p className="demoHint">Connects your Studionet wallet as implementer and prepares a 1 GEN test release.</p><label>Repository <input autoFocus value={repo} onChange={e => setRepo(e.target.value)} placeholder="org/repository" /></label><label>Target branch <input value={ref} onChange={e => setRef(e.target.value)} placeholder="main" /></label><label>Baseline commit <input value={baseline} onChange={e => setBaseline(e.target.value)} placeholder="40-character Git commit SHA" /></label></>}
      {step === 1 && <><h1>Define the outcome.</h1><p>Write measurable obligations. They become the validator’s decision frame.</p><label>Release objective <textarea value={objective} onChange={e => setObjective(e.target.value)} placeholder="Describe the durable outcome this release must achieve." /></label>{obligations.map((obligation, index) => <label key={index}>Acceptance obligation {index + 1}<textarea value={obligation} onChange={event => setObligations(current => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} placeholder="Example: Calls preserve authorization behaviour through the new boundary." /></label>)}<button type="button" className="add" onClick={() => setObligations(current => current.length < 5 ? [...current, ""] : current)}>+ Add another obligation</button></>}
      {step === 2 && <><h1>Set the evidence boundary.</h1><p>Beacon inventories every path inside these areas and requires the exact sponsor-approved CI checks.</p><label>Review scope <input value={scope} onChange={e => setScope(e.target.value)} placeholder="src, packages/auth" /></label><label>Required checks <textarea value={requiredChecks} onChange={e => setRequiredChecks(e.target.value)} placeholder={"tests@github-actions\nsecurity@trusted-ci-app"} /><small>One check name@app-slug per line. The seal fails if any required check is missing or unsuccessful.</small></label><label>Implementer wallet <input value={implementer} onChange={e => setImplementer(e.target.value)} placeholder="0x…" /></label><label>Seal deadline <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} /></label><div className="safetyNote"><b>Automatic safeguards</b><span>The sealed tree, eligible blobs, dependency edges, complete check-run response, and required-check policy are committed before settlement.</span></div></>}
      {step === 3 && <><h1>Fund the agreement.</h1><p>Your wallet will confirm creation, safe deposit, and escrow allocation separately. Each transaction must finalize before the next begins; an unallocated deposit remains withdrawable.</p><label>Escrow amount <input type="number" min="1" value={funding} onChange={e => setFunding(e.target.value)} /><small>Minimum 1 GEN</small></label><div className="fundCard"><span>Settlement route</span><b>Accepted → implementer</b><b>Rejected / unsealed → sponsors</b><b>Indeterminate → sponsors after 7 days</b></div></>}
      <div className="formFooter"><button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || pending}>Back</button><button type="submit" className="primary" disabled={!canContinue || pending}>{pending ? "Finalizing…" : step === 3 ? "Confirm with wallet" : "Continue"} →</button></div>{notice && <p className="launchNotice" role="status">{notice}</p>}{createdId && <a className="createdLink" href={`/?release=${createdId}`}>Open release #{createdId} in Mission Control →</a>}
    </form></section>
  </main>;
}
