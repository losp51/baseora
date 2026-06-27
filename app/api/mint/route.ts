import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { keccak256, encodePacked, toBytes } from "viem";

const LEVEL_INDEX: Record<string, number> = {
  Bronze: 0, Silver: 1, Gold: 2, Platinum: 3, Diamond: 4, Elite: 5,
};

export async function POST(req: NextRequest) {
  try {
    const { wallet, level, totalVolume, swapCount } = await req.json();

    if (!wallet || !level || totalVolume === undefined || swapCount === undefined) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const signerKey = process.env.NFT_SIGNER_PRIVATE_KEY;
    if (!signerKey || signerKey === "your_nft_signer_private_key") {
      // Demo mode — return a fake signature so UI can show the flow
      return NextResponse.json({
        signature: "0x" + "0".repeat(130),
        demo: true,
        message: "NFT_SIGNER_PRIVATE_KEY not set — mint is in demo mode",
      });
    }

    const account = privateKeyToAccount(signerKey as `0x${string}`);
    const levelIdx = LEVEL_INDEX[level] ?? 0;

    // Match contract: keccak256(abi.encodePacked(user, uint8(level), volume, count))
    const msgHash = keccak256(
      encodePacked(
        ["address", "uint8", "uint256", "uint256"],
        [wallet as `0x${string}`, levelIdx, BigInt(totalVolume), BigInt(swapCount)]
      )
    );

    const client = createWalletClient({ account, chain: base, transport: http() });
    const signature = await account.signMessage({ message: { raw: toBytes(msgHash) } });

    return NextResponse.json({ signature, demo: false });
  } catch (err) {
    console.error("Mint sign error:", err);
    return NextResponse.json({ error: "Signing failed" }, { status: 500 });
  }
}
