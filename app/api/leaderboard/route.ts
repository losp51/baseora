import { NextRequest, NextResponse } from "next/server";

// Mock data for demo — replace with Supabase queries
const MOCK_LEADERBOARD = [
  { rank: 1,  wallet_address: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", ens_name: "whale.eth",   total_xp: 124000, level: "Elite",    total_volume_usd: 2400000, swap_count: 847, referral_count: 23 },
  { rank: 2,  wallet_address: "0xabcdef1234567890abcdef1234567890abcdef12", ens_name: "vitalik.eth", total_xp: 98000,  level: "Elite",    total_volume_usd: 1800000, swap_count: 632, referral_count: 18 },
  { rank: 3,  wallet_address: "0x9876543210fedcba9876543210fedcba98765432", ens_name: null,          total_xp: 72000,  level: "Diamond",  total_volume_usd: 980000,  swap_count: 421, referral_count: 12 },
  { rank: 4,  wallet_address: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", ens_name: "defi.eth",    total_xp: 51000,  level: "Diamond",  total_volume_usd: 540000,  swap_count: 318, referral_count: 8  },
  { rank: 5,  wallet_address: "0xcafe0000cafe0000cafe0000cafe0000cafe0000", ens_name: null,          total_xp: 34500,  level: "Platinum", total_volume_usd: 320000,  swap_count: 245, referral_count: 5  },
  { rank: 6,  wallet_address: "0xbabe1111babe1111babe1111babe1111babe1111", ens_name: "base.eth",    total_xp: 22000,  level: "Platinum", total_volume_usd: 198000,  swap_count: 189, referral_count: 3  },
  { rank: 7,  wallet_address: "0x1234567890123456789012345678901234567890", ens_name: null,          total_xp: 15200,  level: "Gold",     total_volume_usd: 145000,  swap_count: 134, referral_count: 2  },
  { rank: 8,  wallet_address: "0xfeedface00000000feedface00000000feedface", ens_name: null,          total_xp: 9800,   level: "Gold",     total_volume_usd: 89000,   swap_count: 98,  referral_count: 1  },
  { rank: 9,  wallet_address: "0xc0ffee00c0ffee00c0ffee00c0ffee00c0ffee00", ens_name: "coffee.eth",  total_xp: 6200,   level: "Silver",   total_volume_usd: 54000,   swap_count: 67,  referral_count: 0  },
  { rank: 10, wallet_address: "0xd00d1e00d00d1e00d00d1e00d00d1e00d00d1e00", ens_name: null,          total_xp: 3400,   level: "Silver",   total_volume_usd: 29000,   swap_count: 43,  referral_count: 0  },
  { rank: 11, wallet_address: "0xaaaa1111aaaa1111aaaa1111aaaa1111aaaa1111", ens_name: "alpha.eth",   total_xp: 2900,   level: "Silver",   total_volume_usd: 24000,   swap_count: 38,  referral_count: 0  },
  { rank: 12, wallet_address: "0xbbbb2222bbbb2222bbbb2222bbbb2222bbbb2222", ens_name: null,          total_xp: 2400,   level: "Silver",   total_volume_usd: 19500,   swap_count: 31,  referral_count: 0  },
  { rank: 13, wallet_address: "0xcccc3333cccc3333cccc3333cccc3333cccc3333", ens_name: "degen.eth",   total_xp: 1950,   level: "Bronze",   total_volume_usd: 15000,   swap_count: 26,  referral_count: 0  },
  { rank: 14, wallet_address: "0xdddd4444dddd4444dddd4444dddd4444dddd4444", ens_name: null,          total_xp: 1500,   level: "Bronze",   total_volume_usd: 11000,   swap_count: 20,  referral_count: 0  },
  { rank: 15, wallet_address: "0xeeee5555eeee5555eeee5555eeee5555eeee5555", ens_name: null,          total_xp: 1100,   level: "Bronze",   total_volume_usd: 8200,    swap_count: 15,  referral_count: 0  },
  { rank: 16, wallet_address: "0xffff6666ffff6666ffff6666ffff6666ffff6666", ens_name: "newbie.eth",  total_xp: 800,    level: "Bronze",   total_volume_usd: 6100,    swap_count: 11,  referral_count: 0  },
  { rank: 17, wallet_address: "0x1111777711117777111177771111777711117777", ens_name: null,          total_xp: 550,    level: "Bronze",   total_volume_usd: 4300,    swap_count: 8,   referral_count: 0  },
  { rank: 18, wallet_address: "0x2222888822228888222288882222888822228888", ens_name: null,          total_xp: 350,    level: "Bronze",   total_volume_usd: 2800,    swap_count: 5,   referral_count: 0  },
  { rank: 19, wallet_address: "0x3333999933339999333399993333999933339999", ens_name: null,          total_xp: 200,    level: "Bronze",   total_volume_usd: 1500,    swap_count: 3,   referral_count: 0  },
  { rank: 20, wallet_address: "0x4444aaaa4444aaaa4444aaaa4444aaaa4444aaaa", ens_name: null,          total_xp: 100,    level: "Bronze",   total_volume_usd: 700,     swap_count: 1,   referral_count: 0  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "all";
  const sortBy = searchParams.get("sortBy") || "xp";
  const wallet = searchParams.get("wallet");

  let data = [...MOCK_LEADERBOARD];

  // Sort
  if (sortBy === "volume") {
    data.sort((a, b) => b.total_volume_usd - a.total_volume_usd);
  } else if (sortBy === "swaps") {
    data.sort((a, b) => b.swap_count - a.swap_count);
  } else {
    data.sort((a, b) => b.total_xp - a.total_xp);
  }

  // Re-rank
  data = data.map((d, i) => ({ ...d, rank: i + 1 }));

  // User position
  let userEntry = null;
  if (wallet) {
    userEntry = data.find(
      (d) => d.wallet_address.toLowerCase() === wallet.toLowerCase()
    );
    if (!userEntry) {
      userEntry = {
        rank: data.length + 1,
        wallet_address: wallet,
        ens_name: null,
        total_xp: 0,
        level: "Bronze",
        total_volume_usd: 0,
        swap_count: 0,
        referral_count: 0,
      };
    }
  }

  return NextResponse.json({
    leaderboard: data,
    userEntry,
    period,
    total: data.length,
  });
}
