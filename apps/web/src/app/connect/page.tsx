'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStellar, shortenAddress } from "@/context/StellarContext";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected, address, network, loading, error, connect, disconnect } = useStellar();
  const [localError, setLocalError] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show success message briefly before redirecting
  useEffect(() => {
    if (isConnected && address && !showSuccessMessage) {
      setShowSuccessMessage(true);
      // Show success message for 7 seconds before redirecting
      const redirectTimer = setTimeout(() => {
        router.push('/dashboard');
      }, 7000);
      return () => clearTimeout(redirectTimer);
    }
  }, [isConnected, address, router, showSuccessMessage]);

  const handleConnect = async () => {
    setLocalError("");
    try {
      await connect();
    } catch (err: any) {
      setLocalError(err.message || "Failed to connect wallet");
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const displayError = localError || error || "";

  return (
    <div className="connect-page">
      <style>{`
        .connect-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--black);
          position: relative;
          overflow: hidden;
        }

        .connect-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(80,227,164,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(80,227,164,0.025) 1px, transparent 1px);
          background-size: 56px 56px;
          pointer-events: none;
        }

        .connect-glass {
          background: rgba(24, 24, 48, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 3rem;
          max-width: 420px;
          width: 90%;
          position: relative;
          text-align: center;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 80px rgba(255, 170, 0, 0.1);
          animation: fadeUp 0.4s ease;
        }

        .connect-header {
          margin-bottom: 2rem;
        }

        .connect-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 1.5rem;
        }

        .connect-logo .logo-dot {
          width: 10px;
          height: 10px;
          background: var(--green);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .connect-logo span {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .connect-logo span span {
          color: var(--green);
        }

        .connect-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text);
        }

        .connect-header p {
          color: var(--muted);
        }

        .connect-status {
          margin-bottom: 2rem;
        }

        .status-connected {
          background: rgba(255, 170, 0, 0.1);
          border: 1px solid rgba(255, 170, 0, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .status-connected .status-icon {
          width: 48px;
          height: 48px;
          background: var(--green);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 1.5rem;
        }

        .status-connected h3 {
          color: var(--green);
          margin-bottom: 1rem;
        }

        .wallet-info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border);
        }

        .wallet-info-row:last-of-type {
          border-bottom: none;
        }

        .wi-label {
          color: var(--muted);
          font-size: 0.85rem;
        }

        .wi-value {
          color: var(--text);
          font-size: 0.85rem;
          font-family: 'DM Mono', monospace;
        }

        .wi-value.green {
          color: var(--green);
        }

        .connect-error {
          background: rgba(255, 80, 80, 0.1);
          border: 1px solid rgba(255, 80, 80, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .connect-error p {
          color: #ff6b6b;
          margin-bottom: 1rem;
        }

        .connect-btn {
          width: 100%;
          padding: 1rem 2rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.9rem;
          font-weight: 500;
          letter-spacing: 0.03em;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .connect-btn-primary {
          background: var(--green);
          color: var(--black);
        }

        .connect-btn-primary:hover {
          background: #7fffc8;
          transform: translateY(-2px);
        }

        .connect-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .connect-btn-secondary {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
          margin-top: 1rem;
        }

        .connect-btn-secondary:hover {
          background: var(--surface);
        }

        .back-link {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          color: var(--muted);
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--text);
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <a href="/" className="back-link">← Back to Home</a>

      <div className="connect-glass">
        <div className="connect-header">
          <div className="connect-logo">
            <div className="logo-dot" />
            <span>Pay<span>Mint</span></span>
          </div>
          <h1>Connect Wallet</h1>
          <p>Connect your Freighter wallet to get started</p>
        </div>

        {mounted && (
          <>
            {/* Success message when wallet connects */}
            {showSuccessMessage && (
              <div className="connect-status">
                <div className="status-connected" style={{ borderColor: 'rgba(255, 170, 0, 0.5)', background: 'rgba(255, 170, 0, 0.15)' }}>
                  <div className="status-icon" style={{ background: 'var(--green)', color: '#000' }}>✓</div>
                  <h3 style={{ color: 'var(--green)' }}>Successfully Connected!</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '1rem' }}>
                    Redirecting to dashboard in 7 seconds...
                  </p>
                  <div className="wallet-info-row">
                    <span className="wi-label">Address</span>
                    <span className="wi-value green">{shortenAddress(address)}</span>
                  </div>
                  <div className="wallet-info-row">
                    <span className="wi-label">Network</span>
                    <span className="wi-value">{network}</span>
                  </div>
                </div>
              </div>
            )}

            {!showSuccessMessage && (
              <>
                {loading ? (
                  <div className="connect-status">
                    <div className="connect-btn connect-btn-primary" style={{ justifyContent: 'center' }}>
                      <div className="spinner" /> Checking wallet...
                    </div>
                  </div>
                ) : isConnected && address ? (
                  <div className="connect-status">
                    <div className="status-connected">
                      <div className="status-icon">✓</div>
                      <h3>Wallet Connected</h3>
                      <div className="wallet-info-row">
                        <span className="wi-label">Address</span>
                        <span className="wi-value green">{shortenAddress(address)}</span>
                      </div>
                      <div className="wallet-info-row">
                        <span className="wi-label">Network</span>
                        <span className="wi-value">{network}</span>
                      </div>
                      <div className="wallet-info-row">
                        <span className="wi-label">Protocol</span>
                        <span className="wi-value">x402 · USDC</span>
                      </div>
                    </div>
                    <button className="connect-btn connect-btn-secondary" onClick={handleDisconnect}>
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <>
                    {displayError && (
                      <div className="connect-error">
                        <p>{displayError}</p>
                        {!displayError.includes('install') && (
                          <a 
                            className="connect-btn connect-btn-primary" 
                            href="https://www.freighter.app" 
                            target="_blank" 
                            rel="noreferrer"
                          >
                            Install Freighter →
                          </a>
                        )}
                      </div>
                    )}

                    <button 
                      className="connect-btn connect-btn-primary" 
                      onClick={handleConnect}
                      disabled={loading}
                    >
                      Connect Freighter
                    </button>

                    <button 
                      className="connect-btn connect-btn-secondary" 
                      onClick={() => router.push('/')}
                    >
                      Go Back
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
