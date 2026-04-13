-- ============================================================================
-- AgentPay Database Schema - Consolidated
-- Supabase PostgreSQL
-- Updated: 2026-04-12
-- ============================================================================

-- ============================================================================
-- AGENTS TABLE - Stores AI agent information
-- ============================================================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ownerAddress" TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE',
    
    -- Agent configuration for buyers
    apiEndpoint TEXT,
    apiKey TEXT,
    webhookUrl TEXT,
    documentationUrl TEXT,
    
    -- Capabilities and pricing
    capabilities TEXT[],
    pricingModel TEXT DEFAULT 'PER_CALL',
    "pricePerCall" DECIMAL(15,7),
    "pricePerMonth" DECIMAL(15,7),
    
    -- Additional info
    logoUrl TEXT,
    websiteUrl TEXT,
    supportEmail TEXT,
    termsOfServiceUrl TEXT,
    
    -- Ratings (computed from reviews)
    rating DECIMAL(3,2) DEFAULT 0,
    ratingCount INTEGER DEFAULT 0,
    
    -- Timestamps
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SERVICES TABLE - Stores services offered by agents
-- ============================================================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "agentId" UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    "serviceType" TEXT DEFAULT 'CUSTOM',
    "pricePerCall" DECIMAL(15,7) NOT NULL,
    currency TEXT DEFAULT 'XLM',
    "isActive" BOOLEAN DEFAULT true,
    "totalCalls" INTEGER DEFAULT 0,
    
    -- Service-specific configuration
    endpoint TEXT,
    method TEXT DEFAULT 'POST',
    rateLimit INTEGER,
    timeout INTEGER,
    retryPolicy TEXT,
    
    -- Response info
    responseFormat TEXT,
    schema TEXT,
    
    -- Usage documentation
    usageExamples TEXT[],
    
    -- Timestamps
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PAYMENTS TABLE - Stores payment/escrow transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "serviceId" UUID NOT NULL,
    "buyerAddress" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    amount DECIMAL(15,7) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    "transactionHash" TEXT,
    "escrowId" TEXT,
    "refundReason" TEXT,
    "refund_reason" TEXT,
    
    -- Dispute tracking columns
    "disputeOpenedAt" TIMESTAMP WITH TIME ZONE,
    "disputeReason" TEXT,
    
    -- Timestamps
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TRANSACTIONS TABLE - Stores Stellar blockchain transactions
-- ============================================================================
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

-- ============================================================================
-- REVIEWS TABLE - Stores agent ratings and reviews from buyers
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "agentId" UUID NOT NULL,
    "buyerAddress" TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Timestamps
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One review per buyer per agent
    UNIQUE("agentId", "buyerAddress")
);

-- ============================================================================
-- NOTIFICATIONS TABLE - Stores user notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userAddress" VARCHAR(256) NOT NULL,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(256) NOT NULL,
    message TEXT NOT NULL,
    "paymentId" VARCHAR(256),
    "isRead" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY - Enable for all tables
-- ============================================================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public access policies (for API access)
CREATE POLICY "Enable all access for agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for services" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- INDEXES - For better query performance
-- ============================================================================

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

-- Dispute-specific indexes
CREATE INDEX IF NOT EXISTS idx_payments_dispute_status ON payments(status) WHERE status = 'DISPUTED';
CREATE INDEX IF NOT EXISTS idx_payments_dispute_opened ON payments("disputeOpenedAt") WHERE "disputeOpenedAt" IS NOT NULL;

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_agent ON reviews("agentId");
CREATE INDEX IF NOT EXISTS idx_reviews_buyer ON reviews("buyerAddress");

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_userAddress ON notifications("userAddress");
CREATE INDEX IF NOT EXISTS idx_notifications_paymentId ON notifications("paymentId");
