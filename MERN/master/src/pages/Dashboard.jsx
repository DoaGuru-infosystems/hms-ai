import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, Bell, Search, Settings, User, CheckCircle2, 
  XCircle, Clock, CalendarDays, Activity, ArrowLeft, MoreHorizontal, Plus, 
  HelpCircle, Sparkles, Filter, ChevronDown, Check, ShieldAlert, Receipt, 
  CreditCard, Eye, Download, Info, LogOut, Menu, X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { superAdminDashboard, superAdminHospitals } from '../utils/api';
import AddHospitalModal from '../components/AddHospitalModal';

export default function Dashboard({ onLogout }) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isAddHospitalOpen, setIsAddHospitalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Backend state
  const [stats, setStats] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const loadData = () => {
    // 1. Fetch Stats
    superAdminDashboard.getStats()
      .then(res => setStats(res.data))
      .catch(() => console.log("Backend offline or unauthorized - using fallback stats"));

    // 2. Fetch Hospitals
    superAdminHospitals.getAll()
      .then(res => setHospitals(res.data))
      .catch(() => console.log("Backend offline or unauthorized - using fallback hospitals"));

    // 3. Fetch Audit Logs
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
    { name: 'Active', value: hospitals.filter(h => h.status === 'Active').length || 38, color: '#10b981' },
    { name: 'Provisioning', value: hospitals.filter(h => h.status === 'Provisioning').length || 5, color: '#f59e0b' },
    { name: 'Failed', value: hospitals.filter(h => h.status === 'Provisioning Failed').length || 2, color: '#ef4444' }
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

  // Render Functions
  const renderDashboardTab = () => (
    <>
      <header className="page-header-row">
        <div className="page-title-area">
          <button className="back-btn"><ArrowLeft size={16} /></button>
          <h2>Hospital Management</h2>
        </div>

        <div className="avatar-stack-container" style={{ gap: '16px' }}>
          <button 
            className="btn-primary-dark" 
            onClick={() => setIsAddHospitalOpen(true)}
            style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '6px', background: '#0f172a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}
          >
            <Plus size={16} /> Onboard Hospital
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginRight: '4px' }}>
              Recently Onboarded:
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['AH', 'MC', 'CL', 'FH'].map((name, idx) => (
                <div key={idx} className="avatar-item">
                  {name}
                  <span className={`avatar-badge ${idx === 2 ? 'danger' : idx === 3 ? 'warning' : 'success'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="board-outer-container">
        <div className="journey-board-card">
          <div className="board-header">
            <h3>Hospital Onboarding Journey</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="nav-icon-btn" style={{ borderRadius: '8px', width: 'auto', padding: '0 16px', fontSize: '13px', display: 'flex', gap: '6px', height: '36px' }}>
                <Filter size={14} /> Filter
              </button>
            </div>
          </div>

          <div className="kanban-grid">
            <svg className="connector-svg" xmlns="http://www.w3.org/2000/svg">
              <path d="M 230 110 Q 280 110 280 200 T 330 200" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 570 200 Q 620 200 620 230 T 670 230" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 910 230 Q 960 230 960 110 T 1010 110" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
            </svg>

            {/* Columns */}
            <div className="kanban-column">
              <div className="column-title">1. Registration</div>
              <div className="column-cards">
                <div className="journey-card">
                  <div className="card-top"><span className="card-title">Collect Details</span><div className="card-icon-wrapper"><Building2 size={16} /></div></div>
                  <div className="card-meta"><span>Hospital Profile</span><span className="meta-status success"><Check size={14} /> Done</span></div>
                </div>
                <div className="journey-card">
                  <div className="card-top"><span className="card-title">Verify Email</span><div className="card-icon-wrapper"><Users size={16} /></div></div>
                  <div className="card-meta"><span>OTP verification</span><span className="meta-status success"><Check size={14} /> Done</span></div>
                </div>
              </div>
            </div>

            <div className="kanban-column">
              <div className="column-title">2. Subscription Setup</div>
              <div className="column-cards">
                <div className="journey-card">
                  <div className="card-top"><span className="card-title">Select Plan</span><div className="card-icon-wrapper"><FileText size={16} /></div></div>
                  <div className="card-meta"><span>Standard Plan chosen</span><span className="meta-status success"><Check size={14} /> Done</span></div>
                </div>
              </div>
            </div>

            <div className="kanban-column">
              <div className="column-title">3. DB Provisioning</div>
              <div className="column-cards">
                <div className="journey-card active-step">
                  <div className="card-top"><span className="card-title">Create Database</span><div className="card-icon-wrapper"><Clock size={16} /></div></div>
                  <div className="card-meta"><span>hms_tenant_apollo</span><span className="meta-status warning" style={{color: '#fcd34d'}}>Running</span></div>
                </div>
              </div>
            </div>

            <div className="kanban-column">
              <div className="column-title">4. Go-Live</div>
              <div className="column-cards">
                <div className="journey-card">
                  <div className="card-top"><span className="card-title">Activate Hospital</span><div className="card-icon-wrapper"><Clock size={16} /></div></div>
                  <div className="card-meta"><span>Enable routing</span><span className="meta-status warning"><Clock size={14} /> Pending</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bottom-widgets-grid">
        <div className="widget-card">
          <div className="widget-header"><h3>All Onboarded Hospitals</h3></div>
          <div className="hospitals-table-wrapper">
            <table className="hospitals-table">
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>Status</th>
                  <th>Beds</th>
                  <th>Plan</th>
                  <th>Renewal Date</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.length > 0 ? hospitals.map(h => (
                  <tr key={h.id}>
                    <td>{h.hospital_name}</td>
                    <td><span className={`status-pill ${h.status === 'Active' ? 'active' : h.status === 'Provisioning' ? 'pending' : 'failed'}`}>{h.status}</span></td>
                    <td>{h.bed_count || 100} Beds</td>
                    <td>{h.plan_name || 'Standard'}</td>
                    <td>{h.created_at ? new Date(h.created_at).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                )) : (
                  <>
                    <tr>
                      <td>Apollo Hospital</td>
                      <td><span className="status-pill active">Active</span></td>
                      <td>150 Beds</td>
                      <td>Standard</td>
                      <td>Sep 24, 2026</td>
                    </tr>
                    <tr>
                      <td>Max Care</td>
                      <td><span className="status-pill active">Active</span></td>
                      <td>200 Beds</td>
                      <td>Premium</td>
                      <td>Oct 12, 2026</td>
                    </tr>
                    <tr>
                      <td>City Life</td>
                      <td><span className="status-pill failed">Failed</span></td>
                      <td>80 Beds</td>
                      <td>Standard</td>
                      <td>N/A</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="widget-card">
          <div className="widget-header"><h3>Provisioning Overview</h3></div>
          <div className="chart-content-area">
            <div style={{ height: '160px', width: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                    {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats?.activeHospitals || 45}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Total</div>
              </div>
            </div>

            <div className="stats-summary-box">
              <div className="summary-item"><h4>Total Beds</h4><p>{stats?.totalBeds || '12,450'}</p></div>
              <div className="summary-item"><h4>MRR (INR)</h4><p>{stats?.mrr || '3.7M'}</p></div>
              <div className="summary-item"><h4>Active Plan</h4><p>93%</p></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const renderSubscriptionsTab = () => (
    <div style={{ padding: '32px' }}>
      <div className="widget-card">
        <div className="widget-header">
          <h3>Active Subscriptions & Plans</h3>
          <button className="floating-btn primary" style={{ width: 'auto', height: '36px', borderRadius: '8px', padding: '0 16px', gap: '8px' }}>
            <Plus size={16} /> New Plan
          </button>
        </div>
        <div className="hospitals-table-wrapper">
          <table className="hospitals-table">
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Plan Type</th>
                <th>Beds Allocated</th>
                <th>Pricing per Bed</th>
                <th>MRR Value</th>
                <th>Subscription Term</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockSubscriptions.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: '500' }}>{sub.hospital}</td>
                  <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{sub.plan}</span></td>
                  <td>{sub.beds} Beds</td>
                  <td>300 INR / month</td>
                  <td style={{ fontWeight: '600' }}>INR {sub.mrr.toLocaleString()}</td>
                  <td>{sub.start} to {sub.end}</td>
                  <td>
                    <span className={`status-pill ${sub.status === 'Active' ? 'active' : sub.status === 'Pending' ? 'pending' : 'failed'}`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAuditTab = () => (
    <div style={{ padding: '32px' }}>
      <div className="widget-card">
        <div className="widget-header">
          <h3>Master System Audit Logs</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={14} /> Security timeline of actions
          </span>
        </div>
        <div className="hospitals-table-wrapper">
          <table className="hospitals-table">
            <thead>
              <tr>
                <th>Admin Email</th>
                <th>Action Code</th>
                <th>Log Details</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {mockAuditLogs.map(log => (
                <tr key={log.id}>
                  <td>{log.admin_email}</td>
                  <td>
                    <span style={{ background: 'var(--bg-main)', color: 'var(--accent-dark)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{log.details}</td>
                  <td>{log.ip_address || '127.0.0.1'}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div style={{ padding: '32px' }}>
      <div className="widget-card">
        <div className="widget-header">
          <h3>Payment Gateway Transactions</h3>
          <span style={{ fontSize: '12px', background: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '4px' }}>
            Gateway Connection: Razorpay / Stripe
          </span>
        </div>
        <div className="hospitals-table-wrapper">
          <table className="hospitals-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Hospital</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockPayments.map(pay => (
                <tr key={pay.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{pay.id}</td>
                  <td>{pay.hospital}</td>
                  <td style={{ fontWeight: '600' }}>INR {pay.amount.toLocaleString()}</td>
                  <td>{pay.method}</td>
                  <td>{pay.date}</td>
                  <td>
                    <span className={`status-pill ${pay.status === 'Completed' ? 'active' : pay.status === 'Pending' ? 'pending' : 'failed'}`}>
                      {pay.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="nav-icon-btn" 
                      style={{ width: '28px', height: '28px', display: 'inline-flex', marginRight: '8px' }}
                      title="View Invoice"
                      onClick={() => setSelectedInvoice(pay)}
                    >
                      <Eye size={12} />
                    </button>
                    <button className="nav-icon-btn" style={{ width: '28px', height: '28px', display: 'inline-flex' }} title="Download PDF">
                      <Download size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      {/* 1. Left Thin Sidebar */}
      <aside className="thin-sidebar">
        <div className="sidebar-icons">
          <button className={`sidebar-btn ${currentTab === 'dashboard' ? 'active-dark' : ''}`} onClick={() => { setCurrentTab('dashboard'); setSelectedInvoice(null); }}><Activity size={20} /></button>
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
                onClick={onLogout} 
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
            {currentTab === 'dashboard' && renderDashboardTab()}
            {currentTab === 'subscriptions' && renderSubscriptionsTab()}
            {currentTab === 'payments' && renderPaymentsTab()}
            {currentTab === 'audit' && renderAuditTab()}
          </>
        )}
      </div>

      {/* Floating Buttons */}
      <div className="floating-actions">
        <button className="floating-btn primary" title="Onboard New Hospital" onClick={() => setIsAddHospitalOpen(true)}>
          <Plus size={20} />
        </button>
        <button className="floating-btn" title="View Alerts"><ShieldAlert size={20} /></button>
      </div>

      {/* Add Hospital Modal with Dynamic Custom Fields */}
      <AddHospitalModal
        isOpen={isAddHospitalOpen}
        onClose={() => setIsAddHospitalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
