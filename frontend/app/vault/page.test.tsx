// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import Vault from "./page";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(async () => `0x${"1".repeat(40)}`),
  balance: vi.fn(),
  write: vi.fn(async () => ({ hash: `0x${"a".repeat(64)}`, receipt: {} })),
}));

vi.mock("@/lib/wallet", () => ({ connectStudionet: mocks.connect }));
vi.mock("@/lib/beacon-client", () => ({
  fetchBalance: mocks.balance,
  formatGen: (value: bigint) => (value / 10n ** 18n).toString(),
  writeBeacon: mocks.write,
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

test("loads a wallet credit and submits a finalized withdrawal", async () => {
  Object.defineProperty(window, "ethereum", { configurable: true, value: { request: vi.fn() } });
  mocks.balance.mockResolvedValueOnce(2n * 10n ** 18n).mockResolvedValueOnce(0n);
  const user = userEvent.setup(); render(<Vault />);
  await user.click(screen.getByRole("button", { name: "Connect wallet" }));
  expect(await screen.findByText("2 GEN")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Withdraw credit" }));
  await waitFor(() => expect(mocks.write).toHaveBeenCalledWith(expect.objectContaining({ functionName: "withdraw" })));
  expect(await screen.findByText(/Withdrawal finalized/)).toBeTruthy();
});
