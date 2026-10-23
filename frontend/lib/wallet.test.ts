import { expect, test } from "vitest";
import { assertStudionet, requestAccount } from "./wallet";

test("returns the first EIP-1193 account", async () => {
  await expect(requestAccount({ request: async () => ["0xa"] })).resolves.toBe("0xa");
});
test("rejects an unexpected network", async () => {
  await expect(assertStudionet({ request: async () => "0x1" })).rejects.toThrow("Studionet");
});
