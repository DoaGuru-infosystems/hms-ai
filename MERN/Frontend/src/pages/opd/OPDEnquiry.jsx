import { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, FileText, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function OPDEnquiry({ user }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceTimer = useRef(null);

  const fetchOPDRecords = useCallback((searchVal = '') => {
    setLoading(true);
    const qs = searchVal ? `?search=${encodeURIComponent(searchVal)}` : '';
    fetch(`${API_BASE}/opd${qs}`)
      .then(res => res.json())
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(err => { console.error('Error fetching OPD records:', err); setRecords([]); })
      .finally(() => setLoading(false));
  }, []);

  // Initial load
  useEffect(() => { fetchOPDRecords(); }, [fetchOPDRecords]);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchOPDRecords(search), 400);
    return () => clearTimeout(debounceTimer.current);
  }, [search, fetchOPDRecords]);

  const handleConvertToIPD = (opdRecord) => {
    navigate('/ipd/admit', { state: { convertFromOPD: opdRecord } });
  };

  const handleMarkAsPaid = async (ioId) => {
    try {
      const res = await fetch(`${API_BASE}/opd/${ioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: true })
      });

      if (!res.ok) throw new Error('Failed to update payment status.');

      // Update locally
      setRecords(prev => prev.map(r => r.ioId === ioId ? { ...r, isPaid: true } : r));
      
      // Update selected modal details if open
      setSelected(prev => prev && prev.ioId === ioId ? { ...prev, isPaid: true } : prev);
    } catch (err) {
      alert(err.message);
    }
  };

  // records already backend-filtered; use directly
  const filtered = records;

  return (
    <div>
      <Topbar title="Out-Patient Enquiry" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div><h2>Out-Patient Enquiry</h2><p>View all OPD visit records</p></div>
          <div className="page-actions">
            <div className="search-bar">
              <input placeholder="Search OPD records..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40, gap: 10, color: 'var(--text-secondary)' }}>
              <Loader2 className="animate-spin" size={18} />
              Loading outpatient records...
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>OPD No.</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Visit Date</th>
                    <th>Complaints</th>
                    <th>Diagnosis</th>
                    <th>Status</th>
                    <th>Paid</th>
                    <th style={{ minWidth: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-light)' }}>{r.ioId}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.patientName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.patientNo}</div>
                      </td>
                      <td>{r.doctor}</td>
                      <td>{r.department}</td>
                      <td style={{ fontSize: 12 }}>{r.dateVisit}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.complaints}</td>
                      <td style={{ fontSize: 12, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.diagnosis}</td>
                      <td>
                        {r.status === 'Converted to IPD' ? (
                          <span className="badge badge-info" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>Converted to IPD</span>
                        ) : (
                          <span className="badge badge-success">{r.status || 'Active'}</span>
                        )}
                      </td>
                      <td>
                        <span 
                          className={`badge ${r.isPaid ? 'badge-success' : 'badge-warning'}`}
                          style={{ 
                            cursor: r.isPaid ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: !r.isPaid ? '0 0 10px rgba(245, 158, 11, 0.15)' : 'none'
                          }}
                          onClick={() => { if (!r.isPaid) handleMarkAsPaid(r.ioId); }}
                          title={r.isPaid ? 'Payment Confirmed' : 'Click to Mark Paid'}
                        >
                          {r.isPaid ? 'Paid' : 'Pending 💳'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelected(r)} title="View Details" style={{ padding: 6 }}>
                          <Eye size={14} />
                        </button>
                        {!r.isPaid && (
                          <button 
                            className="btn btn-success btn-xs" 
                            style={{ 
                              marginLeft: 6, 
                              fontSize: 10, 
                              padding: '4px 8px', 
                              borderRadius: 4, 
                              background: 'rgba(16, 185, 129, 0.1)',
                              borderColor: 'rgba(16, 185, 129, 0.3)',
                              color: '#10b981',
                              cursor: 'pointer' 
                            }}
                            onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(r.ioId); }}
                            title="Mark as Paid"
                          >
                            💳 Pay
                          </button>
                        )}
                        {r.status !== 'Converted to IPD' && (
                          <button 
                            className="btn btn-outline btn-xs" 
                            style={{ 
                              marginLeft: 6, 
                              fontSize: 10, 
                              padding: '4px 8px', 
                              borderRadius: 4, 
                              borderColor: 'var(--accent)', 
                              color: 'var(--accent-light)',
                              background: 'transparent',
                              cursor: 'pointer' 
                            }}
                            onClick={(e) => { e.stopPropagation(); handleConvertToIPD(r); }}
                            title="Convert to IPD Admission"
                          >
                            ⚡ Convert
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} className="empty-state">No OPD records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
              <div className="modal-header">
                <h3>OPD Record — {selected.ioId}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div className="modal-body">
                {[
                  ['OPD No.', selected.ioId],
                  ['Patient', selected.patientName],
                  ['Patient No.', selected.patientNo],
                  ['Doctor Incharge', selected.doctor],
                  ['Department', selected.department],
                  ['Visit Date', selected.dateVisit],
                  ['Complaints', selected.complaints],
                  ['Provisional Diagnosis', selected.diagnosis],
                  ['Status', selected.status || 'Active'],
                  ['Payment Status', selected.isPaid ? 'Paid' : 'Pending']
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{k}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!selected.isPaid && (
                    <button 
                      className="btn btn-success" 
                      style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }}
                      onClick={() => handleMarkAsPaid(selected.ioId)}
                    >
                      💳 Collect Payment
                    </button>
                  )}
                  {selected.status !== 'Converted to IPD' && (
                    <button 
                      className="btn btn-primary" 
                      style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}
                      onClick={() => handleConvertToIPD(selected)}
                    >
                      ⚡ Convert to IPD Admission <ArrowRight size={13} style={{ marginLeft: 4 }} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline" onClick={() => alert('Print feature triggered')}><FileText size={13}/> Print OPD</button>
                  <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
