import { NextRequest, NextResponse } from "next/server";

const BASE_0X_URL = "https://api.0x.org";

/* ── token address → CoinGecko ID map for fallback pricing ── */
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

/* token decimals */
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

/* fetch USD prices from CoinGecko (free, no key needed) */
async function getCGPrices(ids: string[]): Promise<Record<string, number>> {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) return {};
    const data = await res.json();
    const out: Record<string, number> = {};
    for (const id of ids) out[id] = data[id]?.usd ?? 0;
    return out;
  } catch {
    return {};
  }
}

/* build a mock quote from price data */
function buildMockQuote(
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  sellPrice: number,
  buyPrice: number,
  sellDecimals: number,
  buyDecimals: number
) {
  const sellHuman = Number(sellAmount) / Math.pow(10, sellDecimals);
  const sellUSD   = sellHuman * sellPrice;
  const buyHuman  = buyPrice > 0 ? sellUSD / buyPrice : 0;
  const buyRaw    = BigInt(Math.floor(buyHuman * Math.pow(10, buyDecimals))).toString();

  /* synthetic route: show top Base DEX sources */
  const sources = [
    { name: "Uniswap_V3",    proportion: "0.65" },
    { name: "Aerodrome",     proportion: "0.25" },
    { name: "PancakeSwap_V3",proportion: "0.10" },
  ];

  return {
    buyAmount:          buyRaw,
    sellAmount,
    buyToken,
    sellToken,
    price:              buyPrice > 0 ? (sellPrice / buyPrice).toString() : "0",
    guaranteedPrice:    buyPrice > 0 ? (sellPrice / buyPrice * 0.995).toString() : "0",
    sources,
    estimatedGas:       "150000",
    gas:                "150000",
    gasPrice:           "1000000",
    value:              "0",
    to:                 "0x0000000000000000000000000000000000000000",
    data:               "0x",
    sellTokenToEthRate: sellPrice > 0 ? sellPrice.toString() : "1",
    buyTokenToEthRate:  buyPrice  > 0 ? buyPrice.toString()  : "1",
    protocolFee:        "0",
    minimumProtocolFee: "0",
    __isMock: true,   // flag so frontend can show "demo" indicator
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const sellToken  = searchParams.get("sellToken");
  const buyToken   = searchParams.get("buyToken");
  const sellAmount = searchParams.get("sellAmount");
  const chainId    = searchParams.get("chainId") || "8453";
  const slippageBps = searchParams.get("slippageBps") || "50";
  const taker       = searchParams.get("taker");

  if (!sellToken || !buyToken || !sellAmount) {
    return NextResponse.json(
      { reason: "Missing required params: sellToken, buyToken, sellAmount" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ZEROX_API_KEY || "";
  const hasKey = apiKey && apiKey !== "your_0x_api_key" && apiKey.length > 10;

  /* ── try real 0x API first ── */
  if (hasKey) {
    try {
      const params = new URLSearchParams({ chainId, sellToken, buyToken, sellAmount, slippageBps });
      if (taker) params.set("taker", taker);

      const res  = await fetch(`${BASE_0X_URL}/swap/permit2/quote?${params}`, {
        headers: { "0x-api-key": apiKey, "0x-version": "v2" },
        next: { revalidate: 0 },
      });
      const data = await res.json();

      if (res.ok) return NextResponse.json(data);

      /* 0x returned an error — log it and fall through to mock */
      console.warn("0x quote error:", res.status, data.reason ?? JSON.stringify(data));
    } catch (err) {
      console.error("0x fetch failed:", err);
    }
  }

  /* ── fallback: CoinGecko price-based mock quote ── */
  const sellAddr = sellToken.toLowerCase();
  const buyAddr  = buyToken.toLowerCase();
  const sellCG   = CG_IDS[sellAddr];
  const buyCG    = CG_IDS[buyAddr];

  if (!sellCG || !buyCG) {
    return NextResponse.json(
      {
        reason: hasKey
          ? "Quote unavailable for this token pair"
          : "0x API key not configured. Add ZEROX_API_KEY to .env.local to get real quotes.",
      },
      { status: 400 }
    );
  }

  const prices = await getCGPrices([sellCG, buyCG]);
  if (!prices[sellCG] || !prices[buyCG]) {
    return NextResponse.json({ reason: "Price data unavailable" }, { status: 502 });
  }

  const sellDec = DECIMALS[sellAddr] ?? 18;
  const buyDec  = DECIMALS[buyAddr]  ?? 18;

  const mock = buildMockQuote(
    sellToken, buyToken, sellAmount,
    prices[sellCG], prices[buyCG],
    sellDec, buyDec
  );

  return NextResponse.json(mock);
}
