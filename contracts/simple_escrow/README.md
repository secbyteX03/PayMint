# Simple Escrow Smart Contract

A Soroban smart contract for AgentPay that holds escrow payments and allows admin-controlled release/refund.

## ⚠️ IMPORTANT: Build Requirements

**Soroban SDK v25+ requires Rust 1.84+ and `wasm32v1-none` target**

The older `wasm32-unknown-unknown` target is no longer supported due to incompatible features (reference-types, multi-value) in modern Rust.

## Contract Functions

| Function                               | Description                                            |
| -------------------------------------- | ------------------------------------------------------ |
| `initialize(admin)`                    | Set the admin address who can release/refund           |
| `create_escrow(buyer, seller, amount)` | Create new escrow, returns escrow_id                   |
| `release_to_seller(escrow_id)`         | Admin releases funds to seller                         |
| `refund_to_buyer(escrow_id)`           | Admin refunds funds to buyer                           |
| `get_escrow(escrow_id)`                | Get escrow details                                     |
| `get_escrow_status(escrow_id)`         | Get current status (0=Pending, 1=Released, 2=Refunded) |

## Build & Deploy

### Prerequisites

- Rust 1.84+ toolchain
- Stellar CLI: `cargo install stellar-cli`

### Install WASM Target

```bash
rustup target add wasm32v1-none
```

### Build

```bash
cd AgentPay/contracts/simple_escrow
cargo build --target wasm32v1-none --release
```

This creates:

- `target/wasm32v1-none/release/simple_escrow.wasm` (upload to network)
- `target/wasm32v1-none/release/simple_escrow.wasm.hash` (hash for verification)

### Deploy to Testnet

1. Ensure your account is funded on testnet

2. Deploy the contract:

   ```bash
   stellar contract deploy \
     --wasm target/wasm32v1-none/release/simple_escrow.wasm \
     --source YOUR_KEY_NAME \
     --network testnet
   ```

3. Initialize with admin address:

   ```bash
   stellar contract invoke \
     --id CONTRACT_ID \
     --source YOUR_KEY_NAME \
     --network testnet \
     -- initialize \
     --admin YOUR_ADMIN_PUBLIC_KEY
   ```

4. Note the contract ID - this goes into your API config

## API Integration

After deployment, add to your `.env` file:

```env
# .env
ESCROW_CONTRACT_ID=your_contract_id
ESCROW_SECRET=your_escrow_secret_key
STELLAR_NETWORK=testnet
```

> ⚠️ **Security Note**: Never commit secrets to version control. The `.gitignore` file protects `.env` files.

## Deployed Contract Details

| Item        | Value                                               |
| ----------- | --------------------------------------------------- |
| Contract ID | `YOUR_CONTRACT_ID` (deploy your own - see BUILD.md) |
| Network     | Testnet                                             |

The API will call `release_to_seller` or `refund_to_buyer` based on dispute resolution.
