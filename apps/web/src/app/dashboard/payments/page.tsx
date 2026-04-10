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
  RefreshCw,
  Star
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
  
  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showViewRatingsModal, setShowViewRatingsModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [selectedAgentForReview, setSelectedAgentForReview] = useState<any>(null);
  const [viewingRatingsAgent, setViewingRatingsAgent] = useState<any>(null);
  const [agentReviews, setAgentReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  
  // User's agents (for ownership check)
  const [userAgents, setUserAgents] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // If connected, fetch payments for user's wallet address
      if (isConnected && publicKey) {
        const paymentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/address/${publicKey}`);
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPayments(paymentsData);
        }
        
        // Fetch user's agents to check ownership
        const userAgentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/address/${publicKey}`);
        if (userAgentsRes.ok) {
          const userAgentsData = await userAgentsRes.json();
          setUserAgents(Array.isArray(userAgentsData) ? userAgentsData : [userAgentsData].filter(Boolean));
        }
      } else {
        // Fetch all payments if not connected
        const paymentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments`);
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPayments(paymentsData);
        }
      }

      // Fetch services for display
      const servicesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/all/list`);
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
  
  // Check if user is the owner of an agent
  const isAgentOwner = (agentId: string) => {
    return userAgents.some(agent => agent.id === agentId);
  };
  
  // Fetch reviews for an agent (for viewing ratings)
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
  
  // Open view ratings modal
  const openViewRatings = async (agent: any) => {
    setViewingRatingsAgent(agent);
    await fetchAgentReviews(agent.id);
    setShowViewRatingsModal(true);
  };

  // User payments are already filtered by wallet address from API
  // Show all transactions where user is buyer OR seller
  const userPayments = payments;

  // Calculate stats - earnings from completed payments where user is seller
  const totalEarned = userPayments
    .filter(p => p.status === 'COMPLETED' && p.sellerAddress?.toLowerCase() === publicKey?.toLowerCase())
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  
  const totalPending = userPayments
    .filter(p => (p.status === 'PENDING' || p.status === 'ESCROW_CREATED') && p.sellerAddress?.toLowerCase() === publicKey?.toLowerCase())
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const totalSpent = isConnected && publicKey
    ? userPayments
        .filter(p => p.buyerAddress?.toLowerCase() === publicKey?.toLowerCase() && p.status === 'COMPLETED')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    : 0;

  // Get service name by ID
  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Unknown Service';
  };

  // Get agent info from service
  const getAgentInfo = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.agent || null;
  };

  // Get unique agents that user has purchased from (for completed payments)
  const getPurchasedAgents = () => {
    const purchasedPayments = userPayments.filter(p => 
      p.buyerAddress?.toLowerCase() === publicKey?.toLowerCase() && 
      p.status === 'COMPLETED'
    );
    
    const agentIds = new Set();
    const purchasedAgents: any[] = [];
    
    purchasedPayments.forEach(payment => {
      const service = services.find(s => s.id === payment.serviceId);
      if (service?.agent && !agentIds.has(service.agent.id)) {
        agentIds.add(service.agent.id);
        purchasedAgents.push(service.agent);
      }
    });
    
    return purchasedAgents;
  };

  // Submit review for an agent
  const submitReview = async () => {
    if (!selectedAgentForReview || !publicKey) return;
    
    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/${selectedAgentForReview.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerAddress: publicKey,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setReviewSuccess('Thank you for your review!');
        setTimeout(() => {
          setShowReviewModal(false);
          setReviewSuccess('');
          setReviewData({ rating: 5, comment: '' });
          setSelectedAgentForReview(null);
        }, 1500);
      } else {
        setReviewError(data.error || 'Failed to submit review');
      }
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
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
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
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
          font-size: 20px;
          font-weight: 700;
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
          max-height: 600px;
          overflow-y: auto;
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
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL EARNED</div>
            <div className="stat-value positive">${totalEarned.toFixed(2)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">PENDING</div>
            <div className="stat-value warning">${totalPending.toFixed(2)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon spent">
            <TrendingDown size={20} />
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
                <th>RATE</th>
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
                  <td>
                    {(() => {
                      const agentInfo = getAgentInfo(payment.serviceId);
                      const isOwner = agentInfo ? isAgentOwner(agentInfo.id) : false;
                      const isBuyer = payment.buyerAddress?.toLowerCase() === publicKey?.toLowerCase();
                      const isCompleted = payment.status === 'COMPLETED';
                      
                      // If user is the agent owner, show View Ratings
                      if (isOwner && agentInfo) {
                        return (
                          <button 
                            onClick={() => openViewRatings(agentInfo)}
                            style={{
                              background: 'transparent',
                              color: 'var(--accent)',
                              border: '1px solid var(--accent)',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            View Ratings
                          </button>
                        );
                      }
                      // If user is buyer and payment completed, show Rate button
                      if (isBuyer && isCompleted && agentInfo) {
                        return (
                          <button 
                            onClick={() => {
                              setSelectedAgentForReview(agentInfo);
                              setShowReviewModal(true);
                            }}
                            style={{
                              background: 'var(--accent)',
                              color: 'var(--bg)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Rate
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedAgentForReview && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)} style={{
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
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Rate {selectedAgentForReview.name}</h2>
              <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Share your experience with this agent</p>
            </div>
            
            {reviewError && (
              <div style={{ padding: '12px', background: 'rgba(255,107,53,0.1)', border: '1px solid var(--warn)', borderRadius: '8px', color: 'var(--warn)', fontSize: '13px', marginBottom: '16px' }}>
                {reviewError}
              </div>
            )}
            
            {reviewSuccess && (
              <div style={{ padding: '12px', background: 'rgba(0,255,157,0.1)', border: '1px solid #00ff9d', borderRadius: '8px', color: '#00ff9d', fontSize: '13px', marginBottom: '16px' }}>
                {reviewSuccess}
              </div>
            )}
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Rating</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Star 
                      size={28} 
                      color={star <= reviewData.rating ? '#fbbf24' : 'rgba(255,255,255,0.2)'} 
                      fill={star <= reviewData.rating ? '#fbbf24' : 'none'}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Comment (optional)</label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                placeholder="Share your experience..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewError('');
                  setReviewData({ rating: 5, comment: '' });
                }}
                style={{
                  padding: '10px 20px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={submitReview}
                disabled={submittingReview}
                style={{
                  padding: '10px 20px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--bg)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: submittingReview ? 'not-allowed' : 'pointer',
                  opacity: submittingReview ? 0.7 : 1
                }}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* View Ratings Modal */}
      {showViewRatingsModal && viewingRatingsAgent && (
        <div className="modal-overlay" onClick={() => setShowViewRatingsModal(false)} style={{
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
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Ratings for {viewingRatingsAgent.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={18} 
                      color={star <= Math.round(viewingRatingsAgent.rating || 0) ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
                      fill={star <= Math.round(viewingRatingsAgent.rating || 0) ? '#fbbf24' : 'none'}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                  <span style={{ fontWeight: 600, color: '#fbbf24' }}>{viewingRatingsAgent.rating || '0.0'}</span>
                  <span> ({viewingRatingsAgent.ratingCount || 0} reviews)</span>
                </span>
              </div>
            </div>
            
            {loadingReviews ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading reviews...</div>
            ) : agentReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                No ratings yet. Be the first to review this agent!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {agentReviews.map((review: any, index: number) => (
                  <div key={review.id || index} style={{
                    padding: '16px',
                    background: 'var(--surface2)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
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
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {review.buyerAddress?.slice(0, 6)}...{review.buyerAddress?.slice(-4)}
                      </span>
                    </div>
                    {review.comment && (
                      <p style={{ fontSize: '14px', color: 'var(--text)', margin: 0 }}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => setShowViewRatingsModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text)',
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