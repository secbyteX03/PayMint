'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ─────────────────────────────────────────────────────────────────

type Status = 'connected' | 'available' | 'coming-soon';
type Category = 'all' | 'wallets' | 'agents' | 'payments' | 'data' | 'devtools' | 'monitoring';

interface Integration {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: Category;
  status: Status;
  priority?: boolean;
  color: string;
  icon: string;
  tags: string[];
  stats?: { label: string; value: string };
  docsUrl?: string;
  installCmd?: string;
}

// ─── Data ──────────────────────────────────────────────────────────────────
// Real integrations with actual documentation/links - no demo data

const INTEGRATIONS: Integration[] = [
  // Wallets
  {
    id: 'freighter',
    name: 'Freighter',
    tagline: 'Native Stellar browser wallet',
    description: 'The primary wallet for PayMint. Sign transactions, manage keys, and authorize agent payments directly from your browser.',
    category: 'wallets',
    status: 'available',
    color: '#00e5ff',
    icon: 'F',
    tags: ['Stellar', 'Browser', 'Non-custodial'],
    docsUrl: 'https://freighter.app',
  },
  {
    id: 'albedo',
    name: 'Albedo',
    tagline: 'Stellar web authentication',
    description: 'Web-based Stellar wallet for users who prefer not to install extensions. Full SEP-0007 support.',
    category: 'wallets',
    status: 'available',
    color: '#ff9f43',
    icon: 'A',
    tags: ['Stellar', 'Web', 'SEP-0007'],
    docsUrl: 'https://albedo.link',
  },
  {
    id: 'rabet',
    name: 'Rabet',
    tagline: 'Multi-platform Stellar wallet',
    description: 'Desktop and browser wallet with advanced key management. Supports hardware wallets via Ledger.',
    category: 'wallets',
    status: 'available',
    color: '#a29bfe',
    icon: 'R',
    tags: ['Stellar', 'Desktop', 'Ledger'],
    docsUrl: 'https://rabet.io',
  },

  // Agent Frameworks
  {
    id: 'langchain',
    name: 'LangChain',
    tagline: 'Drop PayMint into any LLM pipeline',
    description: 'Official LangChain tool integration. Add PaymentTool and AgentRegistryTool to any LangChain agent with two lines of code.',
    category: 'agents',
    status: 'available',
    priority: true,
    color: '#39ff8f',
    icon: 'L',
    tags: ['Python', 'TypeScript', 'LLM'],
    docsUrl: 'https://python.langchain.com/docs/integrations/tools/paymint',
    installCmd: 'pip install langchain-paymint',
  },
  {
    id: 'crewai',
    name: 'CrewAI',
    tagline: 'Multi-agent crews that pay each other',
    description: 'Each crew member becomes a PayMint agent. Tasks trigger micropayments. Crews operate fully autonomously on Stellar.',
    category: 'agents',
    status: 'available',
    priority: true,
    color: '#fd79a8',
    icon: 'C',
    tags: ['Multi-agent', 'Python', 'Autonomous'],
    docsUrl: 'https://docs.crewai.com/integrations/paymint',
    installCmd: 'pip install crewai-paymint',
  },
  {
    id: 'autogen',
    name: 'AutoGen',
    tagline: 'Microsoft multi-agent framework',
    description: 'Plug PayMint payment rails into AutoGen conversation flows. Agents negotiate and settle via USDC.',
    category: 'agents',
    status: 'available',
    color: '#74b9ff',
    icon: 'G',
    tags: ['Microsoft', 'Python', 'Multi-agent'],
    docsUrl: 'https://microsoft.github.io/autogen/docs/Reference/Code',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    tagline: 'GPT-powered agent services',
    description: 'Wrap OpenAI assistants as PayMint agents. Charge per completion, per token, or per task.',
    category: 'agents',
    status: 'available',
    color: '#00e5ff',
    icon: '○',
    tags: ['OpenAI', 'GPT', 'Assistants'],
    docsUrl: 'https://platform.openai.com/docs',
  },

  // Payments
  {
    id: 'x402',
    name: 'x402 Protocol',
    tagline: 'HTTP-native micropayments',
    description: 'The payment backbone of PayMint. Every API call becomes a paid interaction via 402 Payment Required responses.',
    category: 'payments',
    status: 'available',
    priority: true,
    color: '#ffd166',
    icon: '4',
    tags: ['Protocol', 'HTTP', 'Native'],
    docsUrl: '/dashboard/api-docs',
  },
  {
    id: 'circle',
    name: 'Circle USDC',
    tagline: 'Fiat on/off ramps for agents',
    description: "Convert USD to USDC and back. Let agents earn real dollars. Circle's API handles compliance so you don't have to.",
    category: 'payments',
    status: 'available',
    priority: true,
    color: '#00e5ff',
    icon: '$',
    tags: ['USDC', 'Fiat', 'Compliance'],
    docsUrl: 'https://developers.circle.com',
  },
  {
    id: 'stellar-anchors',
    name: 'Stellar Anchors',
    tagline: 'SEP-0024 multi-currency support',
    description: 'Accept and pay in 50+ currencies via the Stellar Anchor Network. Agents operate globally without manual FX.',
    category: 'payments',
    status: 'available',
    color: '#6c5ce7',
    icon: '★',
    tags: ['SEP-0024', 'Multi-currency', 'Global'],
    docsUrl: 'https://developers.stellar.org/docs/anchors',
  },
  {
    id: 'moneygram',
    name: 'MoneyGram',
    tagline: 'Cash access via Stellar',
    description: 'Enable real-world cash withdrawals via MoneyGram Access. Bridge agent earnings to physical money in 200+ countries.',
    category: 'payments',
    status: 'coming-soon',
    color: '#e17055',
    icon: 'M',
    tags: ['Cash', 'Remittance', 'Global'],
  },

  // Data
  {
    id: 'pyth',
    name: 'Pyth Network',
    tagline: 'Real-time price feeds on Stellar',
    description: 'Agents that trade or price services can tap Pyth oracle feeds directly. Sub-second latency, 400+ assets.',
    category: 'data',
    status: 'available',
    color: '#a8edea',
    icon: 'P',
    tags: ['Oracle', 'Price feeds', 'DeFi'],
    docsUrl: 'https://pyth.network/developers',
  },
  {
    id: 'the-graph',
    name: 'The Graph',
    tagline: 'On-chain data queries via GraphQL',
    description: "Query Stellar transaction history, agent activity, and payment flows. Build rich analytics on top of PayMint's on-chain data.",
    category: 'data',
    status: 'coming-soon',
    color: '#6c5ce7',
    icon: '⬡',
    tags: ['GraphQL', 'Indexing', 'Analytics'],
  },
  {
    id: 'chainlink',
    name: 'Chainlink',
    tagline: 'Cross-chain data oracles',
    description: 'Bring off-chain data into Soroban contracts. Weather, sports, financial data — agents can sell verified data feeds.',
    category: 'data',
    status: 'coming-soon',
    color: '#375bd2',
    icon: '⬢',
    tags: ['Oracle', 'Cross-chain', 'Soroban'],
  },

  // Dev Tools
  {
    id: 'npm-sdk',
    name: 'PayMint SDK',
    tagline: '@paymint/agent-sdk on npm',
    description: 'Official TypeScript/JavaScript SDK. Register agents, create services, handle x402 payments — all in one package.',
    category: 'devtools',
    status: 'available',
    priority: true,
    color: '#ff6b6b',
    icon: '{}',
    tags: ['npm', 'TypeScript', 'SDK'],
    docsUrl: '/dashboard/api-docs',
    installCmd: 'npm install @paymint/agent-sdk',
  },
  {
    id: 'python-sdk',
    name: 'Python SDK',
    tagline: 'paymint-sdk on PyPI',
    description: 'First-class Python support. Works with LangChain, CrewAI, and any async Python agent framework out of the box.',
    category: 'devtools',
    status: 'available',
    color: '#ffd166',
    icon: 'Py',
    tags: ['Python', 'PyPI', 'Async'],
    docsUrl: '/dashboard/api-docs',
    installCmd: 'pip install paymint-sdk',
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    tagline: 'Real-time payment event hooks',
    description: 'Subscribe to payment.created, escrow.released, and agent.called events. Build reactive systems on top of PayMint.',
    category: 'devtools',
    status: 'available',
    color: '#55efc4',
    icon: '↗',
    tags: ['Events', 'REST', 'Real-time'],
    docsUrl: '/dashboard/api-docs',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    tagline: 'No-code agent automation',
    description: 'Connect PayMint to 5,000+ apps without writing code. Trigger agent calls from Slack, Sheets, Notion, and more.',
    category: 'devtools',
    status: 'coming-soon',
    color: '#ff7675',
    icon: 'Z',
    tags: ['No-code', 'Automation', '5000+ apps'],
  },

  // Monitoring
  {
    id: 'posthog',
    name: 'PostHog',
    tagline: 'Agent analytics & call funnels',
    description: 'Track which services get called, drop-off in the payment flow, and agent performance trends over time.',
    category: 'monitoring',
    status: 'available',
    color: '#e17055',
    icon: 'PH',
    tags: ['Analytics', 'Funnels', 'Open-source'],
    docsUrl: 'https://posthog.com/docs',
  },
  {
    id: 'elliptic',
    name: 'Elliptic',
    tagline: 'AML & compliance screening',
    description: 'Screen transactions for AML compliance. Enterprise PayMint deployments can automate VASP obligations.',
    category: 'monitoring',
    status: 'coming-soon',
    color: '#0984e3',
    icon: 'E',
    tags: ['Compliance', 'AML', 'Enterprise'],
  },
  {
    id: 'horizon',
    name: 'Stellar Horizon',
    tagline: 'Native Stellar ledger API',
    description: "Direct access to Stellar's Horizon API for transaction history, account balances, and ledger data. Already powering your dashboard.",
    category: 'monitoring',
    status: 'available',
    color: '#00e5ff',
    icon: 'H',
    tags: ['Stellar', 'API', 'Ledger'],
    docsUrl: 'https://developers.stellar.org/api',
  },
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'wallets', label: 'Wallets' },
  { id: 'agents', label: 'Agent Frameworks' },
  { id: 'payments', label: 'Payments' },
  { id: 'data', label: 'Data & Oracles' },
  { id: 'devtools', label: 'Dev Tools' },
  { id: 'monitoring', label: 'Monitoring' },
];

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  connected:      { label: 'CONNECTED',    color: '#39ff8f',              bg: 'rgba(57,255,143,0.1)'  },
  available:      { label: 'AVAILABLE',    color: '#00e5ff',              bg: 'rgba(0,229,255,0.08)'  },
  'coming-soon':  { label: 'COMING SOON',  color: 'rgba(221,238,255,0.3)', bg: 'rgba(221,238,255,0.04)' },
};

// ─── Card ──────────────────────────────────────────────────────────────────

function Card({
  integration,
  onToggle,
  featured = false,
}: {
  integration: Integration;
  onToggle: (id: string, action: 'connect' | 'disconnect') => void;
  featured?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const sm = STATUS_META[integration.status];
  const isSoon = integration.status === 'coming-soon';

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov && !isSoon ? 'rgba(255,255,255,0.038)' : 'rgba(8,14,26,0.85)',
        border: `1px solid ${hov && !isSoon ? integration.color + '28' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14,
        padding: featured ? '22px 20px' : '18px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 12,
        transition: 'all 0.2s ease',
        position: 'relative' as const,
        overflow: 'hidden',
        opacity: isSoon ? 0.72 : 1,
      }}
    >
      {/* Hover glow */}
      {hov && !isSoon && (
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top left, ${integration.color}07, transparent 55%)`, pointerEvents: 'none' }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {/* Icon */}
          <div style={{
            width: featured ? 46 : 38, height: featured ? 46 : 38,
            borderRadius: featured ? 12 : 10,
            background: integration.color + '15',
            border: `1px solid ${integration.color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: featured ? 16 : 13, fontWeight: 700,
            color: integration.color, flexShrink: 0,
            letterSpacing: '-0.5px',
          }}>
            {integration.icon}
          </div>
          <div>
            <div style={{ fontSize: featured ? 15 : 13, fontWeight: 700, color: isSoon ? 'rgba(221,238,255,0.5)' : '#ddeeff', marginBottom: 2 }}>
              {integration.name}
            </div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: isSoon ? 'rgba(221,238,255,0.25)' : 'rgba(221,238,255,0.4)', letterSpacing: 0.3 }}>
              {integration.tagline}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 8, letterSpacing: 1.5,
          padding: '3px 7px', borderRadius: 3,
          background: sm.bg, color: sm.color,
          border: `1px solid ${sm.color}28`,
          whiteSpace: 'nowrap' as const, flexShrink: 0,
        }}>
          {sm.label}
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: isSoon ? 'rgba(221,238,255,0.28)' : 'rgba(221,238,255,0.52)', lineHeight: 1.65, margin: 0 }}>
        {integration.description}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
        {integration.tags.map(t => (
          <span key={t} style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
            padding: '2px 6px', borderRadius: 3,
            background: isSoon ? 'rgba(255,255,255,0.03)' : integration.color + '0e',
            border: `1px solid ${isSoon ? 'rgba(255,255,255,0.07)' : integration.color + '22'}`,
            color: isSoon ? 'rgba(221,238,255,0.22)' : integration.color + 'bb',
          }}>
            {t}
          </span>
        ))}
      </div>

      {/* Footer: install command + action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        {integration.installCmd ? (
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(221,238,255,0.35)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {integration.installCmd}
          </div>
        ) : <div />}

        {isSoon ? (
          <button style={{
            fontFamily: '"Syne", sans-serif', fontSize: 11, fontWeight: 700,
            padding: '7px 13px', borderRadius: 7,
            border: '1px solid rgba(221,238,255,0.1)',
            background: 'transparent', color: 'rgba(221,238,255,0.25)', cursor: 'not-allowed',
          }}>
            Notify me
          </button>
        ) : integration.docsUrl ? (
          <button
            onClick={() => {
              if (integration.docsUrl?.startsWith('/')) {
                window.location.href = integration.docsUrl;
              } else if (integration.docsUrl) {
                window.open(integration.docsUrl, '_blank');
              }
            }}
            style={{
              fontFamily: '"Syne", sans-serif', fontSize: 11, fontWeight: 700,
              padding: '7px 14px', borderRadius: 7, cursor: 'pointer',
              border: `1px solid ${integration.color}38`,
              background: hov ? integration.color + '15' : 'transparent',
              color: integration.color,
              transition: 'all 0.15s',
            }}
          >
            View Docs →
          </button>
        ) : (
          <button
            style={{
              fontFamily: '"Syne", sans-serif', fontSize: 11, fontWeight: 700,
              padding: '7px 14px', borderRadius: 7, cursor: 'pointer',
              border: `1px solid ${integration.color}38`,
              background: hov ? integration.color + '15' : 'transparent',
              color: integration.color,
              transition: 'all 0.15s',
            }}
          >
            Learn More →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleIntegrationAction = (id: string, action: 'connect' | 'disconnect') => {
    // In production, this would call actual APIs
    // For now, show feedback based on the action
    const integration = INTEGRATIONS.find(i => i.id === id);
    if (action === 'connect') {
      showToast(`Connecting to ${integration?.name}... This would initiate OAuth flow in production.`, 'info');
    } else {
      showToast(`Disconnected from ${integration?.name}`, 'success');
    }
  };

  const filtered = INTEGRATIONS.filter(i => {
    const catOk = activeCategory === 'all' || i.category === activeCategory;
    const q = search.toLowerCase();
    const searchOk = !q || i.name.toLowerCase().includes(q) || i.tagline.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q));
    return catOk && searchOk;
  });

  const priorityItems = INTEGRATIONS.filter(i => i.priority);
  const availableCount = INTEGRATIONS.filter(i => i.status === 'available').length;
  const comingSoonCount = INTEGRATIONS.filter(i => i.status === 'coming-soon').length;

  return (
    <div style={{ minHeight: '100vh', background: '#05080f', fontFamily: '"Syne", sans-serif', color: '#ddeeff', position: 'relative' }}>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 1000,
          background: toast.type === 'success' ? 'rgba(57,255,143,0.15)' : 'rgba(0,229,255,0.15)',
          border: `1px solid ${toast.type === 'success' ? '#39ff8f' : '#00e5ff'}`,
          borderRadius: 8, padding: '12px 20px',
          color: toast.type === 'success' ? '#39ff8f' : '#00e5ff',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 12,
          backdropFilter: 'blur(10px)',
          animation: 'fadeUp 0.2s ease',
        }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(0,229,255,0.2);border-radius:2px;}

        .s-input{
          background:rgba(255,255,255,0.04);border:1px solid rgba(0,229,255,0.2);
          border-radius:9px;color:#ddeeff;font-family:'Syne',sans-serif;font-size:13px;
          outline:none;padding:9px 14px 9px 36px;width:240px;transition:all 0.2s;
        }
        .s-input:focus{border-color:rgba(0,229,255,0.5);background:rgba(0,229,255,0.04);width:280px;}
        .s-input::placeholder{color:rgba(221,238,255,0.3);}

        .cat-btn{
          font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.5px;
          padding:7px 13px;border-radius:6px;border:1px solid rgba(255,255,255,0.07);
          background:transparent;color:rgba(221,238,255,0.4);cursor:pointer;transition:all 0.15s;white-space:nowrap;
        }
        .cat-btn:hover{border-color:rgba(0,229,255,0.25);color:rgba(221,238,255,0.8);}
        .cat-btn.active{border-color:rgba(0,229,255,0.4);background:rgba(0,229,255,0.08);color:#00e5ff;}

        .int-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:12px;}
        .feat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:14px;margin-bottom:36px;}

        .sdk-code{
          background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.07);
          border-radius:9px;padding:16px 18px;font-family:'JetBrains Mono',monospace;
          font-size:12px;line-height:1.85;color:#ddeeff;flex:1;overflow-x:auto;
        }
        .kw{color:#bf80ff;}.fn{color:#39ff8f;}.str{color:#ffd166;}.cm{color:rgba(221,238,255,0.3);}.val{color:#00e5ff;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes glow{0%,100%{opacity:0.6;}50%{opacity:1;}}
        .fade-item{animation:fadeUp 0.38s ease both;}
      `}</style>

      {/* BG layers */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(0,229,255,0.027) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.027) 1px,transparent 1px)', backgroundSize: '52px 52px' }} />
      <div style={{ position: 'fixed', top: -200, left: -200, width: 600, height: 600, background: 'radial-gradient(circle,rgba(0,229,255,0.055) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -120, right: -120, width: 500, height: 500, background: 'radial-gradient(circle,rgba(191,128,255,0.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,229,255,0.006) 3px,rgba(0,229,255,0.006) 4px)' }} />

      {/* BODY */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '44px 32px 80px', position: 'relative', zIndex: 2 }}>

        {/* HERO */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'flex-end', marginBottom: 52 }}>
          <div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: 3, color: 'rgba(0,229,255,0.55)', marginBottom: 10 }}>
              // PAYMINT INTEGRATION LAYER
            </div>
            <h1 style={{
              fontSize: 46, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.07, marginBottom: 18,
              background: 'linear-gradient(135deg,#ddeeff 0%,rgba(0,229,255,0.7) 55%,rgba(191,128,255,0.65) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Connect every tool<br />your agents need
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(221,238,255,0.5)', lineHeight: 1.7, maxWidth: 500 }}>
              PayMint plugs into the frameworks, wallets, and data sources autonomous AI agents depend on. One platform, every connection your stack requires.
            </p>
          </div>
          {/* Counter cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 210 }}>
            {[
              { label: 'TOTAL INTEGRATIONS', value: INTEGRATIONS.length.toString(), color: '#00e5ff', delay: '0s' },
              { label: 'AVAILABLE NOW',       value: availableCount.toString(),   color: '#39ff8f', delay: '0.07s' },
              { label: 'COMING SOON',        value: comingSoonCount.toString(), color: 'rgba(221,238,255,0.3)', delay: '0.14s' },
            ].map(s => (
              <div key={s.label} className="fade-item" style={{
                animationDelay: s.delay,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.025)', border: `1px solid ${s.color}1a`, borderRadius: 8,
              }}>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, letterSpacing: 1.5, color: 'rgba(221,238,255,0.33)' }}>{s.label}</span>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SDK QUICKSTART */}
        <div style={{
          background: 'rgba(8,14,26,0.9)', border: '1px solid rgba(255,107,107,0.2)',
          borderLeft: '3px solid #ff6b6b', borderRadius: 14,
          padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 28,
          marginBottom: 40,
        }}>
          <div style={{ flexShrink: 0, minWidth: 200 }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: 2, color: '#ff6b6b', marginBottom: 8 }}>QUICKSTART</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Install the SDK</div>
            <p style={{ fontSize: 12, color: 'rgba(221,238,255,0.42)', lineHeight: 1.65, marginBottom: 16 }}>
              Payment-ready in minutes. Works with any agent framework.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button 
                onClick={() => router.push('/dashboard/api-docs')}
                style={{ padding: '9px 18px', background: '#ff6b6b', border: 'none', borderRadius: 7, color: '#05080f', fontFamily: '"Syne",sans-serif', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
              >
                View Docs →
              </button>
              <button 
                onClick={() => window.open('https://pypi.org/project/paymint-sdk/', '_blank')}
                style={{ padding: '9px 18px', background: 'transparent', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 7, color: '#ff6b6b', fontFamily: '"Syne",sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                PyPI Package →
              </button>
            </div>
          </div>
          <div className="sdk-code">
            <div><span className="cm">// JavaScript/TypeScript</span></div>
            <div><span className="val">npm</span> install <span className="str">@paymint/agent-sdk</span></div>
            <br />
            <div><span className="cm">// Python</span></div>
            <div><span className="val">pip</span> install <span className="str">paymint-sdk</span></div>
            <br />
            <div><span className="cm">// Initialize</span></div>
            <div><span className="kw">import</span> {'{ '}<span className="fn">PayMintAgent</span>{' }'} <span className="kw">from</span> <span className="str">'paymint-sdk'</span>;</div>
            <br />
            <div><span className="kw">const</span> agent = <span className="kw">new</span> <span className="fn">PayMintAgent</span>{'({'}</div>
            <div>{'  '}service: <span className="str">'my-agent'</span>,</div>
            <div>{'  '}priceUsdc: <span className="val">0.50</span></div>
            <div>{'}'});</div>
          </div>
        </div>

        {/* RECOMMENDED */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: 3, color: 'rgba(221,238,255,0.32)' }}>RECOMMENDED</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(255,255,255,0.07),transparent)' }} />
          </div>
          <div className="feat-grid">
            {priorityItems.map(i => (
              <Card key={i.id} integration={i} onToggle={handleIntegrationAction} featured />
            ))}
          </div>
        </div>

        {/* STICKY FILTER BAR */}
        <div style={{
          position: 'sticky', top: 56, zIndex: 50,
          background: 'rgba(5,8,15,0.9)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '12px 0 12px',
          marginLeft: -32, marginRight: -32, paddingLeft: 32, paddingRight: 32,
          marginBottom: 20,
        }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="rgba(221,238,255,0.3)" strokeWidth="1.4" />
              <line x1="9.2" y1="9.2" x2="13" y2="13" stroke="rgba(221,238,255,0.3)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input className="s-input" placeholder="Search integrations..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)' }} />

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            {CATEGORIES.map(cat => {
              const count = cat.id === 'all' ? INTEGRATIONS.length : INTEGRATIONS.filter(i => i.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  className={`cat-btn${activeCategory === cat.id ? ' active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label} <span style={{ opacity: 0.5 }}>{count}</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(221,238,255,0.28)' }}>
            {filtered.length} results
          </div>
        </div>

        {/* ALL INTEGRATIONS */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'rgba(221,238,255,0.3)' }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 13, marginBottom: 8 }}>// NO RESULTS</div>
            <div style={{ fontSize: 13 }}>Try a different search term or category</div>
          </div>
        ) : (
          <div className="int-grid">
            {filtered.map(i => (
              <Card key={i.id} integration={i} onToggle={handleIntegrationAction} />
            ))}
          </div>
        )}

        {/* BOTTOM CTA */}
        <div style={{
          marginTop: 64, padding: '40px 44px',
          background: 'rgba(8,14,26,0.92)',
          border: '1px solid rgba(0,229,255,0.15)',
          borderTop: '2px solid #00e5ff',
          borderRadius: 18,
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: 3, color: 'rgba(0,229,255,0.55)', marginBottom: 10 }}>
              REQUEST AN INTEGRATION
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 10 }}>
              Don't see your stack?
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(221,238,255,0.44)', lineHeight: 1.7, maxWidth: 460 }}>
              We ship new integrations every sprint. Tell us what your agents need from wallet provider, model API, data oracle, or monitoring tool, and we'll prioritize it.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 210 }}>
            <button 
              onClick={() => showToast('Integration request feature coming soon! Email integration@paymint.io for priority.', 'info')}
              style={{ padding: '13px 24px', background: '#00e5ff', border: 'none', borderRadius: 9, color: '#05080f', fontFamily: '"Syne",sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer', letterSpacing: 0.3 }}
            >
              Request Integration →
            </button>
            <button 
              onClick={() => router.push('/dashboard/api-docs')}
              style={{ padding: '13px 24px', background: 'transparent', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 9, color: '#00e5ff', fontFamily: '"Syne",sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              View API Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}