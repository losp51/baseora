# ⚡ Nexus — DEX Aggregator on Base

> Best swap prices across Uniswap V3, Aerodrome, SushiSwap and more on Base Mainnet.
> Powered by 0x Protocol v2 (Permit2) · AI Agent (Claude) · XP/NFT Rewards

![Base](https://img.shields.io/badge/Network-Base%20Mainnet-0052FF)
![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local .env.local.example
# Fill in .env.local with your API keys

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📋 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Project ID from cloud.walletconnect.com | ✅ |
| `ZEROX_API_KEY` | 0x Protocol API key from dashboard.0x.org | ✅ |
| `ANTHROPIC_API_KEY` | Claude API key from console.anthropic.com | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | For rewards/leaderboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | For rewards/leaderboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server only) | For writing data |
| `NFT_CONTRACT_ADDRESS` | Deployed SwapperNFT contract address | For NFT minting |
| `NFT_SIGNER_PRIVATE_KEY` | Backend signing key for NFT mint auth | For NFT minting |

---

## 🏗️ Project Structure

```
app/
├── swap/        → Main swap interface
├── agent/       → AI chat (Claude-powered)
├── leaderboard/ → Global rankings
├── rewards/     → XP system + NFT minting
├── profile/     → User stats & NFTs
├── stats/       → Protocol analytics
└── api/         → Server routes (quote, price, agent, leaderboard)

components/
├── swap/        → SwapCard, TokenSelector, RouteDisplay, SlippageSettings
├── agent/       → AgentChat
├── rewards/     → RewardCard, ProgressBar
├── leaderboard/ → LeaderboardTable, RankBadge
└── ui/          → ConnectButton, TokenLogo, NetworkBadge

contracts/
└── RewardNFT.sol → ERC-721 with on-chain SVG metadata
```

---

## 🔵 Tech Stack

- **Frontend:** Next.js 14 · TypeScript · Tailwind CSS · Framer Motion
- **Blockchain:** wagmi v2 · viem · RainbowKit · Base Mainnet (Chain ID: 8453)
- **Swap:** 0x Protocol API v2 (Permit2)
- **AI:** Vercel AI SDK · Claude claude-sonnet-4-5
- **Database:** Supabase (PostgreSQL)
- **NFT:** ERC-721 · on-chain SVG · ECDSA backend signing

---

## 📦 Deploying the NFT Contract

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash

# Deploy to Base Mainnet
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --verify \
  -e DEPLOYER_PRIVATE_KEY=<key> \
  -e NFT_SIGNER_ADDRESS=<signer>
```

---

## 🗄️ Database Setup

```bash
# Run Supabase migration
psql $SUPABASE_DB_URL < supabase/schema.sql
```

---

## 📍 Pages

| Route | Description |
|-------|-------------|
| `/swap` | Main swap interface |
| `/agent` | AI DeFi assistant |
| `/leaderboard` | Global XP rankings |
| `/rewards` | XP system, NFT minting, referrals |
| `/profile` | Wallet stats and NFT collection |
| `/stats` | Protocol analytics |

---

## 🔑 Key Features

- **Best price routing** across 10+ Base DEX sources via 0x Protocol
- **Permit2 approval** system — no infinite approvals
- **AI Agent** — ask about swap routes, gas, DeFi strategies (Claude)
- **XP reward system** — earn points for every swap
- **Level-based NFTs** — on-chain SVG, fully dynamic metadata
- **Referral program** — earn bonus XP for inviting traders
- **Leaderboard** — compete with other Base traders
- **MEV protection** — via 0x's private mempool option

---

Built on [Base](https://base.org) · Chain ID: 8453
