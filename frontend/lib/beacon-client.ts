import { createClient } from "genlayer-js";
import type { Eip1193Provider } from "./wallet";

export const STUDIONET = {
  id: 61999,
  name: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: { default: { http: ["https://studio.genlayer.com/api"] } },
  blockExplorers: { default: { name: "GenLayer Explorer", url: "https://explorer-studio.genlayer.com" } },
} as const;

export function contractAddress(): `0x${string}` | null {
  const value = process.env.NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS;
  return value && /^0x[0-9a-fA-F]{40}$/.test(value) ? value as `0x${string}` : null;
}

export function beaconReader() {
  return createClient({ chain: STUDIONET });
}

export function beaconWriter(account: `0x${string}`, provider: Eip1193Provider) {
  return createClient({ chain: STUDIONET, account, provider });
}

export async function fetchRelease(releaseId: number): Promise<Record<string, unknown> | null> {
  const address = contractAddress();
  if (!address) return null;
  const raw = await beaconReader().readContract({ address, functionName: "get_release", args: [BigInt(releaseId)] });
  if (typeof raw !== "string" || !raw) return null;
  return JSON.parse(raw) as Record<string, unknown>;
}

export async function openRelease(input: {
  account: `0x${string}`; provider: Eip1193Provider; repo: string; ref: string; baseline: string;
  implementer: string; title: string; obligations: string[]; scope: string[]; sealBy: number; escrowWei: bigint;
}) {
  const address = contractAddress();
  if (!address) throw new Error("Beacon contract address is not configured");
  return beaconWriter(input.account, input.provider).writeContract({
    address, functionName: "open_release",
    args: [input.repo, input.ref, input.baseline, input.implementer, input.title, JSON.stringify(input.obligations), JSON.stringify(input.scope), BigInt(input.sealBy)],
    value: input.escrowWei,
  });
}
