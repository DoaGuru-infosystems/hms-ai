import { useState, useEffect } from 'react';
import { Search, Plus, Printer, TrendingUp, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import Topbar from '../components/Topbar';

const STATUS_BADGE = { Paid: 'badge-success', Pending: 'badge-warning', Partial: 'badge-info' };

export default function BillingPage({ user }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('All');
  const [billsList, setBillsList] = useState([]);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = () => {
    fetch('http://localhost:5001/api/bills')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBillsList(data);
        } else {
          setBillsList([]);
        }
      })
      .catch(err => {
        console.log('Billing API fetch offline.', err);
        setBillsList([]);
      });
  };

  const filtered = billsList.filter(b => {
    const matchSearch = `${b.patientName || ''} ${b.invoiceNo || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'All' || b.status === tab;
    return matchSearch && matchTab;
  });

  const totalRevenue = billsList.reduce((s, b) => s + b.paid, 0);
  const totalPending = billsList.reduce((s, b) => s + (b.total - b.paid), 0);

  return (
    <div>
      <Topbar title="Billing & Finance" user={user?.name} />
      <div className="page-body has-stats">
        <div className="page-header">
          <div>
            <h2>Invoices & Sales</h2>
            <p>Invoices, receipts, and payments</p>
          </div>
          <div className="page-actions">
            <div className="search-bar">
              <Search />
              <input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary"><Plus size={15} /> New Invoice</button>
          </div>
        </div>

        {/* Premium Stat Cards */}
        <div className="grid-4" style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#047857' }}>
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <p>TOTAL REVENUE</p>
              <h3 style={{ color: '#047857' }}>₹{totalRevenue.toLocaleString()}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#b45309' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="stat-info">
              <p>PENDING AMOUNT</p>
              <h3 style={{ color: '#b45309' }}>₹{totalPending.toLocaleString()}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <p>TOTAL INVOICES</p>
              <h3>{billsList.length}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-info">
              <p>PAID BILLS</p>
              <h3 style={{ color: 'var(--violet)' }}>{billsList.filter(b => b.status === 'Paid').length}</h3>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="tabs">
          {['All', 'Paid', 'Pending', 'Partial'].map(t => (
            <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* Invoices List */}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice No.</th><th>Patient</th><th>Date</th>
                  <th>Sub Total</th><th>Discount</th><th>Total</th><th>Paid</th><th>Balance</th>
                  <th>Payment</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>{b.invoiceNo}</span></td>
                    <td style={{ fontWeight: 600 }}>{b.patientName}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.date}</td>
                    <td>₹{b.subtotal.toLocaleString()}</td>
                    <td style={{ color: '#047857', fontWeight: 500 }}>-₹{b.discount.toLocaleString()}</td>
                    <td style={{ fontWeight: 700 }}>₹{b.total.toLocaleString()}</td>
                    <td style={{ color: '#047857', fontWeight: 600 }}>₹{b.paid.toLocaleString()}</td>
                    <td style={{ color: b.total - b.paid > 0 ? '#b45309' : 'var(--text-muted)', fontWeight: 600 }}>
                      ₹{(b.total - b.paid).toLocaleString()}
                    </td>
                    <td style={{ fontSize: 12 }}>{b.paymentType}</td>
                    <td><span className={`badge ${STATUS_BADGE[b.status] || 'badge-gray'}`}>{b.status}</span></td>
                    <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}><Printer size={14} /></button></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                      No invoices found matching the selected status or query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
