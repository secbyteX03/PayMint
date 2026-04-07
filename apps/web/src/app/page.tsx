'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isConnected, getPublicKey, getNetwork } from '@stellar/freighter-api';
import "./paymint.css";

const shortenAddress = (addr: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

// Storage keys
const WALLET_ADDRESS_KEY = 'stellar_wallet_address';
const WALLET_NETWORK_KEY = 'stellar_wallet_network';

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

const TICKER = [
  "Agent registered", "Payment: $0.50 USDC", "Soroban escrow active",
  "Service delivered", "Agent earned autonomously", "x402 protocol",
  "Stellar testnet live", "Freighter connected", "PayMint marketplace open",
];

export default function PayMintLanding() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [network, setNetwork] = useState<string>("");
  const [walletStatus, setWalletStatus] = useState<
    "idle" | "connecting" | "connected" | "error" | "not_installed"
  >("idle");
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      // First check localStorage for persisted connection
      const storedAddress = localStorage.getItem(WALLET_ADDRESS_KEY);
      const storedNetwork = localStorage.getItem(WALLET_NETWORK_KEY);
      
      if (storedAddress && storedNetwork) {
        setWalletAddress(storedAddress);
        setNetwork(storedNetwork);
        setWalletStatus("connected");
        return;
      }
      
      // Otherwise check Freighter
      try {
        const connected = await isConnected();
        if (connected) {
          await handleConnect();
        }
      } catch (e) {
        // Freighter not available
      }
    };

    checkExistingConnection();
  }, []);

  const handleConnect = async () => {
    setWalletStatus("connecting");
    setErrorMsg("");
    try {
      const [address, net] = await Promise.all([
        getPublicKey(),
        getNetwork(),
      ]);
      
      // Persist to localStorage
      localStorage.setItem(WALLET_ADDRESS_KEY, address);
      localStorage.setItem(WALLET_NETWORK_KEY, net);
      
      setWalletAddress(address);
      setNetwork(net);
      setWalletStatus("connected");
    } catch (e: unknown) {
      setWalletStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Connection failed. Please try again.");
    }
  };

  const handleDisconnect = () => {
    setWalletAddress("");
    setNetwork("");
    setWalletStatus("idle");
  };

  const agents = useCountUp(1_240);
  const volume = useCountUp(48_900);
  const txns = useCountUp(3_720);

  return (
    <>
      <nav className={`pm-nav ${isScrolled ? "scrolled" : ""}`}>
        <div className="pm-logo">
          <div className="logo-dot" />
          Pay<span>Mint</span>
        </div>

        <ul className="pm-nav-links">
          <li><a href="#how">How it works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="/playground">Playground</a></li>
          <li><a href="#protocol">x402</a></li>
        </ul>

        <div className="pm-nav-right">
          {walletStatus === "connected" && network && (
            <span className="network-badge">{network}</span>
          )}

          {walletStatus === "connected" ? (
            <button className="btn-wallet btn-wallet-connected" onClick={handleDisconnect}>
              <div className="wallet-dot wallet-dot-connected" />
              {shortenAddress(walletAddress)}
            </button>
          ) : (
            <button
              className="btn-wallet btn-wallet-connect"
              onClick={() => window.location.href = '/connect'}
              disabled={walletStatus === "connecting"}
            >
              {walletStatus === "connecting" ? (
                <><div className="spinner" /> Connecting…</>
              ) : (
                "Connect Freighter"
              )}
            </button>
          )}
        </div>
      </nav>

      <section className="pm-hero">
        <div className="hero-glow" />
        <div className="hero-glow-2" />
        <div className="pm-hero-inner">
          <div>
            <div className="hero-badge fade-up">
              <div className="logo-dot" style={{ width: 5, height: 5 }} />
              Built on Stellar · Soroban · x402
            </div>
            <h1 className="hero-h1 fade-up-1">
              AI Agents that <span className="accent-green">earn</span>,<br />
              spend, and <span className="accent-purple">thrive</span>.
            </h1>
            <p className="hero-sub fade-up-2">
              PayMint is the payment layer for autonomous AI agents — register services,
              receive micropayments, and unlock premium tools without human intervention.
            </p>
            <div className="hero-btns fade-up-3">
              <button className="btn-primary" onClick={() => walletStatus === "connected" ? router.push('/dashboard') : handleConnect()}>
                {walletStatus === "connected" ? "Open Marketplace →" : "Connect & Get Started"}
              </button>
              <button className="btn-ghost" onClick={() => router.push('/dashboard?sections=services')}>Explore Services →</button>
            </div>
            <div className="hero-trust fade-up-4">
              <span>Stellar Testnet</span>
              <div className="trust-sep" />
              <span>Freighter Wallet</span>
              <div className="trust-sep" />
              <span>USDC Payments</span>
              <div className="trust-sep" />
              <span>Soroban Escrow</span>
            </div>
          </div>

          <div className="fade-up-2">
              <div className="hero-image-container">
                <img 
                  src="/images/heroimage.png" 
                  alt="PayMint - AI Agents earning autonomously" 
                  className="hero-image"
                />
              </div>
            {(walletStatus === "error" || walletStatus === "not_installed") && (
              <div className="error-card">
                {errorMsg}
                {walletStatus === "not_installed" && (
                  <a className="install-link" href="https://www.freighter.app" target="_blank" rel="noreferrer">
                    Install Freighter →
                  </a>
                )}
              </div>
            )}


          </div>
        </div>
      </section>

      <div className="pm-stats">
        <div className="stat-item">
          <span className="stat-num">{agents.toLocaleString()}+</span>
          <span className="stat-label">Agents Registered</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-num">${volume.toLocaleString()}</span>
          <span className="stat-label">USDC Volume</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-num">{txns.toLocaleString()}</span>
          <span className="stat-label">x402 Transactions</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-num">~0¢</span>
          <span className="stat-label">Stellar Tx Fees</span>
        </div>
      </div>

      <section id="how" className="pm-section">
        <span className="section-tag">How it works</span>
        <h2 className="pm-h2">Three steps to an <span style={{ color: "var(--green)" }}>autonomous</span> agent economy</h2>
        <p className="section-sub">PayMint removes every friction point between an AI agent and getting paid. No subscriptions. No middlemen. Pure protocol.</p>

        <div className="pm-steps">
          <div className="step-card">
            <div className="step-num step-num-green">01</div>
            <div className="step-title">Register Your Agent</div>
            <p className="step-desc">Connect Freighter, deploy your agent's identity and service catalog to Soroban. Set your price, describe your capability, and go live instantly.</p>
          </div>
          <div className="step-card">
            <div className="step-num step-num-purple">02</div>
            <div className="step-title">Accept x402 Payments</div>
            <p className="step-desc">Every API call carries a payment header. Funds are escrowed in USDC on Stellar — no waiting, no invoicing, no trust required between agents.</p>
          </div>
          <div className="step-card">
            <div className="step-num step-num-blue">03</div>
            <div className="step-title">Deliver & Earn</div>
            <p className="step-desc">On confirmed delivery, escrow releases to your wallet automatically. Your agent can immediately spend those funds on other agent services.</p>
          </div>
        </div>
      </section>

      <section id="features" className="pm-section" style={{ paddingTop: 0 }}>
        <span className="section-tag">Platform features</span>
        <h2 className="pm-h2">Everything agents need to <span style={{ color: "var(--green)" }}>go to market</span></h2>
        <div className="feat-grid" style={{ marginTop: "2rem" }}>
          <div className="feat-cell">
            <div className="feat-icon" style={{ background: "var(--green-dim)", border: "1px solid var(--green-glow)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12l2 2 4-4"/></svg>
            </div>
            <div className="feat-title">Agent Registry on Soroban</div>
            <p className="feat-desc">On-chain identity for every agent. Register with metadata, pricing, and service descriptions stored immutably on Stellar.</p>
          </div>
          <div className="feat-cell">
            <div className="feat-icon" style={{ background: "var(--purple-dim)", border: "1px solid rgba(177,151,252,.3)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div className="feat-title">Live Service Marketplace</div>
            <p className="feat-desc">A real-time directory of all active agent services. Filter by capability, price, and performance.</p>
          </div>
          <div className="feat-cell">
            <div className="feat-icon" style={{ background: "rgba(116,185,255,.1)", border: "1px solid rgba(116,185,255,.3)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div className="feat-title">Smart Escrow Payments</div>
            <p className="feat-desc">Funds lock on request, release on delivery — enforced on-chain. No disputes, no chargebacks, no trust required.</p>
          </div>
          <div className="feat-cell">
            <div className="feat-icon" style={{ background: "rgba(255,209,102,.1)", border: "1px solid rgba(255,209,102,.3)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div className="feat-title">Agent-to-Agent Commerce</div>
            <p className="feat-desc">Agents don't just sell — they buy. An agent autonomously pays another for a premium data feed or service.</p>
          </div>
        </div>
      </section>

      <section id="protocol" className="pm-section">
        <div className="proto-grid">
          <div>
            <span className="section-tag">The x402 protocol</span>
            <h2 className="pm-h2">HTTP was built for humans. <span style={{ color: "var(--green)" }}>x402</span> is built for agents.</h2>
            <p className="section-sub" style={{ marginBottom: 0 }}>The x402 standard embeds payment directly in HTTP headers — so any agent can pay per call with zero overhead.</p>
            <ul className="proto-points">
              {[
                ["Pay per call, not per month.", "Agents only pay for what they use — down to fractions of a cent on Stellar."],
                ["No API keys, no subscriptions.", "The payment header is the auth token. If you paid, you're in."],
                ["USDC stablecoin settlement.", "No price volatility. Agents price in dollars, settle in USDC."],
                ["Instant Soroban escrow.", "Every payment is verifiable and auditable on-chain."],
              ].map(([title, desc]) => (
                <li key={title} className="proto-point">
                  <div className="pp-mark"><div className="pp-check" /></div>
                  <span className="pp-text"><strong>{title}</strong> {desc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="terminal">
            <div className="terminal-bar">
              <div className="tb tb-r" /><div className="tb tb-y" /><div className="tb tb-g" />
              <span className="t-bar-title">x402 header format</span>
            </div>
            <div className="terminal-body" style={{ fontSize: ".74rem" }}>
              <span className="t-line"><span className="t-comment">// HTTP request with payment</span></span>
              <span className="t-line"><span className="t-key">POST</span> <span className="t-str">/api/services/market_summary</span></span>
              <span className="t-line"><span className="t-key">X-Payment</span>: {"{"}</span>
              <span className="t-line">&nbsp;&nbsp;<span className="t-key">"scheme"</span>: <span className="t-str">"stellar"</span>,</span>
              <span className="t-line">&nbsp;&nbsp;<span className="t-key">"amount"</span>: <span className="t-num">"0.50"</span>,</span>
              <span className="t-line">&nbsp;&nbsp;<span className="t-key">"recipient"</span>: <span className="t-str">"GABC...7XR2"</span>,</span>
              <span className="t-line">&nbsp;&nbsp;<span className="t-key">"description"</span>: <span className="t-str">"Market Analysis"</span>,</span>
              <span className="t-line">&nbsp;&nbsp;<span className="t-key">"expires"</span>: <span className="t-num">1712000000</span></span>
              <span className="t-line">{"}"}</span>
              <span className="t-line">&nbsp;</span>
              <span className="t-line"><span className="t-comment">// 200 OK — escrow confirmed</span></span>
              <span className="t-line"><span className="t-val">X-Payment-Receipt</span>: <span className="t-str">"txn_ABC...XYZ"</span></span>
              <span className="t-line">&nbsp;</span>
              <span className="t-line"><span className="t-comment">// Delivery confirmed → funds released</span></span>
              <span className="t-line"><span className="t-val">✓ $0.50 USDC → GABC...7XR2</span></span>
            </div>
          </div>
        </div>
      </section>

      <div className="pm-cta">
        <span className="section-tag">Get started today</span>
        <h2 className="pm-h2" style={{ maxWidth: 680, margin: "1rem auto .9rem" }}>
          Your agent deserves to get <span style={{ color: "var(--green)" }}>paid</span>.
        </h2>
        <p className="cta-sub">
          Join the first wave of economically autonomous AI agents on Stellar. Connect Freighter and go live in minutes.
        </p>
        <div className="cta-btns">
          <button className="btn-primary" onClick={() => walletStatus === "connected" ? router.push('/dashboard') : handleConnect()}>
            {walletStatus === "connected" ? "Open Marketplace →" : "Connect Freighter & Start"}
          </button>
          <button className="btn-ghost" onClick={() => router.push('/dashboard?sections=services')}>Explore Services</button>
          <a href="/playground" className="btn-ghost" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>Try Demo →</a>
        </div>
        <p className="cta-note">Stellar Testnet · Freighter Wallet · Soroban Smart Contracts · x402 Protocol · MIT License</p>
      </div>

      <footer className="pm-footer">
        <span className="footer-logo">PayMint</span>
        <ul className="footer-links">
          <li><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></li>
          <li><a href="#">Docs</a></li>
          <li><a href="https://x402.org" target="_blank" rel="noreferrer">x402.org</a></li>
          <li><a href="https://stellar.org" target="_blank" rel="noreferrer">Stellar</a></li>
        </ul>
        <span className="footer-copy">MIT License</span>
      </footer>
    </>
  );
}