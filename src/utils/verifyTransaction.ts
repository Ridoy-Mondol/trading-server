import { Api, JsonRpc, Serialize } from "eosjs";

function makeApi() {
  const rpc = new JsonRpc(process.env.PROTON_ENDPOINT as string, {
    fetch: fetch as any,
  });
  const api = new Api({
    rpc,
    signatureProvider: undefined as any,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });
  return { rpc, api };
}

export async function verifyTransact(params: {
  walletAddress: string;
  nonce: string;
  signatures: string[];
  signedTransactionHex: string;
}): Promise<{ ok: boolean; reason?: string; permissionMatched?: boolean }> {
  const { walletAddress, nonce, signatures, signedTransactionHex } = params;

  console.log("[Transaction verification] Params:", {
    walletAddress,
    nonce,
    signatures,
    signedTransactionHexLength: signedTransactionHex.length,
  });

  if (!signatures?.length) return { ok: false, reason: "Missing signatures" };
  if (!signedTransactionHex)
    return { ok: false, reason: "Missing transaction hex" };

  const chainId = (process.env.CHAIN_ID || "").trim();
  if (!chainId || chainId.length !== 64)
    return { ok: false, reason: "Invalid CHAIN_ID" };

  const { rpc, api } = makeApi();

  // Deserialize transaction
  const trxBytes = Serialize.hexToUint8Array(signedTransactionHex);
  const decoded = await api.deserializeTransactionWithActions(trxBytes);
  const firstAction = decoded?.actions?.[0];

  if (!firstAction) return { ok: false, reason: "No actions in transaction" };
  if (firstAction.account !== "eosio.token" || firstAction.name !== "transfer")
    return { ok: false, reason: "Unexpected action type" };

  const hasAuth = firstAction.authorization?.some(
    (a: any) => a.actor === walletAddress
  );
  if (!hasAuth)
    return { ok: false, reason: "Actor not authorized in transaction" };

  const data = firstAction.data as any;
  if (!data || data.memo !== `Login nonce: ${nonce}`)
    return { ok: false, reason: "Nonce/memo mismatch" };
  if (data.from !== walletAddress || data.to !== walletAddress)
    return { ok: false, reason: "Transfer not self-to-self" };
  if (
    typeof data.quantity === "string" &&
    Number(data.quantity.split(" ")[0]) !== 0
  )
    return { ok: false, reason: "Transfer amount must be zero" };

  try {
    const acct = await rpc.get_account(walletAddress);
    if (!acct || !acct.account_name)
      return { ok: false, reason: "Wallet not found on chain" };
  } catch {
    return { ok: false, reason: "Failed to fetch wallet info" };
  }

  return { ok: true, permissionMatched: true };
}
