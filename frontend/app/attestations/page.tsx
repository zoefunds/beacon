"use client";

import { ReleaseMonitor } from "@/components/ReleaseMonitor";

export default function AttestationLog() {
  return <main className="utilityPage">
    <header className="utilityHeader"><a href="/">← Mission control</a><span>BEACON / EVIDENCE</span></header>
    <section className="utilityIntro"><p className="eyebrow">ATTESTATION LOG</p><h1>Inspect every committed evidence record.</h1><p>Load a release to review its seal, certificate roots, blockers, inventory entries, graph components, dependency edges, challenge state, and finalized operations.</p></section>
    <ReleaseMonitor />
  </main>;
}
