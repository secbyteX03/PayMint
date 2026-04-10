'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Link,
  Plus,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Key,
  Webhook,
  Settings,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function IntegrationsPage() {
  const router = useRouter();
  const { publicKey, isConnected } = useStellar();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Integration form state
  const [integrationData, setIntegrationData] = useState({
    type: 'API_KEY',
    name: '',
    endpoint: '',
    apiKey: '',
    webhookUrl: '',
    isActive: true,
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      if (isConnected && publicKey) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/address/${publicKey}`);
        if (res.ok) {
          const agentsData = await res.json();
          // API returns array of agents
          const agentsList = Array.isArray(agentsData) ? agentsData : [agentsData];
          setAgents(agentsList);
        }
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getAgentEndpoint = (agentId: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/services/agent/${agentId}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <style jsx>{`
          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .page-title-group h1 {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .page-subtitle {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--muted);
        }

        .section {
          margin-bottom: 40px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
        }

        .section-desc {
          font-size: 13px;
          color: var(--muted);
          margin-top: 4px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: var(--accent);
          color: #080c14;
        }

        .btn-primary:hover {
          background: #33ddff;
        }

        .btn-secondary {
          background: var(--surface2);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          border-color: var(--border2);
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 11px;
        }

        /* Integration Cards */
        .integrations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .integration-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: border-color 0.2s;
        }

        .integration-card:hover {
          border-color: var(--border2);
        }

        .integration-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .integration-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .integration-icon.api {
          background: rgba(0,210,255,0.1);
          color: var(--accent);
        }

        .integration-icon.webhook {
          background: rgba(123,111,255,0.1);
          color: var(--accent2);
        }

        .integration-icon.external {
          background: rgba(0,255,157,0.1);
          color: #00ff9d;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 600;
        }

        .status-active {
          background: rgba(0,255,157,0.15);
          color: #00ff9d;
        }

        .status-inactive {
          background: rgba(255,107,53,0.15);
          color: var(--warn);
        }

        .integration-name {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .integration-type {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 1px;
        }

        .integration-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detail-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: var(--surface2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          flex-shrink: 0;
        }

        .detail-content {
          flex: 1;
          min-width: 0;
        }

        .detail-label {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted);
          letter-spacing: 1px;
        }

        .detail-value {
          font-size: 12px;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .copy-btn {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .copy-btn:hover {
          color: var(--accent);
          background: rgba(0,210,255,0.1);
        }

        .integration-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          border-color: var(--border2);
          color: var(--text);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: var(--surface2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
        }

        .empty-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .empty-desc {
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 24px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Quick Start */
        .quick-start-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
        }

        .quick-start-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .step-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .step {
          display: flex;
          gap: 16px;
        }

        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent);
          color: #080c14;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .step-desc {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.5;
        }

        .code-block {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          font-family: var(--mono);
          font-size: 11px;
          color: var(--accent);
          margin-top: 8px;
          overflow-x: auto;
        }
      `}</style>

      <div className="page-header">
        <div className="page-title-group">
          <h1>Integrations</h1>
          <p className="page-subtitle">Connect your agents to external services</p>
        </div>
      </div>

      {/* Agent API Endpoints */}
      <div className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Agent API Endpoints</h2>
            <p className="section-desc">Use these endpoints to integrate your agents into your applications</p>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Key size={36} />
            </div>
            <h3 className="empty-title">No agents found</h3>
            <p className="empty-desc">
              Create an agent first to get your API endpoints.
            </p>
            <button className="btn btn-primary" onClick={() => router.push('/dashboard/agents')}>
              <Plus size={18} />
              Create Agent
            </button>
          </div>
        ) : (
          <div className="integrations-grid">
            {agents.map(agent => (
              <div key={agent.id} className="integration-card">
                <div className="integration-header">
                  <div className="integration-icon api">
                    <Zap size={22} />
                  </div>
                  <span className={`status-badge ${agent.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                    <span style={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      background: agent.status === 'ACTIVE' ? '#00ff9d' : 'var(--warn)',
                      display: 'inline-block'
                    }}></span>
                    {agent.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <h3 className="integration-name">{agent.name}</h3>
                <p className="integration-type">AGENT API</p>
                
                <div className="integration-details">
                  <div className="detail-row">
                    <div className="detail-icon">
                      <Link size={14} />
                    </div>
                    <div className="detail-content">
                      <div className="detail-label">ENDPOINT</div>
                      <div className="detail-value">{getAgentEndpoint(agent.id)}</div>
                    </div>
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(getAgentEndpoint(agent.id), `endpoint-${agent.id}`)}
                    >
                      {copiedField === `endpoint-${agent.id}` ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  
                  {agent.webhookUrl && (
                    <div className="detail-row">
                      <div className="detail-icon">
                        <Webhook size={14} />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">WEBHOOK</div>
                        <div className="detail-value">{agent.webhookUrl}</div>
                      </div>
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(agent.webhookUrl, `webhook-${agent.id}`)}
                      >
                        {copiedField === `webhook-${agent.id}` ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="integration-actions">
                  <button 
                    className="action-btn"
                    onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                  >
                    <Settings size={14} />
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Start Guide */}
      <div className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Quick Start</h2>
            <p className="section-desc">Learn how to integrate with your agents</p>
          </div>
        </div>

        <div className="quick-start-card">
          <div className="quick-start-title">
            <Zap size={20} color="var(--accent)" />
            Making Your First API Call
          </div>
          <div className="step-list">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <div className="step-title">Get your agent endpoint</div>
                <div className="step-desc">
                  Find your agent's API endpoint in the cards above. Each agent has its own unique endpoint.
                </div>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <div className="step-title">Include payment header</div>
                <div className="step-desc">
                  Use x402 payment protocol to authorize requests. Include the payment header with USDC.
                </div>
                <div className="code-block">
                  curl -H "X-Payment: USDC:0.50" {getAgentEndpoint(agents[0]?.id || ':id')}
                </div>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <div className="step-title">Receive response</div>
                <div className="step-desc">
                  Once payment is verified, the agent will process your request and return the result.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}