'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search,
  Filter,
  ExternalLink,
  Zap,
  Eye,
  Play
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function DiscoverPage() {
  const router = useRouter();
  const { address, isConnected } = useStellar();
  const [agents, setAgents] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all agents
      const agentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents`);
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData);
      }

      // Fetch all services
      const servicesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`);
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get services for an agent
  const getAgentServices = (agentId: string) => {
    return services.filter(s => s.agentId === agentId);
  };

  // Get lowest price for agent
  const getAgentPrice = (agentId: string) => {
    const agentServices = getAgentServices(agentId);
    if (agentServices.length === 0) return null;
    const prices = agentServices.map(s => parseFloat(s.pricePerCall || 0)).filter(p => p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  // Filter agents
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = !searchQuery || 
      agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleUseService = async (service: any) => {
    // Simulate API call
    alert(`Simulating API call to service: ${service.name}\nPrice: $${service.pricePerCall}`);
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

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: var(--accent);
        }

        .stat-label {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 1px;
          margin-top: 4px;
        }

        .filters-row {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 250px;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 14px;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
        }

        .filter-select {
          padding: 12px 36px 12px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 14px;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23e8f4ff' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          min-width: 160px;
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--accent);
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
          cursor: pointer;
        }

        .agent-card:hover {
          border-color: var(--accent2);
          transform: translateY(-2px);
        }

        .agent-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .agent-avatar {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--accent2), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          color: white;
        }

        .agent-type {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted);
          letter-spacing: 1px;
          background: var(--surface2);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .agent-name {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .agent-description {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .services-preview {
          margin-bottom: 20px;
        }

        .services-label {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted);
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .service-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .service-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--surface2);
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }

        .service-price {
          color: var(--accent3);
        }

        .agent-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .price-preview {
          font-size: 14px;
        }

        .price-label {
          color: var(--muted);
          font-size: 11px;
        }

        .price-value {
          font-weight: 700;
          color: var(--accent3);
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(0,210,255,0.1);
          border: 1px solid var(--accent);
          border-radius: 8px;
          color: var(--accent);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-btn:hover {
          background: var(--accent);
          color: #080c14;
        }

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
        }
      `}</style>

      <div className="page-header">
        <div className="page-title-group">
          <h1>Discover</h1>
          <p className="page-subtitle">Browse AI agents and services in the marketplace</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{agents.length}</div>
          <div className="stat-label">TOTAL AGENTS</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{services.length}</div>
          <div className="stat-label">TOTAL SERVICES</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            ${services.filter(s => s.pricePerCall).reduce((min, s) => Math.min(min, parseFloat(s.pricePerCall)), Infinity) || '0'}
          </div>
          <div className="stat-label">STARTING AT</div>
        </div>
      </div>

      <div className="filters-row">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search agents and services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="NLP">NLP</option>
          <option value="VISION">Computer Vision</option>
          <option value="DATA">Data Processing</option>
          <option value="ANALYTICS">Analytics</option>
        </select>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Search size={36} />
          </div>
          <h3 className="empty-title">No agents found</h3>
          <p className="empty-desc">
            {searchQuery 
              ? 'Try adjusting your search query'
              : 'No agents available in the marketplace yet'}
          </p>
        </div>
      ) : (
        <div className="agents-grid">
          {filteredAgents.map(agent => {
            const agentServices = getAgentServices(agent.id);
            const price = getAgentPrice(agent.id);
            
            return (
              <div 
                key={agent.id} 
                className="agent-card"
                onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
              >
                <div className="agent-header">
                  <div className="agent-avatar">
                    {agent.name?.charAt(0) || 'A'}
                  </div>
                  <span className="agent-type">
                    {agent.status || 'ACTIVE'}
                  </span>
                </div>
                
                <h3 className="agent-name">{agent.name}</h3>
                <p className="agent-description">
                  {agent.description || 'No description available'}
                </p>
                
                <div className="services-preview">
                  <div className="services-label">SERVICES</div>
                  <div className="service-tags">
                    {agentServices.slice(0, 3).map(service => (
                      <span key={service.id} className="service-tag">
                        {service.name}
                        <span className="service-price">${service.pricePerCall}</span>
                      </span>
                    ))}
                    {agentServices.length > 3 && (
                      <span className="service-tag">
                        +{agentServices.length - 3} more
                      </span>
                    )}
                    {agentServices.length === 0 && (
                      <span className="service-tag" style={{ color: 'var(--muted)' }}>
                        No services
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="agent-footer">
                  <div className="price-preview">
                    <div className="price-label">Starting at</div>
                    <div className="price-value">
                      {price ? `$${price}` : 'Free'}
                    </div>
                  </div>
                  <button className="view-btn">
                    <Eye size={14} />
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}