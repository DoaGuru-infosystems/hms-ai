import React from 'react';
import { Info } from 'lucide-react';

export default function AuditLogsTab({ mockAuditLogs }) {
  return (
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
}
