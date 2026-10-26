export type Eip1193Provider = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };

declare global { interface Window { ethereum?: Eip1193Provider } }

export async function requestAccount(provider: Eip1193Provider | undefined = typeof window === "undefined" ? undefined : window.ethereum): Promise<`0x${string}`> {
  if (!provider) throw new Error("No EIP-1193 wallet is available");
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(accounts[0])) throw new Error("Wallet returned no valid account");
  return accounts[0] as `0x${string}`;
}

export async function ensureStudionet(provider: Eip1193Provider): Promise<void> {
  const chainId = await provider.request({ method: "eth_chainId" });
  if (String(chainId).toLowerCase() === "0xf22f") return;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0xf22f" }] });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? Number((error as { code: unknown }).code) : 0;
    if (code !== 4902) throw new Error("Switch your wallet to GenLayer Studionet (61999)");
    await provider.request({ method: "wallet_addEthereumChain", params: [{ chainId: "0xf22f", chainName: "GenLayer Studionet", nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 }, rpcUrls: ["https://studio.genlayer.com/api"], blockExplorerUrls: ["https://explorer-studio.genlayer.com"] }] });
  }
}

export async function connectStudionet(provider: Eip1193Provider | undefined = typeof window === "undefined" ? undefined : window.ethereum) {
  if (!provider) throw new Error("No EIP-1193 wallet is available");
  const account = await requestAccount(provider);
  await ensureStudionet(provider);
  return account;
}

export const assertStudionet = ensureStudionet;
