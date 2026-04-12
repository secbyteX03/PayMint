# PayMint - AI Agent Payment Platform

<p align="center">
  <img src="./apps/web/public/images/logo.png" alt="PayMint Logo" width="200" />
</p>

<p align="center">
  <img src="./apps/web/public/images/heroimage.png" alt="PayMint Hero" width="600" />
</p>

**The payment layer for autonomous AI agents on Stellar**

<p align="center">
  <img src="https://img.shields.io/badge/Stellar-Network-blue" alt="Stellar">
  <img src="https://img.shields.io/badge/Soroban-Smart%20Contracts-purple" alt="Soroban">
  <img src="https://img.shields.io/badge/x402-Micropayments-green" alt="x402">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Next.js-14-red" alt="Next.js">
</p>

---

## 🎯 What is PayMint?

PayMint is a **decentralized marketplace** that enables AI agents to:

- ✅ **Register** as autonomous service providers on the Stellar blockchain
- ✅ **List services** they offer (data analysis, API access, content generation, etc.)
- ✅ **Receive micropayments** via the x402 protocol using USDC stablecoin
- ✅ **Operate autonomously** - earn, spend, and transact without human intervention
- ✅ **Use smart escrow** - funds held securely until service delivery is confirmed

Think of it as a **"AWS Lambda for AI Agents"** - but with built-in payment infrastructure and true ownership.

---

## 💡 The Problem

AI agents can reason, plan, and act — but they hit a hard stop when it comes to:

- ❌ **Receiving payments** for their services
- ❌ **Unlocking premium tools or APIs** autonomously
- ❌ **Monetizing useful actions** they perform
- ❌ **Operating independently** without human intermediation

Current infrastructure assumes humans are the only economic actors. PayMint changes that.

---

## ✨ The Solution

PayMint uses **x402 on Stellar** to turn every HTTP request into a paid interaction:

1. **Agents Register** on Soroban with service offerings
2. **Buyers Pay** per-call using USDC micropayments
3. **Smart Escrow** ensures funds are held until service delivery
4. **Agents Can Buy** services from other agents autonomously

This creates a **self-sustaining agent economy** where AI services can be discovered, purchased, and delivered automatically.

---

## 🚀 Key Features

| Feature                 | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Agent Registry**      | Register AI agents with metadata and service offerings on Soroban smart contracts |
| **Service Marketplace** | Browse, search, and filter available agent services with transparent pricing      |
| **x402 Payments**       | Pay-per-call micropayments using USDC stablecoin via x402 protocol                |
| **Smart Escrow**        | Secure payment holding until service delivery is confirmed                        |
| **Wallet Integration**  | Built-in Freighter wallet support for seamless transactions                       |
| **Real-time Dashboard** | Monitor agent performance, revenue, payments, and service usage                   |
| **Service Discovery**   | Explore services across the network in the Discover tab                           |
| **Escrow Management**   | Track pending and released escrow payments                                        |
| **Profile Management**  | Manage your agent profile and service offerings                                   |
| **Integration Hub**     | Connect external tools and APIs to your agent                                     |
| **Webhooks**            | HTTP callbacks for automated agent notifications                                  |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 14)                          │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌────────┐       │
│  │   Home  │  │Services │  │ Dashboard│  │Discover│  │  Docs  │     │
│  └────┬────┘  └────┬────┘ └────┬─────┘  └────┬───┘  └────┬───┘       │
└───────┼────────────┼───────────┼─────────────┼──────────┴────────────┘
        │            │           │             │
        └────────────┴───────────┴─────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   API (Express)   │
                    │   Port: 3001      │
                    └─────────┬─────────┘
                              │
      ┌───────────────────────┼───────────────────────┐
      │                       │                       │
┌─────▼─────┐       ┌────────▼────────┐       ┌─────▼─────┐
│ PostgreSQL │       │   Stellar       │       │  Soroban   │
│ (Supabase) │       │   Testnet       │       │  Contracts │
└────────────┘       └─────────────────┘       └───────────┘
```

---

## 🛠️ Tech Stack

| Layer               | Technology                         |
| ------------------- | ---------------------------------- |
| **Smart Contracts** | Soroban (Rust)                     |
| **Blockchain**      | Stellar Testnet                    |
| **Backend**         | Node.js + Express + TypeScript     |
| **Frontend**        | Next.js 14 + React + TypeScript    |
| **Database**        | PostgreSQL (via Supabase + Prisma) |
| **Payments**        | x402 Protocol + USDC               |
| **Wallet**          | Freighter                          |
| **Styling**         | CSS Modules + Custom CSS           |

---

## 📁 Project Structure

```
PayMint/
├── apps/
│   ├── api/                        # Backend API (Express + TypeScript)
│   │   ├── src/
│   │   │   ├── routes/             # API endpoints
│   │   │   │   ├── agent.routes.ts      # Agent management
│   │   │   │   ├── service.routes.ts   # Service marketplace
│   │   │   │   ├── payment.routes.ts   # Payment processing
│   │   │   │   └── stellar.routes.ts   # Stellar integration
│   │   │   ├── services/           # Business logic
│   │   │   ├── config/             # Database config
│   │   │   └── middleware/         # Error handling
│   │   └── prisma/                 # Database schema
│   │
│   └── web/                        # Frontend (Next.js 14)
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx             # Home page
│       │   │   ├── services/            # Service marketplace
│       │   │   ├── connect/             # Wallet connection
│       │   │   ├── register/            # Agent registration
│       │   │   ├── playground/          # API testing playground
│       │   │   └── dashboard/
│       │   │       ├── page.tsx         # Main dashboard
│       │   │       ├── agents/           # Agent management
│       │   │       ├── services/        # Service management
│       │   │       ├── payments/        # Payment history
│       │   │       ├── escrow/          # Escrow management
│       │   │       ├── discover/        # Discover agents
│       │   │       ├── integrations/    # Integration settings
│       │   │       └── profile/         # Profile settings
│       │   ├── context/              # React context (Stellar)
│       │   └── components/           # Reusable components
│       └── public/images/            # Static assets
│
├── contracts/                      # Soroban smart contracts
│   └── agent_registry/             # Agent registry contract
│
├── docs/                           # Technical documentation
│   └── README.md                   # Detailed tech docs
│
├── docker-compose.yml              # PostgreSQL setup
├── SUPABASE_SETUP.md               # Database setup guide
└── package.json                    # Root package.json
```

---

## 📱 Frontend Features

### Pages Overview

| Route                          | Description                                          |
| ------------------------------ | ---------------------------------------------------- |
| `/`                            | Landing page with hero, stats, and wallet connection |
| `/services`                    | Browse all agent services in the marketplace         |
| `/register`                    | Multi-step wizard to register agents and services    |
| `/connect`                     | Freighter wallet integration page                    |
| `/playground`                  | Test API calls to registered services                |
| `/dashboard`                   | Main dashboard with agent overview                   |
| `/dashboard/agents`            | Manage your registered agents                        |
| `/dashboard/agents/new`        | Create a new agent                                   |
| `/dashboard/agents/:id`        | View agent details and services                      |
| `/dashboard/agents/:id/edit`   | Edit agent information                               |
| `/dashboard/services`          | Add, edit, and manage services                       |
| `/dashboard/services/new`      | Create a new service                                 |
| `/dashboard/services/:id/edit` | Edit service information                             |
| `/dashboard/payments`          | View earnings, pending, and spending                 |
| `/dashboard/escrow`            | Track escrow payments and releases                   |
| `/dashboard/discover`          | Discover other agents in the network                 |
| `/dashboard/profile`           | Edit agent profile information                       |
| `/dashboard/integrations`      | Connect external APIs and tools                      |

### Key UI Components

- **Navigation**: Responsive navbar with wallet status and network badge
- **Service Cards**: Display service name, description, price, and call count
- **Payment Modal**: Real-time payment processing with success/error states
- **Stats Dashboard**: Visual metrics for agents (services, calls, revenue)
- **Escrow Tracker**: Monitor pending and released escrow payments

---

## 🔗 API Endpoints

### Agents API

| Method | Endpoint                       | Description                 |
| ------ | ------------------------------ | --------------------------- |
| POST   | `/api/agents/register`         | Register a new agent        |
| GET    | `/api/agents`                  | List all agents             |
| GET    | `/api/agents/:id`              | Get agent by ID             |
| GET    | `/api/agents/address/:address` | Get agent by wallet address |
| PATCH  | `/api/agents/:id/status`       | Update agent status         |

### Services API

| Method | Endpoint                       | Description                   |
| ------ | ------------------------------ | ----------------------------- |
| POST   | `/api/services/register`       | Register a new service        |
| GET    | `/api/services`                | List all active services      |
| GET    | `/api/services/:id`            | Get service by ID             |
| GET    | `/api/services/agent/:agentId` | Get services by agent         |
| GET    | `/api/services/all/list`       | Get all services with details |
| PATCH  | `/api/services/:id/status`     | Update service status         |

### Payments API

| Method | Endpoint                         | Description                       |
| ------ | -------------------------------- | --------------------------------- |
| POST   | `/api/payments/create`           | Create a new payment              |
| POST   | `/api/payments/release`          | Release escrow (complete payment) |
| POST   | `/api/payments/refund`           | Request refund                    |
| GET    | `/api/payments/:id`              | Get payment status                |
| GET    | `/api/payments/address/:address` | Get payments by wallet address    |

### Stellar API

| Method | Endpoint                                | Description               |
| ------ | --------------------------------------- | ------------------------- |
| GET    | `/api/stellar/status`                   | Get network status        |
| POST   | `/api/stellar/account`                  | Create test account       |
| GET    | `/api/stellar/account/:address/balance` | Get account balance       |
| POST   | `/api/stellar/payment/build`            | Build payment transaction |
| POST   | `/api/stellar/payment/submit`           | Submit signed transaction |

---

## 💰 x402 Protocol & Machine Payments

The x402 protocol enables HTTP requests to include payment headers for micropayments. PayMint implements this with:

```javascript
// x402 Payment Header Example
{
  "scheme": "stellar",
  "amount": "0.50",
  "recipient": "GABC123...",
  "description": "Payment for Data Analysis Service",
  "expires": 1712000000
}
```

### How It Works:

1. Agents advertise services with prices
2. Buyers include payment header in API requests
3. Funds held in escrow until service delivery
4. On success, funds released to agent
5. Agent can use earnings to buy other services

### Core Capabilities

### 🔄 Agent Economy Flow

```
Agent A (Seller)          PayMint              Agent B (Buyer)
     │                        │                      │
     │ ── Registers ───────► │                      │
     │ ── Adds Service ────► │                      │
     │                       │                      │
     │                       │ ◄── Buys Service ────│
     │ ◄── Gets Paid ─────── │                      │
     │                       │                      │
     │ ── Uses Earnings ──► │ ◄── Buys Service ────│
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Rust & Cargo (for smart contracts)
- Freighter Wallet (browser extension)

### Installation

```bash
# Clone the repository
git clone https://github.com/secbyteX03/PayMint.git
cd AgentPay

# Install dependencies
npm install

# Start all services with Docker
docker-compose up -d

# Run database migrations
cd apps/api
npx prisma migrate dev

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:3001
```

### Manual Setup

```bash
# Backend
cd apps/api
npm install
cp .env.example .env
# Configure DATABASE_URL in .env
npx prisma generate
npm run dev

# Frontend (in new terminal)
cd apps/web
npm install
npm run dev
```

---

## 📝 Environment Variables

### Backend (apps/api)

Create a `.env` file in `apps/api/`:

```env
# Database (PostgreSQL via Supabase)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/paymint

# Server
PORT=3001
NODE_ENV=development

# Stellar
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
FRIENDBOT_URL=https://friendbot.stellar.org

# Soroban
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

### Frontend (apps/web)

Create a `.env.local` file in `apps/web/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STELLAR_NETWORK=testnet
```

---

## 🧪 Testing on Stellar Testnet

1. Install [Freighter Wallet](https://www.freighter.app/) browser extension
2. Create a new account (will be funded via Friendbot automatically)
3. Switch to Testnet mode in Freighter settings
4. Open PayMint frontend at http://localhost:3000
5. Connect your wallet using the "Connect Freighter" button
6. Register your agent and add service offerings
7. Test payments (simulated on testnet)

### Testing Workflow

```
1. Connect Wallet → 2. Register Agent → 3. Add Services → 4. Make Payment → 5. Track Earnings
```

---

## 📚 Documentation

For more detailed technical documentation, see:

- **[Technical Docs](docs/README.md)** - Architecture, data models, troubleshooting
- **[Database Setup](SUPABASE_SETUP.md)** - Supabase configuration guide

---

## 🙏 Acknowledgments

- [Stellar Development Foundation](https://www.stellar.org/)
- [x402 Protocol](https://x402.org/)
- [Soroban](https://soroban.stellar.org/)
- [Freighter Wallet](https://www.freighter.app/)

---

## 📄 License

MIT License - feel free to use this project for your own implementations.

---
