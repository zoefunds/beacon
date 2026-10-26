import { expect, test, vi } from "vitest";

const clientMocks = vi.hoisted(() => ({
  writeContract: vi.fn(async () => `0x${"a".repeat(64)}`),
  waitForTransactionReceipt: vi.fn(async () => ({ result_name: "MAJORITY_AGREE" })),
}));

vi.mock("genlayer-js", () => ({ createClient: () => clientMocks }));

import { formatGen, parseGen, writeBeacon } from "./beacon-client";

test("GEN parsing never uses floating point arithmetic", () => {
  expect(parseGen("1")).toBe(10n ** 18n);
  expect(parseGen("1.000000000000000001")).toBe(1000000000000000001n);
  expect(formatGen(1000000000000000001n)).toBe("1.000000000000000001");
});

test("GEN parsing rejects excess precision and non-finite values", () => {
  expect(() => parseGen("1.0000000000000000001")).toThrow();
  expect(() => parseGen("Infinity")).toThrow();
});

test("writes wait for FINALIZED consensus state", async () => {
  process.env.NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS = `0x${"1".repeat(40)}`;
  await writeBeacon({ account: `0x${"2".repeat(40)}`, provider: { request: vi.fn() }, functionName: "withdraw" });
  expect(clientMocks.waitForTransactionReceipt).toHaveBeenCalledWith({ hash: `0x${"a".repeat(64)}`, status: "FINALIZED" });
});
