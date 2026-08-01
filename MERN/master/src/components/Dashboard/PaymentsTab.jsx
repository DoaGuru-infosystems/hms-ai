import React, { useState, useEffect } from 'react';
import { Eye, Download, Bell, Search, Filter, Loader2, ArrowUpRight, Clock, AlertCircle } from 'lucide-react';
import { superAdminBilling } from '../../utils/api';
import { useQuery } from '@tanstack/react-query';

export default function PaymentsTab({ setCurrentTab, setSelectedInvoiceId, onOpenReminderModal }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoices', page, debouncedSearch, statusFilter],
    queryFn: async () => {
      const res = await superAdminBilling.getInvoices({ page, limit: 10, search: debouncedSearch, status: statusFilter });
      return res.data;
    },
    keepPreviousData: true
  });

  const handleDownloadPDF = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await superAdminBilling.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Failed to download PDF");
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Paid': return 'status-badge success';
      case 'Pending': return 'status-badge warning';
      case 'Overdue': return 'status-badge error';
      default: return 'status-badge';
    }
  };

  const stats = data?.stats || { totalRevenue: 0, pendingAmount: 0, overdueCount: 0 };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Top Action Row: Search, Filter, Send Reminder */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <div className="input-with-icon" style={{ width: '280px' }}>
            <Search size={16} className="input-left-icon" style={{ color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search Hospital or Invoice #..." 
              className="form-input-field icon-padded"
              style={{ height: '40px', fontSize: '13px', borderRadius: '99px', background: '#fff' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Dropdown */}
          <div className="input-with-icon" style={{ position: 'relative' }}>
            <Filter size={16} className="input-left-icon" style={{ color: '#64748b' }} />
            <select 
              className="form-input-field icon-padded"
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ height: '40px', fontSize: '13px', borderRadius: '99px', background: '#fff', cursor: 'pointer', appearance: 'none', paddingRight: '36px', minWidth: '160px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            {/* Custom chevron for select */}
            <svg style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </div>

        {/* Send Reminder Button */}
        <button 
          onClick={onOpenReminderModal} 
          style={{ 
            padding: '10px 20px', 
            fontSize: '13px', 
            borderRadius: '99px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: '#0f172a', 
            color: '#fff', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
          }}
        >
          <Bell size={16} /> Send Reminder
        </button>
      </div>

      {/* Stats Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '24px'
      }}>
        {/* Stat Card 1 */}
        <div className="widget-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={24} />
            </div>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0, fontWeight: 500 }}>Total Revenue (Paid)</p>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            ₹ {Number(stats.totalRevenue || 0).toLocaleString('en-IN', {maximumFractionDigits: 2})}
          </h3>
        </div>

        {/* Stat Card 2 */}
        <div className="widget-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} />
            </div>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0, fontWeight: 500 }}>Pending Amount</p>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            ₹ {Number(stats.pendingAmount || 0).toLocaleString('en-IN', {maximumFractionDigits: 2})}
          </h3>
        </div>

        {/* Stat Card 3 */}
        <div className="widget-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={24} />
            </div>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0, fontWeight: 500 }}>Overdue Invoices</p>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {stats.overdueCount || 0} Invoices
          </h3>
        </div>
      </div>

      {/* Table Widget */}
      <div className="widget-card">
        <div className="widget-header">
          <div>
            <h3 style={{ margin: 0 }}>Invoicing & Billing</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Manage hospital subscriptions and payments</p>
          </div>
        </div>

        {/* Table */}
        <div className="hospitals-table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
          {isLoading ? (
            <div className="flex-center" style={{ padding: '40px' }}><Loader2 className="animate-spin text-primary" size={32} /></div>
          ) : isError ? (
            <div className="flex-center error-text" style={{ padding: '40px' }}>Failed to load invoices.</div>
          ) : (
            <table className="hospitals-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Hospital Name</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.length > 0 ? (
                  data.data.map(inv => (
                    <tr key={inv.id} className="clickable-row" onClick={() => { setSelectedInvoiceId(inv.id); setCurrentTab('invoice_detail'); }}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{inv.invoice_number}</td>
                      <td style={{ fontWeight: 500 }}>{inv.hospital_name}</td>
                      <td style={{ fontWeight: '600' }}>₹ {Number(inv.amount).toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                      <td>{new Date(inv.due_date).toLocaleDateString()}</td>
                      <td>
                        <span className={getStatusClass(inv.status)}>{inv.status}</span>
                      </td>
                      <td>
                        <button 
                          className="nav-icon-btn" 
                          style={{ width: '28px', height: '28px', display: 'inline-flex', marginRight: '8px' }}
                          title="View Invoice"
                          onClick={(e) => { e.stopPropagation(); setSelectedInvoiceId(inv.id); setCurrentTab('invoice_detail'); }}
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="nav-icon-btn" 
                          style={{ width: '28px', height: '28px', display: 'inline-flex' }} 
                          title="Download PDF"
                          onClick={(e) => handleDownloadPDF(inv.id, e)}
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No invoices found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data?.total > 10 && (
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.total)} of {data.total} invoices
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="btn-secondary" style={{ padding: '6px 12px' }}
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => p + 1)} 
                disabled={!data.hasMore}
                className="btn-secondary" style={{ padding: '6px 12px' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
