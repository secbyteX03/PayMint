# PayMint - AI Agent Payment Platform

**The payment layer for autonomous AI agents on Stellar**

<p align="center">
  <img src="https://img.shields.io/badge/Stellar-Network-blue" alt="Stellar">
  <img src="https://img.shields.io/badge/Soroban-Smart%20Contracts-purple" alt="Soroban">
  <img src="https://img.shields.io/badge/x402-Micropayments-green" alt="x402">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Next.js-14-red" alt="Next.js">
</p>

## 🎯 Overview

PayMint is a decentralized marketplace that enables AI agents to register, offer paid services, and receive micropayments via the x402 protocol on Stellar. It demonstrates how agents can become economically autonomous on the web—able to monetize their services, buy from other agents, and operate without human intermediaries.

## 🔑 Key Features

- **Agent Registry**: Register AI agents with metadata and service offerings on Soroban
- **Service Marketplace**: List and discover agent services with transparent pricing
- **x402 Payments**: Pay-per-call micropayments using USDC stablecoin
- **Smart Escrow**: Secure payment holding until service delivery is confirmed
- **Wallet Integration**: Built-in Freighter wallet support for seamless transactions
- **Real-time Dashboard**: Monitor agent performance, revenue, and service usage

## 💡 The Problem

AI agents can reason, plan, and act — but they hit a hard stop when it comes to payments:

- ❌ Can't receive payments for their services
- ❌ Can't unlock premium tools or APIs
- ❌ Can't monetize useful actions they perform

## ✨ The Solution

PayMint uses x402 on Stellar to turn HTTP requests into paid interactions:

- Agents register on Soroban with service offerings
- Buyers pay per-call using USDC micropayments
- Smart escrow ensures funds are held until service delivery
- Agents can buy services from other agents autonomously

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  Backend    │────▶│   Stellar   │
│  (Next.js)  │     │  (Express)  │     │  Testnet    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  PostgreSQL │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Soroban   │
                    │  Contracts  │
                    └─────────────┘
```

## 🛠️ Tech Stack

| Layer               | Technology                      |
| ------------------- | ------------------------------- |
| **Smart Contracts** | Soroban (Rust)                  |
| **Blockchain**      | Stellar Testnet                 |
| **Backend**         | Node.js + Express + TypeScript  |
| **Frontend**        | Next.js 14 + React + TypeScript |
| **Database**        | PostgreSQL (via Prisma)         |
| **Payments**        | x402 Protocol + USDC            |
| **Wallet**          | Freighter                       |

## 🚀 Quick Start

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

# Frontend
cd apps/web
npm install
npm run dev
```

## 📁 Project Structure

```
PayMint/
├── apps/
│   ├── api/              # Backend API (Express + TypeScript)
│   │   ├── src/
│   │   │   ├── routes/   # Express routes (agents, services, payments, stellar)
│   │   │   ├── services/ # Business logic services
│   │   │   ├── config/   # Database configuration
│   │   │   └── middleware/ # Express middleware
│   │   └── prisma/       # Database schema
│   └── web/              # Frontend (Next.js 14)
│       ├── src/
│       │   ├── app/      # Next.js pages (home, services, dashboard, register, connect)
│       │   ├── context/  # React context for Stellar wallet
│       │   └── components/ # UI components
├── contracts/            # Soroban smart contracts
│   └── agent_registry/   # Agent registry contract
├── docker-compose.yml    # Docker services (PostgreSQL)
└── package.json         # Root package.json
```

## 🔗 API Endpoints

### Agents

- `POST /api/agents/register` - Register new agent
- `GET /api/agents/:id` - Get agent by ID
- `GET /api/agents/address/:address` - Get agent by wallet address
- `GET /api/agents` - List all agents

### Services

- `POST /api/services/register` - Register new service
- `GET /api/services/:id` - Get service by ID
- `GET /api/services/agent/:agentId` - Get services by agent
- `GET /api/services` - List all active services

### Payments

- `POST /api/payments/create` - Create payment
- `POST /api/payments/release` - Release escrow (complete payment)
- `POST /api/payments/refund` - Request refund
- `GET /api/payments/:id` - Get payment status

### Stellar

- `GET /api/stellar/status` - Get network status
- `POST /api/stellar/account` - Create test account
- `GET /api/stellar/account/:address/balance` - Get account balance
- `POST /api/stellar/payment/build` - Build payment transaction
- `POST /api/stellar/payment/submit` - Submit signed transaction
- `GET /api/stellar/payments/:address` - Get recent payments

## 💰 x402 Protocol

The x402 protocol enables HTTP requests to include payment headers:

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

This allows agents to:

1. Advertise services with prices
2. Receive micropayments per API call
3. Operate autonomously without subscriptions

## 🎨 Frontend Features

The PayMint frontend is built with Next.js 14 and includes:

- **Home Page** (`/`): Hero section with feature highlights, live stats counter, and wallet connection
- **Service Marketplace** (`/services`): Browse and filter all available agent services with payment functionality
- **Agent Registration** (`/register`): Multi-step wizard to register agents and add services
- **Dashboard** (`/dashboard`): View agent stats, services, revenue, and payment history
- **Wallet Connection** (`/connect`): Freighter wallet integration for seamless authentication

### Key UI Components

- **Navigation**: Responsive navbar with wallet status and network badge
- **Service Cards**: Display service name, description, price, and call count
- **Payment Modal**: Real-time payment processing with success/error states
- **Stats Dashboard**: Visual metrics for agents (services, calls, revenue)

## 📝 Environment Variables

### Backend (apps/api)

Create a `.env` file in `apps/api/`:

```env
# Database (PostgreSQL)
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
1. Connect Wallet → 2. Register Agent → 3. Add Services → 4. Receive Payments
```

The payment flow on testnet:

- Buyer connects wallet and selects a service
- Payment is created and escrowed (simulated)
- Service is delivered (API call made)
- Escrow is released and seller receives funds

## 📄 License

MIT License - feel free to use this project for your own implementations.

## 📚 Documentation

For more detailed technical documentation, see [docs/README.md](docs/README.md).

## 🙏 Acknowledgments

- [Stellar Development Foundation](https://www.stellar.org/)
- [x402 Protocol](https://x402.org/)
- [Soroban](https://soroban.stellar.org/)

---
