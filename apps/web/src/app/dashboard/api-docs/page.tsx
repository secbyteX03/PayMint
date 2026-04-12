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
    description: 'Get agent usage statistics',
    example: 'GET /api/agents/agent-uuid/stats'
  },
  {
    method: 'PUT',
    path: '/api/agents/:id',
    description: 'Update agent details',
    example: 'PUT /api/agents/agent-uuid',
    body: {
      name: 'DataAnalyzer-X-Pro',
      description: 'Updated description',
      pricePerCall: 0.75
    }
  },
  {
    method: 'PATCH',
    path: '/api/agents/:id/status',
    description: 'Update agent status (active/inactive)',
    example: 'PATCH /api/agents/agent-uuid/status',
    body: {
      status: 'active'
    }
  },
  {
    method: 'DELETE',
    path: '/api/agents/:id',
    description: 'Remove agent from marketplace',
    example: 'DELETE /api/agents/agent-uuid'
  },
  // Service endpoints
  {
    method: 'GET',
    path: '/api/services',
    description: 'List marketplace services',
    example: 'GET /api/services'
  },
  {
    method: 'GET',
    path: '/api/services/search',
    description: 'Search services by query',
    example: 'GET /api/services/search?q=analysis'
  },
  {
    method: 'POST',
    path: '/api/services/create',
    description: 'Create a new service listing',
    example: 'POST /api/services/create',
    body: {
      agentId: 'agent-uuid',
      name: 'Premium Analysis',
      description: 'Advanced data analysis',
      price: 100,
      payload: { 'x-price': '100' }
    }
  },
  {
    method: 'PATCH',
    path: '/api/services/:id/status',
    description: 'Update service status (active/inactive)',
    example: 'PATCH /api/services/service-uuid/status',
    body: {
      status: 'active'
    }
  },
  // Payment endpoints
  {
    method: 'POST',
    path: '/api/payments/create',
    description: 'Create payment intent',
    example: 'POST /api/payments/create',
    body: {
      serviceId: 'service-uuid',
      amount: 50,
      buyerAddress: 'GABCD...123'
    }
  },
  {
    method: 'GET',
    path: '/api/payments/:id',
    description: 'Get payment details',
    example: 'GET /api/payments/payment-uuid'
  },
  {
    method: 'GET',
    path: '/api/payments/address/:address',
    description: 'Get payments for wallet',
    example: 'GET /api/payments/address/GABCD...123'
  },
  {
    method: 'POST',
    path: '/api/payments/:id/complete',
    description: 'Mark payment as complete',
    example: 'POST /api/payments/payment-uuid/complete'
  },
  // Webhook endpoints
  {
    method: 'POST',
    path: '/api/webhooks/register',
    description: 'Register webhook URL',
    example: 'POST /api/webhooks/register',
    body: {
      url: 'https://your-app.com/webhook',
      events: ['payment.completed', 'payment.failed']
    }
  },
  {
    method: 'GET',
    path: '/api/webhooks',
    description: 'List registered webhooks',
    example: 'GET /api/webhooks'
  },
  {
    method: 'DELETE',
    path: '/api/webhooks/:id',
    description: 'Remove webhook registration',
    example: 'DELETE /api/webhooks/webhook-uuid'
  },
  // Notification endpoints
  {
    method: 'GET',
    path: '/api/notifications/address/:address',
    description: 'Get notifications for wallet address',
    example: 'GET /api/notifications/address/GABCD...123'
  },
  {
    method: 'PATCH',
    path: '/api/notifications/:id/read',
    description: 'Mark notification as read',
    example: 'PATCH /api/notifications/notification-uuid/read'
  }
];

const METHOD_COLORS: Record<string, string> = {
  GET: '#10b981',
  POST: '#3b82f6',
  PUT: '#f59e0b',
  DELETE: '#ef4444',
  PATCH: '#8b5cf6'
};

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const filteredEndpoints = ENDPOINTS.filter(ep => {
    const matchesTab = activeTab === 'all' || ep.method === activeTab;
    const matchesSearch = ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEndpoint(text);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const methods = ['all', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  return (
    <>
      <style jsx>{`
        .docs-container {
          max-width: 1000px;
        }

        .docs-header {
          margin-bottom: 32px;
        }

        .docs-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }

        .docs-subtitle {
          font-size: 14px;
          color: var(--muted);
          font-family: var(--mono);
        }

        .search-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .search-input {
          flex: 1;
          padding: 12px 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
          font-family: var(--display);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .search-input::placeholder {
          color: var(--muted);
        }

        .method-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .method-tab {
          padding: 8px 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .method-tab:hover {
          border-color: var(--border2);
          color: var(--text);
        }

        .method-tab.active {
          border-color: var(--accent);
          color: var(--accent);
        }

        .endpoints-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .endpoint-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .endpoint-card:hover {
          border-color: var(--border2);
        }

        .endpoint-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          cursor: pointer;
        }

        .method-badge {
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          min-width: 60px;
          text-align: center;
        }

        .endpoint-path {
          font-family: var(--mono);
          font-size: 14px;
          color: var(--text);
          flex: 1;
        }

        .endpoint-desc {
          font-size: 13px;
          color: var(--muted);
        }

        .copy-btn {
          padding: 6px 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--muted);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .copy-btn:hover {
          border-color: var(--border2);
          color: var(--text);
        }

        .copy-btn.copied {
          border-color: var(--accent);
          color: var(--accent);
        }

        .endpoint-body {
          padding: 0 20px 20px;
        }

        .code-block {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 16px;
          overflow-x: auto;
        }

        .code-label {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .code-content {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text);
          white-space: pre;
        }

        .json-key {
          color: var(--accent-purple-light);
        }

        .json-string {
          color: var(--accent3);
        }

        .json-number {
          color: var(--accent);
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: var(--muted);
        }
      `}</style>

      <div className="docs-container">
        <div className="docs-header">
          <h1 className="docs-title">API Documentation</h1>
          <p className="docs-subtitle">Base URL: {API_BASE}</p>
        </div>

        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="method-tabs">
          {methods.map(method => (
            <button
              key={method}
              className={`method-tab ${activeTab === method ? 'active' : ''}`}
              onClick={() => setActiveTab(method)}
            >
              {method === 'all' ? 'All Methods' : method}
            </button>
          ))}
        </div>

        <div className="endpoints-list">
          {filteredEndpoints.length > 0 ? (
            filteredEndpoints.map((endpoint, index) => (
              <div key={index} className="endpoint-card">
                <div className="endpoint-header">
                  <span
                    className="method-badge"
                    style={{ background: METHOD_COLORS[endpoint.method] }}
                  >
                    {endpoint.method}
                  </span>
                  <span className="endpoint-path">{endpoint.path}</span>
                  <span className="endpoint-desc">{endpoint.description}</span>
                  {endpoint.example && (
                    <button
                      className={`copy-btn ${copiedEndpoint === endpoint.example ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(endpoint.example!)}
                    >
                      {copiedEndpoint === endpoint.example ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
                {endpoint.body && (
                  <div className="endpoint-body">
                    <div className="code-block">
                      <div className="code-label">REQUEST BODY</div>
                      <pre className="code-content">
                        {JSON.stringify(endpoint.body, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              No endpoints found matching your search.
            </div>
          )}
        </div>
      </div>
    </>
  );
}