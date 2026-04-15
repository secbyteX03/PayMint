'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

interface FundEscrowModalProps {
  paymentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ESCROW_WALLET = process.env.NEXT_PUBLIC_ESCROW_WALLET || 'YOUR_ESCROW_WALLET';
// Get from environment or ask users to configure their own escrow wallet

export default function FundEscrowModal({ paymentId, onClose, onSuccess }: FundEscrowModalProps) {
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!txHash.trim()) {
      setError('Please enter the transaction hash');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/lock-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          transactionHash: txHash.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm escrow lock');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircle size={64} color="#00ff9d" style={{ marginBottom: '20px' }} />
            <h2 style={{ color: '#fff', marginBottom: '16px' }}>Funds Secured!</h2>
            <p style={{ color: '#888' }}>
              Your payment has been confirmed in escrow. The funds are now locked securely.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            💰 Fund Escrow
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ 
            background: 'rgba(0, 221, 255, 0.1)', 
            border: '1px solid rgba(0, 221, 255, 0.3)', 
            borderRadius: '12px', 
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ color: '#00ddff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              How to Fund Escrow
            </h3>
            <ol style={{ color: '#ccc', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>Send the payment amount to the escrow wallet address below</li>
              <li>Wait for the transaction to be confirmed on Stellar (usually 5 seconds)</li>
              <li>Copy the transaction hash from your wallet</li>
              <li>Paste the transaction hash below and click "I've Sent Funds"</li>
            </ol>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#888', fontSize: '13px', marginBottom: '8px', display: 'block' }}>
              Escrow Wallet Address
            </label>
            <div style={{ 
              background: 'var(--surface2)', 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              padding: '12px',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              color: '#00ff9d',
              wordBreak: 'break-all'
            }}>
              {ESCROW_WALLET}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(ESCROW_WALLET)}
              style={{
                marginTop: '8px',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: '#888',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              📋 Copy Address
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#888', fontSize: '13px', marginBottom: '8px', display: 'block' }}>
              Transaction Hash (TX Hash)
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Paste your transaction hash here (e.g., 1234abcd...)"
              style={{
                width: '100%',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '14px',
                color: '#fff',
                fontFamily: 'var(--mono)',
                fontSize: '13px'
              }}
            />
            <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
              This is the transaction ID you get after sending funds. It starts with a hash (like 1234...).
            </p>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(255, 107, 107, 0.1)', 
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: '#ff6b6b',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={loading || !txHash.trim()}
            style={{
              width: '100%',
              background: loading ? '#666' : '#00ff9d',
              color: '#000',
              fontWeight: 'bold',
              padding: '16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              'Confirming...'
            ) : (
              <>
                <CheckCircle size={18} />
                I've Sent Funds
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}