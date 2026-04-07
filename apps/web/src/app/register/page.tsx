'use client';

import { useState, useEffect } from 'react';
import { useStellar } from '@/context/StellarContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import ConnectWallet from '@/components/ConnectWallet';
import "../paymint.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const shortenAddress = (addr: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

export default function Register() {
  const { isConnected, address, network, disconnect } = useStellar();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [agentData, setAgentData] = useState({
    name: '',
    description: '',
  });
  
  const [serviceData, setServiceData] = useState({
    name: '',
    description: '',
    serviceType: 'CUSTOM',
    pricePerCall: '',
    currency: 'USDC',
  });

  // Handle scroll
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleRegisterAgent = async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/api/agents/register`, {
        ownerAddress: address,
        name: agentData.name,
        description: agentData.description,
      });
      
      if (response.data.id) {
        setStep(2);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register agent');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterService = async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const agentResponse = await axios.get(
        `${API_URL}/api/agents/address/${address}`
      );
      
      await axios.post(`${API_URL}/api/services/register`, {
        agentId: agentResponse.data.id,
        name: serviceData.name,
        description: serviceData.description,
        serviceType: serviceData.serviceType,
        pricePerCall: parseFloat(serviceData.pricePerCall),
        currency: serviceData.currency,
      });
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register service');
    } finally {
      setLoading(false);
    }
  };

  // Navigation bar component
  const Navbar = () => (
    <nav className={`pm-nav ${isScrolled ? "scrolled" : ""}`}>
      <div className="pm-logo">
        <div className="logo-dot" />
        Pay<span>Mint</span>
      </div>
      <ul className="pm-nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/services">Services</a></li>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/playground">Playground</a></li>
      </ul>
      <div className="pm-nav-right">
        {isConnected && network && <span className="network-badge">{network}</span>}
        {isConnected ? (
          <button className="btn-wallet btn-wallet-connected" onClick={disconnect}>
            <div className="wallet-dot wallet-dot-connected" />
            {shortenAddress(address)}
          </button>
        ) : (
          <a href="/connect" className="btn-wallet btn-wallet-connect">
            Connect Wallet
          </a>
        )}
      </div>
    </nav>
  );

  return (
    <>
      <Navbar />
      <div className="pm-page">
        <div className="pm-container">
          <div className="pm-header">
            <h1 className="pm-title">Register Your Agent</h1>
            <p className="pm-subtitle">Set up your AI agent to start earning on the PayMint marketplace</p>
          </div>
          
          {!isConnected ? (
            <div className="pm-card" style={{ textAlign: 'center', padding: '4rem' }}>
              <p style={{ marginBottom: '2rem', color: 'var(--muted)' }}>
                Please connect your wallet to register an agent
              </p>
              <a href="/connect" className="btn-primary">
                Connect Wallet
              </a>
            </div>
          ) : (
            <div>
              {/* Step indicator */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.8rem',
                  background: step >= 1 ? 'var(--green)' : 'var(--surface)',
                  color: step >= 1 ? '#08080f' : 'var(--hint)',
                  border: step >= 1 ? 'none' : '1px solid var(--border)',
                }}>
                  1. Agent Info
                </div>
                <div style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.8rem',
                  background: step >= 2 ? 'var(--green)' : 'var(--surface)',
                  color: step >= 2 ? '#08080f' : 'var(--hint)',
                  border: step >= 2 ? 'none' : '1px solid var(--border)',
                }}>
                  2. Add Service
                </div>
              </div>
              
              {error && (
                <div className="error-card" style={{ marginBottom: '1.5rem' }}>
                  {error}
                </div>
              )}
              
              {step === 1 && (
                <div className="pm-card">
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', fontFamily: "'Syne', sans-serif" }}>
                    Agent Details
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                        Agent Name
                      </label>
                      <input
                        type="text"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--black)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--text)',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                        value={agentData.name}
                        onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                        placeholder="e.g., DataAnalysisBot"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                        Description
                      </label>
                      <textarea
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--black)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--text)',
                          fontSize: '0.95rem',
                          outline: 'none',
                          resize: 'vertical',
                          minHeight: '100px',
                        }}
                        value={agentData.description}
                        onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
                        placeholder="What does your agent do?"
                      />
                    </div>
                    <button
                      onClick={handleRegisterAgent}
                      disabled={loading || !agentData.name}
                      className="btn-primary"
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      {loading ? 'Registering...' : 'Register Agent'}
                    </button>
                  </div>
                </div>
              )}
              
              {step === 2 && (
                <div className="pm-card">
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', fontFamily: "'Syne', sans-serif" }}>
                    Add Your First Service
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                        Service Name
                      </label>
                      <input
                        type="text"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--black)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--text)',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                        value={serviceData.name}
                        onChange={(e) => setServiceData({ ...serviceData, name: e.target.value })}
                        placeholder="e.g., Basic Data Analysis"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                        Description
                      </label>
                      <textarea
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--black)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--text)',
                          fontSize: '0.95rem',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                        value={serviceData.description}
                        onChange={(e) => setServiceData({ ...serviceData, description: e.target.value })}
                        placeholder="What does this service include?"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                        Service Type
                      </label>
                      <select
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--black)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--text)',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                        value={serviceData.serviceType}
                        onChange={(e) => setServiceData({ ...serviceData, serviceType: e.target.value })}
                      >
                        <option value="DATA_ANALYSIS">Data Analysis</option>
                        <option value="API_ACCESS">API Access</option>
                        <option value="CONTENT_GENERATION">Content Generation</option>
                        <option value="RESEARCH">Research</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                          Price per Call
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--black)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            color: 'var(--text)',
                            fontSize: '0.95rem',
                            outline: 'none',
                          }}
                          value={serviceData.pricePerCall}
                          onChange={(e) => setServiceData({ ...serviceData, pricePerCall: e.target.value })}
                          placeholder="0.50"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                          Currency
                        </label>
                        <select
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--black)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            color: 'var(--text)',
                            fontSize: '0.95rem',
                            outline: 'none',
                          }}
                          value={serviceData.currency}
                          onChange={(e) => setServiceData({ ...serviceData, currency: e.target.value })}
                        >
                          <option value="USDC">USDC</option>
                          <option value="XLM">XLM</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleRegisterService}
                      disabled={loading || !serviceData.name || !serviceData.pricePerCall}
                      className="btn-primary"
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      {loading ? 'Creating...' : 'Create Service'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}