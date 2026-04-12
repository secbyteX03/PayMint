'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Code,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function PurchasesPage() {
  const router = useRouter();
  const { publicKey, isConnected } = useStellar();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      if (isConnected && publicKey) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/buyer/${publicKey}`);
        if (res.ok) {
          const data = await res.json();
          setPurchases(data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getApiEndpoint = (agent: any, service: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${baseUrl}/api/services/agent/${agent?.id}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { label: 'Completed', color: '#00ff9d', icon: CheckCircle };
      case 'PENDING':
        return { label: 'Pending', color: '#ffaa00', icon: Clock };
      case 'ESCROW_CREATED':
        return { label: 'In Escrow', color: '#00ddff', icon: Clock };
      case 'REFUNDED':
      case 'CANCELLED':
        return { label: status, color: '#ff5555', icon: AlertCircle };
      default:
        return { label: status, color: '#888', icon: Clock };
    }
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

  // Pagination logic
  const totalPurchasePages = Math.ceil(purchases.length / ITEMS_PER_PAGE);
  const paginatedPurchases = purchases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToNextPage = () => {
    if (currentPage < totalPurchasePages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <>
      <style jsx>{`
        .purchases-container {
          width: 100%;
        }

        .page-header {
          margin-bottom: 24px;
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

        .purchases-count {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .purchases-count .count {
          font-weight: 600;
          color: var(--accent);
        }

        /* Purchases Grid */
        .purchases-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
        }

        .purchase-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: border-color 0.2s;
        }

        .purchase-card:hover {
          border-color: var(--border2);
        }

        .purchase-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .purchase-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(0, 210, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          margin-right: 16px;
        }

        .purchase-info {
          flex: 1;
        }

        .service-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
        }

        .agent-name {
          font-size: 13px;
          color: var(--text-secondary);
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

        .purchase-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px;
          background: var(--surface2);
          border-radius: 10px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 11px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }

        .purchase-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
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
          background: var(--surface2);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          border-color: var(--border2);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--surface2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: var(--text-secondary);
        }

        .empty-state h2 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--text);
        }

        .empty-state p {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        /* Integration Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 32px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
        }

        .modal-close {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--surface2);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text);
        }

        .integration-section {
          margin-bottom: 24px;
        }

        .integration-section h3 {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .code-block {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text);
          overflow-x: auto;
          margin-bottom: 8px;
        }

        .copy-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-copy {
          padding: 6px 12px;
          font-size: 11px;
        }

        .instructions {
          background: var(--surface2);
          border-radius: 10px;
          padding: 16px;
        }

        .instructions ol {
          margin: 0;
          padding-left: 20px;
        }

        .instructions li {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .instructions li:last-child {
          margin-bottom: 0;
        }
      `}</style>

      <div className="purchases-container">
        <div className="page-header">
          <div className="page-title-row">
            <div className="page-title-group">
              <h1>My Purchases</h1>
              <p className="page-subtitle">Services you've purchased from the marketplace</p>
            </div>
            <div className="purchases-count">
              <span className="count">{purchases.length}</span> total purchases
            </div>
          </div>
        </div>

        {purchases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Package size={32} />
            </div>
            <h2>No Purchases Yet</h2>
            <p>When you buy services from the marketplace, they will appear here.</p>
            <button 
              className="btn btn-primary"
              onClick={() => router.push('/dashboard/discover')}
            >
              <Zap size={16} />
              Discover Agents
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="purchases-grid">
            {paginatedPurchases.map((purchase) => {
              const service = purchase.service;
              const agent = purchase.agent;
              const statusInfo = getStatusInfo(purchase.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div key={purchase.id} className="purchase-card">
                  <div className="purchase-header">
                    <div className="purchase-icon">
                      <Package size={24} />
                    </div>
                    <div className="purchase-info">
                      <div className="service-name">{service?.name || 'Unknown Service'}</div>
                      <div className="agent-name">by {agent?.name || 'Unknown Agent'}</div>
                    </div>
                    <div className="status-badge" style={{ background: `${statusInfo.color}20`, color: statusInfo.color }}>
                      <StatusIcon size={12} />
                      {statusInfo.label}
                    </div>
                  </div>

                  <div className="purchase-details">
                    <div className="detail-item">
                      <span className="detail-label">Amount</span>
                      <span className="detail-value">{purchase.amount} {purchase.currency}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date</span>
                      <span className="detail-value">{formatDate(purchase.createdAt)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Service Type</span>
                      <span className="detail-value">{service?.serviceType || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Price per Call</span>
                      <span className="detail-value">{service?.pricePerCall} {service?.currency}</span>
                    </div>
                  </div>

                  <div className="purchase-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedPurchase(purchase);
                        setShowIntegrationModal(true);
                      }}
                    >
                      <Code size={16} />
                      Integration
                    </button>
                    {agent?.documentationUrl && (
                      <a 
                        href={agent.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                      >
                        <BookOpen size={16} />
                        Docs
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Integration Modal */}
      {showIntegrationModal && selectedPurchase && (
        <div className="modal-overlay" onClick={() => setShowIntegrationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Integration Guide</h2>
              <button 
                className="modal-close"
                onClick={() => setShowIntegrationModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="integration-section">
              <h3><Zap size={16} /> API Endpoint</h3>
              <div className="code-block">
                {getApiEndpoint(selectedPurchase.agent, selectedPurchase.service)}
              </div>
              <div className="copy-row">
                <button 
                  className="btn btn-secondary btn-copy"
                  onClick={() => copyToClipboard(
                    getApiEndpoint(selectedPurchase.agent, selectedPurchase.service),
                    'endpoint'
                  )}
                >
                  {copiedField === 'endpoint' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedField === 'endpoint' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="integration-section">
              <h3><DollarSign size={16} /> x402 Payment Header</h3>
              <div className="code-block">
{`// Get payment header before making request
const header = await fetch('${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payments/x402/header', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serviceId: '${selectedPurchase.service?.id}',
    buyerAddress: '${publicKey}'
  })
}).then(r => r.json());

// Include header in your API request
fetch('${getApiEndpoint(selectedPurchase.agent, selectedPurchase.service)}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Payment-Scheme': header.scheme,
    'X-Payment-Amount': header.amount,
    'X-Payment-Recipient': header.recipient,
    'X-Payment-Token': header.token || '',
  },
  body: JSON.stringify({ /* your request data */ })
});`}
              </div>
            </div>

            <div className="integration-section">
              <h3><BookOpen size={16} /> How to Use</h3>
              <div className="instructions">
                <ol>
                  <li>Copy the API endpoint above</li>
                  <li>Get a payment header using the x402 endpoint with your service ID</li>
                  <li>Make API requests including the payment header</li>
                  <li>Funds are held in escrow and released when service is delivered</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {purchases.length > ITEMS_PER_PAGE && (
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
            Page {currentPage} of {totalPurchasePages}
          </span>
          <button
            className="btn btn-secondary"
            onClick={goToNextPage}
            disabled={currentPage === totalPurchasePages}
            style={{ opacity: currentPage === totalPurchasePages ? 0.5 : 1, cursor: currentPage === totalPurchasePages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}