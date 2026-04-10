'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Plus,
  Settings,
  DollarSign,
  Globe,
  Link,
  BookOpen,
  Mail,
  Image,
  Globe2,
  FileText
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function NewAgentPage() {
  const router = useRouter();
  const { address, isConnected } = useStellar();
  const [mounted, setMounted] = useState(false);
  
  const [agentData, setAgentData] = useState({
    name: '',
    description: '',
    supportEmail: '',
    apiEndpoint: '',
    webhookUrl: '',
    documentationUrl: '',
    logoUrl: '',
    capabilities: '',
    pricingModel: 'PER_CALL',
    pricePerCall: '',
    websiteUrl: '',
    termsOfServiceUrl: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateAgent = async () => {
    if (!address) {
      router.push('/connect');
      return;
    }
    if (!agentData.name) {
      setError('Agent name is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: address,
          name: agentData.name,
          description: agentData.description,
          supportEmail: agentData.supportEmail || undefined,
          apiEndpoint: agentData.apiEndpoint || undefined,
          webhookUrl: agentData.webhookUrl || undefined,
          documentationUrl: agentData.documentationUrl || undefined,
          logoUrl: agentData.logoUrl || undefined,
          capabilities: agentData.capabilities || undefined,
          pricingModel: agentData.pricingModel,
          pricePerCall: agentData.pricePerCall ? parseFloat(agentData.pricePerCall) : undefined,
          websiteUrl: agentData.websiteUrl || undefined,
          termsOfServiceUrl: agentData.termsOfServiceUrl || undefined,
        }),
      });

      const data = await res.json();
      if (data.id) {
        router.push(`/dashboard/agents/${data.id}`);
      } else {
        setError(data.error || 'Failed to create agent');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
    } finally {
      setCreating(false);
    }
  };

  if (!mounted) {
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
        .page-container {
          width: 100%;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .back-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-button:hover {
          background: var(--surface2);
          border-color: var(--border2);
        }

        .header-content h1 {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .header-subtitle {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--muted);
        }

        .form-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
        }

        .form-section {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }

        .form-section:last-of-type {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-row.single {
          grid-template-columns: 1fr;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .form-input,
        .form-textarea,
        .form-select {
          padding: 10px 14px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--accent);
          background: var(--surface);
        }

        .form-textarea {
          min-height: 60px;
          resize: vertical;
        }

        .form-select {
          appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23e8f4ff' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }

        .input-icon {
          position: relative;
        }

        .input-icon .form-input {
          padding-left: 36px;
        }

        .input-icon-left {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
        }

        .error-message {
          padding: 12px 16px;
          background: rgba(255,107,53,0.1);
          border: 1px solid var(--warn);
          border-radius: 10px;
          color: var(--warn);
          font-size: 13px;
          margin-bottom: 16px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
          margin-top: 20px;
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

        .btn-secondary {
          background: var(--surface2);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          border-color: var(--border2);
        }

        .btn-primary {
          background: var(--accent);
          color: #080c14;
        }

        .btn-primary:hover {
          background: #33ddff;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="page-container">
        <div className="page-header">
          <button className="back-button" onClick={() => router.push('/dashboard/agents')}>
            <ArrowLeft size={20} />
          </button>
          <div className="header-content">
            <h1>Create New Agent</h1>
            <p className="header-subtitle">Add a new AI agent to your portfolio</p>
          </div>
        </div>

        <div className="form-card">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Agent Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Crypto Analyst Bot"
                  value={agentData.name}
                  onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Support Email</label>
                <div className="input-icon">
                  <Mail size={14} className="input-icon-left" />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="support@example.com"
                    value={agentData.supportEmail}
                    onChange={(e) => setAgentData({ ...agentData, supportEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="form-row single">
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe what your agent does..."
                  value={agentData.description}
                  onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">API Configuration</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">API Endpoint</label>
                <div className="input-icon">
                  <Globe size={14} className="input-icon-left" />
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://api.example.com/agent"
                    value={agentData.apiEndpoint}
                    onChange={(e) => setAgentData({ ...agentData, apiEndpoint: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Webhook URL</label>
                <div className="input-icon">
                  <Link size={14} className="input-icon-left" />
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://your-server.com/webhook"
                    value={agentData.webhookUrl}
                    onChange={(e) => setAgentData({ ...agentData, webhookUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Documentation URL</label>
                <div className="input-icon">
                  <BookOpen size={14} className="input-icon-left" />
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://docs.example.com"
                    value={agentData.documentationUrl}
                    onChange={(e) => setAgentData({ ...agentData, documentationUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Logo URL</label>
                <div className="input-icon">
                  <Image size={14} className="input-icon-left" />
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/logo.png"
                    value={agentData.logoUrl}
                    onChange={(e) => setAgentData({ ...agentData, logoUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Capabilities & Pricing</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Capabilities (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="task-automation, workflow-orchestration, api-integration"
                  value={agentData.capabilities}
                  onChange={(e) => setAgentData({ ...agentData, capabilities: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pricing Model</label>
                <select
                  className="form-select"
                  value={agentData.pricingModel}
                  onChange={(e) => setAgentData({ ...agentData, pricingModel: e.target.value })}
                >
                  <option value="PER_CALL">Per Call</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                  <option value="FREE">Free</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price Per Call (USDC)</label>
                <div className="input-icon">
                  <DollarSign size={14} className="input-icon-left" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.50"
                    value={agentData.pricePerCall}
                    onChange={(e) => setAgentData({ ...agentData, pricePerCall: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Website URL</label>
                <div className="input-icon">
                  <Globe2 size={14} className="input-icon-left" />
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com"
                    value={agentData.websiteUrl}
                    onChange={(e) => setAgentData({ ...agentData, websiteUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="form-row single">
              <div className="form-group">
                <label className="form-label">Terms of Service URL</label>
                <div className="input-icon">
                  <FileText size={14} className="input-icon-left" />
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/terms"
                    value={agentData.termsOfServiceUrl}
                    onChange={(e) => setAgentData({ ...agentData, termsOfServiceUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={() => router.push('/dashboard/agents')}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateAgent}
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Agent
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}