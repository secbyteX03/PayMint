// AgentPay Database Schema
// Supabase PostgreSQL
// Updated: 2026-04-09

// ============================================================================
// AGENTS TABLE - Stores AI agent information
// ============================================================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ownerAddress" TEXT NOT NULL,  -- Wallet address of the owner (allows multiple agents per wallet)
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE, SUSPENDED
    
    -- Agent configuration for buyers
    apiEndpoint TEXT,  -- The base URL where the agent's API is hosted
    apiKey TEXT,  -- API key for authentication (encrypted)
    webhookUrl TEXT,  -- Webhook URL for notifications
    documentationUrl TEXT,  -- Link to documentation
    
    -- Capabilities and pricing
    capabilities TEXT[],  -- Array of capability tags e.g., ['text-generation', 'image-analysis']
    pricingModel TEXT DEFAULT 'PER_CALL',  -- PER_CALL, SUBSCRIPTION, ENTERPRISE
    "pricePerCall" DECIMAL(15,7),
    "pricePerMonth" DECIMAL(15,7),
    
    -- Additional info
    logoUrl TEXT,
    websiteUrl TEXT,
    supportEmail TEXT,
    termsOfServiceUrl TEXT,
    
    -- Ratings
    rating DECIMAL(3,2) DEFAULT 0,
    ratingCount INTEGER DEFAULT 0,
    
    -- Timestamps
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// ============================================================================
// SERVICES TABLE - Stores services offered by agents
// ============================================================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "agentId" UUID NOT NULL,  -- Reference to agent (no FK constraint to avoid join issues)
    name TEXT NOT NULL,
    description TEXT,
    "serviceType" TEXT DEFAULT 'CUSTOM',  -- CUSTOM, PREMIUM, ENTERPRISE
    "pricePerCall" DECIMAL(15,7) NOT NULL,
    currency TEXT DEFAULT 'XLM',  -- XLM, USDC
    "isActive" BOOLEAN DEFAULT true,
    "totalCalls" INTEGER DEFAULT 0,
    
    -- Service-specific configuration
    endpoint TEXT,  -- Specific endpoint path for this service
    method TEXT DEFAULT 'POST',  -- HTTP method (GET, POST, etc.)
    rateLimit INTEGER,  -- Calls per minute limit
    timeout INTEGER,  -- Request timeout in seconds
    retryPolicy TEXT,  -- JSON string for retry configuration
    
    -- Response info
    responseFormat TEXT,  -- Expected response format (JSON, XML, etc.)
    schema TEXT,  -- JSON schema for request/response
    
    -- Usage documentation
    usageExamples TEXT[],  -- Array of usage examples
    
    -- Timestamps
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// ============================================================================
// PAYMENTS TABLE - Stores payment/escrow transactions
// ============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "serviceId" UUID NOT NULL,  -- Reference to service (no FK constraint to avoid join issues)
    "buyerAddress" TEXT NOT NULL,  -- Buyer wallet address
    "sellerAddress" TEXT NOT NULL,  -- Seller wallet address
    amount DECIMAL(15,7) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',  -- PENDING, ESCROW_CREATED, COMPLETED, FAILED
    "transactionHash" TEXT,  -- Stellar transaction hash
    "escrowId" TEXT,  -- Escrow ID if using escrow
    
    -- Timestamps
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// ============================================================================
// TRANSACTIONS TABLE - Stores Stellar blockchain transactions
// ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash TEXT UNIQUE NOT NULL,  -- Transaction hash
    type TEXT NOT NULL,  -- PAYMENT, ESCROW, RELEASE
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    amount DECIMAL(15,7) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',  -- PENDING, COMPLETED, FAILED
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// ============================================================================
// ROW LEVEL SECURITY - Enable for all tables
// ============================================================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

// Public access policies (for API access)
CREATE POLICY "Enable all access for agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for services" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

// ============================================================================
// INDEXES - For better query performance
// ============================================================================

-- Agents indexes
CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents("ownerAddress");
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_services_agent ON services("agentId");
CREATE INDEX IF NOT EXISTS idx_services_active ON services("isActive");

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_service ON payments("serviceId");
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments("status");
CREATE INDEX IF NOT EXISTS idx_payments_buyer ON payments("buyerAddress");
CREATE INDEX IF NOT EXISTS idx_payments_seller ON payments("sellerAddress");

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
