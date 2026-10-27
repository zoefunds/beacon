import { abi, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Eip1193Provider } from "./wallet";

// The SDK's chain definition includes the consensus contracts and validator
// defaults required to encode Intelligent Contract transactions. A generic
// EVM-style chain object is insufficient for writeContract.
export const STUDIONET = studionet;
const STUDIONET_EXPLORER = STUDIONET.blockExplorers?.default.url ?? "https://explorer-studio.genlayer.com";

export type ReleaseRecord = Record<string, unknown>;
export type BeaconArgument = string | number | bigint;
export type BeaconTransaction = { hash: `0x${string}`; receipt: unknown; releaseId?: bigint };
type ReceiptStatus = NonNullable<Parameters<ReturnType<typeof createClient>["waitForTransactionReceipt"]>[0]["status"]>;
const FINALIZED_STATUS = "FINALIZED" as ReceiptStatus;

export function assertSuccessfulFinalizedReceipt(receipt: unknown) {
  const record = receipt && typeof receipt === "object" ? receipt as Record<string, unknown> : {};
  const resultName = record.result_name;
  if (resultName && resultName !== "MAJORITY_AGREE") throw new Error(`Transaction finalized with ${String(resultName)}`);
  const consensus = record.consensus_data && typeof record.consensus_data === "object" ? record.consensus_data as Record<string, unknown> : null;
  const leaderReceipts = consensus && Array.isArray(consensus.leader_receipt) ? consensus.leader_receipt : [];
  const leader = leaderReceipts[0] && typeof leaderReceipts[0] === "object" ? leaderReceipts[0] as Record<string, unknown> : null;
  if (leader && leader.execution_result !== "SUCCESS") throw new Error("Transaction reached consensus but contract execution rolled back");
  const leaderResult = leader?.result && typeof leader.result === "object" ? leader.result as Record<string, unknown> : null;
  if (leaderResult && leaderResult.status !== "return") throw new Error(`Contract execution ended with ${String(leaderResult.status || "an error")}`);
}

export function contractAddress(): `0x${string}` | null {
  const value = process.env.NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS;
  return value && /^0x[0-9a-fA-F]{40}$/.test(value) ? value as `0x${string}` : null;
}

export function explorerAddressUrl() {
  const address = contractAddress();
  return address ? `${STUDIONET_EXPLORER}/address/${address}` : STUDIONET_EXPLORER;
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

export async function fetchFundingBalance(account: string): Promise<bigint> {
  const address = contractAddress();
  if (!address) throw new Error("Beacon contract address is not configured");
  const value = await beaconReader().readContract({ address, functionName: "get_funding_balance", args: [account] });
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

function base64Bytes(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return null;
  try {
    const decoded = atob(value);
    return Uint8Array.from(decoded, char => char.charCodeAt(0));
  } catch { return null; }
}

function parsedJson(value: string): unknown | undefined {
  try { return JSON.parse(value); } catch { return undefined; }
}

/** Extract a release id from both JSON views and GenVM's encoded write receipt. */
export function findReleaseId(value: unknown, visited = new Set<object>()): bigint | undefined {
  if (typeof value === "string") {
    const parsed = parsedJson(value);
    if (parsed !== undefined && parsed !== value) {
      const found = findReleaseId(parsed, visited);
      if (found !== undefined) return found;
    }
    const bytes = base64Bytes(value);
    if (bytes) {
      try {
        const found = findReleaseId(abi.calldata.decode(bytes), visited);
        if (found !== undefined) return found;
      } catch { /* This string was not a GenVM calldata value. */ }
    }
    return undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  if (visited.has(value)) return undefined;
  visited.add(value);
  if (value instanceof Map) {
    const direct = value.get("release_id");
    if (typeof direct === "number" || typeof direct === "string" || typeof direct === "bigint") return BigInt(direct);
    for (const nested of value.values()) {
      const found = findReleaseId(nested, visited);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if ("release_id" in value) {
    const candidate = (value as { release_id?: unknown }).release_id;
    if (typeof candidate === "number" || typeof candidate === "string" || typeof candidate === "bigint") return BigInt(candidate);
  }
  for (const nested of Object.values(value)) {
    const found = findReleaseId(nested, visited);
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
  const receipt = await client.waitForTransactionReceipt({ hash, status: FINALIZED_STATUS });
  assertSuccessfulFinalizedReceipt(receipt);
  return { hash, receipt, releaseId: findReleaseId(receipt) };
}

export async function openRelease(input: {
  account: `0x${string}`; provider: Eip1193Provider; repo: string; ref: string; baseline: string;
  implementer: string; title: string; obligations: string[]; scope: string[]; sealBy: number; escrowWei: bigint;
}) {
  const opened = await writeBeacon({
    account: input.account,
    provider: input.provider,
    functionName: "open_release",
    args: [input.repo, input.ref, input.baseline, input.implementer, input.title, JSON.stringify(input.obligations), JSON.stringify(input.scope), BigInt(input.sealBy)],
  });
  if (opened.releaseId === undefined) throw new Error("Agreement finalized without a release identifier; no GEN was deposited");
  const funded = await fundRelease({ account: input.account, provider: input.provider, releaseId: opened.releaseId, amount: input.escrowWei });
  return { ...funded, releaseId: opened.releaseId };
}

export async function fundRelease(input: {
  account: `0x${string}`; provider: Eip1193Provider; releaseId: bigint; amount: bigint;
}) {
  if (input.amount <= 0n) throw new Error("Funding amount must be positive");
  await writeBeacon({ account: input.account, provider: input.provider, functionName: "deposit_funding", value: input.amount });
  return writeBeacon({ account: input.account, provider: input.provider, functionName: "sponsor", args: [input.releaseId, input.amount] });
}
