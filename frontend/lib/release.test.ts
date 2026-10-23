import { expect, test } from "vitest";
import { phases, statePosition } from "./release";
test("attestation phases have a stable ordering", () => { expect(phases).toHaveLength(7); expect(statePosition("ATTESTING")).toBe(4); });
