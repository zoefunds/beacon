export type ReleaseState = "DRAFT" | "SEALED" | "INVENTORY" | "MATERIALIZED" | "ATTESTING" | "REVIEW" | "ACCEPTED";
export type Release = { id: string; title: string; repo: string; state: ReleaseState; seal: string; deadline: string; coverage: number; blockers: number };
export const demoRelease: Release = { id: "BR-184", title: "Session boundary hardening", repo: "atlas/console", state: "ATTESTING", seal: "e4c91af", deadline: "13:42 UTC", coverage: 78, blockers: 1 };
export const phases: ReleaseState[] = ["DRAFT", "SEALED", "INVENTORY", "MATERIALIZED", "ATTESTING", "REVIEW", "ACCEPTED"];
export function statePosition(state: ReleaseState) { return phases.indexOf(state); }
