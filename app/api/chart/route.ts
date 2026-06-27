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

const PERIOD_CONFIG: Record<string, { days: string }> = {
  "1H":  { days: "0.04167" },
  "24H": { days: "1"       },
  "7D":  { days: "7"       },
  "30D": { days: "30"      },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tokenAddress = searchParams.get("token")?.toLowerCase();
  const period       = searchParams.get("period") || "24H";

  if (!tokenAddress) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const cgId = CG_IDS[tokenAddress];
  if (!cgId) {
    return NextResponse.json({ error: "Token not supported", prices: [] }, { status: 200 });
  }

  const { days } = PERIOD_CONFIG[period] || PERIOD_CONFIG["24H"];

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=${days}`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: period === "1H" ? 60 : period === "24H" ? 300 : 600 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("CoinGecko error:", res.status, text);
      return NextResponse.json({ error: "CoinGecko unavailable", prices: [] }, { status: 200 });
    }

    const data = await res.json();
    const prices: [number, number][] = data.prices ?? [];

    return NextResponse.json({ prices, cgId });
  } catch (err) {
    console.error("Chart fetch error:", err);
    return NextResponse.json({ error: "Fetch failed", prices: [] }, { status: 200 });
  }
}
