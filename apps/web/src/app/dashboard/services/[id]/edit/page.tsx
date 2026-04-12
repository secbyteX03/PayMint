'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Plus,
  Settings,
  DollarSign,
  Activity,
  Globe,
  Clock,
  Code,
  FileText,
  Save
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const { address, isConnected } = useStellar();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const serviceId = params.id as string;
  
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  
  const [serviceData, setServiceData] = useState({
    name: '',
    description: '',
    serviceType: 'CUSTOM',
    pricePerCall: '',
    currency: 'USDC',
    endpoint: '',
    method: 'POST',
    rateLimit: '',
    timeout: '',
    responseFormat: 'JSON',
    retryPolicy: '',
    schema: '',
    usageExamples: '',
    agentId: '',
  });
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState('');

  useEffect(() => {
    setMounted(true);
    if (serviceId) {
      fetchData();
    }
  }, [serviceId]);

  const fetchData = async () => {
    try {
      // Fetch the service
      const serviceRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${serviceId}`);
      if (serviceRes.ok) {
        const service = await serviceRes.json();
        setServiceData({
          name: service.name || '',
          description: service.description || '',
          serviceType: service.serviceType || 'CUSTOM',
          pricePerCall: service.pricePerCall?.toString() || '',
          currency: service.currency || 'USDC',
          endpoint: service.endpoint || '',
          method: service.method || 'POST',
          rateLimit: service.rateLimit?.toString() || '',
          timeout: service.timeout?.toString() || '',
          responseFormat: service.responseFormat || 'JSON',
          retryPolicy: service.retryPolicy || '',
          schema: service.schema || '',
          usageExamples: service.usageExamples || '',
          agentId: service.agentId || '',
        });
      }

      // Fetch agents for the dropdown
      if (address) {
        const agentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/address/${address}`);
        if (agentsRes.ok) {
          const userAgents = await agentsRes.json();
          if (userAgents) {
            const agentsArray = Array.isArray(userAgents) ? userAgents : [userAgents];
            setAgents(agentsArray);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setServiceError('Failed to load service');
    } finally {
      setLoading(false);
      setLoadingAgents(false);
    }
  };

  const handleUpdateService = async () => {
    if (!serviceData.name || !serviceData.pricePerCall || !serviceData.agentId) {
      setServiceError('Service name, price, and agent are required');
      return;
    }

    setSavingService(true);
    setServiceError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: serviceData.agentId,
          name: serviceData.name,
          description: serviceData.description,
          serviceType: serviceData.serviceType,
          pricePerCall: parseFloat(serviceData.pricePerCall),
          currency: serviceData.currency,
          endpoint: serviceData.endpoint || undefined,
          method: serviceData.method,
          rateLimit: serviceData.rateLimit ? parseInt(serviceData.rateLimit) : undefined,
          timeout: serviceData.timeout ? parseInt(serviceData.timeout) : undefined,
          responseFormat: serviceData.responseFormat || undefined,
          retryPolicy: serviceData.retryPolicy || undefined,
          schema: serviceData.schema || undefined,
          usageExamples: serviceData.usageExamples ? serviceData.usageExamples.split('\n').filter(line => line.trim()) : undefined,
        }),
      });

      if (res.ok) {
        router.push('/dashboard/services');
      } else {
        const data = await res.json();
        setServiceError(data.error || 'Failed to update service');
      }
    } catch (err: any) {
      setServiceError(err.message || 'Failed to update service');
    } finally {
      setSavingService(false);
    }
  };

  if (!mounted || loading) {
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

        .form-textarea.large {
          min-height: 100px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
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
          <button className="back-button" onClick={() => router.push('/dashboard/services')}>
            <ArrowLeft size={20} />
          </button>
          <div className="header-content">
            <h1>Edit Service</h1>
            <p className="header-subtitle">Update your service configuration</p>
          </div>
        </div>

        <div className="form-card">
          {serviceError && (
            <div className="error-message">
              {serviceError}
            </div>
          )}

          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Select Agent *</label>
                <select
                  className="form-select"
                  value={serviceData.agentId}
                  onChange={(e) => setServiceData({ ...serviceData, agentId: e.target.value })}
                >
                  <option value="">Select an agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Service Type</label>
                <select
                  className="form-select"
                  value={serviceData.serviceType}
                  onChange={(e) => setServiceData({ ...serviceData, serviceType: e.target.value })}
                >
                  <option value="CUSTOM">Custom</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="STANDARD">Standard</option>
                  <option value="BASIC">Basic</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Service Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter service name"
                  value={serviceData.name}
                  onChange={(e) => setServiceData({ ...serviceData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  className="form-select"
                  value={serviceData.currency}
                  onChange={(e) => setServiceData({ ...serviceData, currency: e.target.value })}
                >
                  <option value="USDC">USDC</option>
                  <option value="XLM">XLM</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price Per Call *</label>
                <div className="input-icon">
                  <DollarSign size={14} className="input-icon-left" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="1.00"
                    value={serviceData.pricePerCall}
                    onChange={(e) => setServiceData({ ...serviceData, pricePerCall: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Endpoint Path</label>
                <div className="input-icon">
                  <Code size={14} className="input-icon-left" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="/api/v1/execute"
                    value={serviceData.endpoint}
                    onChange={(e) => setServiceData({ ...serviceData, endpoint: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="form-row single">
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe what this service does..."
                  value={serviceData.description}
                  onChange={(e) => setServiceData({ ...serviceData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Endpoint Configuration</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">HTTP Method</label>
                <select
                  className="form-select"
                  value={serviceData.method}
                  onChange={(e) => setServiceData({ ...serviceData, method: e.target.value })}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Rate Limit (calls/min)</label>
                <div className="input-icon">
                  <Activity size={14} className="input-icon-left" />
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="60"
                    value={serviceData.rateLimit}
                    onChange={(e) => setServiceData({ ...serviceData, rateLimit: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Timeout (seconds)</label>
                <div className="input-icon">
                  <Clock size={14} className="input-icon-left" />
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="30"
                    value={serviceData.timeout}
                    onChange={(e) => setServiceData({ ...serviceData, timeout: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Response Format</label>
                <select
                  className="form-select"
                  value={serviceData.responseFormat}
                  onChange={(e) => setServiceData({ ...serviceData, responseFormat: e.target.value })}
                >
                  <option value="JSON">JSON</option>
                  <option value="XML">XML</option>
                  <option value="TEXT">Text</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Response Configuration</h3>
            <div className="form-row single">
              <div className="form-group">
                <label className="form-label">Retry Policy (JSON)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder='{"maxRetries": 4, "backoff": "exponential"}'
                  value={serviceData.retryPolicy}
                  onChange={(e) => setServiceData({ ...serviceData, retryPolicy: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row single">
              <div className="form-group">
                <label className="form-label">API Schema (JSON)</label>
                <textarea
                  className="form-textarea large"
                  placeholder='{"type": "object", "properties": {"workflow_id": {"type": "string"}}}'
                  value={serviceData.schema}
                  onChange={(e) => setServiceData({ ...serviceData, schema: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Usage Documentation</h3>
            <div className="form-row single">
              <div className="form-group">
                <label className="form-label">Usage Examples (one per line)</label>
                <textarea
                  className="form-textarea large"
                  placeholder="curl -X POST https://api.example.com/api/v1/execute -d example"
                  value={serviceData.usageExamples}
                  onChange={(e) => setServiceData({ ...serviceData, usageExamples: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={() => router.push('/dashboard/services')}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpdateService}
              disabled={savingService}
            >
              {savingService ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}