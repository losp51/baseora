import { NextRequest, NextResponse } from "next/server";
import { POPULAR_TOKENS, BASE_TOKENS } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase();

  let tokens = Object.values(BASE_TOKENS);

  if (query) {
    tokens = tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.address.toLowerCase() === query
    );
  }

  // Fetch extended list from CoinGecko if no query filter
  if (!query) {
    try {
      const res = await fetch("https://tokens.coingecko.com/base/all.json", {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        const cgTokens = data.tokens
          ?.slice(0, 200)
          .filter(
            (t: { address: string }) =>
              !Object.values(BASE_TOKENS).find(
                (bt) =>
                  bt.address.toLowerCase() === t.address?.toLowerCase()
              )
          );
        tokens = [...tokens, ...(cgTokens || [])];
      }
    } catch {
      // Fallback to BASE_TOKENS only
    }
  }

  return NextResponse.json({
    tokens,
    popular: POPULAR_TOKENS,
  });
}
