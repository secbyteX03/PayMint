# Deploy Escrow Contract Script
# This script helps deploy the Soroban escrow contract to testnet
# 
# IMPORTANT: Update the variables below with YOUR wallet addresses before running

# === CONFIGURATION - Replace with YOUR values ===
$ESCROW_SECRET = "YOUR_ESCROW_SECRET_KEY"      # Your escrow wallet secret key
$ADMIN_WALLET = "YOUR_ADMIN_WALLET_ADDRESS"   # Admin wallet address (can be same as escrow)
$BUYER_WALLET = "YOUR_BUYER_WALLET_ADDRESS"    # Test buyer wallet
$SELLER_WALLET = "YOUR_SELLER_WALLET_ADDRESS"  # Test seller wallet
# ==============================================

# Check if stellar-cli is installed
$stellarPath = "$env:USERPROFILE\.cargo\bin\stellar.exe"

Write-Host "Checking for stellar-cli..." -ForegroundColor Yellow

if (-not (Test-Path $stellarPath)) {
    Write-Host "stellar-cli not found yet. Please install it first:" -ForegroundColor Red
    Write-Host "cargo install stellar-cli" -ForegroundColor Cyan
    exit 1
}

Write-Host "stellar-cli found! Adding escrow key..." -ForegroundColor Green

# Add escrow wallet key (requires interactive input)
Write-Host "Adding escrow key..." -ForegroundColor Cyan
Write-Host "Run: stellar keys add escrow --secret-key" -ForegroundColor Yellow
Write-Host "Then paste your escrow wallet secret key when prompted" -ForegroundColor Yellow

# Try to deploy
Write-Host "`n=== Step 1: Deploy contract ===" -ForegroundColor Cyan
$contractId = stellar contract deploy --wasm target/wasm32v1-none/release/simple_escrow.wasm --source escrow --network testnet 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed. Make sure the escrow key is added first:" -ForegroundColor Red
    Write-Host "stellar keys add escrow --secret-key YOUR_SECRET_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "Contract deployed: $contractId" -ForegroundColor Green

# Initialize contract with admin
Write-Host "`n=== Step 2: Initialize with admin ===" -ForegroundColor Cyan
Write-Host "Run this command (replace YOUR_ADMIN_WALLET with your admin address):" -ForegroundColor Yellow
Write-Host "stellar contract invoke $contractId -- initialize --admin YOUR_ADMIN_WALLET" -ForegroundColor Cyan

# Note: The actual initialization requires the contract to have a constructor that accepts admin
# For this contract, the initialization is handled via the API

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Your Contract ID: $contractId" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Add this to your .env file:" -ForegroundColor White
Write-Host "   ESCROW_CONTRACT_ID=$contractId" -ForegroundColor Gray
Write-Host "   ESCROW_SECRET=YOUR_ESCROW_SECRET" -ForegroundColor Gray
Write-Host "2. Restart your API server" -ForegroundColor White

Write-Host "`n✅ Contract deployment complete!" -ForegroundColor Green
