import { expect, test } from "vitest";
import { formatGen, parseGen } from "./beacon-client";

test("GEN parsing never uses floating point arithmetic", () => {
  expect(parseGen("1")).toBe(10n ** 18n);
  expect(parseGen("1.000000000000000001")).toBe(1000000000000000001n);
  expect(formatGen(1000000000000000001n)).toBe("1.000000000000000001");
});

test("GEN parsing rejects excess precision and non-finite values", () => {
  expect(() => parseGen("1.0000000000000000001")).toThrow();
  expect(() => parseGen("Infinity")).toThrow();
});
