// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import Console from "./page";

vi.mock("@/components/ReleaseMonitor", () => ({ ReleaseMonitor: () => <div>Release monitor</div> }));
vi.mock("@/lib/wallet", () => ({ connectStudionet: vi.fn() }));
vi.mock("@/lib/beacon-client", () => ({ explorerAddressUrl: () => "https://explorer.example/address/contract", formatGen: () => "0" }));

afterEach(cleanup);

test("Attestation Log and Vault navigate to dedicated pages", () => {
  render(<Console />);
  expect(screen.getByRole("link", { name: "Attestation log" }).getAttribute("href")).toBe("/attestations");
  expect(screen.getByRole("link", { name: "Vault" }).getAttribute("href")).toBe("/vault");
});
