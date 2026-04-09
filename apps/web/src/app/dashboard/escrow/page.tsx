'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function EscrowPage() {
  const router = useRouter();
  const { publicKey, isConnected } = useStellar();
  const [payments, setPayments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const paymentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments`);
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }

      const servicesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/all/list`);
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }

      const agentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents`);
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter escrow payments (PENDING, ESCROW_CREATED, COMPLETED)
  const escrowPayments = payments.filter(p => 
    p.status === 'PENDING' || 
    p.status === 'ESCROW_CREATED' || 
    p.status === 'COMPLETED'
  );

  // Get user's escrow payments (as seller)
  const userEscrows = isConnected && publicKey
    ? escrowPayments.filter(p => {
        const service = services.find(s => s.id === p.serviceId);
        const agent = service ? agents.find(a => a.id === service.agentId) : null;
        return agent?.ownerAddress?.toLowerCase() === publicKey?.toLowerCase();
      })
    : [];

  const pendingEscrows = userEscrows.filter(p => 
    p.status === 'PENDING' || p.status === 'ESCROW_CREATED'
  );
  
  const completedEscrows = userEscrows.filter(p => p.status === 'COMPLETED');
  
  const totalInEscrow = pendingEscrows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalReleased = completedEscrows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Unknown Service';
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pending', color: 'var(--accent3)', icon: Clock };
      case 'ESCROW_CREATED':
        return { label: 'In Escrow', color: 'var(--accent)', icon: ShieldCheck };
      case 'COMPLETED':
        return { label: 'Released', color: '#00ff9d', icon: CheckCircle };
      default:
        return { label: status, color: 'var(--muted)', icon: AlertCircle };
    }
  };

  const filteredEscrows = userEscrows.filter(e => {
    if (filterStatus === 'all') return true;
    return e.status === filterStatus;
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

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.pending {
          background: rgba(255,170,0,0.1);
          color: var(--accent3);
        }

        .stat-icon.escrow {
          background: rgba(0,210,255,0.1);
          color: var(--accent);
        }

        .stat-icon.released {
          background: rgba(0,255,157,0.1);
          color: #00ff9d;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
        }

        .stat-value.warning {
          color: var(--accent3);
        }

        .stat-value.accent {
          color: var(--accent);
        }

        .stat-value.positive {
          color: #00ff9d;
        }

        /* Filters */
        .filters-row {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          border-color: var(--border2);
          color: var(--text);
        }

        .filter-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #080c14;
        }

        /* Escrow List */
        .escrow-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .escrow-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: border-color 0.2s;
        }

        .escrow-item:hover {
          border-color: var(--border2);
        }

        .escrow-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .escrow-icon.pending {
          background: rgba(255,170,0,0.1);
          color: var(--accent3);
        }

        .escrow-icon.escrow {
          background: rgba(0,210,255,0.1);
          color: var(--accent);
        }

        .escrow-icon.released {
          background: rgba(0,255,157,0.1);
          color: #00ff9d;
        }

        .escrow-info {
          flex: 1;
        }

        .escrow-service {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .escrow-meta {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted);
        }

        .escrow-amount {
          text-align: right;
          margin-right: 20px;
        }

        .amount-value {
          font-size: 22px;
          font-weight: 800;
          color: var(--accent3);
        }

        .amount-usdc {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted);
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-pending {
          background: rgba(255,170,0,0.15);
          color: var(--accent3);
        }

        .status-escrow {
          background: rgba(0,210,255,0.15);
          color: var(--accent);
        }

        .status-completed {
          background: rgba(0,255,157,0.15);
          color: #00ff9d;
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
          max-width: 400px;
          margin: 0 auto;
        }
      `}</style>

      <div className="page-header">
        <div className="page-title-group">
          <h1>Escrow</h1>
          <p className="page-subtitle">Secure transactions and payment release</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">PENDING ESCROWS</div>
            <div className="stat-value warning">${totalInEscrow.toFixed(2)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon escrow">
            <ShieldCheck size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">ACTIVE ESCROWS</div>
            <div className="stat-value accent">{pendingEscrows.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon released">
            <CheckCircle size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL RELEASED</div>
            <div className="stat-value positive">${totalReleased.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="filters-row">
        <button 
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All ({userEscrows.length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilterStatus('PENDING')}
        >
          Pending ({pendingEscrows.length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'ESCROW_CREATED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('ESCROW_CREATED')}
        >
          In Escrow
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('COMPLETED')}
        >
          Released ({completedEscrows.length})
        </button>
      </div>

      {filteredEscrows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <ShieldCheck size={36} />
          </div>
          <h3 className="empty-title">No escrows found</h3>
          <p className="empty-desc">
            {filterStatus !== 'all' 
              ? 'Try adjusting your filters'
              : 'Your escrow transactions will appear here when payments are made for your services.'}
          </p>
        </div>
      ) : (
        <div className="escrow-list">
          {filteredEscrows.map(escrow => {
            const statusInfo = getStatusInfo(escrow.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div key={escrow.id} className="escrow-item">
                <div className={`escrow-icon ${escrow.status === 'COMPLETED' ? 'released' : escrow.status === 'ESCROW_CREATED' ? 'escrow' : 'pending'}`}>
                  <StatusIcon size={24} />
                </div>
                <div className="escrow-info">
                  <div className="escrow-service">{getServiceName(escrow.serviceId)}</div>
                  <div className="escrow-meta">
                    ID: {escrow.id.slice(0, 12)}... • {new Date(escrow.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="escrow-amount">
                  <div className="amount-value">${parseFloat(escrow.amount || 0).toFixed(2)}</div>
                  <div className="amount-usdc">USDC</div>
                </div>
                <div className={`status-badge status-${escrow.status === 'ESCROW_CREATED' ? 'escrow' : escrow.status?.toLowerCase()}`}>
                  <StatusIcon size={14} />
                  {statusInfo.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}