-- Create AgentPay tables in Supabase
-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ownerAddress" TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE',
    -- Agent configuration for buyers
    apiEndpoint TEXT,  -- The base URL where the agent's API is hosted
    apiKey TEXT,  -- API key for authentication (encrypted)
    webhookUrl TEXT,  -- Webhook URL for notifications
    documentationUrl TEXT,  -- Link to documentation
    -- Capabilities and pricing
    capabilities TEXT[],  -- Array of capability tags e.g., ['text-generation', 'image-analysis']
    pricingModel TEXT DEFAULT 'PER_CALL',  -- PER_CALL, SUBSCRIPTION, ENTERPRISE
    pricePerCall DECIMAL(15,7),
    pricePerMonth DECIMAL(15,7),
    -- Additional info
    logoUrl TEXT,
    websiteUrl TEXT,
    supportEmail TEXT,
    termsOfServiceUrl TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "agentId" UUID REFERENCES agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    "serviceType" TEXT DEFAULT 'CUSTOM',
    "pricePerCall" DECIMAL(15,7) NOT NULL,
    currency TEXT DEFAULT 'USDC',
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
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "serviceId" UUID REFERENCES services(id) ON DELETE CASCADE,
    "buyerAddress" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    amount DECIMAL(15,7) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    "transactionHash" TEXT,
    "escrowId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    amount DECIMAL(15,7) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create public access policies (for API access)
CREATE POLICY "Enable all access for agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for services" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents("ownerAddress");
CREATE INDEX IF NOT EXISTS idx_services_agent ON services("agentId");
CREATE INDEX IF NOT EXISTS idx_services_active ON services("isActive");
CREATE INDEX IF NOT EXISTS idx_payments_service ON payments("serviceId");
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments("status");
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash);
