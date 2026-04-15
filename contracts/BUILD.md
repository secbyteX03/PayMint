# Build & Deploy Instructions

## Prerequisites

Install Rust 1.84+ and Stellar CLI:

```powershell
# Install Rust (ensure version 1.84+)
rustup update

# Add WASM target (wasm32v1-none is required for Soroban SDK v25+)
rustup target add wasm32v1-none

# Install Stellar CLI
cargo install stellar-cli
```

## Build

Navigate to the contracts directory and build:

```powershell
cd AgentPay/contracts/simple_escrow
cargo build --target wasm32v1-none --release
```

This creates:

- `target/wasm32v1-none/release/simple_escrow.wasm`

## Deploy to Testnet (PowerShell)

**Important: Run these commands in a SEPARATE PowerShell window** (not in VSCode terminal).

### Step 1: Create config folder (if not exists)

```powershell
mkdir "$env:USERPROFILE\.config\stellar\identity"
```

> If it says "already exists", that's fine!

### Step 2: Add your escrow key

```powershell
stellar keys add escrow --secret-key
```

When it asks for the secret key, paste your escrow wallet secret key (you need to create/fund this wallet first)

### Step 3: Deploy the contract

Navigate to your project and deploy:

```powershell
cd "C:\xampp-php81\htdocs\Stellar"

stellar contract deploy `
  --wasm "AgentPay/contracts/target/wasm32v1-none/release/simple_escrow.wasm" `
  --source escrow `
  --network testnet
```

### Step 4: Initialize with admin

Once deployed, you'll get a contract ID. Replace `YOUR_CONTRACT_ID` below:

```powershell
stellar contract invoke `
  --id YOUR_CONTRACT_ID `
  --source escrow `
  --network testnet `
  -- initialize `
  --admin YOUR_ADMIN_WALLET
```

## Deployed Contract

**Contract ID**: `YOUR_CONTRACT_ID` (deploy and configure in .env)

## Update Your API

Add to your `.env`:

```
ESCROW_CONTRACT_ID=YOUR_CONTRACT_ID
ESCROW_SECRET=YOUR_ESCROW_SECRET
STELLAR_NETWORK=testnet
```

## Testnet Faucet

Get test XLM at:
https://laboratory.stellar.org/#account-creator?network=testnet
