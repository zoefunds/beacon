export type Eip1193Provider = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };

declare global { interface Window { ethereum?: Eip1193Provider } }

export async function requestAccount(provider: Eip1193Provider | undefined = typeof window === "undefined" ? undefined : window.ethereum): Promise<string> {
  if (!provider) throw new Error("No EIP-1193 wallet is available");
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string") throw new Error("Wallet returned no account");
  return accounts[0];
}

export async function assertStudionet(provider: Eip1193Provider): Promise<void> {
  const chainId = await provider.request({ method: "eth_chainId" });
  if (chainId !== "0xf22f") throw new Error("Switch your wallet to GenLayer Studionet (61999)");
}
