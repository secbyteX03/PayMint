'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

export default function AdminPanelPage() {
  const { publicKey, isConnected } = useStellar();
  const [disputedPayments, setDisputedPayments] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'DISPUTED' | 'REFUND_REQUESTED' | 'REFUNDED' | 'ESCROW_CREATED' | 'COMPLETED' | 'ALL'>('DISPUTED');
  const [resolving, setResolving] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [adminList, setAdminList] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const DEFAULT_ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || 'GDJTYETYSDM4VFX4RYGTCXYMLXSGQODKGGFUBMR4INGFMXOWROGKMIIR';
  
  useEffect(() => {
    const stored = localStorage.getItem('adminWallets');
    if (stored) {
      setAdminList(JSON.parse(stored));
    } else {
      const defaults = [DEFAULT_ADMIN_WALLET];
      setAdminList(defaults);
      localStorage.setItem('adminWallets', JSON.stringify(defaults));
    }
  }, []);
  
  const isAdmin = publicKey && adminList.some(
    admin => admin.toUpperCase() === publicKey.toUpperCase()
  );

  useEffect(() => {
    setMounted(true);
    if (isConnected && publicKey) {
      fetchPayments();
    }
  }, [isConnected, publicKey]);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments`);
      if (res.ok) {
        const data = await res.json();
        setAllPayments(data);
        const disputed = data.filter((p: any) => p.status === 'DISPUTED');
        setDisputedPayments(disputed);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (paymentId: string, refundBuyer: boolean) => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    const payment = allPayments.find(p => p.id === paymentId);
    if (!payment) {
      alert('Payment not found');
      return;
    }

    const confirmed = confirm(
      `${refundBuyer ? 'Refund' : 'Release'} ${payment.amount} XLM?\n\n` +
      `Decision: ${refundBuyer ? 'Return to buyer' : 'Send to seller'}\n` +
      `Buyer: ${payment.buyerAddress?.slice(0, 6)}...${payment.buyerAddress?.slice(-4)}\n` +
      `Seller: ${payment.sellerAddress?.slice(0, 6)}...${payment.sellerAddress?.slice(-4)}`
    );

    if (!confirmed) return;

    setResolving(paymentId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/resolve-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentId, 
          refundBuyer,
          resolution: `Admin resolved: ${refundBuyer ? 'Refund to buyer' : 'Release to seller'}`
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          `Dispute resolved successfully!\n\n` +
          `Amount: ${payment.amount} XLM\n` +
          `Decision: ${refundBuyer ? 'Refunded to buyer' : 'Released to seller'}\n\n` +
          `Funds have been transferred from the escrow wallet.`
        );
        fetchData();
      } else {
        console.error('Failed to resolve dispute:', data.error);
        alert(`Error: ${data.error || 'Failed to resolve dispute'}`);
      }
    } catch (err: any) {
      console.error('Failed to resolve dispute:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setResolving(null);
    }
  };

  const handleApproveRefund = async (paymentId: string) => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    const payment = allPayments.find(p => p.id === paymentId);
    if (!payment) {
      alert('Payment not found');
      return;
    }

    const confirmed = confirm(
      `Approve refund of ${payment.amount} XLM?

` +
      `Buyer: ${payment.buyerAddress?.slice(0, 6)}...${payment.buyerAddress?.slice(-4)}\n` +
      `Reason: ${payment.refundReason || 'Not provided'}`
    );

    if (!confirmed) return;

    setResolving(paymentId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/approve-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          `Refund approved successfully!\n\n` +
          `Amount: ${payment.amount} XLM\n\n` +
          `Funds have been transferred from the escrow wallet.`
        );
        fetchData();
      } else {
        console.error('Failed to approve refund:', data.error);
        alert(`Error: ${data.error || 'Failed to approve refund'}`);
      }
    } catch (err: any) {
      console.error('Failed to approve refund:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setResolving(null);
    }
  };

  const handleRejectRefund = async (paymentId: string) => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    const payment = allPayments.find(p => p.id === paymentId);
    if (!payment) {
      alert('Payment not found');
      return;
    }

    const confirmed = confirm(
      `Reject refund request for ${payment.amount} XLM?

` +
      `The payment will return to escrow status.`
    );

    if (!confirmed) return;

    setResolving(paymentId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/reject-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          `Refund request rejected.\n\n` +
          `The payment has returned to escrow status.`
        );
        fetchData();
      } else {
        console.error('Failed to reject refund:', data.error);
        alert(`Error: ${data.error || 'Failed to reject refund'}`);
      }
    } catch (err: any) {
      console.error('Failed to reject refund:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setResolving(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments`);
      if (res.ok) {
        const data = await res.json();
        setAllPayments(data);
        const disputed = data.filter((p: any) => p.status === 'DISPUTED');
        setDisputedPayments(disputed);
      } else {
        alert('Failed to fetch payments. Please try again.');
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      alert('Error connecting to server. Please check if the API server is running.');
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = () => {
    if (!newAdminAddress || !newAdminAddress.startsWith('G')) {
      alert('Please enter a valid Stellar wallet address (starts with G)');
      return;
    }
    
    if (newAdminAddress.length !== 56) {
      alert('Invalid Stellar address length. Must be 56 characters.');
      return;
    }
    
    if (adminList.some(a => a.toUpperCase() === newAdminAddress.toUpperCase())) {
      alert('This wallet is already an admin');
      return;
    }
    
    const updatedList = [...adminList, newAdminAddress.toUpperCase()];
    setAdminList(updatedList);
    localStorage.setItem('adminWallets', JSON.stringify(updatedList));
    setNewAdminAddress('');
    alert(`Admin wallet added successfully!\n\nWallet: ${newAdminAddress.slice(0, 8)}...${newAdminAddress.slice(-6)}`);
  };

  const removeAdmin = (address: string) => {
    if (address === DEFAULT_ADMIN_WALLET) {
      alert('Cannot remove the default admin wallet');
      return;
    }
    
    if (confirm(`Remove this wallet from admin list?\n\n${address.slice(0, 10)}...${address.slice(-6)}`)) {
      const updatedList = adminList.filter(a => a !== address);
      setAdminList(updatedList);
      localStorage.setItem('adminWallets', JSON.stringify(updatedList));
    }
  };

  const displayedPayments = filter === 'DISPUTED' ? disputedPayments 
    : filter === 'ESCROW_CREATED' ? allPayments.filter(p => p.status === 'ESCROW_CREATED')
    : filter === 'COMPLETED' ? allPayments.filter(p => p.status === 'COMPLETED')
    : filter === 'REFUND_REQUESTED' ? allPayments.filter(p => p.status === 'REFUND_REQUESTED')
    : filter === 'REFUNDED' ? allPayments.filter(p => p.status === 'REFUNDED')
    : allPayments;

  // Paginate displayed payments
  const totalPages = Math.ceil(displayedPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = displayedPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Calculate time since dispute was created
  const getTimeSinceDispute = (payment: any) => {
    if (!payment.updatedAt || payment.status !== 'DISPUTED') return null;
    
    const updated = new Date(payment.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - updated.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    const isOverdue = diffHours >= 24;
    
    return {
      hours: diffHours,
      minutes: diffMinutes,
      seconds: diffSeconds,
      isOverdue,
      formatted: `${diffHours}h ${diffMinutes}m ${diffSeconds}s`
    };
  };

  // Auto-resolve overdue disputes (over 24 hours)
  const autoResolveOverdueDisputes = async () => {
    const now = new Date();
    
    for (const payment of disputedPayments) {
      if (payment.status !== 'DISPUTED' || !payment.updatedAt) continue;
      
      const updated = new Date(payment.updatedAt);
      const diffMs = now.getTime() - updated.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours >= 24) {
        console.log(`Auto-resolving overdue dispute: ${payment.id}`);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/resolve-dispute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              paymentId: payment.id, 
              refundBuyer: false,
              resolution: 'Auto-resolved: Dispute not resolved within 24 hours, funds released to seller'
            }),
          });
          
          if (res.ok) {
            console.log(`Auto-resolved payment ${payment.id}`);
            fetchData();
          }
        } catch (err) {
          console.error(`Failed to auto-resolve payment ${payment.id}:`, err);
        }
      }
    }
  };

  // Check for overdue disputes every 10 seconds (for real-time timer updates)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAdmin && disputedPayments.length > 0) {
        autoResolveOverdueDisputes();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [disputedPayments, isAdmin]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      DISPUTED: { bg: 'rgba(255,0,255,0.15)', color: '#ff00ff', label: 'Disputed' },
      ESCROW_CREATED: { bg: 'rgba(0,210,255,0.15)', color: '#00d2ff', label: 'In Escrow' },
      REFUND_REQUESTED: { bg: 'rgba(255,149,0,0.15)', color: '#ff9500', label: 'Refund Requested' },
      COMPLETED: { bg: 'rgba(0,255,157,0.15)', color: '#00ff9d', label: 'Completed' },
      REFUNDED: { bg: 'rgba(255,107,107,0.15)', color: '#ff6b6b', label: 'Refunded' },
      PENDING: { bg: 'rgba(255,255,255,0.1)', color: '#a855f7', label: 'Pending' },
      CANCELLED: { bg: 'rgba(255,255,255,0.05)', color: '#666', label: 'Cancelled' },
    };
    const style = styles[status] || styles.PENDING;
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        background: style.bg,
        color: style.color,
      }}>
        {style.label}
      </span>
    );
  };

  if (!mounted) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
        Loading...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ 
        padding: '60px 20px', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <ShieldCheck size={64} style={{ color: '#ff6b6b', marginBottom: '20px' }} />
        <h2 style={{ color: '#fff', marginBottom: '16px' }}>Access Denied</h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          You do not have admin privileges to access this page.
        </p>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', textAlign: 'left' }}>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>
            Admin wallet addresses:
          </p>
          {adminList.map((admin, index) => (
            <code key={index} style={{ 
              display: 'block', 
              background: 'rgba(255,255,255,0.1)', 
              padding: '6px 10px', 
              borderRadius: '4px',
              color: '#aaa',
              fontSize: '11px',
              marginBottom: '4px',
              fontFamily: 'monospace',
            }}>
              {admin.slice(0, 12)}...{admin.slice(-8)}
            </code>
          ))}
          <p style={{ color: '#555', fontSize: '11px', marginTop: '12px' }}>
            Connect with one of these wallets to access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '32px',
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(255,0,255,0.1) 0%, rgba(0,210,255,0.1) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(255,0,255,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ff00ff 0%, #00d2ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Admin Panel
            </h1>
            <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0 0' }}>
              Dispute Resolution Center
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowAddAdmin(true)}
            style={{
              padding: '10px 16px',
              background: 'rgba(255,0,255,0.1)',
              border: '1px solid rgba(255,0,255,0.3)',
              borderRadius: '8px',
              color: '#ff00ff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Settings size={16} />
            Manage Admins
          </button>
          <button
            onClick={fetchData}
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '20px',
          background: 'rgba(255,0,255,0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(255,0,255,0.2)'
        }}>
          <div style={{ color: '#ff00ff', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            DISPUTED
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>
            {disputedPayments.length}
          </div>
        </div>
        <div style={{
          padding: '20px',
          background: 'rgba(0,210,255,0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(0,210,255,0.2)'
        }}>
          <div style={{ color: '#00d2ff', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            IN ESCROW
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>
            {allPayments.filter(p => p.status === 'ESCROW_CREATED').length}
          </div>
        </div>
        <div style={{
          padding: '20px',
          background: 'rgba(0,255,157,0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(0,255,157,0.2)'
        }}>
          <div style={{ color: '#00ff9d', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            COMPLETED
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>
            {allPayments.filter(p => p.status === 'COMPLETED').length}
          </div>
        </div>
        <div style={{
          padding: '20px',
          background: 'rgba(255,107,107,0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(255,107,107,0.2)'
        }}>
          <div style={{ color: '#ff6b6b', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            TOTAL PAYMENTS
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>
            {allPayments.length}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        padding: '16px',
        background: 'var(--surface)',
        borderRadius: '12px'
      }}>
        <button
          onClick={() => setFilter('DISPUTED')}
          style={{
            padding: '10px 20px',
            background: filter === 'DISPUTED' ? 'rgba(255,0,255,0.2)' : 'transparent',
            border: `1px solid ${filter === 'DISPUTED' ? '#ff00ff' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            color: filter === 'DISPUTED' ? '#ff00ff' : '#888',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Disputed ({disputedPayments.length})
        </button>
        <button
          onClick={() => setFilter('ESCROW_CREATED')}
          style={{
            padding: '10px 20px',
            background: filter === 'ESCROW_CREATED' ? 'rgba(0,210,255,0.2)' : 'transparent',
            border: `1px solid ${filter === 'ESCROW_CREATED' ? '#00d2ff' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            color: filter === 'ESCROW_CREATED' ? '#00d2ff' : '#888',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          In Escrow ({allPayments.filter(p => p.status === 'ESCROW_CREATED').length})
        </button>
        <button
          onClick={() => setFilter('COMPLETED')}
          style={{
            padding: '10px 20px',
            background: filter === 'COMPLETED' ? 'rgba(0,255,157,0.2)' : 'transparent',
            border: `1px solid ${filter === 'COMPLETED' ? '#00ff9d' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            color: filter === 'COMPLETED' ? '#00ff9d' : '#888',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Completed ({allPayments.filter(p => p.status === 'COMPLETED').length})
        </button>
        <button
          onClick={() => setFilter('REFUND_REQUESTED')}
          style={{
            padding: '10px 20px',
            background: filter === 'REFUND_REQUESTED' ? 'rgba(255,149,0,0.2)' : 'transparent',
            border: `1px solid ${filter === 'REFUND_REQUESTED' ? '#ff9500' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            color: filter === 'REFUND_REQUESTED' ? '#ff9500' : '#888',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Refund Requested ({allPayments.filter(p => p.status === 'REFUND_REQUESTED').length})
        </button>
        <button
          onClick={() => setFilter('REFUNDED')}
          style={{
            padding: '10px 20px',
            background: filter === 'REFUNDED' ? 'rgba(255,107,107,0.2)' : 'transparent',
            border: `1px solid ${filter === 'REFUNDED' ? '#ff6b6b' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            color: filter === 'REFUNDED' ? '#ff6b6b' : '#888',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Refunded ({allPayments.filter(p => p.status === 'REFUNDED').length})
        </button>
        <button
          onClick={() => setFilter('ALL')}
          style={{
            padding: '10px 20px',
            background: filter === 'ALL' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: `1px solid ${filter === 'ALL' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            color: filter === 'ALL' ? '#fff' : '#888',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          All ({allPayments.length})
        </button>
      </div>

      {/* Payments List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
          Loading payments...
        </div>
      ) : displayedPayments.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          color: '#888',
          background: 'var(--surface)',
          borderRadius: '12px'
        }}>
          <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>{filter === 'DISPUTED' ? 'No disputed payments' : 'No payments found'}</p>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px' 
        }}>
          {paginatedPayments.map((payment) => (
            <div
              key={payment.id}
              style={{
                padding: '20px',
                background: 'var(--surface)',
                borderRadius: '12px',
                border: payment.status === 'DISPUTED' ? '1px solid rgba(255,0,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: payment.status === 'DISPUTED' 
                      ? 'rgba(255,0,255,0.2)' 
                      : 'rgba(0,210,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: payment.status === 'DISPUTED' ? '#ff00ff' : '#00d2ff' }}>
                      {payment.currency === 'USDC' ? '$' : 'XLM'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}>
                      {payment.amount} {payment.currency || 'XLM'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      ID: {payment.id.slice(0, 8)}...
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>BUYER</div>
                    <div style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>
                      {payment.buyerAddress?.slice(0, 6)}...{payment.buyerAddress?.slice(-4)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>SELLER</div>
                    <div style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>
                      {payment.sellerAddress?.slice(0, 6)}...{payment.sellerAddress?.slice(-4)}
                    </div>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>

                {/* Admin Actions for Disputed Payments */}
                {payment.status === 'DISPUTED' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {/* Timer showing time since dispute */}
                    {(() => {
                      const timeInfo = getTimeSinceDispute(payment);
                      if (timeInfo) {
                        return (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            background: timeInfo.isOverdue ? 'rgba(255,0,0,0.2)' : 'rgba(255,165,0,0.1)',
                            border: `1px solid ${timeInfo.isOverdue ? 'rgba(255,0,0,0.3)' : 'rgba(255,165,0,0.3)'}`,
                          }}>
                            <Clock size={12} color={timeInfo.isOverdue ? '#ff4444' : '#ffa500'} />
                            <span style={{ 
                              fontSize: '11px', 
                              color: timeInfo.isOverdue ? '#ff4444' : '#ffa500',
                              fontWeight: 600,
                            }}>
                              {timeInfo.formatted}
                              {timeInfo.isOverdue && ' - AUTO-RESOLVING SOON'}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleResolveDispute(payment.id, false)}
                        disabled={resolving === payment.id}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(0,255,157,0.1)',
                          border: '1px solid rgba(0,255,157,0.3)',
                          borderRadius: '8px',
                          color: '#00ff9d',
                          cursor: resolving === payment.id ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle size={14} />
                        Release to Seller
                      </button>
                      <button
                        onClick={() => handleResolveDispute(payment.id, true)}
                        disabled={resolving === payment.id}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(255,107,107,0.1)',
                          border: '1px solid rgba(255,107,107,0.3)',
                          borderRadius: '8px',
                          color: '#ff6b6b',
                          cursor: resolving === payment.id ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <XCircle size={14} />
                        Refund to Buyer
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin Actions for Refund Requested Payments */}
                {payment.status === 'REFUND_REQUESTED' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', marginTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApproveRefund(payment.id)}
                        disabled={resolving === payment.id}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(0,255,157,0.1)',
                          border: '1px solid rgba(0,255,157,0.3)',
                          borderRadius: '8px',
                          color: '#00ff9d',
                          cursor: resolving === payment.id ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle size={14} />
                        Approve Refund
                      </button>
                      <button
                        onClick={() => handleRejectRefund(payment.id)}
                        disabled={resolving === payment.id}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(255,107,107,0.1)',
                          border: '1px solid rgba(255,107,107,0.3)',
                          borderRadius: '8px',
                          color: '#ff6b6b',
                          cursor: resolving === payment.id ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <XCircle size={14} />
                        Reject Refund
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dispute Reason */}
              {payment.status === 'DISPUTED' && (payment.disputeReason || payment.refundReason) && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  background: 'rgba(255,0,255,0.1)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255,0,255,0.2)'
                }}>
                  <div style={{ fontSize: '11px', color: '#ff00ff', fontWeight: 600, marginBottom: '6px' }}>
                    DISPUTE REASON
                  </div>
                  <div style={{ fontSize: '13px', color: '#ccc' }}>
                    {payment.disputeReason || payment.refundReason}
                  </div>
                </div>
              )}

              {/* Refund Reason for REFUND_REQUESTED status */}
              {payment.status === 'REFUND_REQUESTED' && payment.refundReason && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  background: 'rgba(255,165,0,0.1)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255,165,0,0.2)'
                }}>
                  <div style={{ fontSize: '11px', color: '#ffa500', fontWeight: 600, marginBottom: '6px' }}>
                    REFUND REASON
                  </div>
                  <div style={{ fontSize: '13px', color: '#ccc' }}>
                    {payment.refundReason}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginTop: '24px',
          padding: '16px',
          background: 'var(--surface)',
          borderRadius: '12px',
        }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              background: currentPage === 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,0,255,0.1)',
              border: `1px solid ${currentPage === 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,0,255,0.3)'}`,
              borderRadius: '8px',
              color: currentPage === 1 ? '#666' : '#ff00ff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Previous
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: currentPage === page ? 'rgba(255,0,255,0.2)' : 'transparent',
                  border: `1px solid ${currentPage === page ? '#ff00ff' : 'rgba(255,255,255,0.1)'}`,
                  color: currentPage === page ? '#ff00ff' : '#888',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: currentPage === page ? 600 : 400,
                }}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              background: currentPage === totalPages ? 'rgba(255,255,255,0.1)' : 'rgba(255,0,255,0.1)',
              border: `1px solid ${currentPage === totalPages ? 'rgba(255,255,255,0.1)' : 'rgba(255,0,255,0.3)'}`,
              borderRadius: '8px',
              color: currentPage === totalPages ? '#666' : '#ff00ff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Admin Management Modal */}
      {showAddAdmin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid rgba(255,0,255,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>Manage Admin Wallets</h2>
              <button 
                onClick={() => setShowAddAdmin(false)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '24px' }}
              >
                ×
              </button>
            </div>
            
            <p style={{ color: '#888', marginBottom: '16px', fontSize: '13px' }}>
              Admin wallets have access to the admin panel and can resolve disputes.
            </p>
            
            {/* Current Admins List */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#ff00ff', fontWeight: 600, marginBottom: '8px' }}>
                Current Admin Wallets
              </div>
              {adminList.map((admin, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                }}>
                  <span style={{ color: '#ccc', fontFamily: 'monospace', fontSize: '12px' }}>
                    {admin.slice(0, 10)}...{admin.slice(-6)}
                  </span>
                  {admin !== DEFAULT_ADMIN_WALLET && (
                    <button
                      onClick={() => removeAdmin(admin)}
                      style={{
                        background: 'rgba(255,107,107,0.2)',
                        border: '1px solid rgba(255,107,107,0.3)',
                        borderRadius: '4px',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        fontSize: '12px',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Add New Admin */}
            <div>
              <div style={{ fontSize: '14px', color: '#00d2ff', fontWeight: 600, marginBottom: '8px' }}>
                Add New Admin
              </div>
              <input
                type="text"
                value={newAdminAddress}
                onChange={(e) => setNewAdminAddress(e.target.value)}
                placeholder="Enter Stellar wallet address (G...)"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  marginBottom: '12px',
                }}
              />
              <button
                onClick={addAdmin}
                disabled={!newAdminAddress || !newAdminAddress.startsWith('G')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: newAdminAddress && newAdminAddress.startsWith('G') 
                    ? 'rgba(0,255,157,0.2)' 
                    : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${newAdminAddress && newAdminAddress.startsWith('G') ? 'rgba(0,255,157,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px',
                  color: newAdminAddress && newAdminAddress.startsWith('G') ? '#00ff9d' : '#666',
                  cursor: newAdminAddress && newAdminAddress.startsWith('G') ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Add Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}