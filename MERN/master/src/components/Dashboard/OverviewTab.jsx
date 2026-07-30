import React from 'react';
import { 
  Building2, Users, FileText, Clock, Filter, 
  ArrowLeft, Plus, Check, Loader2 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function OverviewTab({ 
  setCurrentTab, 
  setSelectedInvoice, 
  isLoadingHospitals, 
  hospitalsList, 
  stats 
}) {
  
  const donutData = [
    { name: 'Active', value: hospitalsList.filter(h => h.status === 'Active').length || 38, color: '#10b981' },
    { name: 'Provisioning', value: hospitalsList.filter(h => h.status === 'Provisioning').length || 5, color: '#f59e0b' },
    { name: 'Failed', value: hospitalsList.filter(h => h.status === 'Provisioning Failed').length || 2, color: '#ef4444' }
  ];

  return (
    <>
      <header className="page-header-row">
        <div className="page-title-area">
          <button className="back-btn"><ArrowLeft size={16} /></button>
          <h2>Hospital Management</h2>
        </div>

        <div className="avatar-stack-container" style={{ gap: '16px' }}>
          <button 
            className="btn-primary-dark" 
            onClick={() => setCurrentTab('add_hospital')}
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
        <div className="widget-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3>Recent Onboarded Hospitals</h3>
            <button 
              className="btn-link" 
              style={{ fontSize: '13px', color: 'var(--accent-blue)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '500' }}
              onClick={() => { setCurrentTab('hospitals'); setSelectedInvoice(null); }}
            >
              View All &rarr;
            </button>
          </div>
          <div className="hospitals-table-wrapper">
            <table className="hospitals-table">
              <thead>
                <tr>
                  <th style={{ background: '#fff' }}>Hospital Name</th>
                  <th style={{ background: '#fff' }}>Status</th>
                  <th style={{ background: '#fff' }}>Beds</th>
                  <th style={{ background: '#fff' }}>Plan</th>
                  <th style={{ background: '#fff' }}>Renewal Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingHospitals ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                      <Loader2 className="animate-spin" style={{ margin: '0 auto', color: '#94a3b8' }} size={24} />
                    </td>
                  </tr>
                ) : hospitalsList.length > 0 ? (
                  hospitalsList.slice(0, 4).map((h, idx) => (
                    <tr key={h.id || idx}>
                      <td>{h.hospital_name}</td>
                      <td><span className={`status-pill ${h.status === 'Active' ? 'active' : h.status === 'Provisioning' ? 'pending' : 'failed'}`}>{h.status}</span></td>
                      <td>{h.bed_count || 100} Beds</td>
                      <td>{h.plan_name || 'Standard'}</td>
                      <td>{h.created_at ? new Date(h.created_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No hospitals found.
                    </td>
                  </tr>
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
}
