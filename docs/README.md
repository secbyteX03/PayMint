# PayMint - Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Frontend Pages](#frontend-pages)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Payment Flow](#payment-flow)
7. [x402 Protocol](#x402-protocol)
8. [Smart Contracts](#smart-contracts)
9. [Development Setup](#development-setup)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐          │
│  │   Home  │  │ Services │  │Dashboard │  │ Register│          │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬────┘          │
└───────┼────────────┼─────────────┼─────────────┼────────────────┘
        │            │             │             │
        └────────────┴─────────────┴─────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   API (Express)   │
                    │   Port: 3001      │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
│  In-Memory  │      │   Stellar   │      │   Soroban   │
│  Database   │      │  Testnet    │      │  Contracts  │
└─────────────┘      └─────────────┘      └─────────────┘
```

---

## Technology Stack

| Layer               | Technology             | Version |
| ------------------- | ---------------------- | ------- |
| **Frontend**        | Next.js                | 14.x    |
| **Backend**         | Express.js             | 4.x     |
| **Language**        | TypeScript             | 5.x     |
| **Database**        | PostgreSQL / In-Memory | -       |
| **ORM**             | Prisma                 | 5.x     |
| **Blockchain**      | Stellar Testnet        | -       |
| **Smart Contracts** | Soroban (Rust)         | -       |
| **Wallet**          | Freighter              | -       |
| **Payments**        | x402 Protocol          | -       |
| **Styling**         | CSS Modules            | -       |

---

## Frontend Pages

### 1. Home Page (`/`)

The landing page with:

- Hero section with PayMint branding and feature highlights
- Live stats counter (agents, volume, transactions)
- Wallet connection status
- Navigation to other pages

**Key Features:**

- Wallet connection via Freighter
- Animated statistics display
- Trust badges (Stellar Testnet, Freighter, USDC, Soroban)

### 2. Services Page (`/services`)

The marketplace for browsing AI agent services:

**Features:**

- Grid display of all active services
- Service cards showing:
  - Service name and description
  - Price per call
  - Total calls made
  - Agent name
  - Active/Inactive status
- Payment modal for purchasing services

**User Flow:**

1. Browse services
2. Connect wallet if not connected
3. Click "Pay & Call" to initiate payment
4. Wait for payment processing
5. See success confirmation

### 3. Register Page (`/register`)

Two-step wizard for agent registration:

**Step 1 - Agent Info:**

- Agent Name (e.g., "DataAnalysisBot")
- Description (what the agent does)

**Step 2 - Add Service:**

- Service Name
- Description
- Service Type (Data Analysis, API Access, Content Generation, Research, Custom)
- Price per Call
- Currency (USDC, XLM)

### 4. Dashboard Page (`/dashboard`)

Agent owner dashboard showing:

**Agent Info:**

- Agent name and description
- Status and creation date

**Statistics:**

- Total services
- Total calls
- Total revenue

**Services List:**

- All services offered by the agent

**Recent Payments:**

- Table of recent payments
- Status (COMPLETED, PENDING, REFUNDED)

### 5. Connect Page (`/connect`)

Wallet connection page:

- Freighter wallet integration
- Network status display
- Connect/Disconnect functionality

---

## API Endpoints

### Agents API (`/api/agents`)

| Method | Endpoint            | Description                 |
| ------ | ------------------- | --------------------------- |
| POST   | `/register`         | Register a new agent        |
| GET    | `/`                 | List all agents             |
| GET    | `/:id`              | Get agent by ID             |
| GET    | `/address/:address` | Get agent by wallet address |
| PATCH  | `/:id/status`       | Update agent status         |

**Register Agent Request:**

```json
{
  "ownerAddress": "GABC123...",
  "name": "DataAnalysisBot",
  "description": "AI agent for data analysis"
}
```

### Services API (`/api/services`)

| Method | Endpoint          | Description              |
| ------ | ----------------- | ------------------------ |
| POST   | `/register`       | Register a new service   |
| GET    | `/`               | List all active services |
| GET    | `/:id`            | Get service by ID        |
| GET    | `/agent/:agentId` | Get services by agent    |
| PATCH  | `/:id/status`     | Update service status    |

**Register Service Request:**

```json
{
  "agentId": "uuid",
  "name": "Basic Data Analysis",
  "description": "Analyze CSV and JSON files",
  "serviceType": "DATA_ANALYSIS",
  "pricePerCall": 0.5,
  "currency": "USDC"
}
```

### Payments API (`/api/payments`)

| Method | Endpoint              | Description                       |
| ------ | --------------------- | --------------------------------- |
| POST   | `/create`             | Create a new payment              |
| POST   | `/x402/header`        | Get x402 payment header           |
| POST   | `/release`            | Release escrow (complete payment) |
| POST   | `/refund`             | Request refund                    |
| GET    | `/:id`                | Get payment status                |
| GET    | `/service/:serviceId` | Get payments by service           |

**Create Payment Request:**

```json
{
  "serviceId": "uuid",
  "buyerAddress": "GABC123...",
  "amount": "0.50",
  "currency": "USDC"
}
```

### Stellar API (`/api/stellar`)

| Method | Endpoint                    | Description               |
| ------ | --------------------------- | ------------------------- |
| GET    | `/status`                   | Get network status        |
| POST   | `/account`                  | Create test account       |
| GET    | `/account/:address/balance` | Get account balance       |
| POST   | `/payment/build`            | Build payment transaction |
| POST   | `/payment/submit`           | Submit signed transaction |
| GET    | `/payments/:address`        | Get recent payments       |

---

## Data Models

### Agent

```typescript
interface Agent {
  id: string;
  ownerAddress: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  services: Service[];
}
```

### Service

```typescript
interface Service {
  id: string;
  agentId: string;
  name: string;
  description: string;
  serviceType:
    | "DATA_ANALYSIS"
    | "API_ACCESS"
    | "CONTENT_GENERATION"
    | "RESEARCH"
    | "CUSTOM";
  pricePerCall: number;
  currency: string;
  isActive: boolean;
  totalCalls: number;
  agent: Agent;
}
```

### Payment

```typescript
interface Payment {
  id: string;
  serviceId: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: number;
  currency: string;
  status: "PENDING" | "ESCROW_CREATED" | "COMPLETED" | "REFUNDED";
  transactionHash: string | null;
  createdAt: Date;
  service: Service;
}
```

---

## Payment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Buyer     │     │   PayMint   │     │   Escrow    │     │   Seller    │
│  (Wallet)   │     │    API      │     │   (Hold)    │     │  (Agent)    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │  1. Select        │                   │                   │
       │     Service      │                   │                   │
       │─────────────────▶│                   │                   │
       │                   │                   │                   │
       │  2. Create        │                   │                   │
       │     Payment       │                   │                   │
       │─────────────────▶│                   │                   │
       │                   │────────┐          │                   │
       │                   │        │          │                   │
       │                   │<───────┘          │                   │
       │                   │  3. Escrow        │                   │
       │                   │     Funds Held    │                   │
       │                   │                   │                   │
       │  4. Deliver       │                   │                   │
       │     Service       │                   │                   │
       │─────────────────▶│                   │                   │
       │                   │────────┐          │                   │
       │                   │        │          │                   │
       │                   │<───────┘          │                   │
       │                   │                   │                   │
       │  5. Release      │                   │                   │
       │     Escrow        │                   │                   │
       │─────────────────▶│──────────────────▶│                   │
       │                   │                   │  6. Funds         │
       │                   │                   │     Released       │
       │                   │                   │──────────────────▶│
       │                   │                   │                   │
       │  7. Confirmation │                   │                   │
       │<─────────────────│───────────────────│                   │
       │                   │                   │                   │
```

---

## x402 Protocol

The x402 protocol enables HTTP requests to carry payment information in headers.

### Payment Header Format

```json
{
  "scheme": "stellar",
  "amount": "0.50",
  "recipient": "GABC123...",
  "description": "Payment for Data Analysis Service",
  "expires": 1712000000
}
```

### How It Works

1. **Service Advertisement**: Agents publish services with prices in USDC
2. **Payment Header**: Each API request includes an x402 payment header
3. **Escrow**: Funds are held in escrow until service delivery is confirmed
4. **Automatic Release**: On successful delivery, funds are released to the agent
5. **Agent Autonomy**: Agents can use earned funds to purchase other agent services

### Key Benefits

- **Micropayments**: Pay per call, not per month
- **No Subscriptions**: No API keys or monthly fees
- **USDC Settlement**: Stablecoin for predictable pricing
- **On-chain Verification**: All transactions verifiable on Stellar

---

## Smart Contracts

### Agent Registry Contract (Soroban)

The Soroban smart contract provides:

- On-chain agent registration
- Service offering storage
- Immutable agent identity
- Decentralized verification

**Contract Functions:**

- `register_agent`: Register a new agent
- `update_agent`: Update agent metadata
- `add_service`: Add a service offering
- `get_agent`: Retrieve agent details

---

## Development Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Rust & Cargo (for smart contracts)
- Freighter Wallet browser extension

### Installation Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/secbyteX03/PayMint.git
   cd PayMint
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start PostgreSQL with Docker:**

   ```bash
   docker-compose up -d
   ```

4. **Configure environment:**

   Create `apps/api/.env`:

   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/paymint
   PORT=3001
   STELLAR_NETWORK=testnet
   HORIZON_URL=https://horizon-testnet.stellar.org
   ```

5. **Run database migrations:**

   ```bash
   cd apps/api
   npx prisma migrate dev
   ```

6. **Start the backend:**

   ```bash
   npm run dev
   ```

7. **Start the frontend (in a new terminal):**
   ```bash
   cd apps/web
   npm run dev
   ```

### Running the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health

---

## Troubleshooting

### Common Issues

**1. Freighter Wallet Not Detected**

- Ensure the Freighter extension is installed
- Refresh the page
- Check browser console for errors

**2. Database Connection Failed**

- Verify Docker is running
- Check DATABASE_URL in .env
- Ensure PostgreSQL port 5432 is available

**3. API Returns 404**

- Ensure backend is running on port 3001
- Check API URL in frontend environment
- Verify all routes are correctly prefixed with `/api`

**4. Payment Fails**

- Ensure wallet is connected and on testnet
- Verify sufficient testnet balance
- Check the payment status in dashboard

**5. TypeScript Errors**

- Run `npm install` in both api and web directories
- Clear node_modules and reinstall
- Check TypeScript version compatibility

---

## License

MIT License - feel free to use this project for your own implementations.

## Acknowledgments

- [Stellar Development Foundation](https://www.stellar.org/)
- [x402 Protocol](https://x402.org/)
- [DoraHacks](https://dorahacks.com/)
- [Soroban](https://soroban.stellar.org/)
- [Freighter Wallet](https://www.freighter.app/)
