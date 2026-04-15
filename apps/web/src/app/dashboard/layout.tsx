'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  Link,
  Settings,
  User,
  MessageSquare,
  Code,
  BarChart3,
  Globe,
  Zap,
  ArrowRight,
  CheckCircle,
  X,
  Menu,
  Package,
  Bell,
  BellOff,
  AlertCircle,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { useStellar } from '@/context/StellarContext';

interface LayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected, loading } = useStellar();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for notification events from other components
  useEffect(() => {
    const handleNotification = (e: CustomEvent) => {
      const newNotif = e.detail;
      setNotifications(prev => [newNotif, ...prev].slice(0, 20));
    };
    
    window.addEventListener('add-notification', handleNotification as EventListener);
    return () => {
      window.removeEventListener('add-notification', handleNotification as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchNotifications();
    }
  }, [isConnected, address]);


  const fetchNotifications = async () => {
    if (!address) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/address/${address}`);
      if (res.ok) {
        const notifs = await res.json();
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: any) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const navItems = [
    { section: 'NAVIGATION', icon: null, label: '', href: '' },
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Bot, label: 'My Agents', href: '/dashboard/agents' },
    { icon: Code, label: 'Services', href: '/dashboard/services' },
    { icon: CreditCard, label: 'Payments', href: '/dashboard/payments' },
    { icon: ShieldCheck, label: 'Escrow', href: '/dashboard/escrow' },
    { section: 'MARKETPLACE', icon: null, label: '', href: '' },
    { icon: ShoppingCart, label: 'Discover', href: '/dashboard/discover' },
    { icon: Package, label: 'Purchases', href: '/dashboard/purchases' },
    { icon: Link, label: 'Integrations', href: '/dashboard/integrations' },
    { section: 'DOCS', icon: null, label: '', href: '' },
    { icon: Activity, label: 'API Docs', href: '/dashboard/api-docs' },
    { section: 'ACCOUNT', icon: null, label: '', href: '' },
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
  ];

  // Admin wallet address for special privileges (should come from env in production)
  const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || 'GDJTYETYSDM4VFX4RYGTCXYMLXSGQODKGGFUBMR4INGFMXOWROGKMIIR';
  const isAdmin = address?.toUpperCase() === ADMIN_WALLET?.toUpperCase();

  // Add Admin section if user is admin
  if (isAdmin) {
    navItems.push(
      { section: 'ADMIN', icon: null, label: '', href: '' },
      { icon: ShieldCheck, label: 'Admin Panel', href: '/dashboard/admin' }
    );
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // Prevent hydration mismatch - don't render until mounted
  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#080c14' }}></div>
    );
  }

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #080c14;
          --surface: #0d1420;
          --surface2: #111b2e;
          --border: rgba(0,210,255,0.12);
          --border2: rgba(0,210,255,0.25);
          --accent: #00d2ff;
          --accent2: #7b6fff;
          --accent3: #ffaa00;
          --accent-purple: #a855f7;
          --accent-purple-light: #c084fc;
          --accent-purple-dark: #7c3aed;
          --warn: #ff6b35;
          --text: #e8f4ff;
          --muted: rgba(232,244,255,0.45);
          --mono: 'Space Mono', monospace;
          --display: 'Syne', sans-serif;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: var(--display);
          background: var(--bg);
          color: var(--text);
        }

        .dashboard-layout {
          display: grid;
          grid-template-columns: ${sidebarOpen ? '220px' : '64px'} 1fr;
          grid-template-rows: 56px 1fr;
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
        }

        .dashboard-layout::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,210,255,0.012) 2px, rgba(0,210,255,0.012) 4px);
          pointer-events: none;
          z-index: 9999;
        }

        .dashboard-layout::after {
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
          padding: 0 20px;
          border-bottom: 1px solid var(--border);
          background: rgba(8,12,20,0.95);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 100;
          gap: 16px;
        }

        .menu-toggle {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-toggle:hover {
          background: var(--surface2);
          color: var(--text);
        }

        .dashboard-logo {
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
          cursor: pointer;
        }

        .logo-icon {
          width: 26px;
          height: 26px;
          background: linear-gradient(135deg, var(--accent-purple), var(--accent));
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(168,85,247,0.4);
        }

        .network-badge {
          font-family: var(--mono);
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 3px;
          background: rgba(168,85,247,0.15);
          border: 1px solid rgba(168,85,247,0.3);
          color: var(--accent-purple-light);
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
        }

        .wallet-chip:hover {
          border-color: var(--border2);
          color: var(--text);
        }

        .notification-wrapper {
          position: relative;
        }

        .notification-bell {
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.2s;
        }

        .notification-bell:hover,
        .notification-bell.has-notifications {
          color: var(--accent);
          background: var(--surface2);
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: white;
          font-size: 9px;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }

        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          width: 280px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          z-index: 100;
          overflow: hidden;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          font-size: 12px;
          font-weight: 700;
          color: var(--text);
        }

        .clear-notifications {
          background: transparent;
          border: none;
          color: var(--accent);
          font-size: 11px;
          cursor: pointer;
          padding: 0;
        }

        .clear-notifications:hover {
          text-decoration: underline;
        }

        .notification-empty {
          padding: 24px;
          text-align: center;
          color: var(--muted);
          font-size: 12px;
        }

        .notification-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          font-size: 12px;
          color: var(--text);
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-item svg {
          color: var(--accent);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-purple), var(--accent2));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          box-shadow: 0 0 15px rgba(168,85,247,0.3);
        }

        .dashboard-sidebar {
          background: var(--surface);
          border-right: 1px solid var(--border);
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: fixed;
          left: 0;
          top: 56px;
          bottom: 0;
          width: 220px;
          overflow-y: auto;
          z-index: 50;
          transition: left 0.3s ease;
        }

        .dashboard-sidebar.collapsed {
          width: 64px;
        }

        .dashboard-main.collapsed {
          left: 64px;
          margin-left: 0;
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
          color: var(--accent-purple-light);
          background: rgba(168,85,247,0.08);
        }

        .nav-item.active {
          color: var(--accent-purple-light);
          border-left-color: var(--accent-purple);
          background: rgba(168,85,247,0.1);
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

        .nav-section-label {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--accent-purple-light);
          letter-spacing: 2px;
          padding: 12px 20px 6px;
        }

        .nav-badge {
          margin-left: auto;
          font-family: var(--mono);
          font-size: 9px;
          background: rgba(168,85,247,0.2);
          color: var(--accent-purple-light);
          padding: 2px 6px;
          border-radius: 3px;
        }



        .dashboard-main {
          position: fixed;
          top: 56px;
          right: 0;
          bottom: 0;
          left: 220px;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          z-index: 1;
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

        .btn-sm {
          padding: 6px 12px;
          font-size: 11px;
        }

        /* Cards */
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          transition: border-color 0.2s;
        }

        .card:hover {
          border-color: var(--border2);
        }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
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
          background: linear-gradient(90deg, var(--accent), var(--accent2));
          opacity: 0;
          transition: opacity 0.2s;
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-label {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
          color: var(--text);
          line-height: 1;
        }

        .stat-change {
          font-family: var(--mono);
          font-size: 11px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stat-change.positive {
          color: #00ff9d;
        }

        .stat-change.negative {
          color: var(--warn);
        }

        /* Tables */
        .table-container {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .table-title {
          font-size: 14px;
          font-weight: 700;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 1px;
          text-align: left;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border);
          background: var(--surface2);
        }

        td {
          font-size: 13px;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
        }

        tr:last-child td {
          border-bottom: none;
        }

        tr:hover td {
          background: rgba(0,210,255,0.03);
        }

        /* Forms */
        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 10px 14px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          font-size: 13px;
          font-family: var(--display);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .form-input::placeholder {
          color: var(--muted);
        }

        select.form-input {
          cursor: pointer;
        }

        textarea.form-input {
          min-height: 100px;
          resize: vertical;
        }

        /* Status badges */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 600;
        }

        .status-active {
          background: rgba(0,255,157,0.15);
          color: #00ff9d;
        }

        .status-inactive {
          background: rgba(255,107,53,0.15);
          color: var(--warn);
        }

        .status-pending {
          background: rgba(255,170,0,0.15);
          color: var(--accent3);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 700;
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 24px;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
        }

        .modal-close:hover {
          color: var(--text);
        }

        .modal-body {
          padding: 24px;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        /* Grid layouts */
        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .grid-2, .grid-3 {
            grid-template-columns: 1fr;
          }
          
          .dashboard-layout {
            grid-template-columns: 1fr;
          }
          
          .dashboard-sidebar {
            position: fixed;
            left: -240px;
            top: 56px;
            bottom: 0;
            z-index: 99;
          }
          
          .dashboard-sidebar.open {
            left: 0;
          }
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: var(--surface2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
        }

        .empty-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .empty-desc {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 20px;
        }

        /* Page header */
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .page-sub {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--muted);
          margin-top: 4px;
        }
      `}</style>

      <div className="dashboard-layout">
        {/* Topbar */}
        <header className="dashboard-topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>
          
          <div className="dashboard-logo" onClick={() => router.push('/dashboard')}>
            <div className="logo-icon">
              <Zap size={14} color="white" />
            </div>
            PayMint
          </div>
          
          <span className="network-badge">STELLAR TESTNET</span>
          <span className="pulse-dot"></span>
          
          <div className="topbar-right">
            <div className="notification-wrapper">
              <button 
                className={`notification-bell ${unreadCount > 0 ? 'has-notifications' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                {unreadCount > 0 ? <Bell size={18} /> : <BellOff size={18} />}
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <button 
                        className="clear-notifications"
                        onClick={() => setNotifications([])}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="notification-empty">
                      No new notifications
                    </div>
                  ) : (
                    <div className="notification-list">
                      {notifications.slice(0, 5).map((notif: any, idx) => (
                        <div key={idx} className="notification-item" style={{ opacity: notif.isRead ? 0.6 : 1 }}>
                          {notif.type === 'REFUND_REQUESTED' && <RefreshCw size={14} style={{ color: '#ff9500' }} />}
                          {notif.type === 'REFUND_APPROVED' && <CheckCircle size={14} style={{ color: '#00ff9d' }} />}
                          {notif.type === 'REFUND_REJECTED' && <XCircle size={14} style={{ color: '#ff6b6b' }} />}
                          {notif.type === 'DISPUTE_OPENED' && <AlertCircle size={14} style={{ color: '#ff00ff' }} />}
                          {notif.type === 'DISPUTE_RESOLVED' && <CheckCircle size={14} style={{ color: '#00d2ff' }} />}
                          {(notif.type === 'PAYMENT_CREATED' || !notif.type) && <DollarSign size={14} style={{ color: '#00d2ff' }} />}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '2px' }}>{notif.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{notif.message}</div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
                              {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Just now'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {loading ? (
              <span className="wallet-chip">Checking...</span>
            ) : isConnected ? (
              <span className="wallet-chip">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            ) : (
              <span className="wallet-chip">Not Connected</span>
            )}
            <div className="avatar" onClick={() => router.push('/dashboard/profile')}>
              U
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <nav className={`dashboard-sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
          {navItems.map((item, index) => (
            item.section ? (
              <div key={item.section} className="nav-section-label">{item.section}</div>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
              >
                {item.icon && <item.icon className="nav-icon" size={18} />}
                {sidebarOpen && item.label}
              </a>
            )
          ))}
          


        </nav>

        {/* Main Content */}
        <main className={`dashboard-main ${!sidebarOpen ? 'collapsed' : ''}`}>
          {children}
        </main>
      </div>
    </>
  );
}