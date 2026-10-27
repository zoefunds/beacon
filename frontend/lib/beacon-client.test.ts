import { expect, test, vi } from "vitest";

const clientMocks = vi.hoisted(() => ({
  writeContract: vi.fn(async (_input: Record<string, unknown>): Promise<unknown> => `0x${"a".repeat(64)}`),
  waitForTransactionReceipt: vi.fn(async (_input: Record<string, unknown>): Promise<Record<string, unknown>> => ({ result_name: "MAJORITY_AGREE" })),
}));

vi.mock("genlayer-js", () => ({ createClient: () => clientMocks }));

import { assertSuccessfulFinalizedReceipt, findReleaseId, formatGen, openRelease, parseGen, STUDIONET, writeBeacon } from "./beacon-client";

test("uses the official Studionet definition required for consensus writes", () => {
  expect(STUDIONET.id).toBe(61999);
  expect(STUDIONET.consensusMainContract?.address).toMatch(/^0x[0-9a-f]{40}$/i);
  expect(STUDIONET.defaultNumberOfInitialValidators).toBeGreaterThan(0);
  expect(STUDIONET.defaultConsensusMaxRotations).toBeGreaterThan(0);
});

test("extracts a release identifier from Studionet's finalized GenVM receipt", () => {
  const receipt = {
    consensus_data: {
      leader_receipt: [{
        result: {
          raw: "AIQCeyJyZWxlYXNlX2lkIjoxLCJzdGF0ZSI6IkRSQUZUIn0=",
          status: "return",
          payload: { readable: "\"{\\\"release_id\\\":1,\\\"state\\\":\\\"DRAFT\\\"}\"" },
        },
      }],
    },
  };
  expect(findReleaseId(receipt)).toBe(1n);
});

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

test("a finalized consensus rollback is never presented as success", () => {
  expect(() => assertSuccessfulFinalizedReceipt({
    result_name: "MAJORITY_AGREE",
    consensus_data: { leader_receipt: [{ execution_result: "ERROR", result: { status: "rollback", payload: "invalid_state" } }] },
  })).toThrow(/rolled back/);
});

test("release creation finalizes before deposit, and deposit finalizes before allocation", async () => {
  process.env.NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS = `0x${"1".repeat(40)}`;
  clientMocks.writeContract.mockClear();
  clientMocks.waitForTransactionReceipt
    .mockResolvedValueOnce({ result_name: "MAJORITY_AGREE", consensus_data: { leader_receipt: [{ execution_result: "SUCCESS", result: { status: "return", payload: '{"release_id":7}' } }] } })
    .mockResolvedValueOnce({ result_name: "MAJORITY_AGREE", consensus_data: { leader_receipt: [{ execution_result: "SUCCESS", result: { status: "return" } }] } })
    .mockResolvedValueOnce({ result_name: "MAJORITY_AGREE", consensus_data: { leader_receipt: [{ execution_result: "SUCCESS", result: { status: "return" } }] } });
  const transaction = await openRelease({
    account: `0x${"2".repeat(40)}`, provider: { request: vi.fn() }, repo: "org/repo", ref: "main",
    baseline: "a".repeat(40), implementer: `0x${"3".repeat(40)}`, title: "Release",
    obligations: ["Works"], scope: ["src"], sealBy: 2_000_000_000, escrowWei: 10n ** 18n,
  });
  expect(transaction.releaseId).toBe(7n);
  expect(clientMocks.writeContract.mock.calls.map(call => call[0].functionName)).toEqual(["open_release", "deposit_funding", "sponsor"]);
  expect(clientMocks.writeContract.mock.calls[0][0].value).toBe(0n);
  expect(clientMocks.writeContract.mock.calls[1][0].value).toBe(10n ** 18n);
  expect(clientMocks.writeContract.mock.calls[2][0].args).toEqual([7n, 10n ** 18n]);
});

test("a failed deposit is not followed by an allocation retry", async () => {
  process.env.NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS = `0x${"1".repeat(40)}`;
  clientMocks.writeContract.mockClear();
  clientMocks.waitForTransactionReceipt
    .mockResolvedValueOnce({ result_name: "MAJORITY_AGREE", consensus_data: { leader_receipt: [{ execution_result: "SUCCESS", result: { status: "return", payload: '{"release_id":8}' } }] } })
    .mockResolvedValueOnce({ result_name: "MAJORITY_AGREE", consensus_data: { leader_receipt: [{ execution_result: "ERROR", result: { status: "rollback" } }] } });
  await expect(openRelease({
    account: `0x${"2".repeat(40)}`, provider: { request: vi.fn() }, repo: "org/repo", ref: "main",
    baseline: "a".repeat(40), implementer: `0x${"3".repeat(40)}`, title: "Release",
    obligations: ["Works"], scope: ["src"], sealBy: 2_000_000_000, escrowWei: 10n ** 18n,
  })).rejects.toThrow(/rolled back/);
  expect(clientMocks.writeContract.mock.calls.map(call => call[0].functionName)).toEqual(["open_release", "deposit_funding"]);
});
