import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Users, FileText, Bell, Search, Settings, User, CheckCircle2, 
  XCircle, Clock, CalendarDays, Activity, ArrowLeft, MoreHorizontal, Plus, 
  HelpCircle, Sparkles, Filter, ChevronDown, Check, ShieldAlert, Receipt, 
  CreditCard, Eye, Download, Info, LogOut, Menu, X, Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminDashboard, superAdminHospitals } from '../utils/api';
import AddHospitalTab from '../components/Dashboard/AddHospitalTab';
import HospitalDetailTab from '../components/Dashboard/HospitalDetailTab';
import InvoiceDetailTab from '../components/Dashboard/InvoiceDetailTab';
import ManualReminderModal from '../components/Dashboard/ManualReminderModal';
import OverviewTab from '../components/Dashboard/OverviewTab';
import HospitalsTab from '../components/Dashboard/HospitalsTab';
import SubscriptionsTab from '../components/Dashboard/SubscriptionsTab';
import AuditLogsTab from '../components/Dashboard/AuditLogsTab';
import PaymentsTab from '../components/Dashboard/PaymentsTab';

export default function Dashboard({ onLogout }) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);

  // Backend state
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Billing state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Search states
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // React Query: Infinite Scroll for Hospitals
  const {
    data: hospitalsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingHospitals,
    status
  } = useInfiniteQuery({
    queryKey: ['hospitals', debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await superAdminHospitals.getAll({ page: pageParam, limit: 10, search: debouncedSearch });
      return res.data; // { data: [...], hasMore, page, limit }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const hospitalsList = hospitalsData?.pages.flatMap(page => page?.data || []).filter(Boolean) || [];

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  const handleHospitalAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['hospitals'] });
  };

  const loadData = () => {
    // 1. Fetch Stats
    superAdminDashboard.getStats()
      .then(res => setStats(res.data))
      .catch(() => console.log("Backend offline or unauthorized - using fallback stats"));

    // 2. Fetch Audit Logs
    superAdminDashboard.getAuditLogs()
      .then(res => setAuditLogs(res.data))
      .catch(() => console.log("Backend offline or unauthorized - using fallback audit logs"));
  };

  // Fetch real data on load using Axios Centralized API helper
  useEffect(() => {
    loadData();
  }, [currentTab]);

  // Donut Chart Data
  const donutData = [
    { name: 'Active', value: hospitalsList.filter(h => h.status === 'Active').length || 38, color: '#10b981' },
    { name: 'Provisioning', value: hospitalsList.filter(h => h.status === 'Provisioning').length || 5, color: '#f59e0b' },
    { name: 'Failed', value: hospitalsList.filter(h => h.status === 'Provisioning Failed').length || 2, color: '#ef4444' }
  ];

  // Fallback / Mock Data for UI demonstration
  const mockSubscriptions = [
    { id: 1, hospital: 'Apollo Hospital', plan: 'Standard', beds: 150, mrr: 45000, start: '2026-01-10', end: '2026-09-24', status: 'Active' },
    { id: 2, hospital: 'Max Care', plan: 'Premium', beds: 200, mrr: 60000, start: '2026-02-15', end: '2026-10-12', status: 'Active' },
    { id: 3, hospital: 'Fortis Healthcare', plan: 'Premium', beds: 350, mrr: 105000, start: '2026-03-01', end: '2026-11-01', status: 'Pending' },
    { id: 4, hospital: 'City Life', plan: 'Standard', beds: 80, mrr: 24000, start: '2026-01-20', end: '2026-08-20', status: 'Expired' }
  ];

  const mockPayments = [
    { id: 'TXN-98402', hospital: 'Apollo Hospital', amount: 45000, method: 'Razorpay', date: '2026-07-10', status: 'Completed' },
    { id: 'TXN-98403', hospital: 'Max Care', amount: 60000, method: 'Stripe', date: '2026-07-12', status: 'Completed' },
    { id: 'TXN-98404', hospital: 'Fortis Healthcare', amount: 105000, method: 'Bank Transfer', date: '2026-07-14', status: 'Pending' },
    { id: 'TXN-98405', hospital: 'City Life', amount: 24000, method: 'UPI', date: '2026-07-15', status: 'Failed' }
  ];

  const mockAuditLogs = auditLogs.length > 0 ? auditLogs : [
    { id: 1, admin_email: 'superadmin@hms.com', action: 'ONBOARD_HOSPITAL', details: 'Onboarded Apollo Hospital', created_at: '2026-07-16 10:30' },
    { id: 2, admin_email: 'superadmin@hms.com', action: 'LOGIN', details: 'Logged in successfully', created_at: '2026-07-16 09:15' },
    { id: 3, admin_email: 'superadmin@hms.com', action: 'RETRY_PROVISIONING', details: 'Retried DB for City Life', created_at: '2026-07-15 14:00' }
  ];



  return (
    <div className="app-layout">
      {/* 1. Left Thin Sidebar */}
      <aside className="thin-sidebar">
        <div className="sidebar-icons">
          <button className={`sidebar-btn ${currentTab === 'dashboard' ? 'active-dark' : ''}`} onClick={() => { setCurrentTab('dashboard'); setSelectedInvoice(null); }}><Activity size={20} /></button>
          <button className={`sidebar-btn ${currentTab === 'hospitals' ? 'active-dark' : ''}`} onClick={() => { setCurrentTab('hospitals'); setSelectedInvoice(null); }}><Building2 size={20} /></button>
          <button className={`sidebar-btn ${currentTab === 'subscriptions' ? 'active-dark' : ''}`} onClick={() => { setCurrentTab('subscriptions'); setSelectedInvoice(null); }}><FileText size={20} /></button>
          <button className={`sidebar-btn ${currentTab === 'payments' ? 'active-dark' : ''}`} onClick={() => { setCurrentTab('payments'); setSelectedInvoice(null); }}><CreditCard size={20} /></button>
          <button className={`sidebar-btn ${currentTab === 'audit' ? 'active-dark' : ''}`} onClick={() => { setCurrentTab('audit'); setSelectedInvoice(null); }}><ShieldAlert size={20} /></button>
        </div>
        <div className="sidebar-icons">
          <button className="sidebar-btn"><Settings size={20} /></button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* 2. Top Nav Bar */}
        <nav className="top-navbar">
          <div className="nav-brand">
            <button className="mobile-menu-btn" onClick={() => setIsMobileSidebarOpen(true)}>
              <Menu size={22} color="var(--text-primary)" />
            </button>
            <Sparkles size={20} color="var(--accent-blue)" />
            HMS Platform
          </div>

          <div className="nav-tabs-container">
            <button className={`nav-tab-pill ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setCurrentTab('dashboard'); setSelectedInvoice(null); }}>Dashboard</button>
            <button className={`nav-tab-pill ${currentTab === 'hospitals' ? 'active' : ''}`} onClick={() => { setCurrentTab('hospitals'); setSelectedInvoice(null); }}>Hospitals</button>
            <button className={`nav-tab-pill ${currentTab === 'subscriptions' ? 'active' : ''}`} onClick={() => { setCurrentTab('subscriptions'); setSelectedInvoice(null); }}>Subscriptions</button>
            <button className={`nav-tab-pill ${currentTab === 'payments' ? 'active' : ''}`} onClick={() => { setCurrentTab('payments'); setSelectedInvoice(null); }}>Payments</button>
            <button className={`nav-tab-pill ${currentTab === 'audit' ? 'active' : ''}`} onClick={() => { setCurrentTab('audit'); setSelectedInvoice(null); }}>Audit Logs</button>
          </div>

          <div className="nav-right-actions">
            <button className="nav-icon-btn"><Search size={18} /></button>
            <button className="nav-icon-btn"><Bell size={18} /></button>
            <div className="profile-avatar">SA</div>
            {onLogout && (
              <button 
                className="nav-icon-btn" 
                onClick={() => setIsLogoutModalOpen(true)} 
                title="Sign Out Super Admin"
                style={{ color: 'var(--status-danger)', background: '#fef2f2' }}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </nav>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="mobile-sidebar-overlay" onClick={() => setIsMobileSidebarOpen(false)} />
        )}
        
        {/* Mobile Sidebar */}
        <div className={`mobile-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
          <div className="mobile-sidebar-header">
            <div className="nav-brand" style={{ padding: 0 }}>
              <Sparkles size={20} color="var(--accent-blue)" />
              HMS Platform
            </div>
            <button className="nav-icon-btn" onClick={() => setIsMobileSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="mobile-sidebar-nav">
            <button className={`nav-tab-pill ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setCurrentTab('dashboard'); setSelectedInvoice(null); setIsMobileSidebarOpen(false); }}>Dashboard</button>
            <button className={`nav-tab-pill ${currentTab === 'hospitals' ? 'active' : ''}`} onClick={() => { setCurrentTab('hospitals'); setSelectedInvoice(null); setIsMobileSidebarOpen(false); }}>Hospitals</button>
            <button className={`nav-tab-pill ${currentTab === 'subscriptions' ? 'active' : ''}`} onClick={() => { setCurrentTab('subscriptions'); setSelectedInvoice(null); setIsMobileSidebarOpen(false); }}>Subscriptions</button>
            <button className={`nav-tab-pill ${currentTab === 'payments' ? 'active' : ''}`} onClick={() => { setCurrentTab('payments'); setSelectedInvoice(null); setIsMobileSidebarOpen(false); }}>Payments</button>
            <button className={`nav-tab-pill ${currentTab === 'audit' ? 'active' : ''}`} onClick={() => { setCurrentTab('audit'); setSelectedInvoice(null); setIsMobileSidebarOpen(false); }}>Audit Logs</button>
          </div>

          <div className="mobile-sidebar-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="profile-avatar">SA</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>Super Admin</div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="nav-icon-btn"><Search size={18} /></button>
              <button className="nav-icon-btn"><Bell size={18} /></button>
              <button className="nav-icon-btn"><Settings size={18} /></button>
              {onLogout && (
                <button className="nav-icon-btn" onClick={onLogout} style={{ color: 'var(--status-danger)', background: '#fef2f2', marginLeft: 'auto' }}>
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Invoice View / Modal Overlay */}
        {selectedInvoice ? (
          <div style={{ padding: '32px' }}>
            <button 
              className="nav-icon-btn" 
              style={{ width: 'auto', padding: '0 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '8px', fontSize: '13px' }}
              onClick={() => setSelectedInvoice(null)}
            >
              <ArrowLeft size={14} /> Back to Payments
            </button>
            
            <div className="widget-card" style={{ maxWidth: '700px', margin: '0 auto', padding: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--bg-main)', paddingBottom: '24px', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>INVOICE</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Invoice ID: INV-{selectedInvoice.id}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>HMS Platform Corp.</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>superadmin@hms.com</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div>
                  <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Billed To</h4>
                  <h3 style={{ fontSize: '15px', fontWeight: '600' }}>{selectedInvoice.hospital}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>Subscription Plan Billing</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Payment Info</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Date: {selectedInvoice.date}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>Gateway: {selectedInvoice.method}</p>
                </div>
              </div>

              <table className="hospitals-table" style={{ marginBottom: '32px' }}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Enterprise HMS System Access Fee (Monthly Recurring Billing)</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>INR {selectedInvoice.amount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ borderTop: '2px solid var(--bg-main)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Status: <strong style={{ color: 'var(--status-success)' }}>{selectedInvoice.status}</strong></span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Paid</span>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px' }}>INR {selectedInvoice.amount.toLocaleString()}</h2>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && <OverviewTab setCurrentTab={setCurrentTab} setSelectedInvoice={setSelectedInvoice} isLoadingHospitals={isLoadingHospitals} hospitalsList={hospitalsList} stats={stats} />}
          {currentTab === 'hospitals' && (
            <HospitalsTab 
              searchInput={searchInput} 
              setSearchInput={setSearchInput} 
              handleScroll={handleScroll} 
              status={status} 
              isLoadingHospitals={isLoadingHospitals} 
              hospitalsList={hospitalsList} 
              isFetchingNextPage={isFetchingNextPage}
              onRowClick={(id) => { setSelectedHospitalId(id); setCurrentTab('hospital_detail'); }}
            />
          )}
          {currentTab === 'subscriptions' && <SubscriptionsTab mockSubscriptions={mockSubscriptions} />}
          {currentTab === 'payments' && <PaymentsTab setCurrentTab={setCurrentTab} setSelectedInvoiceId={setSelectedInvoiceId} onOpenReminderModal={() => setIsReminderModalOpen(true)} />}
          {currentTab === 'invoice_detail' && <InvoiceDetailTab invoiceId={selectedInvoiceId} onBack={() => setCurrentTab('payments')} />}
            {currentTab === 'audit' && <AuditLogsTab mockAuditLogs={mockAuditLogs} />}
            {currentTab === 'add_hospital' && (
              <AddHospitalTab 
                setCurrentTab={setCurrentTab}
                onSuccess={() => { loadData(); handleHospitalAdded(); setCurrentTab('hospitals'); }}
              />
            )}
            {currentTab === 'hospital_detail' && (
              <HospitalDetailTab 
                hospitalId={selectedHospitalId}
                onClose={() => { setSelectedHospitalId(null); setCurrentTab('hospitals'); }}
              />
            )}
          </>
        )}
      </div>

      {/* Floating Buttons */}
      <div className="floating-actions">
        <button className="floating-btn primary" title="Onboard New Hospital" onClick={() => { setCurrentTab('add_hospital'); setSelectedInvoice(null); }}>
          <Plus size={20} />
        </button>
        <button className="floating-btn" title="View Alerts"><ShieldAlert size={20} /></button>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="modal-backdrop animate-fade-in">
          <div className="cf-modal-card animate-slide-up" style={{ maxWidth: '400px', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header-bar" style={{ borderBottom: 'none', justifyContent: 'center', paddingBottom: 0, background: 'white' }}>
              <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '50%', display: 'inline-flex', marginBottom: '8px' }}>
                <LogOut size={32} color="var(--status-danger)" />
              </div>
            </div>
            <div className="modal-form-body" style={{ padding: '0 24px 24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>Confirm Logout</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5', marginBottom: '24px' }}>
                Are you sure you want to securely log out of the Super Admin console? You will need to re-authenticate to access the dashboard again.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => setIsLogoutModalOpen(false)}
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => { setIsLogoutModalOpen(false); onLogout(); }}
                  style={{ flex: 1, padding: '10px', background: 'var(--status-danger)', border: 'none' }}
                >
                  Yes, Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Reminder Modal */}
      <ManualReminderModal 
        isOpen={isReminderModalOpen} 
        onClose={() => setIsReminderModalOpen(false)} 
      />

    </div>
  );
}
