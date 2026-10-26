export const phases = ["DRAFT", "SEALED", "INVENTORY", "MATERIALIZED", "ATTESTING", "REVIEW", "CHALLENGED", "ACCEPTED", "REJECTED", "REFUNDED", "EXPIRED"] as const;
export function statePosition(state: string) { const index = phases.indexOf(state as (typeof phases)[number]); return index < 0 ? 0 : index; }
