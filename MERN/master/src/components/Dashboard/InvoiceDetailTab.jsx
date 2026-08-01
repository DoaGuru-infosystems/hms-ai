import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import { superAdminBilling } from '../../utils/api';
import { useQuery } from '@tanstack/react-query';

export default function InvoiceDetailTab({ invoiceId, onBack }) {
  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const res = await superAdminBilling.getInvoiceById(invoiceId);
      return res.data;
    },
    enabled: !!invoiceId
  });

  const handleDownloadPDF = async () => {
    try {
      const res = await superAdminBilling.downloadPDF(invoiceId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Failed to download PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-center animate-fade-in" style={{ height: '100%', flexDirection: 'column', gap: '16px' }}>
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted">Loading invoice details...</p>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="flex-center animate-fade-in" style={{ height: '100%', flexDirection: 'column', gap: '16px' }}>
        <AlertCircle size={48} color="#ef4444" />
        <h3>Failed to load invoice</h3>
        <button onClick={onBack} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  let breakdown = [];
  try {
    breakdown = typeof invoice.breakdown_json === 'string' ? JSON.parse(invoice.breakdown_json) : invoice.breakdown_json;
  } catch (e) {
    console.error("Failed to parse breakdown_json", e);
  }

  const getStatusClass = (status) => {
    switch(status) {
      case 'Paid': return 'status-badge success';
      case 'Pending': return 'status-badge warning';
      case 'Overdue': return 'status-badge error';
      default: return 'status-badge';
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Back Button & Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={onBack} className="nav-icon-btn" title="Back to Payments">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#0f172a' }}>Invoice {invoice.invoice_number}</h2>
          <p style={{ margin: 0, color: '#64748b' }}>Detailed breakdown and billing information</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button onClick={handleDownloadPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 350px', alignItems: 'start' }}>
        
        {/* Main Invoice Card */}
        <div className="widget-card">
          <div className="widget-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={20} className="text-primary" />
            <h3 style={{ margin: 0 }}>Invoice Breakdown</h3>
          </div>
          
          <div style={{ padding: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 8px' }}>Description</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {breakdown && breakdown.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 8px', color: '#334155' }}>
                      <span style={{ fontWeight: 500 }}>{item.description}</span>
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      ₹ {Number(item.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #cbd5e1' }}>
                  <td style={{ padding: '20px 8px', fontWeight: 'bold', fontSize: '18px', color: '#0f172a' }}>Total Amount</td>
                  <td style={{ padding: '20px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '20px', color: '#10b981' }}>
                    ₹ {Number(invoice.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Info Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="widget-card">
            <div className="widget-header">
              <h3 style={{ margin: 0 }}>Billing Details</h3>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Status</p>
                <span className={getStatusClass(invoice.status)} style={{ display: 'inline-block' }}>{invoice.status}</span>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Due Date</p>
                <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{new Date(invoice.due_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Invoice Date</p>
                <p style={{ margin: 0, fontWeight: 500, color: '#334155' }}>{new Date(invoice.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-header">
              <h3 style={{ margin: 0 }}>Billed To</h3>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Hospital Name</p>
                <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{invoice.hospital_name}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Email</p>
                <p style={{ margin: 0, fontWeight: 500, color: '#334155' }}>{invoice.admin_email || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Contact Number</p>
                <p style={{ margin: 0, fontWeight: 500, color: '#334155' }}>{invoice.contact_number || 'N/A'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
