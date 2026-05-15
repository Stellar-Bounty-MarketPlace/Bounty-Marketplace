# Autonomous Bounty Marketplace

AI-powered decentralized bounty coordination for open-source ecosystems.

## Architecture

```
/
├── apps/
│   ├── web/          # Next.js 14 frontend (TypeScript, Tailwind, Framer Motion)
│   ├── api/          # NestJS backend (GraphQL + REST, WebSockets)
│   └── worker/       # BullMQ background job processor
├── packages/
│   ├── ui/           # Shared component library (shadcn-style, glassmorphism)
│   ├── contracts/    # Soroban smart contracts (Rust)
│   ├── sdk/          # Stellar/Soroban TypeScript SDK
│   ├── database/     # Prisma schema + migrations (PostgreSQL + pgvector)
│   ├── shared/       # Shared TypeScript types, utils, constants
│   └── config/       # ESLint + TypeScript configs
```

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Recharts, React Query, Zustand |
| Backend | NestJS, GraphQL (Apollo), REST, WebSockets (Socket.io) |
| Database | PostgreSQL 16 + pgvector, Prisma ORM |
| Cache/Queue | Redis, BullMQ |
| Blockchain | Stellar Soroban (Rust smart contracts) |
| AI | OpenAI GPT-4o, text-embedding-3-small, vector similarity search |
| DevOps | Turborepo, Docker, GitHub Actions, pnpm workspaces |

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Rust (for contracts)

### 1. Clone and install

```bash
git clone <repo>
cd autonomous-bounty-marketplace
pnpm install
```

### 2. Environment setup

```bash
cp .env.example .env
# Fill in your GitHub OAuth, OpenAI, and Stellar credentials
```

### 3. Start infrastructure

```bash
docker-compose up postgres redis -d
```

### 4. Database setup

```bash
pnpm db:generate
pnpm db:migrate
pnpm --filter @bounty/database db:seed
```

### 5. Start development

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/api/docs
- GraphQL: http://localhost:3001/graphql

## Smart Contracts

```bash
cd packages/contracts
cargo test                    # Run tests
cargo build --target wasm32-unknown-unknown --release  # Build
```

## Key Features

### AI Contributor Matching
- Semantic embeddings via OpenAI text-embedding-3-small
- pgvector cosine similarity search for fast ANN
- Multi-factor scoring: semantic similarity, reputation, language match, delivery speed
- Confidence scoring based on contributor history

### Smart Escrow (Soroban)
- Trustless escrow with milestone-based releases
- 2.5% platform fee (configurable)
- Dispute resolution with split payouts
- On-chain reputation storage

### PR Verification Engine
- GitHub API integration for PR state sync
- AI-powered spam detection
- Quality signal computation (commits, additions, file changes)
- Duplicate submission detection

### Reputation System
- Event-sourced reputation with weighted deltas
- 5 tiers: Newcomer → Contributor → Trusted → Expert → Elite
- On-chain storage via Soroban reputation contract
- Maintainer ratings, delivery timing bonuses/penalties

## Testing

```bash
pnpm test              # All tests
pnpm --filter @bounty/api test  # API unit tests
cargo test             # Contract tests (in packages/contracts)
```

## Deployment

See `.github/workflows/deploy.yml` for the full CI/CD pipeline.

- API: AWS ECS (Fargate)
- Web: Vercel
- Contracts: Stellar Testnet → Mainnet
