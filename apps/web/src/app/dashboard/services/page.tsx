'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Code,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  DollarSign,
  Activity
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function ServicesPage() {
  const router = useRouter();
  const { address, isConnected } = useStellar();
  const [services, setServices] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditService, setShowEditService] = useState<any | null>(null);
  const [showDeleteService, setShowDeleteService] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 2;

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
    agentId: '',
  });
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState('');

  useEffect(() => {
    if (isConnected && address) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchData = async () => {
    try {
      // First, get the user's agent(s) by address
      const agentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/address/${address}`);
      let userAgentIds: string[] = [];
      
      if (agentsRes.ok) {
        const userAgents = await agentsRes.json();
        if (userAgents) {
          // Handle both single agent and array of agents
          const agentsArray = Array.isArray(userAgents) ? userAgents : [userAgents];
          userAgentIds = agentsArray.map((a: any) => a.id);
          setAgents(agentsArray);
        }
      }

      // If no user agents found, fetch all agents for selection
      if (userAgentIds.length === 0) {
        const allAgentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents`);
        if (allAgentsRes.ok) {
          const allAgents = await allAgentsRes.json();
          setAgents(allAgents);
        }
      }

      // Fetch services - all services will be fetched, then filtered for user's agents
      const servicesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/all/list`);
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        // Filter to only show services belonging to user's agents
        const filteredServices = servicesData.filter((s: any) => userAgentIds.includes(s.agentId));
        setServices(filteredServices);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!serviceData.name || !serviceData.pricePerCall || !serviceData.agentId) {
      setServiceError('Service name, price, and agent are required');
      return;
    }

    setSavingService(true);
    setServiceError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/register`, {
        method: 'POST',
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
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
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
          agentId: '',
        });
        fetchData();
      } else {
        const data = await res.json();
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
      fetchData();
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
      fetchData();
    } catch (err) {
      console.error('Failed to update service status:', err);
    }
  };

  const handleUpdateService = async () => {
    if (!showEditService) return;
    if (!serviceData.name || !serviceData.pricePerCall) {
      setServiceError('Service name and price are required');
      return;
    }

    setSavingService(true);
    setServiceError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${showEditService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

      if (res.ok) {
        setShowEditService(null);
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
          agentId: '',
        });
        fetchData();
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

  const openEditModal = (service: any) => {
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
      agentId: service.agentId || '',
    });
    setShowEditService(service);
    setMenuOpen(null);
  };

  // Get agent name by ID
  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || 'Unknown Agent';
  };

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesAgent = filterAgent === 'all' || service.agentId === filterAgent;
    const matchesSearch = !searchQuery || 
      service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAgent && matchesSearch;
  });

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

  // Pagination logic
  const totalServicePages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToNextPage = () => {
    if (currentPage < totalServicePages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="page-content">
      <style jsx>{`
        .page-content {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

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
        }

        /* Filters */
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
          min-width: 180px;
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--accent);
        }

        /* Table */
        .table-container {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          min-height: 450px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 1px;
          text-align: left;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          background: var(--surface2);
          font-weight: 600;
        }

        td {
          font-size: 14px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        tr:last-child td {
          border-bottom: none;
        }

        tr:hover td {
          background: rgba(0,210,255,0.03);
        }

        .service-name-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .service-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--accent2), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }

        .service-info {
          min-width: 0;
        }

        .service-name {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .service-desc {
          font-size: 12px;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
        }

        .agent-name {
          color: var(--accent);
          cursor: pointer;
        }

        .agent-name:hover {
          text-decoration: underline;
        }

        .price-cell {
          font-family: var(--mono);
          font-weight: 700;
          color: var(--accent3);
        }

        .usage-cell {
          font-family: var(--mono);
          font-size: 13px;
          color: var(--muted);
        }

        .status-badge {
          display: inline-flex;
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

        .actions-cell {
          position: relative;
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

        .menu-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
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

        .btn-secondary {
          background: var(--surface2);
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

        .error-message {
          background: rgba(255,107,53,0.1);
          border: 1px solid var(--warn);
          border-radius: 8px;
          padding: 12px 16px;
          color: var(--warn);
          font-size: 13px;
          margin-bottom: 16px;
        }
      `}</style>

      <div className="page-header">
        <div className="page-title-group">
          <h1>Services</h1>
          <p className="page-subtitle">Manage all services across your agents</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/dashboard/services/new')}>
          <Code size={18} />
          Add Service
        </button>
      </div>

      <div className="filters-row">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
        >
          <option value="all">All Agents</option>
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>{agent.name}</option>
          ))}
        </select>
      </div>

      {filteredServices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Code size={36} />
          </div>
          <h3 className="empty-title">No services found</h3>
          <p className="empty-desc">
            {searchQuery || filterAgent !== 'all' 
              ? 'Try adjusting your filters'
              : 'Create your first service to get started'}
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard/services/new')}>
            <Code size={18} />
            Add Service
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SERVICE</th>
                <th>AGENT</th>
                <th>TYPE</th>
                <th>PRICE</th>
                <th>USAGE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedServices.map(service => (
                <tr key={service.id}>
                  <td>
                    <div className="service-name-cell">
                      <div className="service-icon">
                        {service.name?.charAt(0) || 'S'}
                      </div>
                      <div className="service-info">
                        <div className="service-name">{service.name}</div>
                        <div className="service-desc">{service.description || 'No description'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="agent-name"
                      onClick={() => router.push(`/dashboard/agents/${service.agentId}`)}
                    >
                      {getAgentName(service.agentId)}
                    </span>
                  </td>
                  <td>{service.serviceType || 'Custom'}</td>
                  <td className="price-cell">${service.pricePerCall || '0'}</td>
                  <td className="usage-cell">{service.totalCalls || 0}</td>
                  <td>
                    <span className={`status-badge ${service.isActive ? 'status-active' : 'status-inactive'}`}>
                      <span style={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        background: service.isActive ? '#00ff9d' : 'var(--warn)',
                        display: 'inline-block'
                      }}></span>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="btn-icon"
                      onClick={() => setMenuOpen(menuOpen === service.id ? null : service.id)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {menuOpen === service.id && (
                      <div className="menu-dropdown">
                        <button 
                          className="menu-item"
                          onClick={() => {
                            router.push(`/dashboard/agents/${service.agentId}`);
                            setMenuOpen(null);
                          }}
                        >
                          <Activity size={14} />
                          View Agent
                        </button>
                        <button 
                          className="menu-item"
                          onClick={() => {
                            router.push(`/dashboard/services/${service.id}/edit`);
                          }}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button 
                          className="menu-item"
                          onClick={() => {
                            toggleServiceStatus(service.id, service.isActive);
                            setMenuOpen(null);
                          }}
                        >
                          {service.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button 
                          className="menu-item danger"
                          onClick={() => {
                            setShowDeleteService(service.id);
                            setMenuOpen(null);
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredServices.length > 0 && (
        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px', padding: '16px' }}>
          <button
            className="btn btn-secondary"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          <span style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--mono)' }}>
            Page {currentPage} of {totalServicePages}
          </span>
          <button
            className="btn btn-secondary"
            onClick={goToNextPage}
            disabled={currentPage === totalServicePages}
            style={{ opacity: currentPage === totalServicePages ? 0.5 : 1, cursor: currentPage === totalServicePages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setServiceError(''); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Service</h2>
              <button className="modal-close" onClick={() => { setShowCreateModal(false); setServiceError(''); }}>×</button>
            </div>
            <div className="modal-body">
              {serviceError && <div className="error-message">{serviceError}</div>}
              <div className="form-group">
                <label className="form-label">AGENT *</label>
                <select
                  className="form-input"
                  value={serviceData.agentId}
                  onChange={(e) => setServiceData({ ...serviceData, agentId: e.target.value })}
                >
                  <option value="">Select an agent</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
              </div>
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
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
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


      {/* Edit Service Modal */}
      {showEditService && (
        <div className="modal-overlay" onClick={() => { setShowEditService(null); setServiceError(''); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Service</h2>
              <button className="modal-close" onClick={() => { setShowEditService(null); setServiceError(''); }}>×</button>
            </div>
            <div className="modal-body">
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
              <button className="btn btn-secondary" onClick={() => { setShowEditService(null); setServiceError(''); }}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleUpdateService}
                disabled={savingService}
              >
                {savingService ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}