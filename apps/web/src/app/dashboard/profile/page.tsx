'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStellar } from '@/context/StellarContext';

interface DashboardStats {
  totalRevenue: number;
  apiCalls: number;
  activeEscrows: number;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};

export default function ProfilePage() {
  const router = useRouter();
  const { address, network, disconnect } = useStellar();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    apiCalls: 0,
    activeEscrows: 0
  });
  const [displayAgents, setDisplayAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [address]);

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stellar/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          totalRevenue: parseFloat(statsData.totalVolume || '0'),
          apiCalls: statsData.totalPayments || 0,
          activeEscrows: statsData.totalServices || 0
        });
      }

      // Fetch user's agents
      const agentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/address/${address}`);
      if (agentRes.ok) {
        const agent = await agentRes.json();
        if (agent) {
          setDisplayAgents([agent]);
        }
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
          <div className="panel-title">Wallet Connected ✓</div>
          <div className="panel-meta">ACTIVE</div>
        </div>
        <div style={{ padding: '20px 0' }}>
          <div className="wallet-info-row">
            <span className="wi-label">Address</span>
            <span className="wi-value green">{displayAddress}</span>
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

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Account Stats</div>
        </div>
        <div className="stats-row">
          <div className="stat-card blue">
            <div className="stat-label">TOTAL REVENUE</div>
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-label">API CALLS</div>
            <div className="stat-value">{stats.apiCalls.toLocaleString()}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">AGENTS</div>
            <div className="stat-value">{displayAgents.length}</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-label">ESCROWS</div>
            <div className="stat-value">{stats.activeEscrows}</div>
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