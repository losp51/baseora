import { NextRequest, NextResponse } from "next/server";
import {
  getLevelFromXP,
  getXPToNextLevel,
  getLevelProgress,
} from "@/types/reward";
import { generateReferralCode } from "@/lib/points";

// Mock user store for demo — replace with Supabase
const MOCK_USERS: Record<string, {
  wallet_address: string;
  total_xp: number;
  streak_days: number;
  swap_count: number;
  total_volume_usd: number;
  referral_count: number;
}> = {};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Wallet required" }, { status: 400 });
  }

  const user = MOCK_USERS[wallet.toLowerCase()] || {
    wallet_address: wallet,
    total_xp: 0,
    streak_days: 0,
    swap_count: 0,
    total_volume_usd: 0,
    referral_count: 0,
  };

  const level = getLevelFromXP(user.total_xp);
  const xpToNext = getXPToNextLevel(user.total_xp, level);
  const progress = getLevelProgress(user.total_xp, level);

  return NextResponse.json({
    ...user,
    level,
    xp_to_next: xpToNext,
    level_progress: progress,
    referral_code: generateReferralCode(wallet),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { wallet, xp_amount, event_type } = body;

  if (!wallet || !xp_amount) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const key = wallet.toLowerCase();
  if (!MOCK_USERS[key]) {
    MOCK_USERS[key] = {
      wallet_address: wallet,
      total_xp: 0,
      streak_days: 0,
      swap_count: 0,
      total_volume_usd: 0,
      referral_count: 0,
    };
  }

  MOCK_USERS[key].total_xp += xp_amount;
  if (event_type === "swap") {
    MOCK_USERS[key].swap_count += 1;
  }

  const level = getLevelFromXP(MOCK_USERS[key].total_xp);

  return NextResponse.json({
    success: true,
    new_xp: MOCK_USERS[key].total_xp,
    new_level: level,
    xp_earned: xp_amount,
  });
}
