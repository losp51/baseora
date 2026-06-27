import { NextRequest, NextResponse } from "next/server";

const BASE_0X_URL = "https://api.0x.org";

const CG_IDS: Record<string, string> = {
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ethereum",
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "usd-coin",
  "0x4200000000000000000000000000000000000006": "weth",
  "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22": "coinbase-wrapped-staked-eth",
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": "tether",
  "0x532f27101965dd16442e59d40670faf5ebb142e4": "based-brett",
  "0x4ed4e862860bed51a9570b96d89af5e1b0efefed": "degen-base",
  "0x940181a94a35a4569e4529a3cdfb74e38fd98631": "aerodrome-finance",
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": "dai",
};

const DECIMALS: Record<string, number> = {
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": 18,
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": 6,
  "0x4200000000000000000000000000000000000006": 18,
  "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22": 18,
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": 6,
  "0x532f27101965dd16442e59d40670faf5ebb142e4": 18,
  "0x4ed4e862860bed51a9570b96d89af5e1b0efefed": 18,
  "0x940181a94a35a4569e4529a3cdfb74e38fd98631": 18,
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": 18,
};

async function getCGPrices(ids: string[]): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const out: Record<string, number> = {};
    for (const id of ids) out[id] = data[id]?.usd ?? 0;
    return out;
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sellToken   = searchParams.get("sellToken");
  const buyToken    = searchParams.get("buyToken");
  const sellAmount  = searchParams.get("sellAmount");
  const chainId     = searchParams.get("chainId") || "8453";
  const slippageBps = searchParams.get("slippageBps") || "50";

  if (!sellToken || !buyToken || !sellAmount) {
    return NextResponse.json({ reason: "Missing required params" }, { status: 400 });
  }

  const apiKey = process.env.ZEROX_API_KEY || "";
  const hasKey = apiKey && apiKey !== "your_0x_api_key" && apiKey.length > 10;

  /* ── try real 0x price endpoint ── */
  if (hasKey) {
    try {
      const params = new URLSearchParams({ chainId, sellToken, buyToken, sellAmount, slippageBps });
      const res  = await fetch(`${BASE_0X_URL}/swap/permit2/price?${params}`, {
        headers: { "0x-api-key": apiKey, "0x-version": "v2" },
        next: { revalidate: 10 },
      });
      const data = await res.json();
      if (res.ok) return NextResponse.json(data);
      console.warn("0x price error:", res.status, data.reason);
    } catch (err) {
      console.error("0x price fetch failed:", err);
    }
  }

  /* ── CoinGecko fallback ── */
  const sellAddr = sellToken.toLowerCase();
  const buyAddr  = buyToken.toLowerCase();
  const sellCG   = CG_IDS[sellAddr];
  const buyCG    = CG_IDS[buyAddr];

  if (!sellCG || !buyCG) {
    return NextResponse.json({ reason: "Token not supported in demo mode" }, { status: 400 });
  }

  const prices  = await getCGPrices([sellCG, buyCG]);
  if (!prices[sellCG] || !prices[buyCG]) {
    return NextResponse.json({ reason: "Price data unavailable" }, { status: 502 });
  }

  const sellDec   = DECIMALS[sellAddr] ?? 18;
  const buyDec    = DECIMALS[buyAddr]  ?? 18;
  const sellHuman = Number(sellAmount) / Math.pow(10, sellDec);
  const sellUSD   = sellHuman * prices[sellCG];
  const buyHuman  = prices[buyCG] > 0 ? sellUSD / prices[buyCG] : 0;
  const buyRaw    = BigInt(Math.floor(buyHuman * Math.pow(10, buyDec))).toString();

  return NextResponse.json({
    buyAmount:          buyRaw,
    sellAmount,
    buyToken,
    sellToken,
    price:              prices[buyCG] > 0 ? (prices[sellCG] / prices[buyCG]).toString() : "0",
    sources: [
      { name: "Uniswap_V3",    proportion: "0.65" },
      { name: "Aerodrome",     proportion: "0.25" },
      { name: "PancakeSwap_V3",proportion: "0.10" },
    ],
    estimatedGas:       "150000",
    gas:                "150000",
    gasPrice:           "1000000",
    value:              "0",
    sellTokenToEthRate: prices[sellCG].toString(),
    buyTokenToEthRate:  prices[buyCG].toString(),
    __isMock: true,
  });
}
