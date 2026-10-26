// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { ReleaseMonitor } from "./ReleaseMonitor";

const fetchRelease = vi.fn();
const fetchEntry = vi.fn();
const fetchComponent = vi.fn();
const fetchEdge = vi.fn();
const interactionMocks = vi.hoisted(() => ({
  writeBeacon: vi.fn(),
  connectStudionet: vi.fn(async () => `0x${"1".repeat(40)}`),
}));

vi.mock("@/lib/beacon-client", () => ({
  fetchRelease: (...args: unknown[]) => fetchRelease(...args),
  fetchEntry: (...args: unknown[]) => fetchEntry(...args),
  fetchComponent: (...args: unknown[]) => fetchComponent(...args),
  fetchEdge: (...args: unknown[]) => fetchEdge(...args),
  fetchBalance: vi.fn(async () => 0n),
  formatGen: (value: unknown) => (BigInt(String(value || 0)) / 10n ** 18n).toString(),
  parseGen: (value: string) => BigInt(value) * 10n ** 18n,
  writeBeacon: (...args: unknown[]) => interactionMocks.writeBeacon(...args),
}));

vi.mock("@/lib/wallet", () => ({ connectStudionet: () => interactionMocks.connectStudionet() }));

afterEach(() => { cleanup(); vi.clearAllMocks(); window.history.replaceState({}, "", "/"); });

test("preserves arbitrarily large release IDs as bigint", async () => {
  fetchRelease.mockResolvedValue(null);
  const user = userEvent.setup();
  render(<ReleaseMonitor />);
  const input = screen.getByLabelText("Release ID");
  await user.type(input, "900719925474099312345");
  await user.click(screen.getByRole("button", { name: "Watch release" }));
  await waitFor(() => expect(fetchRelease).toHaveBeenCalledWith(900719925474099312345n));
});

test("renders certificate, blockers, coverage and the applicable operation", async () => {
  window.history.replaceState({}, "", "/?release=1");
  fetchRelease.mockResolvedValue({
    id: 1, state: "REVIEW", repo: "org/repo", ref: "main", baseline: "a".repeat(40), implementer: "0x" + "1".repeat(40), escrow: 10n ** 18n,
    scope: ["src"], obligations: ["Tests pass"], blockers: ["unsupported_inventory_entry"], inventory_count: 1, materialized_count: 1,
    component_count: 1, assessed_count: 1, edge_count: 0, reviewed_edges: 0, certificate: { outcome: "INDETERMINATE", coverage: [1, 1, 1, 1, 0, 0] }, seal: null, challenge: null,
  });
  fetchEntry.mockResolvedValue({ path: "src/a.ts", status: "VERIFIED" });
  fetchComponent.mockResolvedValue({ paths: ["src/a.ts"], status: "UNCERTAIN", assessment: { result: "UNCERTAIN" } });
  render(<ReleaseMonitor />);
  expect(await screen.findByText("unsupported_inventory_entry")).toBeTruthy();
  expect(screen.getByText(/INDETERMINATE/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Refund after review period" })).toBeTruthy();
});

test("represents pending wallet consensus and only reports success after finality", async () => {
  window.history.replaceState({}, "", "/?release=2");
  fetchRelease.mockResolvedValue({
    id: 2, state: "DRAFT", repo: "org/repo", ref: "main", baseline: "a".repeat(40), implementer: `0x${"1".repeat(40)}`,
    escrow: 10n ** 18n, scope: ["src"], obligations: ["Tests pass"], blockers: [], inventory_count: 0, materialized_count: 0,
    component_count: 0, assessed_count: 0, edge_count: 0, reviewed_edges: 0, certificate: null, seal: null, challenge: null,
  });
  let finish!: (value: { hash: string; receipt: object }) => void;
  interactionMocks.writeBeacon.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  Object.defineProperty(window, "ethereum", { configurable: true, value: { request: vi.fn() } });
  const user = userEvent.setup();
  render(<ReleaseMonitor />);
  await screen.findByText("DRAFT");
  await user.click(screen.getByRole("button", { name: "Sponsor" }));
  expect(await screen.findByText(/waiting for wallet confirmation and consensus/i)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Sponsor" })).toHaveProperty("disabled", true);
  finish({ hash: `0x${"b".repeat(64)}`, receipt: {} });
  expect(await screen.findByText(/Sponsor release finalized/i)).toBeTruthy();
});

test.each([
  ["CHALLENGED", "Review challenge"],
  ["REJECTED", null],
  ["ACCEPTED", null],
])("represents %s releases with the correct operation", async (state, operation) => {
  window.history.replaceState({}, "", `/?release=${state === "CHALLENGED" ? "3" : "4"}`);
  fetchRelease.mockResolvedValue({
    id: 3, state, repo: "org/repo", ref: "main", baseline: "a".repeat(40), implementer: `0x${"1".repeat(40)}`,
    escrow: 10n ** 18n, scope: ["src"], obligations: ["Tests pass"], blockers: [], inventory_count: 1, materialized_count: 1,
    component_count: 1, assessed_count: 1, edge_count: 0, reviewed_edges: 0,
    certificate: { outcome: state === "ACCEPTED" ? "ACCEPTED" : "REJECTED", coverage: [1, 1, 1, 1, 0, 0] },
    seal: { commit: "a".repeat(40) }, challenge: state === "CHALLENGED" ? { reason: "Evidence mismatch" } : null,
  });
  fetchEntry.mockResolvedValue({ path: "src/a.ts", status: "VERIFIED" });
  fetchComponent.mockResolvedValue({ paths: ["src/a.ts"], status: "ACCEPT" });
  render(<ReleaseMonitor />);
  expect(await screen.findByText(state)).toBeTruthy();
  if (operation) expect(screen.getByRole("button", { name: operation })).toBeTruthy();
  else expect(screen.queryByRole("button", { name: /Finalize release|Review challenge|Refund after review period/ })).toBeNull();
});
