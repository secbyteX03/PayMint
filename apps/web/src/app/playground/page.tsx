'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Configuration ──────────────────────────────────────────────────────────────

const OLLAMA_ENDPOINT = process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'llama3.2';

// Check if Ollama is available
async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_ENDPOINT}/api/tags`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

// Generate response from Ollama
async function generateOllamaResponse(
  prompt: string,
  systemPrompt: string,
  model: string = OLLAMA_MODEL
): Promise<string> {
  const response = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: `${systemPrompt}\n\nUser: ${prompt}`,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  return data.response;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  cost?: string;
  source?: 'ollama' | 'demo';
}

interface Agent {
  id: string;
  name: string;
  codename: string;
  tagline: string;
  color: string;
  glowColor: string;
  accentBg: string;
  cost: string;
  capabilities: string[];
  systemPrompt: string;
  replies: string[];
  statusLabel: string;
  shape: 'hex' | 'diamond' | 'circle';
}

interface FeedItem {
  id: number;
  agentName: string;
  type: 'call' | 'payment' | 'register' | 'escrow';
  amount?: string;
  address: string;
  ts: number;
}

interface Badge {
  id: string;
  name: string;
  desc: string;
  threshold: number;
  symbol: string;
  color: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const AGENTS: Agent[] = [
  {
    id: 'neural',
    name: 'Neural Core',
    codename: 'NC-01',
    tagline: 'General cognition & reasoning engine',
    color: '#00e5ff',
    glowColor: 'rgba(0,229,255,0.35)',
    accentBg: 'rgba(0,229,255,0.06)',
    cost: '0.50',
    capabilities: ['Deep reasoning', 'Long-form writing', 'Translation', 'Summarization'],
    systemPrompt: 'You are a general-purpose AI assistant. Be clear, helpful, and concise.',
    statusLabel: 'ONLINE',
    shape: 'hex',
    replies: [
      "Analysing your query across multiple inference paths...\n\nHere's what I found: the most robust approach combines three strategies simultaneously — lateral decomposition, constraint mapping, and iterative refinement. Want me to walk through each?",
      "Processing complete. The core insight here is that most of the complexity is surface-level. Strip it back to first principles and you get:\n\n→ One clear goal\n→ Two real constraints  \n→ Three possible paths\n\nWhich path fits your timeline?",
      "Good question — and it's trickier than it looks. The short answer is yes, but the long answer involves a few important nuances around context, scope, and edge cases. Let me break those down.",
      "I've cross-referenced this with known patterns. The closest analogy is a three-body problem — once you fix two variables, the third falls into place naturally. Start by locking in your core constraint.",
    ],
  },
  {
    id: 'codex',
    name: 'Codex Agent',
    codename: 'CX-07',
    tagline: 'Full-stack code synthesis & debugging',
    color: '#39ff8f',
    glowColor: 'rgba(57,255,143,0.35)',
    accentBg: 'rgba(57,255,143,0.06)',
    cost: '0.75',
    capabilities: ['Code generation', 'Debugging', 'Architecture review', 'Performance audit'],
    systemPrompt: 'You are an expert programmer. Write clean, well-documented code with explanations.',
    statusLabel: 'READY',
    shape: 'diamond',
    replies: [
      "Found the pattern. Here's a clean implementation:\n\n```typescript\nconst optimized = <T>(arr: T[], key: keyof T): Map<T[keyof T], T> =>\n  arr.reduce((acc, item) => acc.set(item[key], item), new Map());\n```\n\nO(n) time, O(n) space. The generic keeps it type-safe across any shape of data.",
      "Root cause identified — it's a classic async race condition. Fix:\n\n```typescript\nconst withRetry = async <T>(fn: () => Promise<T>, n = 3): Promise<T> => {\n  try { return await fn(); }\n  catch (e) { if (n <= 1) throw e; return withRetry(fn, n - 1); }\n};\n```\n\nWraps any async call with automatic retry + exponential backoff.",
      "Architecture review complete. You have a coupling problem — three modules sharing the same state. Recommended fix:\n\n```typescript\n// Before: tightly coupled\nimport { state } from '../store/global';\n\n// After: dependency injected\nconst Component = ({ store }: { store: Store }) => { ... }\n```\n\nThis makes it testable and removes the hidden dependency.",
    ],
  },
  {
    id: 'oracle',
    name: 'Oracle Lens',
    codename: 'OL-14',
    tagline: 'Data intelligence & predictive analytics',
    color: '#bf80ff',
    glowColor: 'rgba(191,128,255,0.35)',
    accentBg: 'rgba(191,128,255,0.06)',
    cost: '1.00',
    capabilities: ['Predictive modelling', 'Trend detection', 'Statistical analysis', 'Report generation'],
    systemPrompt: 'You are a data analyst. Provide insights with clear explanations and recommendations.',
    statusLabel: 'SCANNING',
    shape: 'circle',
    replies: [
      "Scan complete. Significant signal detected:\n\n● Revenue velocity: +23% MoM — accelerating\n● Churn inflection point: day 7 (critical intervention window)\n● CAC trending down 11% — channel mix is working\n\nHigh-confidence recommendation: double retention spend at the 7-day mark. Projected LTV improvement: 34%.",
      "Pattern analysis across 90-day dataset:\n\n1. Tuesday 10am–2pm = peak engagement (3.2× baseline)\n2. Mobile drives 62% of traffic but only 38% of conversions — friction gap\n3. Cohort B retains 89% vs cohort A's 71% — pricing structure is the differentiator\n\nThe mobile conversion gap is your biggest lever right now.",
      "Predictive model output (87% confidence interval):\n\n→ Q3 target: achievable if current rate holds +/- 8%\n→ Risk factor: seasonal dip weeks 11–13, plan for -15% dip\n→ Opportunity: expand market segment 3, under-indexed vs. competition\n\nWant the full model breakdown?",
    ],
  },
];

const BADGES: Badge[] = [
  { id: 'spark', name: 'First Signal', desc: 'Send your first message', threshold: 1, symbol: '◈', color: '#00e5ff' },
  { id: 'probe', name: 'Deep Probe', desc: 'Make 5 calls', threshold: 5, symbol: '◉', color: '#39ff8f' },
  { id: 'multi', name: 'Multi-Agent', desc: 'Try all 3 agents', threshold: -1, symbol: '⬡', color: '#bf80ff' },
  { id: 'power', name: 'Power Node', desc: 'Reach 20 calls', threshold: 20, symbol: '◆', color: '#ff6b6b' },
];

const LIVE_AGENTS = ['DataAnalyzer-X', 'NLPEngine-7', 'TradeBot-Ω', 'VisionCore-3', 'SentimentAI', 'Codex-Prime'];
const LIVE_TYPES: { type: FeedItem['type']; label: string; color: string }[] = [
  { type: 'call', label: 'API call', color: '#00e5ff' },
  { type: 'payment', label: 'Payment', color: '#39ff8f' },
  { type: 'escrow', label: 'Escrow released', color: '#bf80ff' },
  { type: 'register', label: 'Agent registered', color: '#ff9f43' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function randAddr() {
  return `G${Math.random().toString(36).slice(2, 6).toUpperCase()}…${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AgentShape({ shape, color, size = 36 }: { shape: Agent['shape']; color: string; size?: number }) {
  if (shape === 'hex') {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <polygon
          points="18,3 32,10.5 32,25.5 18,33 4,25.5 4,10.5"
          stroke={color}
          strokeWidth="1.5"
          fill={color + '18'}
        />
        <polygon
          points="18,10 26,14.5 26,23.5 18,28 10,23.5 10,14.5"
          fill={color}
          opacity="0.9"
        />
      </svg>
    );
  }
  if (shape === 'diamond') {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <rect x="5" y="5" width="26" height="26" transform="rotate(45 18 18)" stroke={color} strokeWidth="1.5" fill={color + '18'} />
        <rect x="11" y="11" width="14" height="14" transform="rotate(45 18 18)" fill={color} opacity="0.9" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="14" stroke={color} strokeWidth="1.5" fill={color + '18'} />
      <circle cx="18" cy="18" r="8" fill={color} opacity="0.9" />
    </svg>
  );
}

function CodeBlock({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
          return (
            <pre key={i} style={{
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 12,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              overflowX: 'auto',
              margin: '8px 0',
              color: '#e8f4ff',
              lineHeight: 1.7,
              whiteSpace: 'pre',
            }}>
              {code}
            </pre>
          );
        }
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
      })}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const [agent, setAgent] = useState<Agent>(AGENTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [calls, setCalls] = useState(0);
  const [agentsSeen, setAgentsSeen] = useState<Set<string>>(new Set(['neural']));
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [scanLine, setScanLine] = useState(0);
  const [networkPulse, setNetworkPulse] = useState(0);
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check Ollama status on mount
  useEffect(() => {
    checkOllamaStatus().then(available => {
      setOllamaAvailable(available);
      console.log('Ollama status:', available ? 'Available' : 'Not available');
    });
  }, []);

  // Boot sequence message
  useEffect(() => {
    const boot: Message = {
      id: uid(),
      role: 'agent',
      content: `PAYMINT AGENT NETWORK · NODE ${agent.codename} ONLINE\n\nI'm ${agent.name} — ${agent.tagline}.\n\nThis is a free demo session. No wallet required. Make real paid calls by connecting Freighter after.`,
      timestamp: Date.now(),
    };
    setMessages([boot]);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  // Scanline animation
  useEffect(() => {
    const t = setInterval(() => setScanLine(p => (p + 1) % 100), 30);
    return () => clearInterval(t);
  }, []);

  // Network pulse counter
  useEffect(() => {
    const t = setInterval(() => setNetworkPulse(p => p + Math.floor(Math.random() * 4 + 1)), 1200);
    return () => clearInterval(t);
  }, []);

  // Live feed
  useEffect(() => {
    const addFeed = () => {
      const type = pick(LIVE_TYPES);
      setFeed(prev => [{
        id: Date.now(),
        agentName: pick(LIVE_AGENTS),
        type: type.type,
        amount: type.type === 'payment' || type.type === 'escrow'
          ? `${(Math.random() * 2 + 0.1).toFixed(2)} USDC`
          : undefined,
        address: randAddr(),
        ts: Date.now(),
      }, ...prev].slice(0, 8));
    };
    addFeed(); addFeed(); addFeed();
    const t = setInterval(addFeed, 2500 + Math.random() * 2000);
    return () => clearInterval(t);
  }, []);

  // Badges computation
  const unlockedBadges = BADGES.filter(b => {
    if (b.id === 'multi') return agentsSeen.size >= 3;
    return calls >= b.threshold;
  });

  const handleSend = useCallback(async () => {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput('');
    setBusy(true);

    const userMsg: Message = { id: uid(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    // Try to get real AI response from Ollama if available
    let reply: string;
    let source: 'ollama' | 'demo' = 'demo';

    if (ollamaAvailable) {
      try {
        reply = await generateOllamaResponse(text, agent.systemPrompt);
        source = 'ollama';
      } catch (err) {
        console.error('Ollama request failed, falling back to demo:', err);
        reply = pick(agent.replies);
      }
    } else {
      // Simulate network delay for demo mode
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));
      reply = pick(agent.replies);
    }

    const agentMsg: Message = {
      id: uid(),
      role: 'agent',
      content: reply,
      timestamp: Date.now(),
      cost: agent.cost,
      source, // Track where the response came from
    };
    setMessages(prev => [...prev, agentMsg]);

    setCalls(p => p + 1);
    setFeed(prev => [{
      id: Date.now(),
      agentName: agent.name,
      type: 'call' as const,
      address: source === 'ollama' ? 'Local AI' : 'Demo',
      ts: Date.now(),
    }, ...prev].slice(0, 8));

    setBusy(false);
    inputRef.current?.focus();
  }, [input, busy, agent, ollamaAvailable]);

  const handleAgentSwitch = (a: Agent) => {
    if (a.id === agent.id) return;
    setAgent(a);
    setAgentsSeen(prev => {
      const newSet = new Set(prev);
      newSet.add(a.id);
      return newSet;
    });
    const switchMsg: Message = {
      id: uid(),
      role: 'agent',
      content: `— SWITCHING NODE —\n\n${a.codename} · ${a.name} online.\n${a.tagline}.\n\nCapabilities loaded: ${a.capabilities.join(' · ')}`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, switchMsg]);
  };

  const progressPct = Math.min(100, Math.round((calls / 20) * 100));

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: '#05080f',
      fontFamily: '"Syne", sans-serif',
      color: '#ddeeff',
      overflowX: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 2px; }

        .pm-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(0,229,255,0.18);
          border-radius: 10px;
          color: #ddeeff;
          font-family: inherit;
          font-size: 14px;
          outline: none;
          padding: 12px 16px;
          transition: border-color 0.2s, background 0.2s;
          width: 100%;
        }
        .pm-input:focus {
          border-color: rgba(0,229,255,0.5);
          background: rgba(0,229,255,0.04);
        }
        .pm-input::placeholder { color: rgba(221,238,255,0.3); }

        .agent-btn {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          cursor: pointer;
          padding: 14px;
          text-align: left;
          transition: all 0.2s;
          color: #ddeeff;
          font-family: inherit;
        }
        .agent-btn:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.05); }

        .send-btn {
          background: #00e5ff;
          border: none;
          border-radius: 10px;
          color: #05080f;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 12px 22px;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .send-btn:hover:not(:disabled) { background: #33eeff; transform: translateY(-1px); }
        .send-btn:active:not(:disabled) { transform: translateY(0); }
        .send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .cap-pill {
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          color: rgba(221,238,255,0.5);
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.3px;
          padding: 3px 8px;
          transition: all 0.15s;
        }

        .msg-bubble {
          animation: msgIn 0.25s ease both;
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .feed-row {
          animation: feedIn 0.3s ease both;
        }
        @keyframes feedIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .glitch {
          animation: glitch 8s infinite;
        }
        @keyframes glitch {
          0%, 92%, 100% { clip-path: none; transform: none; }
          93% { clip-path: inset(20% 0 40% 0); transform: translateX(-3px); }
          94% { clip-path: inset(60% 0 10% 0); transform: translateX(3px); }
          95% { clip-path: none; transform: none; }
        }

        .pulse-ring {
          animation: pulseRing 2s ease-in-out infinite;
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        .blink { animation: blink 1.2s step-end infinite; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

        .corner-tl::before, .corner-tr::after {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          border-color: rgba(0,229,255,0.4);
          border-style: solid;
        }
        .corner-tl::before { top: 0; left: 0; border-width: 1px 0 0 1px; }
        .corner-tr::after  { top: 0; right: 0; border-width: 1px 1px 0 0; }

        .typing-dots span {
          animation: dot 1.2s infinite;
          display: inline-block;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>

      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)',
        backgroundSize: '52px 52px',
        zIndex: 0,
      }} />

      {/* Radial glow top-left */}
      <div style={{
        position: 'fixed', top: -200, left: -200,
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Scanline */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,229,255,0.008) 3px, rgba(0,229,255,0.008) 4px)`,
        zIndex: 1,
      }} />

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,8,15,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,229,255,0.1)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 16,
        height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke="#00e5ff" strokeWidth="1.5" fill="rgba(0,229,255,0.12)" />
            <polygon points="12,7 17,9.5 17,14.5 12,17 7,14.5 7,9.5" fill="#00e5ff" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.5 }}>
            Pay<span style={{ color: '#00e5ff' }}>Mint</span>
          </span>
        </div>

        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9, letterSpacing: 2,
          color: 'rgba(0,229,255,0.6)',
          padding: '3px 8px',
          border: '1px solid rgba(0,229,255,0.2)',
          borderRadius: 3,
        }}>
          STELLAR TESTNET
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#39ff8f',
            boxShadow: '0 0 8px rgba(57,255,143,0.8)',
            animation: 'pulseRing 2s ease-in-out infinite',
          }} />
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#39ff8f' }}>
            {networkPulse.toLocaleString()} txns
          </span>
        </div>

        {/* Ollama status indicator */}
        {ollamaAvailable === true && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            marginLeft: 8, padding: '3px 8px',
            background: 'rgba(57,255,143,0.1)',
            border: '1px solid rgba(57,255,143,0.3)',
            borderRadius: 4,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#39ff8f',
            }} />
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: '#39ff8f' }}>
              LOCAL AI
            </span>
          </div>
        )}
        {ollamaAvailable === false && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            marginLeft: 8, padding: '3px 8px',
            background: 'rgba(255,159,67,0.1)',
            border: '1px solid rgba(255,159,67,0.3)',
            borderRadius: 4,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#ff9f43',
            }} />
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: '#ff9f43' }}>
              DEMO MODE
            </span>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: 'Dashboard', href: '/dashboard' },
          ].map(link => (
            <a key={link.href} href={link.href} style={{
              color: 'rgba(221,238,255,0.5)',
              fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.15s',
              padding: '4px 8px',
            }}>
              {link.label}
            </a>
          ))}
          <span style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            padding: '4px 12px',
            background: 'rgba(0,229,255,0.1)',
            border: '1px solid rgba(0,229,255,0.3)',
            borderRadius: 4,
            color: '#00e5ff',
            letterSpacing: 0.5,
          }}>
            PLAYGROUND
          </span>
          <button style={{
            background: '#00e5ff', border: 'none', borderRadius: 6,
            color: '#05080f', fontFamily: 'inherit', fontWeight: 800,
            fontSize: 12, padding: '7px 14px', cursor: 'pointer',
            letterSpacing: 0.3,
          }}>
            Connect Wallet
          </button>
        </div>
      </nav>

      {/* ── PAGE BODY ── */}
      <div style={{
        maxWidth: 1380,
        margin: '0 auto',
        padding: '24px 24px 40px',
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 20,
        position: 'relative', zIndex: 2,
      }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10, letterSpacing: 3,
                color: 'rgba(0,229,255,0.6)',
                marginBottom: 6,
              }}>
                // AGENT PLAYGROUND · FREE DEMO
              </div>
              <h1 className="glitch" style={{
                fontSize: 32, fontWeight: 800, letterSpacing: -1,
                lineHeight: 1.1,
                background: 'linear-gradient(135deg, #ddeeff 0%, rgba(0,229,255,0.8) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Interact with<br />AI Agents on Stellar
              </h1>
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10, color: 'rgba(221,238,255,0.35)',
              textAlign: 'right', lineHeight: 1.8,
            }}>
              <div>x402 PROTOCOL</div>
              <div>USDC MICROPAYMENTS</div>
              <div>SOROBAN ESCROW</div>
            </div>
          </div>

          {/* Agent selector */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10,
          }}>
            {AGENTS.map(a => {
              const active = a.id === agent.id;
              return (
                <button
                  key={a.id}
                  className="agent-btn"
                  onClick={() => handleAgentSwitch(a)}
                  style={{
                    borderColor: active ? a.color + '55' : undefined,
                    background: active ? a.accentBg : undefined,
                    position: 'relative',
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      height: 2,
                      background: a.color,
                      borderRadius: '12px 12px 0 0',
                    }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <AgentShape shape={a.shape} color={a.color} size={32} />
                    <div>
                      <div style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 9, color: a.color, letterSpacing: 1.5, marginBottom: 2,
                      }}>
                        {a.codename}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ddeeff' }}>{a.name}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(221,238,255,0.45)', lineHeight: 1.4, marginBottom: 10 }}>
                    {a.tagline}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11, fontWeight: 700,
                      color: active ? a.color : 'rgba(221,238,255,0.4)',
                    }}>
                      ${a.cost} / call
                    </span>
                    {active && (
                      <span style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 8, letterSpacing: 1,
                        color: '#39ff8f',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: '#39ff8f', display: 'inline-block',
                          boxShadow: '0 0 6px #39ff8f',
                        }} />
                        {a.statusLabel}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Capabilities */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9, letterSpacing: 2, color: 'rgba(221,238,255,0.3)',
            }}>
              CAPABILITIES
            </span>
            {agent.capabilities.map(cap => (
              <span key={cap} className="cap-pill"
                style={{ borderColor: agent.color + '40', color: agent.color + 'cc' }}
              >
                {cap}
              </span>
            ))}
          </div>

          {/* Chat panel */}
          <div style={{
            background: 'rgba(8,14,26,0.8)',
            border: `1px solid ${agent.color}28`,
            borderRadius: 14,
            display: 'flex', flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Corner accents */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              pointerEvents: 'none', zIndex: 1,
            }}>
              {[
                { top: 0, left: 0, borderWidth: '2px 0 0 2px' },
                { top: 0, right: 0, borderWidth: '2px 2px 0 0' },
                { bottom: 0, left: 0, borderWidth: '0 0 2px 2px' },
                { bottom: 0, right: 0, borderWidth: '0 2px 2px 0' },
              ].map((style, i) => (
                <div key={i} style={{
                  position: 'absolute', width: 16, height: 16,
                  borderStyle: 'solid', borderColor: agent.color + '60',
                  ...style,
                }} />
              ))}
            </div>

            {/* Chat header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: `1px solid ${agent.color}18`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AgentShape shape={agent.shape} color={agent.color} size={28} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{agent.name}</div>
                  <div style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 9, color: 'rgba(221,238,255,0.4)', letterSpacing: 1,
                  }}>
                    {agent.codename} · {agent.statusLabel}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10, fontWeight: 700,
                  color: agent.color,
                }}>
                  ${agent.cost} USDC / call
                </div>
                <div style={{
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
                  color: '#39ff8f', letterSpacing: 1,
                  background: 'rgba(57,255,143,0.08)',
                  border: '1px solid rgba(57,255,143,0.2)',
                  borderRadius: 4, padding: '3px 8px',
                }}>
                  DEMO · FREE
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesRef}
              style={{
                flex: 1, overflowY: 'auto',
                padding: '16px 18px',
                display: 'flex', flexDirection: 'column', gap: 12,
                minHeight: 320, maxHeight: 380,
              }}
            >
              {messages.map(msg => (
                <div key={msg.id} className="msg-bubble" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  {msg.role === 'agent' && (
                    <div style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 9, letterSpacing: 1,
                      color: agent.color, marginBottom: 4, opacity: 0.7,
                    }}>
                      {agent.codename}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '86%',
                    padding: '11px 14px',
                    borderRadius: msg.role === 'user'
                      ? '12px 12px 3px 12px'
                      : '12px 12px 12px 3px',
                    background: msg.role === 'user'
                      ? agent.color
                      : 'rgba(255,255,255,0.04)',
                    border: msg.role === 'user'
                      ? 'none'
                      : `1px solid ${agent.color}22`,
                    color: msg.role === 'user' ? '#05080f' : '#ddeeff',
                    fontSize: 13, lineHeight: 1.65,
                  }}>
                    <CodeBlock text={msg.content} />
                  </div>
                  {msg.cost && (
                    <div style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 9, color: 'rgba(221,238,255,0.3)',
                      marginTop: 4,
                    }}>
                      demo · would cost ${msg.cost} USDC
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {busy && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AgentShape shape={agent.shape} color={agent.color} size={20} />
                  <div style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${agent.color}22`,
                    borderRadius: '12px 12px 12px 3px',
                    display: 'flex', gap: 5, alignItems: 'center',
                  }}>
                    <div className="typing-dots" style={{ display: 'flex', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: agent.color, display: 'block' }} />
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: agent.color, display: 'block' }} />
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: agent.color, display: 'block' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div style={{
              padding: '12px 18px',
              borderTop: `1px solid ${agent.color}18`,
              display: 'flex', gap: 10,
            }}>
              <input
                ref={inputRef}
                className="pm-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={`Ask ${agent.name} anything — no wallet needed`}
                disabled={busy}
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim() || busy}
                style={{ background: agent.color }}
              >
                Send →
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Session stats */}
          <div style={{
            background: 'rgba(8,14,26,0.8)',
            border: '1px solid rgba(0,229,255,0.12)',
            borderRadius: 12, padding: 16,
          }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9, letterSpacing: 2,
              color: 'rgba(221,238,255,0.35)', marginBottom: 12,
            }}>
              SESSION METRICS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'CALLS', value: calls, color: '#00e5ff' },
                { label: 'BADGES', value: unlockedBadges.length, color: '#bf80ff' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8, padding: '12px 10px', textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{
                    fontSize: 28, fontWeight: 800, letterSpacing: -1,
                    color: s.color, lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {s.value}
                  </div>
                  <div style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 9, color: 'rgba(221,238,255,0.35)',
                    marginTop: 5, letterSpacing: 1,
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress to Power Node */}
            <div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 9, color: 'rgba(221,238,255,0.35)',
                marginBottom: 6,
              }}>
                <span>POWER NODE PROGRESS</span>
                <span>{calls}/20</span>
              </div>
              <div style={{
                height: 4, background: 'rgba(255,255,255,0.06)',
                borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${progressPct}%`,
                  background: `linear-gradient(90deg, #00e5ff, #bf80ff)`,
                  borderRadius: 2,
                  transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                }} />
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div style={{
            background: 'rgba(8,14,26,0.8)',
            border: '1px solid rgba(0,229,255,0.12)',
            borderRadius: 12, padding: 16,
          }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9, letterSpacing: 2,
              color: 'rgba(221,238,255,0.35)', marginBottom: 12,
            }}>
              ACHIEVEMENTS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BADGES.map(b => {
                const unlocked = unlockedBadges.some(u => u.id === b.id);
                return (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px',
                    borderRadius: 8,
                    background: unlocked ? b.color + '0d' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${unlocked ? b.color + '33' : 'rgba(255,255,255,0.05)'}`,
                    opacity: unlocked ? 1 : 0.38,
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 7,
                      background: unlocked ? b.color + '1a' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${unlocked ? b.color + '44' : 'rgba(255,255,255,0.06)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: unlocked ? b.color : 'rgba(221,238,255,0.2)',
                    }}>
                      {b.symbol}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#ddeeff' }}>{b.name}</div>
                      <div style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 9, color: 'rgba(221,238,255,0.35)', marginTop: 2,
                      }}>
                        {b.desc}
                      </div>
                    </div>
                    {unlocked && (
                      <div style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 9, color: b.color,
                        background: b.color + '15',
                        border: `1px solid ${b.color}33`,
                        borderRadius: 3, padding: '2px 6px',
                      }}>
                        EARNED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live activity feed */}
          <div style={{
            background: 'rgba(8,14,26,0.8)',
            border: '1px solid rgba(0,229,255,0.12)',
            borderRadius: 12, padding: 16,
            flex: 1,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: '#39ff8f',
                boxShadow: '0 0 8px rgba(57,255,143,0.7)',
                animation: 'pulseRing 1.5s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 9, letterSpacing: 2, color: 'rgba(221,238,255,0.35)',
              }}>
                NETWORK ACTIVITY
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {feed.map(item => {
                const meta = LIVE_TYPES.find(t => t.type === item.type) || LIVE_TYPES[0];
                return (
                  <div key={item.id} className="feed-row" style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 9px',
                    background: 'rgba(255,255,255,0.025)',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: meta.color, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 11, fontWeight: 600, color: '#ddeeff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {item.agentName}
                      </div>
                      <div style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 9, color: 'rgba(221,238,255,0.35)',
                      }}>
                        {item.address} · {meta.label}
                      </div>
                    </div>
                    {item.amount && (
                      <div style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 10, fontWeight: 700,
                        color: '#39ff8f', flexShrink: 0,
                      }}>
                        +{item.amount}
                      </div>
                    )}
                    <div style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 9, color: meta.color, flexShrink: 0,
                    }}>
                      {timeAgo(item.ts)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div style={{
            background: 'rgba(8,14,26,0.9)',
            borderRadius: 12, padding: 18,
            border: '1px solid rgba(0,229,255,0.25)',
            borderTop: '2px solid #00e5ff',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9, letterSpacing: 2,
              color: 'rgba(0,229,255,0.6)', marginBottom: 8,
            }}>
              GO LIVE ON STELLAR
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
              Ready to earn USDC?
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10, color: 'rgba(221,238,255,0.4)',
              lineHeight: 1.6, marginBottom: 14,
            }}>
              Connect Freighter wallet to make real<br />
              paid API calls via x402 protocol
            </div>
            <button style={{
              width: '100%', padding: '11px 0',
              background: '#00e5ff', border: 'none', borderRadius: 8,
              color: '#05080f', fontFamily: 'inherit',
              fontWeight: 800, fontSize: 13, letterSpacing: 0.5,
              cursor: 'pointer', transition: 'background 0.15s',
            }}>
              Connect Freighter →
            </button>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9, color: 'rgba(221,238,255,0.25)',
              marginTop: 10,
            }}>
              Non-custodial · Stellar Testnet · USDC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}