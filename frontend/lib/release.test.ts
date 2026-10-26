import { expect, test } from "vitest";
import { phases, statePosition } from "./release";
test("attestation phases include every terminal and challenge state", () => {
  expect(phases).toEqual(["DRAFT", "SEALED", "INVENTORY", "MATERIALIZED", "ATTESTING", "REVIEW", "CHALLENGED", "ACCEPTED", "REJECTED", "REFUNDED", "EXPIRED"]);
  expect(statePosition("ATTESTING")).toBe(4);
});
