import { NextRequest, NextResponse } from "next/server";

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

// GeckoTerminal pool addresses for Base tokens (for fallback)
const GT_POOL: Record<string, string> = {
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "0xd0b53d9277642d899df5c87a3966a349a798f224", // ETH/USDC on Uniswap V3
  "0x532f27101965dd16442e59d40670faf5ebb142e4": "0x8a4e8e42e58af5484c5ad37b15b4dc95f09aa04c", // BRETT/WETH
  "0x4ed4e862860bed51a9570b96d89af5e1b0efefed": "0x625e7708f30ca75bfd92586e17077590c60eb4cd", // DEGEN/WETH
  "0x940181a94a35a4569e4529a3cdfb74e38fd98631": "0x7f670f78b17dec44d5ef68a48740b6f8849cc2e6", // AERO/USDC
};

const PERIOD_CONFIG: Record<string, { days: string; revalidate: number }> = {
  "1H":  { days: "0.04167", revalidate: 60  },
  "24H": { days: "1",       revalidate: 300 },
  "7D":  { days: "7",       revalidate: 600 },
  "30D": { days: "30",      revalidate: 1800 },
};

async function fetchCoinGecko(cgId: string, days: string, revalidate: number) {
  const key = process.env.COINGECKO_API_KEY;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (key && key !== "your_coingecko_api_key") {
    headers["x-cg-demo-api-key"] = key;
  }

  const url = `https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=${days}`;
  const res = await fetch(url, { headers, next: { revalidate } });

  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const data = await res.json();
  return (data.prices ?? []) as [number, number][];
}

async function fetchGeckoTerminal(poolAddress: string, period: string) {
  const tfMap: Record<string, { tf: string; limit: number }> = {
    "1H":  { tf: "minute", limit: 60 },
    "24H": { tf: "hour",   limit: 24 },
    "7D":  { tf: "hour",   limit: 168 },
    "30D": { tf: "day",    limit: 30 },
  };
  const { tf, limit } = tfMap[period] ?? tfMap["24H"];
  const url = `https://api.geckoterminal.com/api/v2/networks/base/pools/${poolAddress}/ohlcv/${tf}?limit=${limit}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json;version=20230302" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`GeckoTerminal ${res.status}`);
  const data = await res.json();

  // ohlcv_list: [[timestamp, open, high, low, close, volume], ...]
  const ohlcv: number[][] = data.data?.attributes?.ohlcv_list ?? [];
  // Convert to [timestamp_ms, close_price]
  return ohlcv.map(([ts, , , , close]) => [ts * 1000, close]) as [number, number][];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tokenAddress = searchParams.get("token")?.toLowerCase();
  const period       = searchParams.get("period") || "24H";

  if (!tokenAddress) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const { days, revalidate } = PERIOD_CONFIG[period] ?? PERIOD_CONFIG["24H"];
  const cgId      = CG_IDS[tokenAddress];
  const poolAddr  = GT_POOL[tokenAddress];

  // 1. Try CoinGecko
  if (cgId) {
    try {
      const prices = await fetchCoinGecko(cgId, days, revalidate);
      return NextResponse.json({ prices, source: "coingecko" });
    } catch (err) {
      console.warn("CoinGecko chart failed, trying GeckoTerminal:", err);
    }
  }

  // 2. Try GeckoTerminal fallback
  if (poolAddr) {
    try {
      const prices = await fetchGeckoTerminal(poolAddr, period);
      return NextResponse.json({ prices, source: "geckoterminal" });
    } catch (err) {
      console.warn("GeckoTerminal chart also failed:", err);
    }
  }

  // 3. Empty — chart shows "no data"
  return NextResponse.json({ prices: [], source: "none" });
}
