'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search,
  SlidersHorizontal,
  X,
  Zap,
  Star,
  ShoppingCart,
  CheckCircle,
  Activity,
  DollarSign
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function DiscoverPage() {
  const router = useRouter();
  const { address, isConnected } = useStellar();
  const [agents, setAgents] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  
  // Reviews state
  const [selectedAgentForReviews, setSelectedAgentForReviews] = useState<any>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [agentReviews, setAgentReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Get unique service types from actual services
  const serviceTypes = useMemo(() => {
    const types = new Set(services.map(s => s.serviceType).filter(Boolean));
    return Array.from(types);
  }, [services]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, servicesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`)
      ]);
      
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData);
      }
      
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

  // Get service types for an agent
  const getAgentServiceTypes = (agentId: string) => {
    const agentServices = getAgentServices(agentId);
    return [...new Set(agentServices.map(s => s.serviceType).filter(Boolean))];
  };

  // Filter agents with working logic
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      // Search filter - search in agent name, description, and service names
      const agentServices = getAgentServices(agent.id);
      const matchesSearch = !searchQuery || 
        agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agentServices.some((s: any) => s.name?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;
      
      // Type filter - filter by service type
      if (filterType !== 'all') {
        const agentServiceTypes = getAgentServiceTypes(agent.id);
        if (!agentServiceTypes.includes(filterType)) return false;
      }
      
      // Price range filter
      if (priceRange !== 'all') {
        const agentPrice = getAgentPrice(agent.id);
        if (priceRange === 'free') {
          if (agentPrice !== null) return false;
        } else if (priceRange === '0-1') {
          if (agentPrice === null || agentPrice > 1) return false;
        } else if (priceRange === '1-5') {
          if (agentPrice === null || agentPrice < 1 || agentPrice > 5) return false;
        } else if (priceRange === '5+') {
          if (agentPrice === null || agentPrice < 5) return false;
        }
      }
      
      return true;
    });
  }, [agents, services, searchQuery, filterType, priceRange]);

  const handleUseService = async (service: any) => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // First, get the service details to find the seller's address
      const serviceRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/services/${service.id}`
      );
      
      if (!serviceRes.ok) {
        throw new Error('Failed to fetch service details');
      }
      
      const serviceData = await serviceRes.json();
      const agentId = serviceData.agentId;
      
      // Get the agent's owner address (seller)
      const agentRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/${agentId}`
      );
      
      if (!agentRes.ok) {
        throw new Error('Failed to fetch agent details');
      }
      
      const agentData = await agentRes.json();
      const sellerAddress = agentData.ownerAddress;
      
      if (!sellerAddress) {
        throw new Error('Seller address not found');
      }

      // Show confirmation
      const confirmed = confirm(
        `Create escrow for ${service.pricePerCall} XLM?\n\n` +
        `Service: ${service.name}\n` +
        `Seller: ${sellerAddress.slice(0, 6)}...${sellerAddress.slice(-4)}\n\n` +
        `Funds will be held in escrow until you release them after service is delivered.`
      );
      
      if (!confirmed) return;

      // Create escrow payment record (no XLM transferred yet)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          buyerAddress: address,
          amount: service.pricePerCall,
          currency: 'XLM',
        }),
      });


      if (res.ok) {
        const payment = await res.json();
        alert(
          `Escrow created successfully!\n\n` +
          `Escrow ID: ${payment.id}\n` +
          `Amount: ${service.pricePerCall} XLM\n\n` +
          `Go to Escrow tab to release funds once the service is delivered.`
        );
        
        // Refresh the page to show new payment
        router.refresh();
      } else {
        const data = await res.json();
        alert(`Failed to create escrow: ${data.error}`);
      }
    } catch (err: any) {
      console.error('Failed to create escrow:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setPriceRange('all');
  };
  
  // Fetch reviews for an agent
  const fetchAgentReviews = async (agentId: string) => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/${agentId}/reviews`);
      if (res.ok) {
        const reviews = await res.json();
        setAgentReviews(reviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setAgentReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };
  
  // Open reviews modal
  const openReviewsModal = async (agent: any) => {
    setSelectedAgentForReviews(agent);
    await fetchAgentReviews(agent.id);
    setShowReviewsModal(true);
  };

  const hasActiveFilters = searchQuery || filterType !== 'all' || priceRange !== 'all';

  if (loading) {
    return (
      <div className="discover-loading">
        <div className="loading-spinner"></div>
        <style jsx>{`
          .discover-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
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
        .discover-container {
          width: 100%;
        }

        .page-header {
          margin-bottom: 24px;
          width: 100%;
        }

        .page-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 8px;
        }

        .page-title-group h1 {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
          color: var(--text);
        }

        .page-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .results-count {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .results-count .count {
          font-weight: 600;
          color: var(--accent);
        }

        /* Filter Bar */
        .filter-bar {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          width: 100%;
        }

        .filter-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-container {
          flex: 1;
          min-width: 280px;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 48px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 14px;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .search-input::placeholder {
          color: var(--text-secondary);
        }

        .filter-select {
          padding: 12px 36px 12px 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 14px;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          min-width: 140px;
          transition: all 0.2s;
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--accent);
        }

        .clear-filters-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 16px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-secondary);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-filters-btn:hover {
          border-color: #ef4444;
          color: #ef4444;
        }

        /* Agents Grid */
        .agents-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 20px;
          width: 100%;
        }

        /* Agent Card - Matching My Agents Page */
        .agent-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s;
          position: relative;
          cursor: pointer;
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
          color: var(--text);
          margin-bottom: 8px;
        }

        .agent-description {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.5;
          margin-bottom: 20px;
        }

        /* Stats Grid */
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
          font-size: 18px;
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

        .price-stat {
          color: var(--accent) !important;
        }

        /* Service Tags */
        .services-section {
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
          background: rgba(0,210,255,0.1);
          border: 1px solid var(--accent);
          border-radius: 8px;
          font-size: 12px;
          color: var(--accent);
        }

        .service-price {
          color: var(--accent);
          font-weight: 600;
        }

        .no-services {
          padding: 12px;
          background: var(--surface2);
          border-radius: 10px;
          font-size: 13px;
          color: var(--text-secondary);
          text-align: center;
        }

        /* Rating Row */
        .rating-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }

        .stars {
          display: flex;
          gap: 2px;
        }

        .star {
          color: #fbbf24;
        }

        .star.empty {
          color: var(--border);
        }

        .rating-text {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .rating-value {
          font-weight: 600;
          color: #fbbf24;
        }

        /* Card Footer */
        .card-footer {
          display: flex;
          gap: 10px;
        }

        .btn-buy {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--accent);
          color: #080c14;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-buy:hover {
          background: #33ddff;
        }

        .btn-view {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 20px;
          background: var(--surface2);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-view:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: var(--surface);
          border: 1px dashed var(--border);
          border-radius: 16px;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: var(--surface2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        .empty-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--text);
        }

        .empty-desc {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        .empty-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: var(--accent);
          color: #080c14;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .empty-action:hover {
          transform: scale(1.02);
        }

        /* Mobile Responsive */
        @media (max-width: 900px) {
          .agents-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .filter-row {
            flex-direction: column;
          }
          
          .search-container,
          .filter-select {
            width: 100%;
          }
          
          .agent-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="discover-container" style={{ maxWidth: '100%', padding: '0 8px' }}>
        {/* Header */}
        <div className="page-header">
          <div className="page-title-row">
            <div className="page-title-group">
              <h1>Discover</h1>
              <p className="page-subtitle">Browse and purchase AI agents from the marketplace</p>
            </div>
            <div className="results-count">
              <span className="count">{filteredAgents.length}</span>
              <span>agents found</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-row">
            {/* Search */}
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search agents, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Categories</option>
              {serviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Price Filter */}
            <select
              className="filter-select"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              <option value="all">All Prices</option>
              <option value="free">Free</option>
              <option value="0-1">Under $1</option>
              <option value="1-5">$1 - $5</option>
              <option value="5+">$5+</option>
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Agents Grid or Empty State */}
        {filteredAgents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Search size={36} />
            </div>
            <h3 className="empty-title">No agents found</h3>
            <p className="empty-desc">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search query'
                : 'No agents available yet. Be the first to list your agent!'}
            </p>
            {hasActiveFilters && (
              <button className="empty-action" onClick={clearFilters}>
                <X size={18} />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="agents-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', width: '100%' }}>
            {filteredAgents.map(agent => {
              const agentServices = getAgentServices(agent.id);
              const price = getAgentPrice(agent.id);
              const serviceCount = agentServices.length;
              
              return (
                <div 
                  key={agent.id} 
                  className="agent-card"
                  style={{
                    background: 'linear-gradient(180deg, rgba(13,20,32,0.98) 0%, rgba(8,12,20,1) 100%)',
                    border: '1px solid rgba(0,210,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                    position: 'relative',
                    minHeight: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px',
                    boxSizing: 'border-box',
                  }}
                  onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                >
                  {/* Gradient border overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(0,210,255,0.1) 0%, transparent 50%, rgba(123,111,255,0.1) 100%)',
                    pointerEvents: 'none',
                  }} />
                  
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #00d2ff 0%, #7b6fff 100%)',
                        boxShadow: '0 4px 12px rgba(0,210,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'white',
                        flexShrink: 0,
                      }}>
                        {agent.name?.charAt(0) || 'A'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#e8f4ff',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>{agent.name}</h3>
                        <span style={{
                          fontSize: '11px',
                          color: 'rgba(232,244,255,0.5)',
                        }}>{serviceCount} service{serviceCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{
                        background: agent.status === 'ACTIVE' ? 'rgba(0,255,157,0.12)' : 'rgba(255,107,53,0.12)',
                        border: `1px solid ${agent.status === 'ACTIVE' ? 'rgba(0,255,157,0.3)' : 'rgba(255,107,53,0.3)'}`,
                        padding: '4px 8px',
                        borderRadius: '20px',
                        fontSize: '9px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                      }}>
                        <span style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: agent.status === 'ACTIVE' ? '#00ff9d' : '#ff6b35',
                        }} />
                        <span style={{ color: agent.status === 'ACTIVE' ? '#00ff9d' : '#ff6b35' }}>{agent.status || 'ACTIVE'}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Card Body - fills remaining space */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* Rating Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={14} 
                            color={star <= Math.round(agent.rating || 0) ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
                            fill={star <= Math.round(agent.rating || 0) ? '#fbbf24' : 'none'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: 'rgba(232,244,255,0.5)' }}>
                        <span style={{ fontWeight: 600, color: '#fbbf24' }}>{agent.rating || '0.0'}</span>
                        <span> ({agent.ratingCount || 0})</span>
                      </span>
                      {(agent.ratingCount || 0) > 0 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openReviewsModal(agent);
                          }}
                          style={{
                            marginLeft: '8px',
                            padding: '4px 8px',
                            background: 'rgba(0,210,255,0.1)',
                            border: '1px solid rgba(0,210,255,0.3)',
                            borderRadius: '4px',
                            color: '#00d2ff',
                            fontSize: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          Reviews
                        </button>
                      )}
                    </div>
                    
                    {/* Price Section */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '16px',
                      marginBottom: '16px',
                      borderTop: '1px solid rgba(0,210,255,0.15)',
                    }}>
                      <span style={{
                        fontSize: '13px',
                        color: 'rgba(232,244,255,0.6)',
                      }}>Starting at</span>
                      <span style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#ffaa00',
                      }}>
                        {price !== null ? `${price}` : 'Free'}
                      </span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/agents/${agent.id}`);
                        }}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '12px 16px',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#e8f4ff',
                          border: '1px solid rgba(0,210,255,0.3)',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        View
                      </button>
                      {address && agent.ownerAddress && address.toLowerCase() === agent.ownerAddress.toLowerCase() ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/agents/${agent.id}`);
                          }}
                          disabled
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'rgba(232,244,255,0.4)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'not-allowed',
                          }}
                        >
                          Your Agent
                        </button>
                      ) : (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (agentServices.length > 0) {
                              await handleUseService(agentServices[0]);
                            } else {
                              router.push(`/dashboard/agents/${agent.id}`);
                            }
                          }}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, #00d2ff 0%, #7b6fff 100%)',
                            color: '#080c14',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <ShoppingCart size={14} />
                          Buy Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Reviews Modal */}
      {showReviewsModal && selectedAgentForReviews && (
        <div className="modal-overlay" onClick={() => setShowReviewsModal(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{
            background: 'linear-gradient(180deg, rgba(13,20,32,0.98) 0%, rgba(8,12,20,1) 100%)',
            border: '1px solid rgba(0,210,255,0.3)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#e8f4ff' }}>Reviews for {selectedAgentForReviews.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={18} 
                      color={star <= Math.round(selectedAgentForReviews.rating || 0) ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
                      fill={star <= Math.round(selectedAgentForReviews.rating || 0) ? '#fbbf24' : 'none'}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '14px', color: 'rgba(232,244,255,0.5)' }}>
                  <span style={{ fontWeight: 600, color: '#fbbf24' }}>{selectedAgentForReviews.rating || '0.0'}</span>
                  <span> ({selectedAgentForReviews.ratingCount || 0} reviews)</span>
                </span>
              </div>
            </div>
            
            {loadingReviews ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(232,244,255,0.5)' }}>Loading reviews...</div>
            ) : agentReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(232,244,255,0.5)' }}>
                No ratings yet. Be the first to review this agent!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {agentReviews.map((review: any, index: number) => (
                  <div key={review.id || index} style={{
                    padding: '16px',
                    background: 'rgba(0,210,255,0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,210,255,0.15)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={14} 
                            color={star <= review.rating ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
                            fill={star <= review.rating ? '#fbbf24' : 'none'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: 'rgba(232,244,255,0.5)' }}>
                        {review.buyerAddress?.slice(0, 6)}...{review.buyerAddress?.slice(-4)}
                      </span>
                    </div>
                    {review.comment && (
                      <p style={{ fontSize: '14px', color: '#e8f4ff', margin: 0 }}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => setShowReviewsModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(0,210,255,0.3)',
                  borderRadius: '8px',
                  color: '#e8f4ff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}