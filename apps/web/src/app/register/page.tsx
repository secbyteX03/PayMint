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
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  
  const [agentData, setAgentData] = useState({
    name: '',
    description: '',
    apiEndpoint: '',
    webhookUrl: '',
    documentationUrl: '',
    capabilities: '',
    pricingModel: 'PER_CALL',
    pricePerCall: '',
    pricePerMonth: '',
    logoUrl: '',
    websiteUrl: '',
    supportEmail: '',
    termsOfServiceUrl: '',
  });
  
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const [serviceData, setServiceData] = useState({
    name: '',
    description: '',
    serviceType: 'CUSTOM',
    pricePerCall: '',
    currency: 'USDC',
    endpoint: '',
    method: 'POST',
    rateLimit: '',
    timeout: '',
    retryPolicy: '',
    responseFormat: 'JSON',
    schema: '',
    usageExamples: '',
  });

  // Handle scroll
  useEffect(() => {
    setMounted(true);
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
      // Parse capabilities from comma-separated string to array
      const capabilities = agentData.capabilities 
        ? agentData.capabilities.split(',').map(c => c.trim()).filter(c => c)
        : undefined;
      
      const response = await axios.post(`${API_URL}/api/agents/register`, {
        ownerAddress: address,
        name: agentData.name,
        description: agentData.description,
        apiEndpoint: agentData.apiEndpoint || undefined,
        webhookUrl: agentData.webhookUrl || undefined,
        documentationUrl: agentData.documentationUrl || undefined,
        capabilities: capabilities,
        pricingModel: agentData.pricingModel,
        pricePerCall: agentData.pricePerCall ? parseFloat(agentData.pricePerCall) : undefined,
        pricePerMonth: agentData.pricePerMonth ? parseFloat(agentData.pricePerMonth) : undefined,
        logoUrl: agentData.logoUrl || undefined,
        websiteUrl: agentData.websiteUrl || undefined,
        supportEmail: agentData.supportEmail || undefined,
        termsOfServiceUrl: agentData.termsOfServiceUrl || undefined,
      });
      
      if (response.data.id) {
        // Store the new agent ID for service registration
        sessionStorage.setItem('lastAgentId', response.data.id);
        setSuccessMessage('Agent registered successfully! You can now add a service.');
        setStep(2);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      // Handle different error types
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Unable to connect to the server. Please ensure the API is running.');
      } else if (err.response?.data?.error === 'Agent already registered' || err.message === 'Agent already registered') {
        // User is already registered - fetch their agent and show success
        try {
          const agentResponse = await axios.get(`${API_URL}/api/agents/address/${address}`);
          if (agentResponse.data) {
            setSuccessMessage('You are already registered! You can add a new service or manage your existing agent.');
            setStep(2);
          }
        } catch {
          setError('You appear to be registered but could not load your agent data. Please try again or contact support.');
        }
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to register agent. Please try again.');
      }
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
      
      // Parse usage examples from comma-separated string to array
      const usageExamples = serviceData.usageExamples
        ? serviceData.usageExamples.split('\n').map(e => e.trim()).filter(e => e)
        : undefined;
      
      await axios.post(`${API_URL}/api/services/register`, {
        agentId: agentResponse.data.id,
        name: serviceData.name,
        description: serviceData.description,
        serviceType: serviceData.serviceType,
        pricePerCall: parseFloat(serviceData.pricePerCall),
        currency: serviceData.currency,
        endpoint: serviceData.endpoint || undefined,
        method: serviceData.method,
        rateLimit: serviceData.rateLimit ? parseInt(serviceData.rateLimit) : undefined,
        timeout: serviceData.timeout ? parseInt(serviceData.timeout) : undefined,
        retryPolicy: serviceData.retryPolicy || undefined,
        responseFormat: serviceData.responseFormat || undefined,
        schema: serviceData.schema || undefined,
        usageExamples: usageExamples,
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
        <li><a href="/docs">Docs</a></li>
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
              {mounted && (
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
              )}
              
              {error && (
                <div className="error-card" style={{ marginBottom: '1.5rem' }}>
                  {error}
                </div>
              )}
              
              {successMessage && (
                <div className="success-card" style={{ marginBottom: '1.5rem', background: 'rgba(46, 204, 113, 0.1)', border: '1px solid var(--green)', borderRadius: '8px', padding: '1rem' }}>
                  <p style={{ color: 'var(--green)', margin: 0 }}>{successMessage}</p>
                </div>
              )}
              
              {step === 1 && (
                <div className="pm-card">
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', fontFamily: "'Syne', sans-serif" }}>
                    Agent Details
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Basic Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                          Agent Name *
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
                          Support Email
                        </label>
                        <input
                          type="email"
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
                          value={agentData.supportEmail}
                          onChange={(e) => setAgentData({ ...agentData, supportEmail: e.target.value })}
                          placeholder="support@example.com"
                        />
                      </div>
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
                    
                    {/* API Configuration */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--muted)' }}>
                        API Configuration
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            API Endpoint
                          </label>
                          <input
                            type="url"
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
                            value={agentData.apiEndpoint}
                            onChange={(e) => setAgentData({ ...agentData, apiEndpoint: e.target.value })}
                            placeholder="https://api.example.com"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Webhook URL
                          </label>
                          <input
                            type="url"
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
                            value={agentData.webhookUrl}
                            onChange={(e) => setAgentData({ ...agentData, webhookUrl: e.target.value })}
                            placeholder="https://webhook.example.com"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Documentation URL
                          </label>
                          <input
                            type="url"
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
                            value={agentData.documentationUrl}
                            onChange={(e) => setAgentData({ ...agentData, documentationUrl: e.target.value })}
                            placeholder="https://docs.example.com"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Logo URL
                          </label>
                          <input
                            type="url"
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
                            value={agentData.logoUrl}
                            onChange={(e) => setAgentData({ ...agentData, logoUrl: e.target.value })}
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Capabilities & Pricing */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--muted)' }}>
                        Capabilities & Pricing
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Capabilities (comma-separated)
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
                            value={agentData.capabilities}
                            onChange={(e) => setAgentData({ ...agentData, capabilities: e.target.value })}
                            placeholder="text-generation, image-analysis"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Pricing Model
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
                            value={agentData.pricingModel}
                            onChange={(e) => setAgentData({ ...agentData, pricingModel: e.target.value })}
                          >
                            <option value="PER_CALL">Per Call</option>
                            <option value="SUBSCRIPTION">Subscription</option>
                            <option value="ENTERPRISE">Enterprise</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Price per Call (USDC)
                          </label>
                          <input
                            type="number"
                            step="0.0000001"
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
                            value={agentData.pricePerCall}
                            onChange={(e) => setAgentData({ ...agentData, pricePerCall: e.target.value })}
                            placeholder="0.50"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Price per Month (USDC)
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
                            value={agentData.pricePerMonth}
                            onChange={(e) => setAgentData({ ...agentData, pricePerMonth: e.target.value })}
                            placeholder="99.00"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--muted)' }}>
                        Additional Information
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Website URL
                          </label>
                          <input
                            type="url"
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
                            value={agentData.websiteUrl}
                            onChange={(e) => setAgentData({ ...agentData, websiteUrl: e.target.value })}
                            placeholder="https://example.com"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Terms of Service URL
                          </label>
                          <input
                            type="url"
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
                            value={agentData.termsOfServiceUrl}
                            onChange={(e) => setAgentData({ ...agentData, termsOfServiceUrl: e.target.value })}
                            placeholder="https://example.com/tos"
                          />
                        </div>
                      </div>
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
                    {/* Basic Service Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                          Service Name *
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
                    
                    {/* Pricing */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                          Price per Call (USDC) *
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
                    
                    {/* Endpoint Configuration */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--muted)' }}>
                        Endpoint Configuration
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Endpoint Path
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
                            value={serviceData.endpoint}
                            onChange={(e) => setServiceData({ ...serviceData, endpoint: e.target.value })}
                            placeholder="/api/v1/analyze"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            HTTP Method
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
                            value={serviceData.method}
                            onChange={(e) => setServiceData({ ...serviceData, method: e.target.value })}
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Rate Limit (calls/min)
                          </label>
                          <input
                            type="number"
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
                            value={serviceData.rateLimit}
                            onChange={(e) => setServiceData({ ...serviceData, rateLimit: e.target.value })}
                            placeholder="60"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Timeout (seconds)
                          </label>
                          <input
                            type="number"
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
                            value={serviceData.timeout}
                            onChange={(e) => setServiceData({ ...serviceData, timeout: e.target.value })}
                            placeholder="30"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Response & Schema */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--muted)' }}>
                        Response Configuration
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Response Format
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
                            value={serviceData.responseFormat}
                            onChange={(e) => setServiceData({ ...serviceData, responseFormat: e.target.value })}
                          >
                            <option value="JSON">JSON</option>
                            <option value="XML">XML</option>
                            <option value="TEXT">Text</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            Retry Policy (JSON)
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
                            value={serviceData.retryPolicy}
                            onChange={(e) => setServiceData({ ...serviceData, retryPolicy: e.target.value })}
                            placeholder='{"maxRetries": 3, "backoff": "exponential"}'
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                          JSON Schema
                        </label>
                        <textarea
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--black)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            color: 'var(--text)',
                            fontSize: '0.85rem',
                            outline: 'none',
                            fontFamily: "'DM Mono', monospace",
                            resize: 'vertical',
                            minHeight: '100px',
                          }}
                          value={serviceData.schema}
                          onChange={(e) => setServiceData({ ...serviceData, schema: e.target.value })}
                          placeholder='{"type": "object", "properties": {...}}'
                        />
                      </div>
                    </div>
                    
                    {/* Usage Examples */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--muted)' }}>
                        Usage Documentation
                      </h3>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                          Usage Examples (one per line)
                        </label>
                        <textarea
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--black)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            color: 'var(--text)',
                            fontSize: '0.85rem',
                            outline: 'none',
                            fontFamily: "'DM Mono', monospace",
                            resize: 'vertical',
                            minHeight: '100px',
                          }}
                          value={serviceData.usageExamples}
                          onChange={(e) => setServiceData({ ...serviceData, usageExamples: e.target.value })}
                          placeholder="curl -X POST https://api.example.com/analyze -d '{...}'
OR
fetch('https://api.example.com/analyze', {...})"
                        />
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
