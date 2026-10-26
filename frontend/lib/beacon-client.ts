import { createClient } from "genlayer-js";
import type { Eip1193Provider } from "./wallet";

export const STUDIONET = {
  id: 61999,
  name: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: { default: { http: ["https://studio.genlayer.com/api"] } },
  blockExplorers: { default: { name: "GenLayer Explorer", url: "https://explorer-studio.genlayer.com" } },
} as const;

export type ReleaseRecord = Record<string, unknown>;
export type BeaconArgument = string | number | bigint;
export type BeaconTransaction = { hash: `0x${string}`; receipt: unknown; releaseId?: bigint };

export function contractAddress(): `0x${string}` | null {
  const value = process.env.NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS;
  return value && /^0x[0-9a-fA-F]{40}$/.test(value) ? value as `0x${string}` : null;
}

export function explorerAddressUrl() {
  const address = contractAddress();
  return address ? `${STUDIONET.blockExplorers.default.url}/address/${address}` : STUDIONET.blockExplorers.default.url;
}

export function beaconReader() { return createClient({ chain: STUDIONET }); }
export function beaconWriter(account: `0x${string}`, provider: Eip1193Provider) { return createClient({ chain: STUDIONET, account, provider }); }

function parseRecord(raw: unknown): ReleaseRecord | null {
  if (typeof raw !== "string" || !raw) return null;
  const value: unknown = JSON.parse(raw);
  return value && typeof value === "object" && !Array.isArray(value) ? value as ReleaseRecord : null;
}

export async function fetchRelease(releaseId: bigint): Promise<ReleaseRecord | null> {
  const address = contractAddress();
  if (!address) throw new Error("Beacon contract address is not configured");
  return parseRecord(await beaconReader().readContract({ address, functionName: "get_release", args: [releaseId] }));
}

async function fetchIndexed(functionName: "get_entry" | "get_component" | "get_edge", releaseId: bigint, index: number) {
  const address = contractAddress();
  if (!address) throw new Error("Beacon contract address is not configured");
  return parseRecord(await beaconReader().readContract({ address, functionName, args: [releaseId, index] }));
}

export const fetchEntry = (releaseId: bigint, index: number) => fetchIndexed("get_entry", releaseId, index);
export const fetchComponent = (releaseId: bigint, index: number) => fetchIndexed("get_component", releaseId, index);
export const fetchEdge = (releaseId: bigint, index: number) => fetchIndexed("get_edge", releaseId, index);

export async function fetchBalance(account: string): Promise<bigint> {
  const address = contractAddress();
  if (!address) throw new Error("Beacon contract address is not configured");
  const value = await beaconReader().readContract({ address, functionName: "get_balance", args: [account] });
  return BigInt(String(value));
}

export function parseGen(value: string): bigint {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,18})?$/.test(normalized)) throw new Error("Enter a valid GEN amount with at most 18 decimal places");
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, "0"));
}

export function formatGen(value: unknown): string {
  const amount = BigInt(String(value || 0));
  const whole = amount / 10n ** 18n;
  const fraction = (amount % 10n ** 18n).toString().padStart(18, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function findReleaseId(value: unknown): bigint | undefined {
  if (!value || typeof value !== "object") return undefined;
  if ("release_id" in value) {
    const candidate = (value as { release_id?: unknown }).release_id;
    if (typeof candidate === "number" || typeof candidate === "string" || typeof candidate === "bigint") return BigInt(candidate);
  }
  for (const nested of Object.values(value)) {
    if (typeof nested === "string" && nested.includes("release_id")) {
      try { const found = findReleaseId(JSON.parse(nested)); if (found !== undefined) return found; } catch { /* not JSON */ }
    }
    const found = findReleaseId(nested);
    if (found !== undefined) return found;
  }
  return undefined;
}

export async function writeBeacon(input: {
  account: `0x${string}`;
  provider: Eip1193Provider;
  functionName: string;
  args?: BeaconArgument[];
  value?: bigint;
}): Promise<BeaconTransaction> {
  const address = contractAddress();
  if (!address) throw new Error("Beacon contract address is not configured");
  const client = beaconWriter(input.account, input.provider);
  const hash = await client.writeContract({ address, functionName: input.functionName, args: input.args || [], value: input.value || 0n }) as `0x${string}` & { length: 66 };
  const receipt = await client.waitForTransactionReceipt({ hash });
  const resultName = (receipt as { result_name?: string }).result_name;
  if (resultName && resultName !== "MAJORITY_AGREE") throw new Error(`Transaction finalized with ${resultName}`);
  return { hash, receipt, releaseId: findReleaseId(receipt) };
}

export async function openRelease(input: {
  account: `0x${string}`; provider: Eip1193Provider; repo: string; ref: string; baseline: string;
  implementer: string; title: string; obligations: string[]; scope: string[]; sealBy: number; escrowWei: bigint;
}) {
  return writeBeacon({
    account: input.account,
    provider: input.provider,
    functionName: "open_release",
    args: [input.repo, input.ref, input.baseline, input.implementer, input.title, JSON.stringify(input.obligations), JSON.stringify(input.scope), BigInt(input.sealBy)],
    value: input.escrowWei,
  });
}
