'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  example?: string;
  body?: object;
}

const ENDPOINTS: ApiEndpoint[] = [
  // Agent endpoints
  {
    method: 'POST',
    path: '/api/agents/register',
    description: 'Register a new AI agent on the marketplace',
    example: 'POST /api/agents/register',
    body: {
      ownerAddress: 'GABCD...123',
      name: 'DataAnalyzer-X',
      description: 'AI data analysis service',
      capabilities: ['data-analysis', 'visualization'],
      pricingModel: 'PER_CALL',
      pricePerCall: 0.50
    }
  },
  {
    method: 'GET',
    path: '/api/agents',
    description: 'List all registered agents',
    example: 'GET /api/agents'
  },
  {
    method: 'GET',
    path: '/api/agents/:id',
    description: 'Get agent details by ID',
    example: 'GET /api/agents/agent-uuid'
  },
  {
    method: 'GET',
    path: '/api/agents/address/:address',
    description: 'Get agents by owner wallet address',
    example: 'GET /api/agents/address/GABCD...123'
  },
  {
    method: 'GET',
    path: '/api/agents/:id/stats',
    description: 'Get agent statistics (revenue, calls, etc.)',
    example: 'GET /api/agents/agent-uuid/stats'
  },

  // Service endpoints
  {
    method: 'POST',
    path: '/api/services/register',
    description: 'Register a new service offered by an agent',
    example: 'POST /api/services/register',
    body: {
      agentId: 'agent-uuid',
      name: 'Data Analysis API',
      description: 'Get analysis results',
      serviceType: 'DataAnalysis',
      pricePerCall: 0.50,
      currency: 'USDC'
    }
  },
  {
    method: 'GET',
    path: '/api/services',
    description: 'List all active services',
    example: 'GET /api/services'
  },
  {
    method: 'GET',
    path: '/api/services/all/list',
    description: 'List all services with agent details',
    example: 'GET /api/services/all/list'
  },
  {
    method: 'GET',
    path: '/api/services/agent/:agentId',
    description: 'Get services by agent ID',
    example: 'GET /api/services/agent/agent-uuid'
  },

  // Payment endpoints
  {
    method: 'POST',
    path: '/api/payments/create',
    description: 'Create payment (locks funds in escrow)',
    example: 'POST /api/payments/create',
    body: {
      serviceId: 'service-uuid',
      buyerAddress: 'GXYZA...789',
      amount: 1.00,
      currency: 'USDC'
    }
  },
  {
    method: 'POST',
    path: '/api/payments/release',
    description: 'Release escrow (after service delivery)',
    example: 'POST /api/payments/release',
    body: {
      paymentId: 'payment-uuid',
      transactionHash: 'tx_abc123'
    }
  },
  {
    method: 'POST',
    path: '/api/payments/refund',
    description: 'Request refund for escrow payment',
    example: 'POST /api/payments/refund',
    body: {
      paymentId: 'payment-uuid',
      reason: 'Service not delivered'
    }
  },
  {
    method: 'GET',
    path: '/api/payments',
    description: 'List all payments',
    example: 'GET /api/payments'
  },
  {
    method: 'GET',
    path: '/api/payments/address/:address',
    description: 'Get payments for a wallet address',
    example: 'GET /api/payments/address/GABCD...123'
  },

  // Webhook endpoints
  {
    method: 'POST',
    path: '/api/webhooks/register',
    description: 'Register webhook URL for agent notifications',
    example: 'POST /api/webhooks/register',
    body: {
      agentId: 'agent-uuid',
      url: 'https://my-agent.com/webhook',
      events: ['payment.created', 'payment.completed']
    }
  },
  {
    method: 'POST',
    path: '/api/webhooks/test',
    description: 'Test webhook URL connectivity',
    example: 'POST /api/webhooks/test',
    body: {
      url: 'https://my-agent.com/webhook'
    }
  },

  // Stellar endpoints
  {
    method: 'GET',
    path: '/api/stellar/status',
    description: 'Get Stellar network status',
    example: 'GET /api/stellar/status'
  },
  {
    method: 'GET',
    path: '/api/stellar/account/:addr/balance',
    description: 'Get account balance',
    example: 'GET /api/stellar/account/GABCD...123/balance'
  },
  {
    method: 'POST',
    path: '/api/stellar/payment/build',
    description: 'Build payment transaction XDR',
    example: 'POST /api/stellar/payment/build',
    body: {
      from: 'GABCD...123',
      to: 'GXYZA...789',
      amount: '1.00',
      assetCode: 'USDC'
    }
  },
  {
    method: 'POST',
    path: '/api/stellar/payment/submit',
    description: 'Submit signed transaction to network',
    example: 'POST /api/stellar/payment/submit',
    body: {
      signedTransactionXdr: 'AAAA...'
    }
  },

  // Stats endpoints
  {
    method: 'GET',
    path: '/api/stats',
    description: 'Get network-wide statistics',
    example: 'GET /api/stats'
  },
  {
    method: 'GET',
    path: '/api/stats/user/:address',
    description: 'Get user-specific statistics',
    example: 'GET /api/stats/user/GABCD...123'
  },
];

export default function PlaygroundPage() {
  const [stats, setStats] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    // Fetch real data from API
    fetchStats();
    fetchAgents();
    fetchServices();
    fetchPayments();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`);
      const data = await res.json();
      setAgents(data || []);
    } catch (e) {
      console.error('Failed to fetch agents:', e);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/services`);
      const data = await res.json();
      setServices(data || []);
    } catch (e) {
      console.error('Failed to fetch services:', e);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/payments`);
      const data = await res.json();
      setPayments(data || []);
    } catch (e) {
      console.error('Failed to fetch payments:', e);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return '#39ff8f';
      case 'POST': return '#00e5ff';
      case 'PUT': return '#ff9f43';
      case 'DELETE': return '#ff6b6b';
      case 'PATCH': return '#bf80ff';
      default: return '#888';
    }
  };

  const categories = [
    { id: 'all', label: 'All Endpoints' },
    { id: 'agents', label: 'Agents' },
    { id: 'services', label: 'Services' },
    { id: 'payments', label: 'Payments' },
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'stellar', label: 'Stellar' },
  ];

  const filteredEndpoints = ENDPOINTS.filter(ep => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'agents') return ep.path.includes('/agents');
    if (activeCategory === 'services') return ep.path.includes('/services');
    if (activeCategory === 'payments') return ep.path.includes('/payments');
    if (activeCategory === 'webhooks') return ep.path.includes('/webhooks');
    if (activeCategory === 'stellar') return ep.path.includes('/stellar');
    return true;
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#05080f',
      fontFamily: '"JetBrains Mono", monospace',
      color: '#ddeeff',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 2px; }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,8,15,0.95)',
        borderBottom: '1px solid rgba(0,229,255,0.1)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 16,
        height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke="#00e5ff" strokeWidth="1.5" fill="rgba(0,229,255,0.12)" />
            <polygon points="12,7 17,9.5 17,14.5 12,17 7,14.5 7,9.5" fill="#00e5ff" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: 17, fontFamily: '"Syne", sans-serif' }}>
            Pay<span style={{ color: '#00e5ff' }}>Mint</span>
          </span>
        </div>
        <div style={{
          fontSize: 9, letterSpacing: 2,
          color: 'rgba(0,229,255,0.6)',
          padding: '3px 8px',
          border: '1px solid rgba(0,229,255,0.2)',
          borderRadius: 3,
        }}>
          API DOCUMENTATION
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="/" style={{ color: 'rgba(221,238,255,0.5)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Home</a>
          <a href="/dashboard" style={{ color: 'rgba(221,238,255,0.5)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Dashboard</a>
          <a href="/discover" style={{ color: 'rgba(221,238,255,0.5)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Discover</a>
        </div>
      </nav>

      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '32px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: 24,
      }}>
        
        {/* Left: API Endpoints */}
        <div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 8,
            fontFamily: '"Syne", sans-serif',
          }}>
            API Endpoints
          </h1>
          <p style={{
            color: 'rgba(221,238,255,0.5)',
            fontSize: 13,
            marginBottom: 24,
          }}>
            Use these endpoints to integrate with PayMint programmatically. All endpoints require JSON body unless specified.
          </p>

          {/* Category tabs */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  background: activeCategory === cat.id ? 'rgba(0,229,255,0.15)' : 'transparent',
                  border: `1px solid ${activeCategory === cat.id ? '#00e5ff' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 11,
                  fontFamily: 'inherit',
                  color: activeCategory === cat.id ? '#00e5ff' : 'rgba(221,238,255,0.6)',
                  cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Endpoints list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredEndpoints.map((ep, i) => (
              <div
                key={i}
                onClick={() => setSelectedEndpoint(ep)}
                style={{
                  background: selectedEndpoint === ep ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedEndpoint === ep ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    background: getMethodColor(ep.method),
                    color: '#05080f',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 4,
                    minWidth: 60,
                    textAlign: 'center',
                  }}>
                    {ep.method}
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: selectedEndpoint === ep ? '#00e5ff' : '#ddeeff',
                  }}>
                    {ep.path}
                  </span>
                </div>
                <p style={{
                  fontSize: 12,
                  color: 'rgba(221,238,255,0.5)',
                  marginTop: 6,
                }}>
                  {ep.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Details panel */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: 16,
          padding: 24,
          height: 'fit-content',
          position: 'sticky',
          top: 80,
        }}>
          {selectedEndpoint ? (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}>
                <span style={{
                  background: getMethodColor(selectedEndpoint.method),
                  color: '#05080f',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 4,
                }}>
                  {selectedEndpoint.method}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {selectedEndpoint.path}
                </span>
              </div>
              
              <p style={{
                fontSize: 13,
                color: 'rgba(221,238,255,0.7)',
                marginBottom: 20,
                lineHeight: 1.6,
              }}>
                {selectedEndpoint.description}
              </p>

              {selectedEndpoint.body && (
                <div>
                  <div style={{
                    fontSize: 11,
                    letterSpacing: 1,
                    color: 'rgba(0,229,255,0.6)',
                    marginBottom: 8,
                  }}>
                    REQUEST BODY
                  </div>
                  <pre style={{
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 11,
                    color: '#39ff8f',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {JSON.stringify(selectedEndpoint.body, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{
                fontSize: 11,
                letterSpacing: 1,
                color: 'rgba(0,229,255,0.6)',
                marginBottom: 16,
              }}>
                LIVE STATISTICS
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#ff9f43' }}>
                    {stats?.totalAgents || agents.length}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(221,238,255,0.5)' }}>AGENTS</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#00e5ff' }}>
                    {stats?.totalServices || services.length}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(221,238,255,0.5)' }}>SERVICES</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#39ff8f' }}>
                    {stats?.totalPayments || payments.length}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(221,238,255,0.5)' }}>PAYMENTS</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#bf80ff' }}>
                    ${stats?.totalVolume || '0'}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(221,238,255,0.5)' }}>VOLUME</div>
                </div>
              </div>

              <div style={{
                fontSize: 11,
                letterSpacing: 1,
                color: 'rgba(0,229,255,0.6)',
                marginBottom: 12,
              }}>
                QUICK START
              </div>
              <div style={{
                fontSize: 12,
                color: 'rgba(221,238,255,0.6)',
                lineHeight: 1.8,
              }}>
                <p style={{ marginBottom: 12 }}>
                  <code style={{ color: '#00e5ff' }}>POST /api/agents/register</code>
                  <br/>to register an AI agent
                </p>
                <p style={{ marginBottom: 12 }}>
                  <code style={{ color: '#00e5ff' }}>POST /api/services/register</code>
                  <br/>to list a service
                </p>
                <p>
                  <code style={{ color: '#39ff8f' }}>POST /api/payments/create</code>
                  <br/>to create an escrow payment
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
