"use client";
import { FormEvent, useMemo, useState } from "react";
import { openRelease } from "@/lib/beacon-client";
import { assertStudionet, requestAccount } from "@/lib/wallet";

const steps = ["Source", "Obligations", "Safeguards", "Fund"];

export default function LaunchRelease() {
  const [step, setStep] = useState(0);
  const [repo, setRepo] = useState("");
  const [scope, setScope] = useState("src");
  const [objective, setObjective] = useState("");
  const [baseline, setBaseline] = useState("");
  const [implementer, setImplementer] = useState("");
  const [deadline, setDeadline] = useState("");
  const [funding, setFunding] = useState("1");
  const [notice, setNotice] = useState<string | null>(null);
  const canContinue = useMemo(() => [repo.includes("/"), objective.trim().length >= 12, scope.trim().length > 0, true][step], [repo, objective, scope, step]);
  async function next(event: FormEvent) {
    event.preventDefault(); if (!canContinue) return;
    if (step !== 3) { setStep(step + 1); return; }
    try {
      const account = await requestAccount(); await assertStudionet(window.ethereum!);
      if (!baseline.match(/^[0-9a-f]{40}$/i) || !implementer.match(/^0x[0-9a-f]{40}$/) || !deadline) throw new Error("Add a valid baseline, implementer wallet, and seal deadline.");
      const hash = await openRelease({ account: account as `0x${string}`, provider: window.ethereum!, repo, ref: "main", baseline, implementer, title: objective.slice(0, 120), obligations: [objective], scope: scope.split(",").map(item => item.trim()).filter(Boolean), sealBy: Math.floor(new Date(deadline).getTime() / 1000), escrowWei: BigInt(Math.round(Number(funding) * 1e18)) });
      setNotice(`Release submitted: ${String(hash).slice(0, 14)}…`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to submit release"); }
  }
  return <main className="launchShell">
    <aside className="launchRail"><a href="/" className="back">← Mission control</a><div className="launchBrand">✦ <b>beacon</b></div><ol>{steps.map((name, index) => <li key={name} className={index === step ? "current" : index < step ? "complete" : ""}><span>{index < step ? "✓" : index + 1}</span>{name}</li>)}</ol><p>A release agreement becomes reviewable only after the implementer seals a reachable commit before the close time.</p></aside>
    <section className="launchBody"><header><span>CREATE RELEASE</span><b>Step {step + 1} of {steps.length}</b></header><form onSubmit={next}>
      {step === 0 && <><h1>Where does this release live?</h1><p>Use a public Git repository and the baseline commit that the work begins from.</p><label>Repository <input autoFocus value={repo} onChange={e => setRepo(e.target.value)} placeholder="org/repository" /></label><label>Target branch <input defaultValue="main" placeholder="main" /></label><label>Baseline commit <input value={baseline} onChange={e => setBaseline(e.target.value)} placeholder="40-character Git commit SHA" /></label></>}
      {step === 1 && <><h1>Define the outcome.</h1><p>Write measurable obligations. They become the validator’s decision frame.</p><label>Release objective <textarea value={objective} onChange={e => setObjective(e.target.value)} placeholder="Describe the durable outcome this release must achieve." /></label><label>Acceptance obligation <textarea placeholder="Example: Calls preserve authorization behaviour through the new boundary." /></label><button type="button" className="add">+ Add another obligation</button></>}
      {step === 2 && <><h1>Set the evidence boundary.</h1><p>Beacon inventories every path inside these areas of the sealed release.</p><label>Review scope <input value={scope} onChange={e => setScope(e.target.value)} placeholder="src, packages/auth" /></label><label>Implementer wallet <input value={implementer} onChange={e => setImplementer(e.target.value)} placeholder="0x…" /></label><label>Seal deadline <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} /></label><div className="safetyNote"><b>Automatic safeguards</b><span>The sealed tree, every eligible blob, and all resolvable local dependency edges are committed before settlement.</span></div></>}
      {step === 3 && <><h1>Fund the agreement.</h1><p>Your GEN stays in the contract until the sealed release reaches an attested outcome.</p><label>Escrow amount <input type="number" min="1" value={funding} onChange={e => setFunding(e.target.value)} /><small>Minimum 1 GEN</small></label><div className="fundCard"><span>Settlement route</span><b>Accepted → implementer</b><b>Rejected / unsealed → sponsors</b><b>Indeterminate → remains locked</b></div></>}
      <div className="formFooter"><button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</button><button className="primary" disabled={!canContinue}>{step === 3 ? "Confirm with wallet" : "Continue"} →</button></div>{notice && <p className="launchNotice" role="status">{notice}</p>}
    </form></section>
  </main>;
}
