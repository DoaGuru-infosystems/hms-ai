import React from 'react';
import { Plus } from 'lucide-react';

export default function SubscriptionsTab({ mockSubscriptions }) {
  return (
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
}
