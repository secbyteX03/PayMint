'use client';

import { useState } from 'react';
import { useStellar, shortenAddress } from '@/context/StellarContext';

interface ConnectWalletProps {
  onSuccess?: () => void;
}

export default function ConnectWallet({ onSuccess }: ConnectWalletProps) {
  const { connect, error, isConnected, address } = useStellar();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setLocalError(null);

    try {
      console.log('Starting wallet connection...');
      const result = await connect();
      console.log('Wallet connection result:', result);
      if (result) {
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      const errMsg = err.message || err.toString() || 'Failed to connect wallet. Make sure Freighter is installed and unlocked.';
      setLocalError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // If already connected, show connected state
  if (isConnected && address) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-sm font-medium">
            {shortenAddress(address)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="btn-connect"
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            Connect Wallet
          </>
        )}
      </button>
      
      {(localError || error) && (
        <div className="error-msg mt-4">
          {localError || error}
        </div>
      )}
      
      <p className="helper-text mt-4">
        Don't have Freighter?{' '}
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Install it here
        </a>
      </p>
      <p className="helper-note mt-2">
        Make sure your Freighter extension is unlocked
      </p>

      <style jsx>{`
        .btn-connect {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
          color: #000000;
          padding: 14px 28px;
          border-radius: 100px;
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-connect:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(212, 175, 55, 0.3);
        }

        .btn-connect:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-msg {
          margin-top: 16px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          color: #ef4444;
          font-size: 13px;
        }

        .helper-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        .helper-text a {
          color: #D4AF37;
          text-decoration: none;
          transition: color 0.2s;
        }

        .helper-text a:hover {
          color: #FFD700;
        }

        .helper-note {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
}