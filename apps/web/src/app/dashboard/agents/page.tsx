'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  Plus, 
  Settings,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  ArrowRight,
  Activity,
  Code,
  DollarSign
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function MyAgentsPage() {
  const router = useRouter();
  const { address, isConnected } = useStellar();
  const [agents, setAgents] = useState<any[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  
  // Agent form data
  const [agentData, setAgentData] = useState({
    name: '',
    description: '',
    apiEndpoint: '',
    webhookUrl: '',
    documentationUrl: '',
    pricingModel: 'PER_CALL',
    pricePerCall: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Set mounted to prevent hydration mismatch
    setMounted(true);
    
    if (isConnected && address) {
      fetchUserAgents();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchUserAgents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/address/${address}`);
      if (res.ok) {
        const agentsData = await res.json();
        // The API now returns an array of agents
        const agentsList = Array.isArray(agentsData) ? agentsData : [agentsData];
        setAgents(agentsList);
        
        // Fetch services for each agent
        agentsList.forEach(async (agent: any) => {
          const servicesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/agent/${agent.id}`);
          if (servicesRes.ok) {
            const services = await servicesRes.json();
            setServicesMap((prev: any) => ({ ...prev, [agent.id]: services }));
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  };

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
      // If we have a selectedAgent, we're editing an existing agent
      if (selectedAgent && !showDeleteConfirm) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/${selectedAgent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: agentData.name,
            description: agentData.description,
            apiEndpoint: agentData.apiEndpoint || undefined,
            webhookUrl: agentData.webhookUrl || undefined,
            documentationUrl: agentData.documentationUrl || undefined,
            pricingModel: agentData.pricingModel,
            pricePerCall: agentData.pricePerCall ? parseFloat(agentData.pricePerCall) : undefined,
          }),
        });

        if (res.ok) {
          setShowCreateModal(false);
          setAgentData({ name: '', description: '', apiEndpoint: '', webhookUrl: '', documentationUrl: '', pricingModel: 'PER_CALL', pricePerCall: '' });
          setSelectedAgent(null); // Clear selected agent after edit
          fetchUserAgents();
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to update agent');
        }
        setCreating(false);
        return;
      }

      // Creating a new agent
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: address,
          name: agentData.name,
          description: agentData.description,
          apiEndpoint: agentData.apiEndpoint || undefined,
          webhookUrl: agentData.webhookUrl || undefined,
          documentationUrl: agentData.documentationUrl || undefined,
          pricingModel: agentData.pricingModel,
          pricePerCall: agentData.pricePerCall ? parseFloat(agentData.pricePerCall) : undefined,
        }),
      });

      const data = await res.json();
      if (data.id) {
        setShowCreateModal(false);
        setAgentData({ name: '', description: '', apiEndpoint: '', webhookUrl: '', documentationUrl: '', pricingModel: 'PER_CALL', pricePerCall: '' });
        fetchUserAgents();
      } else {
        setError(data.error || 'Failed to create agent');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;
    
    try {
      // In a real app, you'd have a delete endpoint
      // For now, just close the modal
      setShowDeleteConfirm(false);
      setSelectedAgent(null);
    } catch (err) {
      console.error('Failed to delete agent:', err);
    }
  };

  const toggleAgentStatus = async (agent: any) => {
    const newStatus = agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/${agent.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchUserAgents();
    } catch (err) {
      console.error('Failed to update agent status:', err);
    }
  };

  const getServiceCount = (agentId: string) => {
    return servicesMap[agentId]?.length || 0;
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
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: var(--surface2);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          border-color: var(--border2);
        }

        .btn-icon {
          padding: 8px;
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          border-radius: 6px;
        }

        .btn-icon:hover {
          background: var(--surface2);
          color: var(--text);
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }

        .agent-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s;
          position: relative;
        }

        .agent-card:hover {
          border-color: var(--border2);
          transform: translateY(-2px);
        }

        .agent-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .agent-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent2), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          color: white;
        }

        .agent-status {
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

        .agent-name {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .agent-description {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .agent-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 16px;
          background: var(--surface2);
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .agent-stat {
          text-align: center;
        }

        .agent-stat-value {
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
        }

        .agent-stat-label {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted);
          letter-spacing: 1px;
          margin-top: 4px;
        }

        .agent-actions {
          display: flex;
          gap: 10px;
        }

        .btn-manage {
          flex: 1;
          justify-content: center;
          background: var(--accent);
          color: #080c14;
        }

        .btn-manage:hover {
          background: #33ddff;
        }

        .menu-dropdown {
          position: absolute;
          top: 60px;
          right: 24px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 8px;
          z-index: 10;
          min-width: 140px;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          font-size: 12px;
          color: var(--text);
          cursor: pointer;
          border-radius: 6px;
          width: 100%;
          background: none;
          border: none;
          text-align: left;
        }

        .menu-item:hover {
          background: rgba(0,210,255,0.1);
        }

        .menu-item.danger {
          color: var(--warn);
        }

        .menu-item.danger:hover {
          background: rgba(255,107,53,0.1);
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
          max-width: 500px;
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

        .modal-close:hover {
          color: var(--text);
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

        .form-input::placeholder {
          color: var(--muted);
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

        /* Empty state */
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
      `}</style>

      <div className="page-header">
        <div className="page-title-group">
          <h1>My Agents</h1>
          <p className="page-subtitle">Manage your AI agents and their services</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/dashboard/agents/new')}>
          <Plus size={18} />
          Create Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Bot size={36} />
          </div>
          <h3 className="empty-title">No agents yet</h3>
          <p className="empty-desc">
            Create your first AI agent to start offering services on the marketplace.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard/agents/new')}>
            <Plus size={18} />
            Create Your First Agent
          </button>
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map((agent) => (
            <div key={agent.id} className="agent-card">
              <div className="agent-header">
                <div className="agent-avatar">
                  {agent.name?.charAt(0) || 'A'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`agent-status ${agent.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                    <span style={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      background: agent.status === 'ACTIVE' ? '#00ff9d' : 'var(--warn)',
                      display: 'inline-block'
                    }}></span>
                    {agent.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                  <div style={{ position: 'relative' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => setMenuOpen(menuOpen === agent.id ? null : agent.id)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {menuOpen === agent.id && (
                      <div className="menu-dropdown">
                        <button 
                          className="menu-item"
                          onClick={() => {
                            router.push(`/dashboard/agents/${agent.id}/edit`);
                            setMenuOpen(null);
                          }}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button 
                          className="menu-item"
                          onClick={() => {
                            router.push(`/dashboard/agents/${agent.id}`);
                            setMenuOpen(null);
                          }}
                        >
                          <Settings size={14} />
                          Manage
                        </button>
                        <button 
                          className="menu-item"
                          onClick={() => {
                            toggleAgentStatus(agent);
                            setMenuOpen(null);
                          }}
                        >
                          <Power size={14} />
                          {agent.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </button>
                        <button className="menu-item danger" onClick={() => {
                          setSelectedAgent(agent);
                          setShowDeleteConfirm(true);
                          setMenuOpen(null);
                        }}>
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <h3 className="agent-name">{agent.name}</h3>
              <p className="agent-description">
                {agent.description || 'No description provided'}
              </p>
              
              <div className="agent-stats">
                <div className="agent-stat">
                  <div className="agent-stat-value">{getServiceCount(agent.id)}</div>
                  <div className="agent-stat-label">SERVICES</div>
                </div>
                <div className="agent-stat">
                  <div className="agent-stat-value">0</div>
                  <div className="agent-stat-label">API CALLS</div>
                </div>
                <div className="agent-stat">
                  <div className="agent-stat-value">$0</div>
                  <div className="agent-stat-label">REVENUE</div>
                </div>
              </div>
              
              <div className="agent-actions">
                <button 
                  className="btn btn-manage"
                  onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                >
                  Manage Agent
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAgent && !showDeleteConfirm ? 'Edit Agent' : 'Create New Agent'}</h2>
              <button className="modal-close" onClick={() => { setShowCreateModal(false); setSelectedAgent(null); }}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label className="form-label">AGENT NAME *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Crypto Analyst Bot"
                  value={agentData.name}
                  onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">DESCRIPTION</label>
                <textarea
                  className="form-input"
                  placeholder="Describe what your agent does..."
                  value={agentData.description}
                  onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">API ENDPOINT</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://api.example.com/agent"
                  value={agentData.apiEndpoint}
                  onChange={(e) => setAgentData({ ...agentData, apiEndpoint: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">WEBHOOK URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://your-server.com/webhook"
                  value={agentData.webhookUrl}
                  onChange={(e) => setAgentData({ ...agentData, webhookUrl: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">PRICING MODEL</label>
                <select
                  className="form-input"
                  value={agentData.pricingModel}
                  onChange={(e) => setAgentData({ ...agentData, pricingModel: e.target.value })}
                >
                  <option value="PER_CALL">Per Call</option>
                  <option value="MONTHLY">Monthly Subscription</option>
                  <option value="FREEMIUM">Freemium</option>
                </select>
              </div>
              {agentData.pricingModel === 'PER_CALL' && (
                <div className="form-group">
                  <label className="form-label">PRICE PER CALL (USDC)</label>
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
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleCreateAgent}
                disabled={creating}
              >
                {creating ? (selectedAgent && !showDeleteConfirm ? 'Updating...' : 'Creating...') : (selectedAgent && !showDeleteConfirm ? 'Update Agent' : 'Create Agent')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Delete Agent</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{selectedAgent?.name}</strong>? This action cannot be undone and all associated services will be removed.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ background: 'var(--warn)', color: 'white' }}
                onClick={handleDeleteAgent}
              >
                Delete Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}