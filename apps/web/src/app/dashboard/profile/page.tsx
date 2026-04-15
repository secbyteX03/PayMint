'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStellar } from '@/context/StellarContext';
import { Copy, Check, Shield } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { address, network, disconnect } = useStellar();
  const [displayAgents, setDisplayAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Admin wallet from environment
  const ADMIN_WALLET = 'GDJTYETYSDM4VFX4RYGTCXYMLXSGQODKGGFUBMR4INGFMXOWROGKMIIR';
  const isAdmin = address?.toUpperCase() === ADMIN_WALLET.toUpperCase();

  useEffect(() => {
    if (address) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [address]);

  const fetchData = async () => {
    try {
      // Fetch user's agents
      const agentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/address/${address}`);
      if (agentRes.ok) {
        const agentsData = await agentRes.json();
        // API returns array of agents
        const agentsList = Array.isArray(agentsData) ? agentsData : [agentsData];
        setDisplayAgents(agentsList);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayAddress = address ? 
    `${address.slice(0, 6)}...${address.slice(-4)}` : 
    'Not connected';

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: 'var(--muted)'
      }}>
        Loading...
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

        .page-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .page-sub {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--muted);
        }

        .panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 16px;
        }

        .panel-title {
          font-size: 14px;
          font-weight: 700;
        }

        .panel-meta {
          font-family: var(--mono);
          font-size: 10px;
          color: #00ff9d;
          background: rgba(0,255,157,0.1);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .wallet-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }

        .wallet-info-row:last-child {
          border-bottom: none;
        }

        .wi-label {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 1px;
        }

        .wi-value {
          font-family: var(--mono);
          font-size: 13px;
          color: var(--text);
        }

        .wi-value.green {
          color: #00ff9d;
        }

        .wi-address-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .copy-btn {
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .copy-btn:hover {
          color: var(--accent);
          background: var(--surface2);
        }

        .copy-btn.copied {
          color: #00ff9d;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .stat-card {
          text-align: center;
          padding: 20px;
          border-radius: 12px;
          background: var(--surface2);
        }

        .stat-label {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 800;
        }

        .stat-card.blue .stat-value { color: var(--accent); }
        .stat-card.purple .stat-value { color: var(--accent2); }
        .stat-card.green .stat-value { color: #00ff9d; }
        .stat-card.orange .stat-value { color: var(--accent3); }

        /* Danger Zone */
        .danger-zone {
          border: 1px solid rgba(255,107,53,0.3);
          background: rgba(255,107,53,0.05);
        }

        .danger-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .danger-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255,107,53,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff6b35;
        }

        .danger-title {
          font-size: 14px;
          font-weight: 700;
          color: #ff6b35;
        }

        .danger-desc {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 16px;
        }

        .disconnect-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          border: 1px solid #ff6b35;
          color: #ff6b35;
        }

        .disconnect-btn:hover {
          background: #ff6b35;
          color: white;
        }

        .warning-text {
          font-size: 11px;
          color: var(--muted);
          margin-top: 8px;
          font-style: italic;
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">My Profile</div>
          <div className="page-sub">// WALLET INFORMATION</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            Wallet Connected ✓
            {isAdmin && (
              <span style={{ 
                marginLeft: '12px', 
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Shield size={12} /> ADMIN
              </span>
            )}
          </div>
          <div className="panel-meta">ACTIVE</div>
        </div>
        <div style={{ padding: '20px 0' }}>
          <div className="wallet-info-row">
            <span className="wi-label">Address</span>
            <div className="wi-address-container">
              <span className="wi-value green">{displayAddress}</span>
              <button className="copy-btn" onClick={copyAddress} title="Copy full address">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div className="wallet-info-row">
            <span className="wi-label">Network</span>
            <span className="wi-value">{network || 'TESTNET'}</span>
          </div>
          <div className="wallet-info-row">
            <span className="wi-label">Protocol</span>
            <span className="wi-value">x402 · USDC</span>
          </div>
          <div className="wallet-info-row">
            <span className="wi-label">Status</span>
            <span className="wi-value green">Ready to transact</span>
          </div>
        </div>
      </div>

      <div className="panel danger-zone">
        <div className="danger-header">
          <div className="danger-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="danger-title">Danger Zone</div>
        </div>
        <div className="danger-desc">Irreversible actions</div>
        <button 
          className="disconnect-btn"
          onClick={() => {
            disconnect();
            window.location.href = '/';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Disconnect Wallet
        </button>
        <div className="warning-text">This action cannot be undone. You will need to reconnect your wallet to access the platform.</div>
      </div>
    </>
  );
}