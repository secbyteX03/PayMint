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
  DollarSign,
  XCircle,
  HelpCircle,
  FileText,
  Info
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function EscrowPage() {
  const router = useRouter();
  const { publicKey, isConnected, signAndSubmitTransaction } = useStellar();
  const [payments, setPayments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [releasing, setReleasing] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [showRefundConfirm, setShowRefundConfirm] = useState<string | null>(null);
  const [showDisputeConfirm, setShowDisputeConfirm] = useState<string | null>(null);
  const [showResolveDisputeConfirm, setShowResolveDisputeConfirm] = useState<string | null>(null);
  const [showRefundReason, setShowRefundReason] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [resolveDecision, setResolveDecision] = useState<'refund' | 'release' | null>(null);

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
      } else {
        // Fetch all payments if not connected
        const paymentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments`);
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPayments(paymentsData);
        }
      }

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

  // Filter escrow payments (PENDING, ESCROW_CREATED, COMPLETED)
  // Now payments are already filtered by API to user's wallet
  const userEscrows = payments;

  const pendingEscrows = userEscrows.filter(p => 
    p.status === 'PENDING' || p.status === 'ESCROW_CREATED'
  );

  // In progress includes escrow created and refund requested
  const inProgressEscrows = userEscrows.filter(p => 
    p.status === 'ESCROW_CREATED' || p.status === 'REFUND_REQUESTED'
  );

  const completedEscrows = userEscrows.filter(p => p.status === 'COMPLETED');
  const refundedEscrows = userEscrows.filter(p => p.status === 'REFUNDED');
  const disputedEscrows = userEscrows.filter(p => p.status === 'DISPUTED');
  
  const totalInEscrow = pendingEscrows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalReleased = completedEscrows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalRefunded = refundedEscrows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

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
      case 'REFUND_REQUESTED':
        return { label: 'Refund Requested', color: '#ff9500', icon: AlertCircle };
      case 'REFUND_REJECTED':
        return { label: 'Refund Rejected', color: '#ff6b6b', icon: XCircle };
      case 'COMPLETED':
        return { label: 'Released', color: '#00ff9d', icon: CheckCircle };
      case 'REFUNDED':
        return { label: 'Refunded', color: '#ff6b6b', icon: RefreshCw };
      case 'DISPUTED':
        return { label: 'Disputed', color: '#ff00ff', icon: AlertCircle };
      case 'CANCELLED':
        return { label: 'Cancelled', color: 'var(--muted)', icon: XCircle };
      default:
        return { label: status, color: 'var(--muted)', icon: AlertCircle };
    }
  };

  const filteredEscrows = userEscrows.filter(e => {
    if (filterStatus === 'all') return true;
    return e.status === filterStatus;
  });
  
  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);
  
  // Paginate
  const paginatedEscrows = filteredEscrows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredEscrows.length / ITEMS_PER_PAGE);

  const handleRelease = async (paymentId: string) => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    // Find the payment
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
      alert('Payment not found');
      return;
    }

    const confirmed = confirm(
      `Release ${payment.amount} XLM to seller?\n\n` +
      `This will send the escrowed funds from the escrow wallet to the seller.`
    );
    
    if (!confirmed) return;

    setReleasing(paymentId);
    try {
      // Call the release API - backend handles escrow transaction (signs from escrow wallet)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Dispatch notification for successful escrow release
        window.dispatchEvent(new CustomEvent('add-notification', {
          detail: {
            message: `Escrow released: ${payment.amount} XLM to ${payment.sellerAddress?.slice(0, 6)}...${payment.sellerAddress?.slice(-4)}`,
            type: 'success',
            timestamp: new Date().toISOString()
          }
        }));

        alert(
          `Funds released successfully!\n\n` +
          `Amount: ${payment.amount} XLM\n` +
          `Seller: ${payment.sellerAddress?.slice(0, 6)}...${payment.sellerAddress?.slice(-4)}\n\n` +
          `The seller has received the payment from escrow.`
        );
        fetchData();
      } else {
        console.error('Failed to release:', data.error);
        alert(`Error: ${data.error || 'Failed to release escrow'}`);
      }
    } catch (err: any) {
      console.error('Failed to release payment:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setReleasing(null);
    }
  };

  const handleCancel = async (paymentId: string) => {
    setCancelling(paymentId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, reason: cancelReason }),
      });
      
      if (res.ok) {
        fetchData();
        setShowCancelConfirm(null);
        setCancelReason('');
      } else {
        const data = await res.json();
        console.error('Failed to cancel:', data.error);
      }
    } catch (err) {
      console.error('Failed to cancel payment:', err);
    } finally {
      setCancelling(null);
    }
  };

  const handleRefund = async (paymentId: string) => {
    if (!refundReason.trim()) {
      alert('Please provide a reason for the refund request');
      return;
    }
    
    setRefunding(paymentId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, reason: refundReason }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        fetchData();
        setShowRefundConfirm(null);
        setRefundReason('');
        window.dispatchEvent(new CustomEvent('add-notification', {
          detail: { 
            message: 'Refund requested! Waiting for seller to approve.', 
            type: 'info', 
            timestamp: new Date().toISOString() 
          }
        }));
        alert(
          `Refund Request Submitted!\n\n` +
          `Your request has been sent to the seller.\n` +
          `They must approve the refund for funds to be returned.\n\n` +
          `If they reject, you can open a dispute from this page.`
        );
      } else {
        console.error('Failed to refund:', data.error);
        alert(`Error: ${data.error || 'Failed to request refund'}`);
      }
    } catch (err: any) {
      console.error('Failed to refund payment:', err);
      alert(`Error: ${err.message || 'Failed to request refund'}`);
    } finally {
      setRefunding(null);
    }
  };

  const handleDispute = async (paymentId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, reason: disputeReason }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        fetchData();
        setShowDisputeConfirm(null);
        setDisputeReason('');
        window.dispatchEvent(new CustomEvent('add-notification', {
          detail: { message: 'Dispute opened', type: 'warning', timestamp: new Date().toISOString() }
        }));
      } else {
        console.error('Failed to dispute:', data.error);
        alert(`Error: ${data.error || 'Failed to open dispute'}`);
      }
    } catch (err: any) {
      console.error('Failed to dispute payment:', err);
      alert(`Error: ${err.message || 'Failed to open dispute'}`);
    }
  };

  const handleApproveRefund = async (paymentId: string) => {
    try {
      // First, get the refund details (buyer address and amount)
      const detailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/${paymentId}/refund-details`);
      
      if (!detailsRes.ok) {
        throw new Error('Failed to get refund details');
      }
      
      const refundDetails = await detailsRes.json();
      
      // Ask seller to confirm they approve the refund (escrow will handle the transaction)
      const confirmed = confirm(
        `Approve refund and return ${refundDetails.amount} XLM to buyer?\n\n` +
        `This will return funds to: ${refundDetails.buyerAddress.slice(0, 6)}...${refundDetails.buyerAddress.slice(-4)}\n\n` +
        `The escrow wallet will send the funds back to the buyer.`
      );
      
      if (!confirmed) return;
      
      // Call the approve-refund API - backend handles escrow transaction (signs from escrow wallet)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/approve-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        fetchData();
        window.dispatchEvent(new CustomEvent('add-notification', {
          detail: { message: `Refund approved: ${refundDetails.amount} XLM returned to buyer`, type: 'success', timestamp: new Date().toISOString() }
        }));
        alert(
          `Refund completed successfully!\n\n` +
          `Amount: ${refundDetails.amount} XLM\n` +
          `Buyer: ${refundDetails.buyerAddress.slice(0, 6)}...${refundDetails.buyerAddress.slice(-4)}\n\n` +
          `The buyer has received the funds back from escrow.`
        );
      } else {
        console.error('Failed to approve refund:', data.error);
        alert(`Error: ${data.error || 'Failed to approve refund'}`);
      }
    } catch (err: any) {
      console.error('Failed to approve refund:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleRejectRefund = async (paymentId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/reject-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      
      if (res.ok) {
        fetchData();
        window.dispatchEvent(new CustomEvent('add-notification', {
          detail: { message: 'Refund rejected', type: 'info', timestamp: new Date().toISOString() }
        }));
      } else {
        const data = await res.json();
        console.error('Failed to reject refund:', data.error);
      }
    } catch (err) {
      console.error('Failed to reject refund:', err);
    }
  };

  const handleResolveDispute = async (paymentId: string, refundBuyer: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/resolve-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentId, 
          refundBuyer,
          resolution: refundBuyer ? 'Refund to buyer via mutual resolution' : 'Release to seller via mutual resolution'
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        fetchData();
        setShowResolveDisputeConfirm(null);
        setResolveDecision(null);
        window.dispatchEvent(new CustomEvent('add-notification', {
          detail: { 
            message: refundBuyer 
              ? `Dispute resolved: ${data.amount || 'funds'} returned to buyer`
              : `Dispute resolved: funds released to seller`,
            type: 'success', 
            timestamp: new Date().toISOString() 
          }
        }));
        alert(
          `Dispute resolved successfully!\n\n` +
          `${refundBuyer ? 'Funds have been returned to the buyer from escrow.' : 'Funds have been released to the seller from escrow.'}`
        );
      } else {
        console.error('Failed to resolve dispute:', data.error);
        alert(`Error: ${data.error || 'Failed to resolve dispute'}`);
      }
    } catch (err: any) {
      console.error('Failed to resolve dispute:', err);
      alert(`Error: ${err.message}`);
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
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
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
          flex-shrink: 0;
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

        .stat-icon.refunded {
          background: rgba(255,107,107,0.1);
          color: #ff6b6b;
        }

        .stat-icon.cancelled {
          background: rgba(128,128,128,0.1);
          color: var(--muted);
        }

        .stat-content {
          flex: 1;
          min-width: 0;
        }

        .stat-label {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted);
          letter-spacing: 0.5px;
          margin-bottom: 2px;
          white-space: nowrap;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          white-space: nowrap;
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

        .status-refunded {
          background: rgba(255,107,107,0.15);
          color: #ff6b6b;
        }

        .status-cancelled {
          background: rgba(128,128,128,0.15);
          color: var(--muted);
        }

        /* Release Button & Action Buttons */
        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .release-btn {
          padding: 8px 16px;
          background: var(--accent);
          border: none;
          border-radius: 8px;
          color: #080c14;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .release-btn:hover {
          background: #33ddff;
          transform: translateY(-1px);
        }

        .release-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .cancel-btn {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--accent3);
          border-radius: 8px;
          color: var(--accent3);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: rgba(255,170,0,0.1);
        }

        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .refund-btn {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #ff6b6b;
          border-radius: 8px;
          color: #ff6b6b;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .refund-btn:hover {
          background: rgba(255,107,107,0.1);
        }

        .refund-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Dispute Button */
        .dispute-btn {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #ff00ff;
          border-radius: 8px;
          color: #ff00ff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .dispute-btn:hover {
          background: rgba(255,0,255,0.1);
        }

        .dispute-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Approve/Reject Buttons */
        .approve-btn {
          padding: 8px 16px;
          background: #00ff9d;
          border: none;
          border-radius: 8px;
          color: #080c14;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .approve-btn:hover {
          background: #00cc7d;
        }

        .reject-refund-btn {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--accent);
          border-radius: 8px;
          color: var(--accent);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .reject-refund-btn:hover {
          background: rgba(0,210,255,0.1);
        }

        /* Refund Requested Status */
        .status-refund-requested {
          background: rgba(255,149,0,0.15);
          color: #ff9500;
        }

        .status-disputed {
          background: rgba(255,0,255,0.15);
          color: #ff00ff;
        }

        .escrow-icon.refund-requested {
          background: rgba(255,149,0,0.1);
          color: #ff9500;
        }

        .escrow-icon.disputed {
          background: rgba(255,0,255,0.1);
          color: #ff00ff;
        }

        /* Confirm Dialog */
        .confirm-dialog {
          background: var(--surface2);
          border-radius: 12px;
          padding: 20px;
          margin-top: 16px;
        }

        .confirm-text {
          font-size: 14px;
          margin-bottom: 12px;
          color: var(--text);
        }

        .confirm-input {
          width: 100%;
          padding: 10px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-size: 13px;
          margin-bottom: 12px;
        }

        .confirm-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .confirm-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .confirm-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .confirm-btn.danger {
          background: #ff6b6b;
          border: none;
          color: white;
        }

        .confirm-btn.danger:hover {
          background: #ff5252;
        }

        .confirm-btn.secondary {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
        }

        .confirm-btn.secondary:hover {
          border-color: var(--border2);
          color: var(--text);
        }

        /* Smart Contract Badge */
        .contract-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(0,210,255,0.1);
          border: 1px solid rgba(0,210,255,0.3);
          border-radius: 6px;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--accent);
          margin-left: 8px;
        }

        /* Help Button */
        .help-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .help-btn:hover {
          background: var(--surface);
          border-color: var(--accent);
        }

        /* Help Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
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
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          padding: 32px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .modal-title {
          font-size: 22px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: var(--surface2);
          color: var(--text);
        }

        /* Help Sections */
        .help-section {
          margin-bottom: 24px;
        }

        .help-section h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 12px;
          color: var(--accent);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .help-section p {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.6;
        }

        .help-steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
        }

        .help-step {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent);
          color: #080c14;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-content strong {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .step-content span {
          font-size: 13px;
          color: var(--muted);
        }

        /* Escrow Flow */
        .escrow-flow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 16px;
          background: var(--surface2);
          border-radius: 12px;
          flex-wrap: wrap;
        }

        .flow-step {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--muted);
        }

        .flow-step.active {
          color: var(--accent);
          font-weight: 600;
        }

        .flow-arrow {
          color: var(--border2);
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
          <p className="page-subtitle">Secure transactions with smart contracts</p>
        </div>
        <button className="help-btn" onClick={() => setShowHelp(true)}>
          <HelpCircle size={18} />
          How It Works
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon escrow">
            <ShieldCheck size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">IN ESCROW</div>
            <div className="stat-value accent">${totalInEscrow.toFixed(2)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon released">
            <AlertCircle size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">DISPUTED</div>
            <div className="stat-value" style={{ color: '#ff00ff' }}>${disputedEscrows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(2)}</div>
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
        <div className="stat-card">
          <div className="stat-icon released">
            <RefreshCw size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL REFUNDED</div>
            <div className="stat-value" style={{ color: '#ff6b6b' }}>${totalRefunded.toFixed(2)}</div>
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
          className={`filter-btn ${filterStatus === 'ESCROW_CREATED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('ESCROW_CREATED')}
        >
          In Escrow ({userEscrows.filter(p => p.status === 'ESCROW_CREATED').length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('COMPLETED')}
        >
          Released ({completedEscrows.length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'REFUNDED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('REFUNDED')}
        >
          Refunded ({refundedEscrows.length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'REFUND_REQUESTED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('REFUND_REQUESTED')}
        >
          Refund Requested ({inProgressEscrows.filter(p => p.status === 'REFUND_REQUESTED').length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'REFUND_REJECTED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('REFUND_REJECTED')}
        >
          Refund Rejected ({userEscrows.filter(p => p.status === 'REFUND_REJECTED').length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'DISPUTED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('DISPUTED')}
        >
          Disputed ({disputedEscrows.length})
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
          {paginatedEscrows.map(escrow => {
            const statusInfo = getStatusInfo(escrow.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div key={escrow.id} className="escrow-item">
                <div className={`escrow-icon ${escrow.status === 'COMPLETED' ? 'released' : escrow.status === 'ESCROW_CREATED' ? 'escrow' : escrow.status === 'REFUND_REQUESTED' ? 'refund-requested' : escrow.status === 'REFUND_REJECTED' ? 'refund-rejected' : escrow.status === 'DISPUTED' ? 'disputed' : 'pending'}`}>
                  <StatusIcon size={24} />
                </div>
                <div className="escrow-info">
                  <div className="escrow-service">
                    {getServiceName(escrow.serviceId)}
                    {escrow.status === 'ESCROW_CREATED' && (
                      <span className="contract-badge">
                        <FileText size={12} />
                        Smart Contract
                      </span>
                    )}
                  </div>
                  <div className="escrow-meta">
                    ID: {escrow.id.slice(0, 12)}... • {new Date(escrow.createdAt).toLocaleDateString()}
                    {escrow.status === 'REFUND_REQUESTED' && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(255,149,0,0.15)', borderRadius: '6px', border: '1px solid rgba(255,149,0,0.3)' }}>
                        {escrow.buyerAddress === publicKey ? (
                          <span style={{ color: '#ff9500', fontSize: '12px' }}>
                            ⏳ <strong>Waiting for seller approval</strong> - They can approve or reject the refund. If rejected, you can open a dispute.
                          </span>
                        ) : (
                          <span style={{ color: '#ff9500', fontSize: '12px' }}>
                            ⚠️ <strong>Buyer has requested a refund</strong> - Please review and approve or reject
                            {escrow.refundReason && (
                              <button 
                                onClick={() => setShowRefundReason(showRefundReason === escrow.id ? null : escrow.id)}
                                style={{ 
                                  marginLeft: '8px', 
                                  background: 'none', 
                                  border: 'none', 
                                  color: '#ff9500', 
                                  textDecoration: 'underline', 
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                [Click here to see the reason]
                              </button>
                            )}
                            {showRefundReason === escrow.id && escrow.refundReason && (
                              <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,149,0,0.1)', borderRadius: '4px', fontSize: '12px' }}>
                                <strong>Reason:</strong> {escrow.refundReason}
                              </div>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                    {escrow.status === 'REFUND_REJECTED' && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(255,107,107,0.15)', borderRadius: '6px', border: '1px solid rgba(255,107,107,0.3)' }}>
                        {escrow.sellerAddress === publicKey ? (
                          <span style={{ color: '#ff6b6b', fontSize: '12px' }}>
                            ❌ <strong>You rejected the refund</strong> - The buyer can now open a dispute if they wish.
                          </span>
                        ) : (
                          <span style={{ color: '#ff6b6b', fontSize: '12px' }}>
                            ❌ <strong>Refund rejected by seller</strong> - You can open a dispute if you believe this is unfair.
                          </span>
                        )}
                      </div>
                    )}
                    {escrow.status === 'DISPUTED' && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(255,0,255,0.15)', borderRadius: '6px', border: '1px solid rgba(255,0,255,0.3)' }}>
                        <span style={{ color: '#ff00ff', fontSize: '12px' }}>
                          ⚠️ <strong>Funds are held in escrow</strong> - Please try to resolve directly within 12 hours or an admin will step in.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="escrow-amount">
                  <div className="amount-value">${parseFloat(escrow.amount || 0).toFixed(2)}</div>
                  <div className="amount-usdc">USDC</div>
                </div>
                <div className={`status-badge status-${escrow.status === 'ESCROW_CREATED' ? 'escrow' : escrow.status === 'REFUND_REQUESTED' ? 'refund-requested' : escrow.status === 'REFUND_REJECTED' ? 'refund-rejected' : escrow.status === 'DISPUTED' ? 'disputed' : escrow.status?.toLowerCase()}`}>
                  <StatusIcon size={14} />
                  {statusInfo.label}
                </div>
                
                {/* Action Buttons - Only show for PENDING, ESCROW_CREATED, REFUND_REQUESTED, REFUND_REJECTED */}
                {(escrow.status === 'PENDING' || escrow.status === 'ESCROW_CREATED' || escrow.status === 'REFUND_REQUESTED' || escrow.status === 'REFUND_REJECTED') && (
                  <div className="action-buttons">
                    {/* Release Button - Only for ESCROW_CREATED and only if user is the BUYER */}
                    {escrow.status === 'ESCROW_CREATED' && escrow.buyerAddress === publicKey && (
                      <button 
                        className="release-btn"
                        onClick={() => handleRelease(escrow.id)}
                        disabled={releasing === escrow.id}
                      >
                        {releasing === escrow.id ? 'Releasing...' : (
                          <>
                            <CheckCircle size={14} />
                            Release
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* Cancel Button - Only for PENDING and only if user is the BUYER */}
                    {escrow.status === 'PENDING' && escrow.buyerAddress === publicKey && (
                      <button 
                        className="cancel-btn"
                        onClick={() => setShowCancelConfirm(escrow.id)}
                        disabled={cancelling === escrow.id}
                      >
                        <XCircle size={14} />
                        Cancel
                      </button>
                    )}
                    
                    {/* Refund Button - Only for ESCROW_CREATED and only if user is the BUYER */}
                    {escrow.status === 'ESCROW_CREATED' && escrow.buyerAddress === publicKey && (
                      <button 
                        className="refund-btn"
                        onClick={() => setShowRefundConfirm(escrow.id)}
                        disabled={refunding === escrow.id}
                      >
                        <RefreshCw size={14} />
                        Request Refund
                      </button>
                    )}

                    {/* Show Refund Rejected Message - When seller rejected the refund (status is REFUND_REJECTED) */}
                    {escrow.status === 'REFUND_REJECTED' && escrow.buyerAddress === publicKey && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(255,107,107,0.15)', borderRadius: '6px', border: '1px solid rgba(255,107,107,0.3)' }}>
                        <span style={{ color: '#ff6b6b', fontSize: '12px' }}>
                          ⚠️ <strong>Seller rejected your refund request</strong> - You can now open a dispute.
                        </span>
                      </div>
                    )}

                    {/* Seller Actions for REFUND_REQUESTED - Only show for SELLER who did NOT request the refund (i.e., the other party) */}
                    {escrow.status === 'REFUND_REQUESTED' && escrow.sellerAddress === publicKey && escrow.buyerAddress !== publicKey && (
                      <>
                        <button 
                          className="approve-btn"
                          onClick={() => handleApproveRefund(escrow.id)}
                        >
                          <CheckCircle size={14} />
                          Approve Refund
                        </button>
                        <button 
                          className="reject-refund-btn"
                          onClick={() => handleRejectRefund(escrow.id)}
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </>
                    )}

                    {/* Dispute Button - For REFUND_REJECTED: Only BUYER can dispute (since they requested the refund and it was rejected) */}
                    {escrow.status === 'REFUND_REJECTED' && escrow.buyerAddress === publicKey && (
                      <button 
                        className="dispute-btn"
                        onClick={() => {
                          console.log('Clicking dispute button for escrow:', escrow.id, 'status:', escrow.status, 'buyer:', escrow.buyerAddress, 'publicKey:', publicKey);
                          setShowDisputeConfirm(escrow.id);
                        }}
                      >
                        <AlertCircle size={14} />
                        Dispute
                      </button>
                    )}
                  </div>
                )}
                
                {/* Action Buttons for DISPUTED Status - Only show the option that benefits the OTHER party */}
                {escrow.status === 'DISPUTED' && (escrow.buyerAddress === publicKey || escrow.sellerAddress === publicKey) && (
                  <div className="action-buttons" style={{ marginTop: '12px' }}>
                    {escrow.buyerAddress === publicKey ? (
                      // Buyer is viewing - only show Release to Seller (can't refund to yourself)
                      <button 
                        className="release-btn"
                        onClick={() => {
                          setShowResolveDisputeConfirm(escrow.id);
                          setResolveDecision('release');
                        }}
                        style={{ background: '#00ff9d' }}
                      >
                        <CheckCircle size={14} />
                        Resolve: Release to Seller
                      </button>
                    ) : (
                      // Seller is viewing - only show Refund to Buyer (can't release to yourself)
                      <button 
                        className="refund-btn"
                        onClick={() => {
                          setShowResolveDisputeConfirm(escrow.id);
                          setResolveDecision('refund');
                        }}
                        style={{ background: '#ff6b6b', color: 'white' }}
                      >
                        <XCircle size={14} />
                        Resolve: Refund to Buyer
                      </button>
                    )}
                  </div>
                )}
                
                {/* Cancel Confirmation Dialog */}
                {showCancelConfirm === escrow.id && (
                  <div className="confirm-dialog" style={{ width: '100%', marginTop: '12px' }}>
                    <div className="confirm-text" style={{ color: 'var(--accent3)', marginBottom: '16px', padding: '12px', background: 'rgba(255,170,0,0.1)', borderRadius: '8px' }}>
                      <strong>⚠️ Cancel - Only for PENDING payments</strong><br/>
                      Funds are not yet locked in escrow. Use this if the payment hasn't been processed yet.
                    </div>
                    <input
                      type="text"
                      className="confirm-input"
                      placeholder="Reason for cancellation (optional)"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <div className="confirm-actions">
                      <button 
                        className="confirm-btn secondary"
                        onClick={() => { setShowCancelConfirm(null); setCancelReason(''); }}
                      >
                        No, Keep It
                      </button>
                      <button 
                        className="confirm-btn danger"
                        onClick={() => handleCancel(escrow.id)}
                        disabled={cancelling === escrow.id}
                      >
                        {cancelling === escrow.id ? 'Cancelling...' : 'Yes, Cancel'}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Refund Confirmation Dialog */}
                {showRefundConfirm === escrow.id && (
                  <div className="confirm-dialog" style={{ width: '100%', marginTop: '12px' }}>
                    <div className="confirm-text" style={{ color: '#ff6b6b', marginBottom: '16px', padding: '12px', background: 'rgba(255,107,107,0.1)', borderRadius: '8px' }}>
                      <strong>⚠️ Request Refund - Only for ESCROW_CREATED payments</strong><br/>
                      Funds are locked in the smart contract. Request a refund if there's an issue with the service. The seller must approve before funds are returned.
                    </div>
                    <input
                      type="text"
                      className="confirm-input"
                      placeholder="Reason for refund request (required)"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                    />
                    <div className="confirm-actions">
                      <button 
                        className="confirm-btn secondary"
                        onClick={() => { setShowRefundConfirm(null); setRefundReason(''); }}
                      >
                        No, Keep It
                      </button>
                      <button 
                        className="confirm-btn danger"
                        onClick={() => handleRefund(escrow.id)}
                        disabled={refunding === escrow.id || !refundReason.trim()}
                      >
                        {refunding === escrow.id ? 'Requesting...' : 'Request Refund'}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Dispute Confirmation Dialog */}
                {showDisputeConfirm === escrow.id && (
                  <div className="confirm-dialog" style={{ width: '100%', marginTop: '12px' }}>
                    <div className="confirm-text" style={{ color: '#ff00ff', marginBottom: '16px', padding: '12px', background: 'rgba(255,0,255,0.1)', borderRadius: '8px' }}>
                      <strong>🔶 Open Dispute</strong><br/>
                      If you believe a refund request is unfair or there's a problem, you can open a dispute. Our support team will review the case.
                    </div>
                    <input
                      type="text"
                      className="confirm-input"
                      placeholder="Reason for dispute (required)"
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                    />
                    <div className="confirm-actions">
                      <button 
                        className="confirm-btn secondary"
                        onClick={() => { setShowDisputeConfirm(null); setDisputeReason(''); }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="confirm-btn danger"
                        style={{ background: '#ff00ff' }}
                        onClick={() => handleDispute(escrow.id)}
                        disabled={!disputeReason.trim()}
                      >
                        Open Dispute
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Resolve Dispute Confirmation Dialog */}
                {showResolveDisputeConfirm === escrow.id && (
                  <div className="confirm-dialog" style={{ width: '100%', marginTop: '12px' }}>
                    <div className="confirm-text" style={{ color: resolveDecision === 'release' ? '#00ff9d' : '#ff6b6b', marginBottom: '16px', padding: '12px', background: resolveDecision === 'release' ? 'rgba(0,255,157,0.1)' : 'rgba(255,107,107,0.1)', borderRadius: '8px' }}>
                      <strong>⚠️ Resolve Dispute</strong><br/>
                      {resolveDecision === 'release' 
                        ? `This will release ${escrow.amount} XLM from escrow to the seller.`
                        : `This will refund ${escrow.amount} XLM from escrow to the buyer.`}
                      <br/><br/>
                      <em>Both parties must agree to resolve the dispute this way.</em>
                    </div>
                    <div className="confirm-actions">
                      <button 
                        className="confirm-btn secondary"
                        onClick={() => { setShowResolveDisputeConfirm(null); setResolveDecision(null); }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="confirm-btn"
                        style={{ background: resolveDecision === 'release' ? '#00ff9d' : '#ff6b6b', color: resolveDecision === 'release' ? '#080c14' : 'white' }}
                        onClick={() => handleResolveDispute(escrow.id, resolveDecision === 'refund')}
                      >
                        Confirm Resolution
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px', padding: '16px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '10px 20px',
              background: currentPage === 1 ? 'var(--surface2)' : 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              color: currentPage === 1 ? 'var(--muted)' : '#080c14',
              fontSize: '13px',
              fontWeight: '600',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            ← Previous
          </button>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '10px 20px',
              background: currentPage === totalPages ? 'var(--surface2)' : 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              color: currentPage === totalPages ? 'var(--muted)' : '#080c14',
              fontSize: '13px',
              fontWeight: '600',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <HelpCircle size={24} />
                How Escrow Works
              </h2>
              <button className="modal-close" onClick={() => setShowHelp(false)}>
                ✕
              </button>
            </div>

            <div className="help-section">
              <h3><ShieldCheck size={18} /> What is Escrow?</h3>
              <p>
                Escrow is a secure payment method where your money is held in a dedicated escrow wallet 
                until the service is delivered. This protects both buyers and sellers from fraud 
                and ensures trustworthy transactions on the Stellar blockchain.
              </p>
            </div>

            <div className="help-section">
              <h3><ArrowRight size={18} /> Payment Flow</h3>
              <div className="help-steps">
                <div className="help-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <strong>Payment Initiated</strong>
                    <span>Buyer sends payment, it enters PENDING status</span>
                  </div>
                </div>
                <div className="help-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <strong>Funds Secured in Escrow</strong>
                    <span>Payment held securely in ESCROW_CREATED status via Stellar escrow wallet</span>
                  </div>
                </div>
                <div className="help-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <strong>Service Delivered</strong>
                    <span>Seller provides the service</span>
                  </div>
                </div>
                <div className="help-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <strong>Payment Released</strong>
                    <span>Buyer releases funds to seller, status becomes COMPLETED</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="help-section">
              <h3><CheckCircle size={18} /> Release Payment</h3>
              <p>
                <strong>When to use:</strong> Only available for ESCROW_CREATED (In Escrow) payments where funds are locked in the escrow wallet.
              </p>
              <p style={{ marginTop: '8px' }}>
                Click RELEASE when you're satisfied with the service and want to send the funds to the seller. 
                This completes the transaction and releases the locked funds from the escrow wallet.
              </p>
            </div>

            <div className="help-section">
              <h3><RefreshCw size={18} /> Request Refund</h3>
              <p>
                <strong>When to use:</strong> Only available for ESCROW_CREATED (In Escrow) payments.
              </p>
              <p style={{ marginTop: '8px' }}>
                Request a refund if there's an issue with the service. You must provide a reason for the refund request. 
                <strong>The seller must approve</strong> before funds are returned. If the seller rejects, you can open a dispute.
              </p>
            </div>

            <div className="help-section">
              <h3><AlertCircle size={18} /> Dispute</h3>
              <p>
                <strong>When to use:</strong> Available for ESCROW_CREATED and REFUND_REQUESTED payments.
              </p>
              <p style={{ marginTop: '8px' }}>
                If you believe a refund request is unfair or there's a problem, you can open a dispute. 
                Our support team will review the case and make a final decision. Use this if the other 
                party is acting in bad faith.
              </p>
            </div>

            <div className="help-section">
              <h3><FileText size={18} /> Escrow Security</h3>
              <p>
                Each escrow is protected by a <strong>Stellar escrow wallet</strong> that securely holds funds until release or refund:
              </p>
              <div className="help-steps" style={{ marginTop: '12px' }}>
                <div className="help-step">
                  <div className="step-number">🔒</div>
                  <div className="step-content">
                    <strong>Funds Secured</strong>
                    <span>Once payment enters ESCROW_CREATED status, funds are locked in the escrow wallet and cannot be accessed by anyone until released</span>
                  </div>
                </div>
                <div className="help-step">
                  <div className="step-number">⚡</div>
                  <div className="step-content">
                    <strong>Automatic Release</strong>
                    <span>Release and refund operations are executed automatically via Stellar transactions once authorized</span>
                  </div>
                </div>
                <div className="help-step">
                  <div className="step-number">🛡️</div>
                  <div className="step-content">
                    <strong>Transparent & Trustless</strong>
                    <span>No middleman needed - the escrow system ensures both parties fulfill their obligations</span>
                  </div>
                </div>
                <div className="help-step">
                  <div className="step-number">⏰</div>
                  <div className="step-content">
                    <strong>Auto-Release</strong>
                    <span>Escrows automatically release to the seller after 30 days if no action is taken, ensuring timely payment for services</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}