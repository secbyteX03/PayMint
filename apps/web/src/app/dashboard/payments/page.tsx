'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function PaymentsPage() {
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
      // Fetch all payments
      const paymentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments`);
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }

      // Fetch services for display
      const servicesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/all/list`);
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }

      // Fetch agents for display
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

  // Filter payments for user's agents (as seller)
  const userPayments = isConnected && publicKey
    ? payments.filter(p => {
        const service = services.find(s => s.id === p.serviceId);
        const agent = service ? agents.find(a => a.id === service.agentId) : null;
        return agent?.ownerAddress?.toLowerCase() === publicKey?.toLowerCase();
      })
    : [];

  // Calculate stats
  const totalEarned = userPayments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  
  const totalPending = userPayments
    .filter(p => p.status === 'PENDING' || p.status === 'ESCROW_CREATED')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const totalSpent = isConnected && publicKey
    ? payments
        .filter(p => p.buyerAddress?.toLowerCase() === publicKey?.toLowerCase() && p.status === 'COMPLETED')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    : 0;

  // Get service name by ID
  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Unknown Service';
  };

  // Filter payments
  const filteredPayments = userPayments.filter(p => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle size={16} color="#00ff9d" />;
      case 'PENDING':
      case 'ESCROW_CREATED':
        return <Clock size={16} color="var(--accent3)" />;
      case 'REFUNDED':
        return <RefreshCw size={16} color="var(--warn)" />;
      default:
        return <AlertCircle size={16} color="var(--muted)" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

        .stat-icon.earned {
          background: rgba(0,255,157,0.1);
          color: #00ff9d;
        }

        .stat-icon.pending {
          background: rgba(255,170,0,0.1);
          color: var(--accent3);
        }

        .stat-icon.spent {
          background: rgba(255,107,53,0.1);
          color: var(--warn);
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

        .stat-value.positive {
          color: #00ff9d;
        }

        .stat-value.warning {
          color: var(--accent3);
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

        /* Table */
        .table-container {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
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

        .service-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .service-name {
          font-weight: 600;
        }

        .service-agent {
          font-size: 12px;
          color: var(--muted);
        }

        .amount-cell {
          font-family: var(--mono);
          font-weight: 700;
          font-size: 15px;
        }

        .amount-cell.earned {
          color: #00ff9d;
        }

        .amount-cell.spent {
          color: var(--warn);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 600;
        }

        .status-completed {
          background: rgba(0,255,157,0.15);
          color: #00ff9d;
        }

        .status-pending {
          background: rgba(255,170,0,0.15);
          color: var(--accent3);
        }

        .status-refunded {
          background: rgba(255,107,53,0.15);
          color: var(--warn);
        }

        .hash-cell {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted);
        }

        .time-cell {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--muted);
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
          <h1>Payments</h1>
          <p className="page-subtitle">Track your earnings and spending</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon earned">
            <TrendingUp size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL EARNED</div>
            <div className="stat-value positive">${totalEarned.toFixed(2)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">PENDING</div>
            <div className="stat-value warning">${totalPending.toFixed(2)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon spent">
            <TrendingDown size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL SPENT</div>
            <div className="stat-value">${totalSpent.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="filters-row">
        <button 
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('COMPLETED')}
        >
          Completed
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilterStatus('PENDING')}
        >
          Pending
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'REFUNDED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('REFUNDED')}
        >
          Refunded
        </button>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <DollarSign size={36} />
          </div>
          <h3 className="empty-title">No payments found</h3>
          <p className="empty-desc">
            {filterStatus !== 'all' 
              ? 'Try adjusting your filters'
              : 'Your payment history will appear here when customers use your services.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SERVICE</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>TRANSACTION</th>
                <th>DATE</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(payment => (
                <tr key={payment.id}>
                  <td>
                    <div className="service-cell">
                      <span className="service-name">{getServiceName(payment.serviceId)}</span>
                      <span className="service-agent">Payment ID: {payment.id.slice(0, 8)}...</span>
                    </div>
                  </td>
                  <td>
                    <span className={`amount-cell ${payment.status === 'COMPLETED' ? 'earned' : ''}`}>
                      ${parseFloat(payment.amount || 0).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${payment.status?.toLowerCase()}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <span className="hash-cell">
                      {payment.transactionHash 
                        ? `${payment.transactionHash.slice(0, 10)}...${payment.transactionHash.slice(-8)}`
                        : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <span className="time-cell">
                      {payment.createdAt ? formatDate(payment.createdAt) : 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}