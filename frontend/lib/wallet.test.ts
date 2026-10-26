import { expect, test } from "vitest";
import { ensureStudionet, requestAccount } from "./wallet";

test("returns the first EIP-1193 account", async () => {
  const account = "0x1111111111111111111111111111111111111111";
  await expect(requestAccount({ request: async () => [account] })).resolves.toBe(account);
});
test("switches an unexpected network to Studionet", async () => {
  const methods: string[] = [];
  await ensureStudionet({ request: async ({ method }) => { methods.push(method); return method === "eth_chainId" ? "0x1" : undefined; } });
  expect(methods).toEqual(["eth_chainId", "wallet_switchEthereumChain"]);
});

test("adds Studionet when a wallet does not know the chain", async () => {
  const methods: string[] = [];
  await ensureStudionet({ request: async ({ method }) => {
    methods.push(method);
    if (method === "eth_chainId") return "0x1";
    if (method === "wallet_switchEthereumChain") throw Object.assign(new Error("missing"), { code: 4902 });
    return undefined;
  } });
  expect(methods).toEqual(["eth_chainId", "wallet_switchEthereumChain", "wallet_addEthereumChain"]);
});
