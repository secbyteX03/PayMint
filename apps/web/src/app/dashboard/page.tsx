'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import { 
  Home,
  Bot, 
  ShoppingCart, 
  CreditCard, 
  ShieldCheck, 
  Wallet, 
  Activity,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  Settings,
  User,
  MessageSquare,
  Code,
  BarChart3,
  Globe,
  Zap,
  ArrowRight,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';
const dashboardStyles = `
:root {
  --bg: #080c14;
  --surface: #0d1420;
  --surface2: #111b2e;
  --border: rgba(0,210,255,0.12);
  --border2: rgba(0,210,255,0.25);
  --accent: #00d2ff;
  --accent2: #7b6fff;
  --accent3: #ffaa00;
  --warn: #ff6b35;
  --text: #e8f4ff;
  --muted: rgba(232,244,255,0.45);
  --mono: 'Space Mono', monospace;
  --display: 'Syne', sans-serif;
}

.dashboard-container {
  display: grid;
  grid-template-columns: 220px 1fr;
  grid-template-rows: 56px 1fr;
  min-height: 100vh;
  background: var(--bg);
  font-family: var(--display);
  color: var(--text);
  margin: 0;
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.dashboard-container::before {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,210,255,0.012) 2px, rgba(0,210,255,0.012) 4px);
  pointer-events: none;
  z-index: 9999;
}

.dashboard-container::after {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    linear-gradient(rgba(0,210,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,210,255,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: -1;
}

.dashboard-topbar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(8,12,20,0.9);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
  gap: 16px;
}

.dashboard-logo {
  font-family: var(--display);
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  cursor: pointer;
}

.logo-icon {
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-hex {
  width: 14px;
  height: 14px;
}

.network-badge {
  font-family: var(--mono);
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 3px;
  background: rgba(0,210,255,0.1);
  border: 1px solid var(--border2);
  color: var(--accent);
  letter-spacing: 0.5px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent3);
  animation: pulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,255,157,0.4); }
  50% { box-shadow: 0 0 0 6px rgba(0,255,157,0); }
}

.live-text {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--muted);
}

.topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.wallet-chip {
  font-family: var(--mono);
  font-size: 10px;
  padding: 5px 10px;
  border-radius: 4px;
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--muted);
  cursor: pointer;
  transition: border-color 0.2s;
  text-decoration: none;
  display: inline-block;
}

.wallet-chip:hover {
  border-color: var(--border2);
  color: var(--text);
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent2), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: white;
  cursor: pointer;
}

.dashboard-sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.nav-section-label {
  font-family: var(--mono);
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 2px;
  padding: 12px 20px 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
  border-left: 2px solid transparent;
  letter-spacing: 0.2px;
  text-decoration: none;
}

.nav-item:hover {
  color: var(--text);
  background: rgba(0,210,255,0.04);
}

.nav-item.active {
  color: var(--accent);
  border-left-color: var(--accent);
  background: rgba(0,210,255,0.06);
}

.nav-icon {
  width: 16px;
  height: 16px;
  opacity: 0.6;
  flex-shrink: 0;
}

.nav-item.active .nav-icon {
  opacity: 1;
}

.nav-badge {
  margin-left: auto;
  font-family: var(--mono);
  font-size: 9px;
  background: rgba(0,210,255,0.15);
  color: var(--accent);
  padding: 2px 6px;
  border-radius: 3px;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
}

.agent-chip {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.agent-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7b6fff, #00d2ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.agent-info {
  flex: 1;
  min-width: 0;
}

.agent-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-status {
  font-family: var(--mono);
  font-size: 9px;
  color: var(--accent3);
}

.dashboard-main {
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.page-sub {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
}

.btn {
  font-family: var(--display);
  font-size: 12px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  letter-spacing: 0.3px;
  text-decoration: none;
}

.btn-primary {
  background: var(--accent);
  color: #080c14;
}

.btn-primary:hover {
  background: #33ddff;
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  border-color: var(--border2);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: var(--text);
}

.modal-body {
  padding: 20px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.wallet-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

.wallet-info-row:last-of-type {
  border-bottom: none;
}

.wi-label {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 1px;
}

.wi-value {
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
}

.wi-value.green {
  color: var(--accent3);
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;
}

.stat-card:hover {
  border-color: var(--border2);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
}

.stat-card.blue::before { background: linear-gradient(90deg, var(--accent), transparent); }
.stat-card.purple::before { background: linear-gradient(90deg, var(--accent2), transparent); }
.stat-card.green::before { background: linear-gradient(90deg, var(--accent3), transparent); }
.stat-card.orange::before { background: linear-gradient(90deg, var(--warn), transparent); }

.stat-label {
  font-family: var(--mono);
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-card.blue .stat-value { color: var(--accent); }
.stat-card.purple .stat-value { color: var(--accent2); }
.stat-card.green .stat-value { color: var(--accent3); }
.stat-card.orange .stat-value { color: var(--warn); }

.stat-delta {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--accent3);
}

.stat-delta.neg { color: #ff5757; }

.grid2 {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.panel-meta {
  font-family: var(--mono);
  font-size: 9px;
  color: var(--muted);
}

.chart-area {
  height: 140px;
  position: relative;
  margin-bottom: 8px;
}

.chart-area svg { width: 100%; height: 100%; }

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-family: var(--mono);
  font-size: 9px;
  color: var(--muted);
}

.chart-legend {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}

.chart-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--muted);
}

.chart-legend-color {
  width: 12px;
  height: 2px;
  border-radius: 1px;
}

.agent-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 4px;
  margin: 0 -8px;
  cursor: pointer;
  transition: background 0.15s;
}

.agent-row:hover {
  background: rgba(0,210,255,0.04);
}

.agent-row-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.ag1 { background: rgba(0,210,255,0.15); color: var(--accent); }
.ag2 { background: rgba(123,111,255,0.15); color: var(--accent2); }
.ag3 { background: rgba(0,255,157,0.12); color: var(--accent3); }

.agent-row-info { flex: 1; min-width: 0; }
.agent-row-name { font-size: 12px; font-weight: 700; color: var(--text); }
.agent-row-sub { font-family: var(--mono); font-size: 9px; color: var(--muted); margin-top: 2px; }

.agent-row-stat { text-align: right; }
.agent-row-val { font-family: var(--mono); font-size: 12px; font-weight: 700; color: var(--text); }
.agent-row-calls { font-family: var(--mono); font-size: 9px; color: var(--muted); }

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.on { background: var(--accent3); }
.status-dot.idle { background: var(--warn); }
.status-dot.off { background: rgba(255,255,255,0.2); }

.txn-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 4px;
  margin: 0 -8px;
}

.txn-row:hover { background: rgba(0,210,255,0.04); }

.txn-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: rgba(0,210,255,0.1);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
}

.txn-icon.out { background: rgba(255,107,53,0.1); }

.txn-desc { flex: 1; min-width: 0; }
.txn-name { font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.txn-time { font-family: var(--mono); font-size: 9px; color: var(--muted); margin-top: 2px; }

.txn-amount { font-family: var(--mono); font-size: 12px; font-weight: 700; }
.txn-amount.in { color: var(--accent3); }
.txn-amount.out { color: var(--warn); }

.txn-hash { font-family: var(--mono); font-size: 9px; color: var(--muted); margin-top: 2px; text-align: right; }

.services-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.service-card {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.service-card:hover {
  border-color: var(--border2);
  transform: translateY(-2px);
}

.service-tag {
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 1.5px;
  color: var(--accent);
  background: rgba(0,210,255,0.1);
  border-radius: 3px;
  padding: 2px 6px;
  display: inline-block;
  margin-bottom: 8px;
}

.service-tag.nlp { background: rgba(123,111,255,0.12); color: var(--accent2); }
.service-tag.vision { background: rgba(0,255,157,0.08); color: var(--accent3); }

.service-name { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; line-height: 1.3; }
.service-price { font-family: var(--mono); font-size: 11px; color: var(--accent3); font-weight: 700; }
.service-calls { font-family: var(--mono); font-size: 9px; color: var(--muted); margin-top: 4px; }

.service-bar { margin-top: 10px; height: 2px; background: var(--border); border-radius: 1px; overflow: hidden; }
.service-bar-fill { height: 100%; border-radius: 1px; background: linear-gradient(90deg, var(--accent), var(--accent2)); }

.escrow-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-bottom: 1px solid var(--border);
  margin: 0 -8px;
  border-radius: 4px;
}

.escrow-pct { font-family: var(--mono); font-size: 10px; color: var(--muted); width: 32px; text-align: right; }
.escrow-bar-wrap { flex: 1; height: 4px; background: rgba(0,210,255,0.08); border-radius: 2px; overflow: hidden; }
.escrow-bar-inner { height: 100%; border-radius: 2px; }
.escrow-label { font-family: var(--mono); font-size: 10px; color: var(--text); width: 80px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.escrow-usdc { font-family: var(--mono); font-size: 11px; color: var(--text); font-weight: 700; text-align: right; min-width: 64px; }

.escrow-total {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.escrow-total-label { font-family: var(--mono); font-size: 9px; color: var(--muted); }
.escrow-total-value { font-family: var(--mono); font-size: 20px; font-weight: 700; color: var(--accent); }

.dashboard-footer {
  font-family: var(--mono);
  font-size: 9px;
  color: rgba(232,244,255,0.2);
  text-align: center;
  padding-bottom: 8px;
  letter-spacing: 1px;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-card { animation: fadeUp 0.4s ease both; }
.stat-card:nth-child(1) { animation-delay: 0.05s; }
.stat-card:nth-child(2) { animation-delay: 0.1s; }
.stat-card:nth-child(3) { animation-delay: 0.15s; }
.stat-card:nth-child(4) { animation-delay: 0.2s; }
`;

// Types
interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
  ownerAddress: string;
  // Extended properties for display
  type?: string;
  revenue?: number;
  calls?: number;
}

interface Service {
  id: string;
  name: string;
  description: string;
  serviceType: string;
  pricePerCall: number;
  currency: string;
  isActive: boolean;
  agentId: string;
  totalCalls?: number;
}

interface DashboardStats {
  totalRevenue: number;
  previousRevenue: number;
  apiCalls: number;
  previousApiCalls: number;
  activeEscrows: number;
  avgLatency: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected, network, disconnect } = useStellar();
  const [activeSection, setActiveSection] = useState('dashboard');

  // Handle URL query params for navigation
  useEffect(() => {
    const section = searchParams?.get('sections');
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const [showApiConfigModal, setShowApiConfigModal] = useState(false);
  const [showWebhookConfigModal, setShowWebhookConfigModal] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [agentData, setAgentData] = useState({
    name: '',
    description: '',
    apiEndpoint: '',
    apiKey: '',
    webhookUrl: '',
    documentationUrl: '',
    capabilities: '',
    pricingModel: 'PER_CALL',
    pricePerCall: '',
    pricePerMonth: '',
    logoUrl: '',
    websiteUrl: '',
    supportEmail: '',
    termsOfServiceUrl: ''
  });
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
    usageExamples: ''
  });
  
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    previousRevenue: 0,
    apiCalls: 0,
    previousApiCalls: 0,
    activeEscrows: 0,
    avgLatency: '-'
  });
  const [chartData, setChartData] = useState<{revenue: number[]; expenses: number[]; labels: string[]}>({
    revenue: [],
    expenses: [],
    labels: []
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [myAgent, setMyAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Display agents from API data filtered by user's wallet address
  const userAgents = address 
    ? agents.filter((a: any) => a.ownerAddress?.toLowerCase() === address?.toLowerCase())
    : [];
  
  const displayAgents = userAgents.length > 0 
    ? userAgents.map((a: any) => {
        // Calculate real revenue from completed payments where seller is this agent's owner
        const agentPayments = payments.filter((p: any) => 
          p.sellerAddress?.toLowerCase() === a.ownerAddress?.toLowerCase() && 
          p.status === 'COMPLETED'
        );
        const revenue = agentPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
        
        // Get services for this agent
        const agentServices = services.filter((s: any) => s.agentId === a.id);
        const calls = agentServices.reduce((sum: number, s: any) => sum + (s.totalCalls || 0), 0);
        
        return {
          id: a.id,
          name: a.name,
          type: a.pricingModel || 'PER_CALL',
          status: a.status?.toLowerCase() || 'active',
          revenue: revenue,
          calls: calls
        };
      })
    : [];

  // Generate random latency value only once on mount
  const latencyDelta = mounted ? Math.floor(Math.random() * 20) + 5 : 15;

  // Update myAgent when address changes or when agents list updates
  useEffect(() => {
    if (address && agents.length > 0) {
      const userAgent = agents.find((a: any) => a.ownerAddress?.toLowerCase() === address?.toLowerCase());
      setMyAgent(userAgent || null);
    }
  }, [address, agents]);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const baseUrl = 'http://localhost:3001/api';
        
        // Fetch stats from API - use user-specific stats if address is available
        try {
          const statsUrl = address 
            ? `${baseUrl}/stats/user/${address}` 
            : `${baseUrl}/stats`;
          const statsRes = await fetch(statsUrl);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            // Calculate market rank based on revenue vs other agents
            const allAgentsRes = await fetch(`${baseUrl}/agents`);
            let marketRank = '-';
            if (allAgentsRes.ok) {
              const allAgents = await allAgentsRes.json();
              const revenue = parseFloat(statsData.totalRevenue || '0');
              const sortedByRevenue = [...allAgents].sort((a: any, b: any) => {
                // Would need payments to calculate, using rating as proxy
                return (b.rating || 0) - (a.rating || 0);
              });
              const rank = sortedByRevenue.findIndex((a: any) => 
                a.ownerAddress?.toLowerCase() === address?.toLowerCase()) + 1;
              marketRank = rank > 0 ? `#${rank}` : '-';
            }
            setStats({
              totalRevenue: parseFloat(statsData.totalRevenue || statsData.totalVolume || '0'),
              previousRevenue: stats.previousRevenue || parseFloat(statsData.totalRevenue || statsData.totalVolume || '0') * 0.8, // Simulated previous (80% of current)
              apiCalls: statsData.apiCalls || statsData.totalPayments || 0,
              previousApiCalls: stats.previousApiCalls || (statsData.apiCalls || statsData.totalPayments || 0) * 0.9, // Simulated previous (90% of current)
              activeEscrows: statsData.activeEscrows || statsData.totalServices || 0,
              avgLatency: marketRank
            });
          }
        } catch (e) {
          console.log('Using default stats');
        }

        // Fetch chart data
        try {
          const paymentsRes = await fetch(`${baseUrl}/payments`);
          if (paymentsRes.ok) {
            const allPayments = await paymentsRes.json();
            setPayments(allPayments);
            
            // Get user's payments based on their address
            const userPayments = address 
              ? allPayments.filter((p: any) => 
                p.sellerAddress?.toLowerCase() === address?.toLowerCase() || 
                p.buyerAddress?.toLowerCase() === address?.toLowerCase()
              )
              : allPayments;
            
            // Generate last 30 days of data
            const now = new Date();
            const revenueByDay: Record<string, number> = {};
            const expensesByDay: Record<string, number> = {};
            const labels: string[] = [];
            
            // Initialize last 30 days
            for (let i = 29; i >= 0; i--) {
              const date = new Date(now);
              date.setDate(date.getDate() - i);
              const dateStr = date.toISOString().split('T')[0];
              const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              labels.push(label);
              revenueByDay[dateStr] = 0;
              expensesByDay[dateStr] = 0;
            }
            
            // Aggregate payments by day
            userPayments.forEach((p: any) => {
              if (p.status === 'COMPLETED') {
                const paymentDate = new Date(p.createdAt).toISOString().split('T')[0];
                const amount = parseFloat(p.amount) || 0;
                
                if (p.sellerAddress?.toLowerCase() === address?.toLowerCase()) {
                  // As seller - this is revenue
                  if (revenueByDay[paymentDate] !== undefined) {
                    revenueByDay[paymentDate] += amount;
                  }
                }
                if (p.buyerAddress?.toLowerCase() === address?.toLowerCase()) {
                  // As buyer - this is expense
                  if (expensesByDay[paymentDate] !== undefined) {
                    expensesByDay[paymentDate] += amount;
                  }
                }
              }
            });
            
            const revenue = labels.map(label => {
              const date = new Date(now);
              const [month, day] = label.split(' ');
              date.setMonth(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(month));
              date.setDate(parseInt(day));
              if (date > now) {
                date.setFullYear(date.getFullYear() - 1);
              }
              const dateStr = date.toISOString().split('T')[0];
              return revenueByDay[dateStr] || 0;
            });
            
            const expenses = labels.map(label => {
              const date = new Date(now);
              const [month, day] = label.split(' ');
              date.setMonth(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(month));
              date.setDate(parseInt(day));
              if (date > now) {
                date.setFullYear(date.getFullYear() - 1);
              }
              const dateStr = date.toISOString().split('T')[0];
              return expensesByDay[dateStr] || 0;
            });
            
            setChartData({ revenue, expenses, labels });
          }
        } catch (e) {
          console.log('Using default chart data');
        }
        
        try {
          const agentsRes = await fetch(`${baseUrl}/agents`);
          if (agentsRes.ok) {
            const agentsData = await agentsRes.json();
            setAgents(agentsData);
            
            // Find user's agent by their wallet address
            if (address) {
              const userAgent = agentsData.find((a: any) => a.ownerAddress?.toLowerCase() === address?.toLowerCase());
              if (userAgent) {
                setMyAgent(userAgent);
              }
            }
          }
        } catch (e) {
          console.log('Using demo agents');
        }
        
        try {
          const servicesRes = await fetch(`${baseUrl}/services`);
          if (servicesRes.ok) {
            const servicesData = await servicesRes.json();
            setServices(servicesData);
          }
        } catch (e) {
          console.log('Using demo services');
        }
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle in-dashboard registration
  const handleRegisterAgent = async () => {
    if (!address) {
      setRegisterError('Please connect your wallet first');
      return;
    }
    
    if (!agentData.name) {
      setRegisterError('Please enter an agent name');
      return;
    }
    
    setRegisterLoading(true);
    setRegisterError('');
    
    try {
      // Parse capabilities from comma-separated string to array
      const capabilities = agentData.capabilities 
        ? agentData.capabilities.split(',').map(c => c.trim()).filter(c => c)
        : undefined;
      
      const response = await fetch('http://localhost:3001/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: address,
          name: agentData.name,
          description: agentData.description,
          apiEndpoint: agentData.apiEndpoint || undefined,
          apiKey: agentData.apiKey || undefined,
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
        }),
      });
      
      const data = await response.json();
      
      if (data.id) {
        setRegisterStep(2);
        // Refresh agents list
        const agentsRes = await fetch('http://localhost:3001/api/agents');
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          setAgents(agentsData);
        }
      }
    } catch (err: any) {
      setRegisterError(err.message || 'Failed to register agent');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRegisterService = async () => {
    if (!address || agents.length === 0) return;
    
    setRegisterLoading(true);
    setRegisterError('');
    
    try {
      // Get the agent by address
      const agentResponse = await fetch(`http://localhost:3001/api/agents/address/${address}`);
      const agentInfo = await agentResponse.json();
      
      // Parse usage examples from newline-separated string to array
      const usageExamples = serviceData.usageExamples
        ? serviceData.usageExamples.split('\n').map(e => e.trim()).filter(e => e)
        : undefined;
      
      await fetch('http://localhost:3001/api/services/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agentInfo.id,
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
        }),
      });
      
      // Refresh services
      const servicesRes = await fetch('http://localhost:3001/api/services');
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }
      
      // Show success message
      setRegisterSuccess(true);
      
      // Close modal after a brief delay
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegisterStep(1);
        setRegisterSuccess(false);
        setAgentData({ name: '', description: '', apiEndpoint: '', apiKey: '', webhookUrl: '', documentationUrl: '', capabilities: '', pricingModel: 'PER_CALL', pricePerCall: '', pricePerMonth: '', logoUrl: '', websiteUrl: '', supportEmail: '', termsOfServiceUrl: '' });
        setServiceData({ name: '', description: '', serviceType: 'CUSTOM', pricePerCall: '', currency: 'USDC', endpoint: '', method: 'POST', rateLimit: '', timeout: '', retryPolicy: '', responseFormat: 'JSON', schema: '', usageExamples: '' });
      }, 2000);
    } catch (err: any) {
      setRegisterError(err.message || 'Failed to register service');
    } finally {
      setRegisterLoading(false);
    }
  };

  const openRegisterModal = () => {
    if (!address) {
      window.location.href = '/connect';
      return;
    }
    setShowRegisterModal(true);
    setRegisterStep(1);
    setRegisterError('');
  };

  const closeRegisterModal = () => {
    setShowRegisterModal(false);
    setRegisterStep(1);
    setRegisterError('');
    setRegisterSuccess(false);
    setAgentData({ name: '', description: '', apiEndpoint: '', apiKey: '', webhookUrl: '', documentationUrl: '', capabilities: '', pricingModel: 'PER_CALL', pricePerCall: '', pricePerMonth: '', logoUrl: '', websiteUrl: '', supportEmail: '', termsOfServiceUrl: '' });
    setServiceData({ name: '', description: '', serviceType: 'CUSTOM', pricePerCall: '', currency: 'USDC', endpoint: '', method: 'POST', rateLimit: '', timeout: '', retryPolicy: '', responseFormat: 'JSON', schema: '', usageExamples: '' });
  };

  // Filter services to show only user's own services
  const myServices = services.filter((s: any) => {
    if (!myAgent) return false;
    return s.agentId === myAgent.id;
  });

  // Static ID for SSR hydration stability
  const stableId = 47000000;

  const displayServices = myServices.length > 0 
    ? myServices.map((s, i) => ({
        id: s.id,
        name: s.name,
        price: Number(s.pricePerCall) || 0,
        calls: s.totalCalls || 0,
        uptime: 95,
        type: s.serviceType || 'CUSTOM'
      })) 
    : [];

  // Map payments to display format with service names - filtered by user's wallet address
  const userPayments = address
    ? payments.filter((p: any) => 
        p.buyerAddress?.toLowerCase() === address?.toLowerCase() ||
        p.sellerAddress?.toLowerCase() === address?.toLowerCase()
      )
    : payments;
  
  const displayPayments: { id: string; name: string; time: string; amount: number; type: string; hash: string }[] = userPayments.length > 0 
    ? userPayments.slice(0, 5).map((p: any) => {
        // Find the service name from services array
        const service = services.find((s: any) => s.id === p.serviceId);
        const serviceName = service?.name || p.serviceId?.slice(0, 8) || 'Payment';
        const isIncoming = p.sellerAddress?.toLowerCase() === address?.toLowerCase();
        return {
          id: p.id,
          name: serviceName,
          time: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent',
          amount: parseFloat(p.amount) || 0,
          type: isIncoming ? 'in' : 'out',
          hash: p.transactionHash?.slice(0, 8) || p.id?.slice(0, 8) || 'N/A'
        };
      })
    : [];
  
  // Map escrow payments - filtered by user's wallet address as buyer (user needs to release these)
  const userEscrows = address
    ? payments.filter((p: any) => 
        p.buyerAddress?.toLowerCase() === address?.toLowerCase() &&
        (p.status === 'PENDING' || p.status === 'ESCROW_CREATED' || p.status === 'LOCKED')
      )
    : payments.filter((p: any) => p.status === 'PENDING' || p.status === 'ESCROW_CREATED' || p.status === 'LOCKED');
  
  const displayEscrow: { id: string; name: string; pct: number; amount: number; color: string }[] = userEscrows.length > 0
    ? userEscrows.slice(0, 3).map((p: any, i: number) => {
        const service = services.find((s: any) => s.id === p.serviceId);
        return {
          id: p.id,
          name: service?.name || `Payment ${i + 1}`,
          pct: p.status === 'COMPLETED' ? 100 : p.status === 'ESCROW_CREATED' ? 75 : 50,
          amount: parseFloat(p.amount) || 0,
          color: ['#00d2ff', '#7b6fff', '#ffaa00'][i % 3]
        };
      })
    : [];
  const totalEscrow = displayEscrow.reduce((sum, e) => sum + e.amount, 0);
  const pendingEscrows = userEscrows.length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate percentage change
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / previous) * 100;
    return Math.round(change * 10) / 10;
  };

  // Render chart path from data points
  const renderChartPath = (data: number[], isRevenue: boolean, baseY: number) => {
    if (data.length === 0) return null;
    
    const maxVal = Math.max(...data, 1);
    const height = 120;
    const width = 520;
    const stepX = width / (data.length - 1);
    
    // Calculate Y positions (inverted - higher value = lower Y)
    const points = data.map((val, i) => {
      const x = i * stepX;
      const y = baseY - (val / maxVal) * (height * 0.8);
      return { x, y: Math.max(y, 5) };
    });
    
    // Create path string
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillPath = linePath + ` L${width} ${height} L0 ${height}Z`;
    
    const strokeColor = isRevenue ? '#00d2ff' : '#7b6fff';
    const fillUrl = isRevenue ? 'url(#grad1)' : 'url(#grad2)';
    const strokeWidth = isRevenue ? 2 : 1.5;
    
    return (
      <>
        <path d={fillPath} fill={fillUrl} />
        <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  };

  const [pageSub, setPageSub] = useState('// LAST SYNC: -- EPOCH #--');

  useEffect(() => {
    // Use stable values generated only on client - don't use random for hydration
    setPageSub(`// LAST SYNC: 2 MIN AGO · EPOCH #47000000`);
  }, []);

  const handleNavClick = (section: string) => {
    router.push(section === 'dashboard' ? '/dashboard' : `/dashboard/${section}`);
  };

  const openPlayground = () => {
    window.location.href = '/docs';
  };

  const goToRegister = () => {
    window.location.href = '/register';
  };

  const goToConnect = () => {
    window.location.href = '/connect';
  };

  const goHome = () => {
    window.location.href = '/';
  };

  const handlePurchase = (serviceName: string, price: number) => {
    alert(`Initiating purchase for ${serviceName} at ${price}/call`);
  };

  const handleReleaseEscrow = (escrowName: string) => {
    alert(`Releasing escrow for ${escrowName}`);
  };

  // Render different content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'my-agent':
        return renderMyAgent();
      case 'services':
        return renderServices();
      case 'payments':
        return renderPayments();
      case 'escrow':
        return renderEscrow();
      case 'discover':
        return renderDiscover();
      case 'integrations':
        return renderIntegrations();
      case 'profile':
        return renderProfile();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Agent Dashboard</div>
          <div className="page-sub">{pageSub}</div>
        </div>
      </div>

      {mounted && (
      <>
      <div className="stats-row">
        <div className="stat-card blue">
          <div className="stat-label">TOTAL REVENUE</div>
          <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
          <div className={`stat-delta ${getPercentageChange(stats.totalRevenue, stats.previousRevenue) >= 0 ? '' : 'neg'}`}>
            {getPercentageChange(stats.totalRevenue, stats.previousRevenue) >= 0 ? '↑' : '↓'} {Math.abs(getPercentageChange(stats.totalRevenue, stats.previousRevenue))}% from last period
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">TOTAL EXPENSES</div>
          <div className="stat-value">{formatCurrency(userPayments.filter((p: any) => p.buyerAddress?.toLowerCase() === address?.toLowerCase()).reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0))}</div>
          <div className="stat-delta">Total spent as buyer</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">API CALLS</div>
          <div className="stat-value">{stats.apiCalls.toLocaleString()}</div>
          <div className={`stat-delta ${getPercentageChange(stats.apiCalls, stats.previousApiCalls) >= 0 ? '' : 'neg'}`}>
            {getPercentageChange(stats.apiCalls, stats.previousApiCalls) >= 0 ? '↑' : '↓'} {Math.abs(getPercentageChange(stats.apiCalls, stats.previousApiCalls))}% from last period
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">ACTIVE ESCROWS</div>
          <div className="stat-value">{stats.activeEscrows}</div>
          <div className="stat-delta">↑ {pendingEscrows} pending release</div>
        </div>
      </div>
      </>
      )}

      <div className="grid2">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Revenue Stream</div>
            <div className="panel-meta">USDC · 30D</div>
          </div>
          <div className="chart-area">
            {chartData.revenue.length > 0 || chartData.expenses.length > 0 ? (
              <svg viewBox="0 0 520 130" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#00d2ff" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="grad2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7b6fff" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#7b6fff" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <line x1="0" y1="32" x2="520" y2="32" stroke="rgba(0,210,255,0.07)" strokeWidth="1"/>
                <line x1="0" y1="65" x2="520" y2="65" stroke="rgba(0,210,255,0.07)" strokeWidth="1"/>
                <line x1="0" y1="98" x2="520" y2="98" stroke="rgba(0,210,255,0.07)" strokeWidth="1"/>
                {renderChartPath(chartData.revenue, true, 98)}
                {renderChartPath(chartData.expenses, false, 110)}
              </svg>
            ) : (
              <svg viewBox="0 0 520 130" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#00d2ff" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="grad2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7b6fff" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#7b6fff" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <line x1="0" y1="32" x2="520" y2="32" stroke="rgba(0,210,255,0.07)" strokeWidth="1"/>
                <line x1="0" y1="65" x2="520" y2="65" stroke="rgba(0,210,255,0.07)" strokeWidth="1"/>
                <line x1="0" y1="98" x2="520" y2="98" stroke="rgba(0,210,255,0.07)" strokeWidth="1"/>
                <path d="M0 98 L26 90 L52 82 L78 75 L104 72 L130 68 L156 58 L182 52 L208 55 L234 45 L260 38 L286 35 L312 28 L338 32 L364 22 L390 18 L416 14 L442 10 L468 12 L494 8 L520 5 L520 130 L0 130Z" fill="url(#grad1)"/>
                <path d="M0 110 L26 108 L52 105 L78 100 L104 98 L130 95 L156 90 L182 88 L208 92 L234 86 L260 82 L286 80 L312 75 L338 78 L364 70 L390 66 L416 62 L442 58 L468 60 L494 55 L520 50 L520 130 L0 130Z" fill="url(#grad2)"/>
                <path d="M0 98 L26 90 L52 82 L78 75 L104 72 L130 68 L156 58 L182 52 L208 55 L234 45 L260 38 L286 35 L312 28 L338 32 L364 22 L390 18 L416 14 L442 10 L468 12 L494 8 L520 5" fill="none" stroke="#00d2ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M0 110 L26 108 L52 105 L78 100 L104 98 L130 95 L156 90 L182 88 L208 92 L234 86 L260 82 L286 80 L312 75 L338 78 L364 70 L390 66 L416 62 L442 58 L468 60 L494 55 L520 50" fill="none" stroke="#7b6fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="4" y="29" fontSize="9" fill="rgba(232,244,255,0.35)" fontFamily="Space Mono">$3k</text>
                <text x="4" y="62" fontSize="9" fill="rgba(232,244,255,0.35)" fontFamily="Space Mono">$2k</text>
                <text x="4" y="95" fontSize="9" fill="rgba(232,244,255,0.35)" fontFamily="Space Mono">$1k</text>
              </svg>
            )}
          </div>
          <div className="chart-labels">
            {chartData.labels.length > 0 ? (
              chartData.labels.filter((_, i) => i % 5 === 0).map((label, i) => (
                <span key={i}>{label}</span>
              ))
            ) : (
              <>
                <span>APR 7</span><span>APR 13</span><span>APR 19</span><span>APR 25</span><span>MAY 1</span><span>MAY 6</span>
              </>
            )}
          </div>
          <div className="chart-legend">
            <div className="chart-legend-item">
              <span className="chart-legend-color" style={{ background: 'var(--accent)' }}></span>
              Revenue
            </div>
            <div className="chart-legend-item">
              <span className="chart-legend-color" style={{ background: 'var(--accent2)' }}></span>
              Expenses
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Agent Network</div>
            <div className="panel-meta">{displayAgents.length} NODES</div>
          </div>
          {displayAgents.slice(0, 3).map((agent, i) => (
            <div key={agent.id || i} className="agent-row" onClick={() => handleNavClick('my-agent')}>
              <div className={`agent-row-avatar ag${(i % 3) + 1}`}>
                {agent.name?.slice(0, 2) || 'AG'}
              </div>
              <div className="agent-row-info">
                <div className="agent-row-name">{agent.name}</div>
                <div className="agent-row-sub">{agent.type}</div>
              </div>
              <div className={`status-dot ${agent.status}`}></div>
              <div className="agent-row-stat">
                <div className="agent-row-val">${agent.revenue ?? 0}</div>
                <div className="agent-row-calls">{(agent.calls ?? 0).toLocaleString()} calls</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Recent Transactions</div>
            <div className="panel-meta">x402 PROTOCOL</div>
          </div>
          {displayPayments.map((txn, i) => (
            <div key={txn.id || i} className="txn-row">
              <div className={`txn-icon ${txn.type}`}>
                {txn.type === 'in' ? '↓' : '↑'}
              </div>
              <div className="txn-desc">
                <div className="txn-name">{txn.name}</div>
                <div className="txn-time">{txn.time} · {txn.type === 'in' ? 'ESCROW RELEASED' : 'CONFIRMED'}</div>
              </div>
              <div>
                <div className={`txn-amount ${txn.type}`}>
                  {txn.type === 'in' ? '+' : '-'}${txn.amount.toFixed(2)}
                </div>
                <div className="txn-hash">{txn.hash}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Escrow Pipeline</div>
            <div className="panel-meta">USDC LOCKED</div>
          </div>
          {displayEscrow.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
              {address ? 'No pending escrows to release for your wallet' : 'Connect wallet to view your escrows'}
            </div>
          ) : (
            displayEscrow.map((escrow, i) => (
              <div key={escrow.id || i} className="escrow-row">
                <div className="escrow-label">{escrow.name}</div>
                <div className="escrow-bar-wrap">
                  <div className="escrow-bar-inner" style={{ width: `${escrow.pct}%`, background: escrow.color }}></div>
                </div>
                <div className="escrow-pct">{escrow.pct}%</div>
                <div className="escrow-usdc">${escrow.amount.toFixed(2)}</div>
              </div>
            ))
          )}
          <div className="escrow-total">
            <div>
              <div className="escrow-total-label">TOTAL LOCKED</div>
              <div className="escrow-total-value">${totalEscrow.toFixed(2)}</div>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ fontSize: '11px', padding: '6px 14px', opacity: displayEscrow.length === 0 ? 0.5 : 1, cursor: displayEscrow.length === 0 ? 'not-allowed' : 'pointer' }}
              onClick={() => {
                if (displayEscrow.length > 0) {
                  handleReleaseEscrow('All Escrows');
                }
              }}
              disabled={displayEscrow.length === 0}
            >
              Release All
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Active Services</div>
          <div className="panel-meta">{displayServices.length} LIVE ENDPOINTS</div>
        </div>
        <div className="services-grid">
          {displayServices.slice(0, 3).map((service, i) => (
            <div key={service.id || i} className="service-card" onClick={() => handleNavClick('services')}>
              <div className={`service-tag ${service.type === 'NLP' ? 'nlp' : service.type === 'VISION' ? 'vision' : ''}`}>
                {service.type} · {i === 0 ? 'ANALYTICS' : i === 1 ? 'INFERENCE' : 'OCR'}
              </div>
              <div className="service-name">{service.name}</div>
              <div className="service-price">${service.price} / call</div>
              <div className="service-calls">{service.calls.toLocaleString()} calls · {service.uptime}% uptime</div>
              <div className="service-bar">
                <div className="service-bar-fill" style={{ width: `${service.uptime}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderMyAgent = () => {
    // Filter agents to only show user's own agents
    const userAgents = address 
      ? agents.filter((a: any) => a.ownerAddress?.toLowerCase() === address?.toLowerCase())
      : [];
    
    // If user has no agents registered but agents exist in the system
    if (userAgents.length === 0 && agents.length > 0) {
      return (
        <>
          <div className="page-header">
            <div>
              <div className="page-title">My Agents</div>
              <div className="page-sub">// REGISTER AND MANAGE YOUR AI AGENTS</div>
            </div>
            <button className="btn btn-primary" onClick={openRegisterModal}>
              <Plus size={12} />
              Register Agent
            </button>
          </div>

          <div className="panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <Bot size={64} color="var(--accent)" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>No Agents Found for Your Wallet</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              You have {agents.length} registered agent{agents.length !== 1 ? 's' : ''} in the marketplace, but none match your current wallet address.
              <br/><br/>
              <span style={{ fontSize: '12px' }}>
                Connected: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None'}
              </span>
            </p>
            <button className="btn btn-primary" onClick={openRegisterModal}>
              <Plus size={14} />
              Register New Agent
            </button>
          </div>
        </>
      );
    } else if (userAgents.length === 0) {
      return (
        <>
          <div className="page-header">
            <div>
              <div className="page-title">My Agents</div>
              <div className="page-sub">// REGISTER AND MANAGE YOUR AI AGENTS</div>
            </div>
            <button className="btn btn-primary" onClick={openRegisterModal}>
              <Plus size={12} />
              Register Agent
            </button>
          </div>

          <div className="panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <Bot size={64} color="var(--accent)" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>No Agents Registered</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              Register your AI agent on the Stellar network to start accepting payments and providing services.
            </p>
            <button className="btn btn-primary" onClick={openRegisterModal}>
              <Plus size={14} />
              Register Your First Agent
            </button>
          </div>
        </>
      );
    }
    
    // Show all user's agents
    return (
      <>
        <div className="page-header">
          <div>
            <div className="page-title">My Agents</div>
            <div className="page-sub">// {userAgents.length} AGENT{userAgents.length !== 1 ? 'S' : ''} REGISTERED</div>
          </div>
          <button className="btn btn-primary" onClick={openRegisterModal}>
            <Plus size={12} />
            Register Agent
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {userAgents.map((agent: any) => {
            const agentServices = services.filter((s: any) => s.agentId === agent.id);
            return (
              <div key={agent.id} className="panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                  <div className="agent-avatar" style={{ width: '56px', height: '56px', fontSize: '20px' }}>
                    {agent.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{agent.name}</h3>
                    <div style={{ color: 'var(--accent)', fontSize: '13px' }}>{agent.status || 'ACTIVE'}</div>
                    {agent.description && (
                      <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '8px' }}>{agent.description}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      className="btn" 
                      style={{ border: '1px solid var(--border)', background: 'transparent', padding: '8px 16px' }}
                      onClick={() => {
                        // Configure action - could open a modal
                        console.log('Configure agent:', agent.id);
                      }}
                    >
                      Configure
                    </button>
                    {agentServices.length === 0 && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '8px 16px' }}
                        onClick={() => {
                          // Add service for this specific agent
                          setShowRegisterModal(true);
                          setRegisterStep(2);
                        }}
                      >
                        <Plus size={12} />
                        Add Service
                      </button>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '4px' }}>PRICING MODEL</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{agent.pricingmodel || 'PER_CALL'}</div>
                  </div>
                  <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '4px' }}>PRICE PER CALL</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>${agent.pricepercall || '0.00'}</div>
                  </div>
                  <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '4px' }}>SERVICES</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{agentServices.length}</div>
                  </div>
                  <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '4px' }}>TOTAL CALLS</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{agentServices.reduce((sum, s) => sum + (s.totalCalls || 0), 0)}</div>
                  </div>
                </div>

                {/* Services for this agent */}
                {agentServices.length > 0 && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--muted)' }}>SERVICES</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                      {agentServices.map((service: any) => (
                        <div key={service.id} style={{ background: 'var(--surface2)', padding: '16px', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>{service.name}</div>
                            <div style={{ 
                              background: service.isActive ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 107, 53, 0.2)',
                              color: service.isActive ? '#2ecc71' : '#ff6b35',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px'
                            }}>
                              {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </div>
                          </div>
                          {service.description && (
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>{service.description}</div>
                          )}
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted)' }}>
                            <span>${service.pricepercall} / call</span>
                            <span>{service.totalCalls || 0} calls</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {agentServices.length === 0 && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '12px' }}>No services yet</p>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '8px 16px' }}
                      onClick={() => {
                        setShowRegisterModal(true);
                        setRegisterStep(2);
                      }}
                    >
                      <Plus size={12} />
                      Add Service
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderServices = () => (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Services</div>
          <div className="page-sub">// MARKETPLACE SERVICES</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowRegisterModal(true); setRegisterStep(2); }}>
          <Plus size={12} />
          Add Service
        </button>
      </div>

      <div className="services-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {displayServices.map((service, i) => (
          <div key={service.id || i} className="service-card">
            <div className={`service-tag ${service.type === 'NLP' ? 'nlp' : service.type === 'VISION' ? 'vision' : ''}`}>
              {service.type}
            </div>
            <div className="service-name">{service.name}</div>
            <div className="service-price">${service.price} / call</div>
            <div className="service-calls">{service.calls.toLocaleString()} calls · {service.uptime}% uptime</div>
            <div className="service-bar">
              <div className="service-bar-fill" style={{ width: `${service.uptime}%` }}></div>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '12px', width: '100%' }} onClick={() => handlePurchase(service.name, service.price)}>
              <Wallet size={14} />
              Purchase
            </button>
          </div>
        ))}
      </div>
    </>
  );

  const renderPayments = () => (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Payments</div>
          <div className="page-sub">// TRANSACTION HISTORY</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">All Transactions</div>
          <div className="panel-meta">x402 PROTOCOL</div>
        </div>
        {displayPayments.map((txn, i) => (
          <div key={txn.id || i} className="txn-row">
            <div className={`txn-icon ${txn.type}`}>
              {txn.type === 'in' ? '↓' : '↑'}
            </div>
            <div className="txn-desc">
              <div className="txn-name">{txn.name}</div>
              <div className="txn-time">{txn.time} · {txn.type === 'in' ? 'ESCROW RELEASED' : 'CONFIRMED'}</div>
            </div>
            <div>
              <div className={`txn-amount ${txn.type}`}>
                {txn.type === 'in' ? '+' : '-'}${txn.amount.toFixed(2)}
              </div>
              <div className="txn-hash">{txn.hash}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderEscrow = () => (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Escrow</div>
          <div className="page-sub">// SMART CONTRACT ESCROW</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Active Escrows</div>
          <div className="panel-meta">USDC LOCKED</div>
        </div>
        {displayEscrow.map((escrow, i) => (
          <div key={i} className="escrow-row">
            <div className="escrow-label">{escrow.name}</div>
            <div className="escrow-bar-wrap">
              <div className="escrow-bar-inner" style={{ width: `${escrow.pct}%`, background: escrow.color }}></div>
            </div>
            <div className="escrow-pct">{escrow.pct}%</div>
            <div className="escrow-usdc">${escrow.amount.toFixed(2)}</div>
          </div>
        ))}
        <div className="escrow-total">
          <div>
            <div className="escrow-total-label">TOTAL LOCKED</div>
            <div className="escrow-total-value">${totalEscrow.toFixed(2)}</div>
          </div>
          <button className="btn btn-primary" onClick={() => handleReleaseEscrow('All Escrows')}>Release All</button>
        </div>
      </div>
    </>
  );



  const renderDiscover = () => {
    const discoveredAgents = agents;
    
    return (
      <>
        <div className="page-header">
          <div>
            <div className="page-title">Discover</div>
            <div className="page-sub">// BROWSE AI AGENTS IN THE MARKETPLACE</div>
          </div>
        </div>

        {discoveredAgents.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <Search size={64} color="var(--accent)" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>No Agents Found</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              There are no registered agents in the marketplace yet. Be the first to register your agent!
            </p>
            <button className="btn btn-primary" onClick={openRegisterModal}>
              <Bot size={14} />
              Register Agent
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {discoveredAgents.map((agent: any) => (
              <div key={agent.id} className="panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div className="agent-icon">
                    <Bot size={20} color="var(--accent)" />
                  </div>
                  <div>
                    <div className="panel-title" style={{ fontSize: '14px' }}>{agent.name}</div>
                    <div className="panel-meta" style={{ fontSize: '11px' }}>{agent.description || 'AI Agent'}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <div className="stat-label">Status</div>
                    <div style={{ color: agent.status === 'ACTIVE' || agent.status === 'on' ? 'var(--accent3)' : 'var(--muted)', fontSize: '13px' }}>
                      {agent.status === 'ACTIVE' || agent.status === 'on' ? '● Active' : '○ Idle'}
                    </div>
                  </div>
                  <div>
                    <div className="stat-label">Calls</div>
                    <div style={{ fontSize: '13px' }}>{agent.calls?.toLocaleString() || 0}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="stat-label">Revenue</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent3)' }}>
                      ${agent.revenue || 0}
                    </div>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderIntegrations = () => (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Integrations</div>
          <div className="page-sub">// CONNECT YOUR AGENTS TO EXTERNAL SERVICES</div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <Code size={48} color="var(--accent)" style={{ marginBottom: '16px' }} />
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>API Integration</h4>
          <p style={{ color: 'var(--muted)', fontSize: '12px' }}>Connect via REST API</p>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '16px' }}
            onClick={() => setShowApiConfigModal(true)}
          >
            Configure
          </button>
        </div>
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <MessageSquare size={48} color="var(--accent2)" style={{ marginBottom: '16px' }} />
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Webhook</h4>
          <p style={{ color: 'var(--muted)', fontSize: '12px' }}>Real-time notifications</p>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '16px' }}
            onClick={() => setShowWebhookConfigModal(true)}
          >
            Configure
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Playground</div>
          <div className="panel-meta">TEST YOUR AGENTS</div>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>
          Test your AI agents in an interactive playground environment.
        </p>
        <button className="btn btn-primary" onClick={openPlayground}>
          <Zap size={14} />
          Open Playground
          <ArrowRight size={14} />
        </button>
      </div>

      {/* API Config Modal */}
      {showApiConfigModal && (
        <div className="modal-overlay" onClick={() => setShowApiConfigModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>API Integration Configuration</h3>
              <button className="modal-close" onClick={() => setShowApiConfigModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">API Endpoint URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://api.example.com/v1"
                  style={{ width: '100%', padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">API Key</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter your API key"
                  style={{ width: '100%', padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Secret Key</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter your secret key"
                  style={{ width: '100%', padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={() => setShowApiConfigModal(false)}>
                  Save Configuration
                </button>
                <button className="btn btn-secondary" onClick={() => setShowApiConfigModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Config Modal */}
      {showWebhookConfigModal && (
        <div className="modal-overlay" onClick={() => setShowWebhookConfigModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Webhook Configuration</h3>
              <button className="modal-close" onClick={() => setShowWebhookConfigModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Webhook URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://your-server.com/webhook"
                  style={{ width: '100%', padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Webhook Secret</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter webhook secret"
                  style={{ width: '100%', padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Events to Subscribe</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <input type="checkbox" /> Payment Received
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <input type="checkbox" /> Agent Registered
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <input type="checkbox" /> Escrow Released
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <input type="checkbox" /> Service Called
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={() => setShowWebhookConfigModal(false)}>
                  Save Webhook
                </button>
                <button className="btn btn-secondary" onClick={() => setShowWebhookConfigModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </>
  );

  const renderProfile = () => (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">My Profile</div>
          <div className="page-sub">// WALLET INFORMATION</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div className="panel-title">Wallet Connected ✓</div>
          <div className="panel-meta">ACTIVE</div>
        </div>
        <div style={{ padding: '20px 0' }}>
          <div className="wallet-info-row">
            <span className="wi-label">Address</span>
            <span className="wi-value green">{address}</span>
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
        <button 
          className="btn btn-secondary" 
          style={{ marginTop: '16px', borderColor: '#ff6b35', color: '#ff6b35' }}
          onClick={() => {
            disconnect();
            window.location.href = '/';
          }}
        >
          Disconnect Wallet
        </button>
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
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />
      
      <div className="dashboard-container">
        {/* TOPBAR */}
        <div className="dashboard-topbar">
          <div className="dashboard-logo" onClick={goHome}>
            <div className="logo-icon">
              <svg className="logo-hex" viewBox="0 0 14 14" fill="none">
                <polygon points="7,1 12,3.5 12,10.5 7,13 2,10.5 2,3.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <polygon points="7,4.5 9.5,5.75 9.5,9.25 7,10.5 4.5,9.25 4.5,5.75" fill="white"/>
              </svg>
            </div>
            PayMint
          </div>
          
          <div className="network-badge">STELLAR {network?.toUpperCase() || 'TESTNET'}</div>
          <div className="pulse-dot"></div>
          <span className="live-text">LIVE</span>
          
          <div className="topbar-right">
            {address ? (
              <span className="wallet-chip">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
            ) : (
              <span className="wallet-chip" onClick={goToConnect} style={{ cursor: 'pointer' }}>
                Connect Wallet
              </span>
            )}
            <div className="avatar">
              {address ? address.slice(0, 2).toUpperCase() : '0x'}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="dashboard-sidebar">
          <div className="nav-section-label">NAVIGATION</div>
          <NextLink href="/dashboard" className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}>
            <Home size={16} className="nav-icon" />
            Dashboard
          </NextLink>
          <NextLink href="/dashboard/agents" className={`nav-item ${activeSection === 'my-agent' ? 'active' : ''}`}>
            <Bot size={16} className="nav-icon" />
            My Agents
          </NextLink>
          <NextLink href="/dashboard/services" className={`nav-item ${activeSection === 'services' ? 'active' : ''}`}>
            <ShoppingCart size={16} className="nav-icon" />
            Services
            {displayServices.length > 0 && <span className="nav-badge">{displayServices.length}</span>}
          </NextLink>
          <NextLink href="/dashboard/payments" className={`nav-item ${activeSection === 'payments' ? 'active' : ''}`}>
            <CreditCard size={16} className="nav-icon" />
            Payments
          </NextLink>
          <NextLink href="/dashboard/escrow" className={`nav-item ${activeSection === 'escrow' ? 'active' : ''}`}>
            <ShieldCheck size={16} className="nav-icon" />
            Escrow
          </NextLink>

          <div className="nav-section-label">MARKETPLACE</div>
          <NextLink href="/dashboard/discover" className={`nav-item ${activeSection === 'discover' ? 'active' : ''}`}>
            <Search size={16} className="nav-icon" />
            Discover
          </NextLink>
          <NextLink href="/dashboard/purchases" className={`nav-item ${activeSection === 'purchases' ? 'active' : ''}`}>
            <ShoppingCart size={16} className="nav-icon" />
            Purchases
          </NextLink>
          <NextLink href="/dashboard/integrations" className={`nav-item ${activeSection === 'integrations' ? 'active' : ''}`}>
            <ExternalLink size={16} className="nav-icon" />
            Integrations
          </NextLink>

          <div className="nav-section-label">ACCOUNT</div>
          <NextLink href="/dashboard/profile" className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}>
            <User size={16} className="nav-icon" />
            Profile
          </NextLink>

          <div className="sidebar-footer">
            <NextLink href="/docs" className="nav-item" target="_blank">
              <Code size={16} className="nav-icon" />
              API Docs
            </NextLink>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="dashboard-main">
          {renderContent()}
          
          <div className="dashboard-footer">
            PAYMINT v0.4.1 · SOROBAN CONTRACTS · STELLAR TESTNET · x402 PROTOCOL
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={closeRegisterModal}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '32px',
            width: '480px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
                {registerStep === 1 ? 'Register Your Agent' : 'Add Your First Service'}
              </h2>
              <button onClick={closeRegisterModal} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '24px' }}>×</button>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.75rem',
                background: registerStep >= 1 ? 'var(--accent3)' : 'var(--surface2)',
                color: registerStep >= 1 ? '#080c14' : 'var(--muted)',
                border: registerStep >= 1 ? 'none' : '1px solid var(--border)',
              }}>
                1. Agent
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.75rem',
                background: registerStep >= 2 ? 'var(--accent3)' : 'var(--surface2)',
                color: registerStep >= 2 ? '#080c14' : 'var(--muted)',
                border: registerStep >= 2 ? 'none' : '1px solid var(--border)',
              }}>
                2. Service
              </div>
            </div>

            {registerError && (
              <div style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid var(--warn)', borderRadius: '6px', padding: '12px', marginBottom: '16px', color: 'var(--warn)', fontSize: '13px' }}>
                {registerError}
              </div>
            )}

            {registerSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,170,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={32} color="var(--accent3)" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--accent3)' }}>Registration Complete!</h3>
                <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Your agent and service have been successfully registered.</p>
              </div>
            ) : (
              <>
                {registerStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Basic Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Agent Name *</label>
                        <input
                          type="text"
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg)',
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
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Support Email</label>
                        <input
                          type="email"
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg)',
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
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Description</label>
                      <textarea
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--text)',
                          fontSize: '0.95rem',
                          outline: 'none',
                          resize: 'vertical',
                          minHeight: '80px',
                        }}
                        value={agentData.description}
                        onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
                        placeholder="What does your agent do?"
                      />
                    </div>
                    
                    {/* API Configuration */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>API Configuration</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>API Endpoint</label>
                          <input
                            type="url"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              color: 'var(--text)',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                            value={agentData.apiEndpoint}
                            onChange={(e) => setAgentData({ ...agentData, apiEndpoint: e.target.value })}
                            placeholder="https://api.example.com"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>API Key</label>
                          <input
                            type="password"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              color: 'var(--text)',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                            value={agentData.apiKey}
                            onChange={(e) => setAgentData({ ...agentData, apiKey: e.target.value })}
                            placeholder="sk-..."
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Documentation URL</label>
                          <input
                            type="url"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              color: 'var(--text)',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                            value={agentData.documentationUrl}
                            onChange={(e) => setAgentData({ ...agentData, documentationUrl: e.target.value })}
                            placeholder="https://docs.example.com"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Webhook URL</label>
                          <input
                            type="url"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              color: 'var(--text)',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                            value={agentData.webhookUrl}
                            onChange={(e) => setAgentData({ ...agentData, webhookUrl: e.target.value })}
                            placeholder="https://your-server.com/webhook"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Capabilities & Pricing */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Capabilities & Pricing</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Capabilities</label>
                          <input
                            type="text"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              color: 'var(--text)',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                            value={agentData.capabilities}
                            onChange={(e) => setAgentData({ ...agentData, capabilities: e.target.value })}
                            placeholder="text-generation, image-analysis"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Pricing Model</label>
                          <select
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              color: 'var(--text)',
                              fontSize: '0.85rem',
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
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Price per Call (USDC)</label>
                          <input
                            type="number"
                            step="0.0000001"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              color: 'var(--text)',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                            value={agentData.pricePerCall}
                            onChange={(e) => setAgentData({ ...agentData, pricePerCall: e.target.value })}
                            placeholder="0.50"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Logo URL</label>
                          <input
                            type="url"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              color: 'var(--text)',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                            value={agentData.logoUrl}
                            onChange={(e) => setAgentData({ ...agentData, logoUrl: e.target.value })}
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Website URL</label>
                          <input
                            type="url"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              color: 'var(--text)',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                            value={agentData.websiteUrl}
                            onChange={(e) => setAgentData({ ...agentData, websiteUrl: e.target.value })}
                            placeholder="https://example.com"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Terms of Service URL</label>
                          <input
                            type="url"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              color: 'var(--text)',
                              fontSize: '0.85rem',
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
                      disabled={registerLoading || !agentData.name}
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      {registerLoading ? 'Registering...' : 'Register Agent'}
                    </button>
                  </div>
                )}

                {registerStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Service Name</label>
                      <input
                        type="text"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg)',
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
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Description</label>
                      <textarea
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg)',
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
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Service Type</label>
                      <select
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg)',
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
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Endpoint Path</label>
                        <input
                          type="text"
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg)',
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
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>HTTP Method</label>
                        <select
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg)',
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
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Rate Limit (req/min)</label>
                        <input
                          type="number"
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg)',
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
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Timeout (seconds)</label>
                        <input
                          type="number"
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg)',
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
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Response Format</label>
                        <select
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg)',
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
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Retry Policy (JSON)</label>
                      <textarea
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--text)',
                          fontSize: '0.95rem',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'monospace',
                        }}
                        value={serviceData.retryPolicy}
                        onChange={(e) => setServiceData({ ...serviceData, retryPolicy: e.target.value })}
                        placeholder='{"maxRetries": 3, "backoff": "exponential"}'
                        rows={2}
                      />
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>API Schema (JSON)</label>
                      <textarea
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--text)',
                          fontSize: '0.95rem',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'monospace',
                        }}
                        value={serviceData.schema}
                        onChange={(e) => setServiceData({ ...serviceData, schema: e.target.value })}
                        placeholder='{"type": "object", "properties": {...}}'
                        rows={3}
                      />
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Usage Examples</label>
                      <textarea
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--text)',
                          fontSize: '0.95rem',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                        value={serviceData.usageExamples}
                        onChange={(e) => setServiceData({ ...serviceData, usageExamples: e.target.value })}
                        placeholder={`curl -X POST https://api.example.com/v1/analyze -d '{"data": "test"}'`}
                        rows={3}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Price per Call</label>
                        <input
                          type="number"
                          step="0.01"
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg)',
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
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Currency</label>
                        <select
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg)',
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
                      disabled={registerLoading || !serviceData.name || !serviceData.pricePerCall}
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      {registerLoading ? 'Creating...' : 'Create Service'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}