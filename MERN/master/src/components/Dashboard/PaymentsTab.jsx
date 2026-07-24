import React from 'react';
import { Eye, Download } from 'lucide-react';

export default function PaymentsTab({ mockPayments, setSelectedInvoice }) {
  return (
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
}
