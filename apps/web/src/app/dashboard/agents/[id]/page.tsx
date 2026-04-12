'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Power,
  Settings,
  DollarSign,
  Activity,
  Clock,
  Globe,
  Link,
  BookOpen,
  Copy,
  Check
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function AgentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { publicKey, isConnected } = useStellar();
  const [agent, setAgent] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDeleteService, setShowDeleteService] = useState<string | null>(null);
  
  // Edit form state
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    apiEndpoint: '',
    webhookUrl: '',
    documentationUrl: '',
    pricingModel: 'PER_CALL',
    pricePerCall: '',
  });
  
  // Service form state
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
  });
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [serviceSuccess, setServiceSuccess] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const agentId = params.id as string;

  useEffect(() => {
    // Set mounted to prevent hydration mismatch
    setMounted(true);
    
    if (agentId) {
      fetchAgentData();
    }
  }, [agentId]);

  const fetchAgentData = async () => {
    try {
      // Fetch agent
      const agentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/${agentId}`);
      if (agentRes.ok) {
        const agentData = await agentRes.json();
        setAgent(agentData);
        setEditData({
          name: agentData.name || '',
          description: agentData.description || '',
          apiEndpoint: agentData.apiEndpoint || '',
          webhookUrl: agentData.webhookUrl || '',
          documentationUrl: agentData.documentationUrl || '',
          pricingModel: agentData.pricingModel || 'PER_CALL',
          pricePerCall: agentData.pricePerCall?.toString() || '',
        });
      }

      // Fetch services
      const servicesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/agent/${agentId}`);
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }

      // Fetch stats
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/${agentId}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch agent data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAgent = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          description: editData.description,
          apiEndpoint: editData.apiEndpoint || undefined,
          webhookUrl: editData.webhookUrl || undefined,
          documentationUrl: editData.documentationUrl || undefined,
          pricingModel: editData.pricingModel,
          pricePerCall: editData.pricePerCall ? parseFloat(editData.pricePerCall) : undefined,
        }),
      });
      
      if (res.ok) {
        setShowEditModal(false);
        fetchAgentData();
      }
    } catch (err) {
      console.error('Failed to update agent:', err);
    }
  };

  const toggleAgentStatus = async () => {
    const newStatus = agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/${agentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchAgentData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCreateService = async () => {
    if (!serviceData.name || !serviceData.pricePerCall) {
      setServiceError('Service name and price are required');
      return;
    }

    setSavingService(true);
    setServiceError('');
    setServiceSuccess('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
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
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setServiceSuccess('Service created successfully!');
        // Don't close modal immediately - show success message first
        // Then refresh the services list and close after a short delay
        fetchAgentData();
        setTimeout(() => {
          setShowServiceModal(false);
          setServiceSuccess('');
        }, 1500);
        setServiceData({
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
        });
        fetchAgentData();
        // Clear success message after 3 seconds
        setTimeout(() => setServiceSuccess(''), 3000);
      } else {
        setServiceError(data.error || 'Failed to create service');
      }
    } catch (err: any) {
      setServiceError(err.message || 'Failed to create service');
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${serviceId}`, {
        method: 'DELETE',
      });
      setShowDeleteService(null);
      fetchAgentData();
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${serviceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchAgentData();
    } catch (err) {
      console.error('Failed to update service status:', err);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Show loading state only after mount to prevent hydration mismatch
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

  if (!agent) {
    return (
      <div className="not-found">
        <h2>Agent not found</h2>
        <button onClick={() => router.push('/dashboard/agents')}>Go Back</button>
        <style jsx>{`
          .not-found {
            text-align: center;
            padding: 60px 20px;
          }
          .not-found h2 {
            margin-bottom: 20px;
            color: var(--muted);
          }
          .not-found button {
            padding: 10px 20px;
            background: var(--accent);
            color: #080c14;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 700;
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
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
        }

        .back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:hover {
          border-color: var(--border2);
          color: var(--text);
        }

        .header-content {
          flex: 1;
        }

        .header-title {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .header-subtitle {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--muted);
        }

        .header-actions {
          display: flex;
          gap: 12px;
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
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          border-color: var(--border2);
        }

        .btn-danger {
          background: var(--warn);
          color: white;
        }

        /* Overview Section */
        .section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .overview-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
        }

        .overview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .agent-avatar {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--accent2), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-family: var(--mono);
          font-size: 11px;
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

        .agent-name {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .agent-description {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .config-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .config-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--surface2);
          border-radius: 10px;
        }

        .config-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(0,210,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
        }

        .config-content {
          flex: 1;
          min-width: 0;
        }

        .config-label {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted);
          letter-spacing: 1px;
          margin-bottom: 2px;
        }

        .config-value {
          font-size: 13px;
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
        }

        .copy-btn:hover {
          color: var(--accent);
          background: rgba(0,210,255,0.1);
        }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .stat-icon.revenue {
          background: rgba(0,255,157,0.1);
          color: #00ff9d;
        }

        .stat-icon.calls {
          background: rgba(0,210,255,0.1);
          color: var(--accent);
        }

        .stat-icon.services {
          background: rgba(123,111,255,0.1);
          color: var(--accent2);
        }

        .stat-icon.uptime {
          background: rgba(255,170,0,0.1);
          color: var(--accent3);
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .stat-card.green .stat-value {
          color: var(--green);
        }

        .stat-label {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 1px;
        }

        /* Services */
        .services-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .service-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: border-color 0.2s;
        }

        .service-item:hover {
          border-color: var(--border2);
        }

        .service-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--accent2), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }

        .service-info {
          flex: 1;
        }

        .service-name {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .service-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted);
        }

        .service-price {
          font-size: 16px;
          font-weight: 700;
          color: var(--accent3);
        }

        .service-actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          padding: 8px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          border-color: var(--border2);
          color: var(--text);
        }

        .btn-icon.danger:hover {
          border-color: var(--warn);
          color: var(--warn);
        }

        .add-service-card {
          background: var(--surface2);
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-service-card:hover {
          border-color: var(--accent);
          background: rgba(0,210,255,0.05);
        }

        .add-service-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          margin-bottom: 12px;
        }

        .add-service-text {
          font-size: 14px;
          font-weight: 600;
          color: var(--muted);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          width: 90%;
          max-width: 540px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 700;
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 24px;
          cursor: pointer;
          line-height: 1;
        }

        .modal-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
          font-family: var(--display);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        textarea.form-input {
          min-height: 100px;
          resize: vertical;
        }

        select.form-input {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23e8f4ff' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .error-message {
          background: rgba(255,107,53,0.1);
          border: 1px solid var(--warn);
          border-radius: 8px;
          padding: 12px 16px;
          color: var(--warn);
          font-size: 13px;
          margin-bottom: 16px;
        }

        .success-message {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid #22c55e;
          border-radius: 8px;
          padding: 12px 16px;
          color: #22c55e;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .empty-services {
          text-align: center;
          padding: 40px;
          color: var(--muted);
        }
      `}</style>

      <div className="page-header">
        <button className="back-btn" onClick={() => router.push('/dashboard/agents')}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-content">
          <h1 className="header-title">Agent Details</h1>
          <p className="header-subtitle">Manage your agent and its services</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={toggleAgentStatus}>
            <Power size={16} />
            {agent.status === 'ACTIVE' ? 'Disable' : 'Enable'}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>
            <Edit size={16} />
            Configure Agent
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="section">
        <div className="stats-grid">
          <div className="stat-card green">
            <div className="stat-icon revenue">
              <DollarSign size={20} />
            </div>
            <div className="stat-value" style={{ color: '#00ff88' }}>${stats?.totalRevenue || '0'}</div>
            <div className="stat-label">TOTAL REVENUE</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon calls">
              <Activity size={20} />
            </div>
            <div className="stat-value">{stats?.totalCalls || '0'}</div>
            <div className="stat-label">API CALLS</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon services">
              <Settings size={20} />
            </div>
            <div className="stat-value">{services.length}</div>
            <div className="stat-label">SERVICES</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon uptime">
              <Clock size={20} />
            </div>
            <div className="stat-value">99.9%</div>
            <div className="stat-label">UPTIME</div>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Agent Overview</h2>
        </div>
        <div className="overview-grid">
          <div className="overview-card">
            <div className="overview-header">
              <div className="agent-avatar">
                {agent.name?.charAt(0) || 'A'}
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
            <h3 className="agent-name">{agent.name}</h3>
            <p className="agent-description">
              {agent.description || 'No description provided'}
            </p>
            {agent.pricingModel && (
              <div style={{ 
                display: 'inline-block', 
                padding: '6px 12px', 
                background: 'var(--surface2)', 
                borderRadius: '6px',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                color: 'var(--accent3)'
              }}>
                {agent.pricingModel === 'PER_CALL' && agent.pricePerCall 
                  ? `$${agent.pricePerCall} per call`
                  : agent.pricingModel === 'MONTHLY'
                  ? 'Monthly subscription'
                  : 'Freemium model'}
              </div>
            )}
          </div>
          
          <div className="overview-card">
            <div className="config-items">
              {agent.apiEndpoint && (
                <div className="config-item">
                  <div className="config-icon">
                    <Globe size={16} />
                  </div>
                  <div className="config-content">
                    <div className="config-label">API ENDPOINT</div>
                    <div className="config-value">{agent.apiEndpoint}</div>
                  </div>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(agent.apiEndpoint, 'api')}
                  >
                    {copiedField === 'api' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              )}
              {agent.webhookUrl && (
                <div className="config-item">
                  <div className="config-icon">
                    <Link size={16} />
                  </div>
                  <div className="config-content">
                    <div className="config-label">WEBHOOK URL</div>
                    <div className="config-value">{agent.webhookUrl}</div>
                  </div>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(agent.webhookUrl, 'webhook')}
                  >
                    {copiedField === 'webhook' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              )}
              {agent.documentationUrl && (
                <div className="config-item">
                  <div className="config-icon">
                    <BookOpen size={16} />
                  </div>
                  <div className="config-content">
                    <div className="config-label">DOCUMENTATION</div>
                    <div className="config-value">{agent.documentationUrl}</div>
                  </div>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(agent.documentationUrl, 'docs')}
                  >
                    {copiedField === 'docs' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              )}
              {!agent.apiEndpoint && !agent.webhookUrl && !agent.documentationUrl && (
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '20px', 
                  textAlign: 'center', 
                  color: 'var(--muted)',
                  fontSize: '13px'
                }}>
                  <div>No endpoints configured.</div>
                  <button 
                    onClick={() => setShowEditModal(true)}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--accent)',
                      color: '#080c14',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Configure Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Services</h2>
        </div>
        <div className="services-list">
          {services.length === 0 ? (
            <div className="empty-services">
              <p>No services yet. Add your first service to start earning.</p>
            </div>
          ) : (
            services.map((service) => (
              <div key={service.id} className="service-item">
                <div className="service-icon">
                  {service.name?.charAt(0) || 'S'}
                </div>
                <div className="service-info">
                  <div className="service-name">{service.name}</div>
                  <div className="service-meta">
                    <span>{service.method || 'POST'}</span>
                    <span>{service.endpoint || '/'}</span>
                    <span style={{ 
                      color: service.isActive ? '#00ff9d' : 'var(--warn)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: service.isActive ? '#00ff9d' : 'var(--warn)',
                        display: 'inline-block'
                      }}></span>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="service-price">
                  ${service.pricePerCall || '0'}
                </div>
                <div className="service-actions">
                  <button 
                    className="btn-icon"
                    onClick={() => toggleServiceStatus(service.id, service.isActive)}
                    title={service.isActive ? 'Disable' : 'Enable'}
                  >
                    <Power size={14} />
                  </button>
                  <button 
                    className="btn-icon danger"
                    onClick={() => setShowDeleteService(service.id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
          
          {/* Add Service Card */}
          <div className="add-service-card" onClick={() => router.push(`/dashboard/services/new?agentId=${agentId}`)}>
            <div className="add-service-icon">
              <Plus size={24} />
            </div>
            <span className="add-service-text">Add New Service</span>
          </div>
        </div>
      </div>

      {/* Edit Agent Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Configure Agent</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">AGENT NAME</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">DESCRIPTION</label>
                <textarea
                  className="form-input"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">API ENDPOINT</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://api.example.com/agent"
                  value={editData.apiEndpoint}
                  onChange={(e) => setEditData({ ...editData, apiEndpoint: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">WEBHOOK URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://your-server.com/webhook"
                  value={editData.webhookUrl}
                  onChange={(e) => setEditData({ ...editData, webhookUrl: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">DOCUMENTATION URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://docs.example.com"
                  value={editData.documentationUrl}
                  onChange={(e) => setEditData({ ...editData, documentationUrl: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">PRICING MODEL</label>
                <select
                  className="form-input"
                  value={editData.pricingModel}
                  onChange={(e) => setEditData({ ...editData, pricingModel: e.target.value })}
                >
                  <option value="PER_CALL">Per Call</option>
                  <option value="MONTHLY">Monthly Subscription</option>
                  <option value="FREEMIUM">Freemium</option>
                </select>
              </div>
              {editData.pricingModel === 'PER_CALL' && (
                <div className="form-group">
                  <label className="form-label">PRICE PER CALL (USDC)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.50"
                    value={editData.pricePerCall}
                    onChange={(e) => setEditData({ ...editData, pricePerCall: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdateAgent}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Service</h2>
              <button className="modal-close" onClick={() => setShowServiceModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {serviceSuccess && <div className="success-message">{serviceSuccess}</div>}
              {serviceError && <div className="error-message">{serviceError}</div>}
              <div className="form-group">
                <label className="form-label">SERVICE NAME *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Text Analysis"
                  value={serviceData.name}
                  onChange={(e) => setServiceData({ ...serviceData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">DESCRIPTION</label>
                <textarea
                  className="form-input"
                  placeholder="Describe what this service does..."
                  value={serviceData.description}
                  onChange={(e) => setServiceData({ ...serviceData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">SERVICE TYPE</label>
                <select
                  className="form-input"
                  value={serviceData.serviceType}
                  onChange={(e) => setServiceData({ ...serviceData, serviceType: e.target.value })}
                >
                  <option value="CUSTOM">Custom</option>
                  <option value="NLP">NLP</option>
                  <option value="VISION">Computer Vision</option>
                  <option value="DATA">Data Processing</option>
                  <option value="ANALYTICS">Analytics</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">PRICE PER CALL (USDC) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.50"
                  value={serviceData.pricePerCall}
                  onChange={(e) => setServiceData({ ...serviceData, pricePerCall: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ENDPOINT PATH</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="/analyze"
                  value={serviceData.endpoint}
                  onChange={(e) => setServiceData({ ...serviceData, endpoint: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">HTTP METHOD</label>
                <select
                  className="form-input"
                  value={serviceData.method}
                  onChange={(e) => setServiceData({ ...serviceData, method: e.target.value })}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">RATE LIMIT (calls/min)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="60"
                  value={serviceData.rateLimit}
                  onChange={(e) => setServiceData({ ...serviceData, rateLimit: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">TIMEOUT (seconds)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="30"
                  value={serviceData.timeout}
                  onChange={(e) => setServiceData({ ...serviceData, timeout: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">RESPONSE FORMAT</label>
                <select
                  className="form-input"
                  value={serviceData.responseFormat}
                  onChange={(e) => setServiceData({ ...serviceData, responseFormat: e.target.value })}
                >
                  <option value="JSON">JSON</option>
                  <option value="XML">XML</option>
                  <option value="TEXT">Plain Text</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleCreateService}
                disabled={savingService}
              >
                {savingService ? 'Creating...' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Service Confirmation */}
      {showDeleteService && (
        <div className="modal-overlay" onClick={() => setShowDeleteService(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Delete Service</h2>
              <button className="modal-close" onClick={() => setShowDeleteService(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this service? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteService(null)}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleDeleteService(showDeleteService)}
              >
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}