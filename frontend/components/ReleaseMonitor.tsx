"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { fetchRelease } from "@/lib/beacon-client";

type ReleaseRecord = Record<string, unknown>;

function initialReleaseId() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("release") || "";
}

export function ReleaseMonitor() {
  const [releaseId, setReleaseId] = useState(initialReleaseId);
  const [activeId, setActiveId] = useState(initialReleaseId);
  const [release, setRelease] = useState<ReleaseRecord | null>(null);
  const [message, setMessage] = useState("Enter a release ID to read its on-chain evidence.");

  const poll = useCallback(async () => {
    if (!activeId || !/^\d+$/.test(activeId)) return;
    try {
      const next = await fetchRelease(Number(activeId));
      if (!next) {
        setRelease(null);
        setMessage(`Release #${activeId} does not exist on Beacon yet.`);
        return;
      }
      setRelease(next);
      setMessage(`Live chain read · refreshed ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to read the release record.");
    }
  }, [activeId]);

  useEffect(() => {
    void poll();
    const interval = window.setInterval(() => void poll(), 12_000);
    return () => window.clearInterval(interval);
  }, [poll]);

  function watch(event: FormEvent) {
    event.preventDefault();
    const trimmed = releaseId.trim();
    if (!/^\d+$/.test(trimmed)) {
      setMessage("Use a non-negative numeric release ID.");
      return;
    }
    setActiveId(trimmed);
    const url = new URL(window.location.href);
    url.searchParams.set("release", trimmed);
    window.history.replaceState({}, "", url);
  }

  return <section className="panel monitor" aria-labelledby="monitor-title">
    <div className="panelHead"><h2 id="monitor-title">On-chain release monitor</h2><span>12s POLL</span></div>
    <form onSubmit={watch} className="monitorForm">
      <label htmlFor="release-id">Release ID</label>
      <input id="release-id" inputMode="numeric" value={releaseId} onChange={event => setReleaseId(event.target.value)} placeholder="e.g. 1" />
      <button type="submit">Watch release</button>
    </form>
    <p className="muted" role="status">{message}</p>
    {release && <dl className="releaseData">
      <div><dt>State</dt><dd>{String(release.state)}</dd></div>
      <div><dt>Repository</dt><dd>{String(release.repo)}</dd></div>
      <div><dt>Baseline</dt><dd>{String(release.baseline)}</dd></div>
      <div><dt>Implementer</dt><dd>{String(release.implementer)}</dd></div>
      <div><dt>Escrow</dt><dd>{(BigInt(String(release.escrow || 0)) / 10n ** 18n).toString()} GEN</dd></div>
      <div><dt>Scope</dt><dd>{Array.isArray(release.scope) ? release.scope.join(", ") : String(release.scope)}</dd></div>
      <div><dt>Obligations</dt><dd>{Array.isArray(release.obligations) ? release.obligations.join(" · ") : String(release.obligations)}</dd></div>
    </dl>}
  </section>;
}
