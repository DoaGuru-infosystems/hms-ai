import { useState, useEffect } from 'react';
import { FileText, Activity, Pill, Calendar, User, Clock, Heart, Clipboard, Award, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function EMRPage({ type = 'opd', user }) {
  const isOPD = type === 'opd';
  const [records, setRecords] = useState([]);
  const title = isOPD ? 'Out-Patient EMR' : 'In-Patient EMR';

  // Modal and history view states
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [emrData, setEmrData] = useState(null);
  const [loadingEMR, setLoadingEMR] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchEMR();
  }, [type]);

  const fetchEMR = () => {
    const endpoint = isOPD ? `${API_BASE}/opd` : `${API_BASE}/ipd`;
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Archives display both active/admitted and discharged/past patients
          if (isOPD) {
            setRecords(data);
          } else {
            setRecords(data.filter(r => r.status === 'Admitted' || r.status === 'Discharged'));
          }
        } else {
          setRecords([]);
        }
      })
      .catch(err => {
        console.error('Failed to load EMR records:', err);
        setRecords([]);
      });
  };

  const handleOpenEMR = (rec) => {
    setSelectedRecord(rec);
    setLoadingEMR(true);
    setActiveTab('summary');
    
    fetch(`${API_BASE}/nurse/patient-history?patientNo=${rec.patientNo}`)
      .then(res => res.json())
      .then(data => {
        setEmrData(data);
      })
      .catch(err => {
        console.error('Failed to load EMR details:', err);
        setEmrData(null);
      })
      .finally(() => {
        setLoadingEMR(false);
      });
  };

  const dateStr = selectedRecord ? (isOPD ? (selectedRecord.dateVisit || selectedRecord.date) : (selectedRecord.dateAdmit || selectedRecord.date)) : '';

  return (
    <div className="nurse-theme">
      <Topbar title={title} user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>EMR Sheet — {title}</h2>
            <p>Electronic Medical Records Archives</p>
          </div>
        </div>
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{isOPD ? 'OPD' : 'IPD'} No.</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Diagnosis</th>
                  <th>EMR Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily:'monospace', color:'var(--accent-light)', fontWeight: 600 }}>{r.ioId}</td>
                    <td>
                      <div style={{ fontWeight:600 }}>{r.patientName}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.patientNo}</div>
                    </td>
                    <td>{r.doctor}</td>
                    <td>{r.department}</td>
                    <td style={{ fontSize:12 }}>{isOPD ? r.dateVisit : r.dateAdmit}</td>
                    <td style={{ fontSize:12, maxWidth:150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.diagnosis}</td>
                    <td>
                      <span className={`badge ${r.status === 'Discharged' ? 'badge-success' : 'badge-info'}`}>
                        {r.status === 'Discharged' ? 'Completed' : 'Active / Admitted'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => handleOpenEMR(r)}>
                        View EMR
                      </button>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                      No active medical records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- EMR DETAILED MODAL --- */}
      {selectedRecord && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }} 
          onClick={() => setSelectedRecord(null)}
        >
          <div 
            style={{
              background: 'var(--surface, #1e293b)',
              border: '1px solid var(--surface-border, #334155)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 900,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
            }} 
            onClick={e => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--surface-border, #334155)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clipboard size={18} color="var(--primary)" />
                  Electronic Medical Record (EMR)
                  <span className="badge badge-info" style={{ fontFamily: 'monospace', fontSize: 11 }}>{selectedRecord.ioId}</span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  Patient: <strong style={{ color: 'var(--text-primary)' }}>{selectedRecord.patientName}</strong> ({selectedRecord.patientNo})
                </p>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{
              display: 'flex',
              gap: 8,
              padding: '12px 24px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderBottom: '1px solid var(--surface-border, #334155)'
            }}>
              {[
                { id: 'summary', label: 'Case Summary' },
                { id: 'vitals_meds', label: 'Vitals & Medications' },
                { id: 'clinical_logs', label: 'Clinical & Nursing Logs' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === tab.id ? 'var(--primary, #3b82f6)' : 'transparent',
                    color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div style={{
              padding: 24,
              overflowY: 'auto',
              flex: 1,
              background: 'var(--surface, #1e293b)'
            }}>
              {loadingEMR ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 250, gap: 12, color: 'var(--text-secondary)' }}>
                  <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                  <h4>Loading EMR Clinical Assets...</h4>
                </div>
              ) : (
                <div>
                  {/* --- CASE SUMMARY TAB --- */}
                  {activeTab === 'summary' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div className="grid-2" style={{ gap: 16 }}>
                        <div className="card" style={{ padding: 16, border: '1px solid var(--surface-border)', margin: 0 }}>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--surface-border)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-light)' }}>
                            <User size={16} /> Demographics
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Name:</span><strong style={{ color: 'var(--text-primary)' }}>{selectedRecord.patientName}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Patient ID:</span><span style={{ fontFamily: 'monospace' }}>{selectedRecord.patientNo}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Admission Ref:</span><span style={{ fontFamily: 'monospace' }}>{selectedRecord.ioId}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Scope:</span><span>{isOPD ? 'Outpatient (OPD)' : 'Inpatient (IPD)'}</span></div>
                          </div>
                        </div>

                        <div className="card" style={{ padding: 16, border: '1px solid var(--surface-border)', margin: 0 }}>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--surface-border)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-light)' }}>
                            <Award size={16} /> Attending Team
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Consultant:</span><strong style={{ color: 'var(--text-primary)' }}>{selectedRecord.doctor}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Department:</span><span>{selectedRecord.department}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Date:</span><span>{dateStr}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Room/Bed:</span>
                              <span>{selectedRecord.room ? `Rm ${selectedRecord.room} / Bed ${selectedRecord.bed || 'A'}` : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="card" style={{ padding: 20, border: '1px solid var(--surface-border)', margin: 0 }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--surface-border)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-light)' }}>
                          <FileText size={16} /> Diagnosis & Complaints
                        </h4>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Primary Diagnosis</div>
                          <div style={{ padding: 12, background: 'rgba(59,130,246,0.08)', borderRadius: 8, border: '1px dashed rgba(59,130,246,0.3)', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {selectedRecord.diagnosis || 'No primary diagnosis registered yet.'}
                          </div>
                        </div>
                        {selectedRecord.complaints && (
                          <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Chief Complaints</div>
                            <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                              {selectedRecord.complaints}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* --- VITALS & MEDS TAB --- */}
                  {activeTab === 'vitals_meds' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div className="card" style={{ padding: 16, border: '1px solid var(--surface-border)', margin: 0 }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--surface-border)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-light)' }}>
                          <Heart size={16} /> Patient Vitals Log
                        </h4>
                        {emrData?.vitals?.length > 0 ? (
                          <div className="table-wrapper">
                            <table>
                              <thead>
                                <tr>
                                  <th>Date & Time</th>
                                  <th>BP</th>
                                  <th>Temp</th>
                                  <th>Pulse</th>
                                  <th>Resp</th>
                                  <th>SpO2</th>
                                  <th>Weight</th>
                                  <th>Attendant</th>
                                </tr>
                              </thead>
                              <tbody>
                                {emrData.vitals.map(v => (
                                  <tr key={v.id}>
                                    <td style={{ fontSize: 11 }}>{new Date(v.date).toLocaleString()}</td>
                                    <td style={{ fontWeight: 600 }}>{v.bp || '—'}</td>
                                    <td>{v.temp ? `${v.temp} °F` : '—'}</td>
                                    <td>{v.pulse ? `${v.pulse} bpm` : '—'}</td>
                                    <td>{v.resp ? `${v.resp} cpm` : '—'}</td>
                                    <td>
                                      {v.spo2 ? (
                                        <span className={`badge ${parseInt(v.spo2) < 95 ? 'badge-danger' : 'badge-success'}`}>
                                          {v.spo2}%
                                        </span>
                                      ) : '—'}
                                    </td>
                                    <td>{v.weight ? `${v.weight} kg` : '—'}</td>
                                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.by}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No vital signs recorded.</div>
                        )}
                      </div>

                      <div className="card" style={{ padding: 16, border: '1px solid var(--surface-border)', margin: 0 }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--surface-border)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-light)' }}>
                          <Pill size={16} /> Medication Chart
                        </h4>
                        {emrData?.meds?.length > 0 ? (
                          <div className="table-wrapper">
                            <table>
                              <thead>
                                <tr>
                                  <th>Signed Date</th>
                                  <th>Medication Name</th>
                                  <th>Dose</th>
                                  <th>Route</th>
                                  <th>Frequency</th>
                                  <th>Administered Status</th>
                                  <th>Nurse</th>
                                </tr>
                              </thead>
                              <tbody>
                                {emrData.meds.map(m => (
                                  <tr key={m.id}>
                                    <td style={{ fontSize: 11 }}>{new Date(m.date).toLocaleString()}</td>
                                    <td style={{ fontWeight: 600 }}>{m.medName}</td>
                                    <td>{m.dose}</td>
                                    <td>{m.route}</td>
                                    <td>{m.freq}</td>
                                    <td>
                                      <span className={`badge ${m.status === 'Given' ? 'badge-success' : 'badge-danger'}`}>
                                        {m.status || 'Given'}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.by}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No active medication charts found.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* --- CLINICAL LOGS TAB --- */}
                  {activeTab === 'clinical_logs' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div className="card" style={{ padding: 16, border: '1px solid var(--surface-border)', margin: 0 }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--surface-border)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-light)' }}>
                          <Clock size={16} /> Nurse Progress Notes & Bedside Timelines
                        </h4>
                        {emrData?.notes?.length > 0 || emrData?.bedside?.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {emrData?.notes?.map(n => (
                              <div key={n.id} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--surface-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span className="badge badge-purple" style={{ fontSize: 10 }}>Progress Note</span>
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(n.date).toLocaleString()}</span>
                                </div>
                                <p style={{ margin: '8px 0', fontSize: 13, color: 'var(--text-secondary)' }}>{n.note}</p>
                                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>Signed by: {n.by}</div>
                              </div>
                            ))}
                            {emrData?.bedside?.map(b => (
                              <div key={b.id} style={{ padding: 14, background: 'rgba(59,130,246,0.04)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span className="badge badge-info" style={{ fontSize: 10 }}>{b.procedureName}</span>
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(b.date).toLocaleString()}</span>
                                </div>
                                <p style={{ margin: '8px 0', fontSize: 13, color: 'var(--text-secondary)' }}>{b.note}</p>
                                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>Signed by: {b.by}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No clinical progress notes or bedside procedures logged.</div>
                        )}
                      </div>

                      <div className="card" style={{ padding: 16, border: '1px solid var(--surface-border)', margin: 0 }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--surface-border)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-light)' }}>
                          <Activity size={16} /> Fluid Intake & Output Chart
                        </h4>
                        {emrData?.io?.length > 0 ? (
                          <div className="table-wrapper">
                            <table>
                              <thead>
                                <tr>
                                  <th>Date & Time</th>
                                  <th>Intake Type</th>
                                  <th>Intake Vol</th>
                                  <th>Output Type</th>
                                  <th>Output Vol</th>
                                  <th>Attendant</th>
                                </tr>
                              </thead>
                              <tbody>
                                {emrData.io.map(i => (
                                  <tr key={i.id}>
                                    <td style={{ fontSize: 11 }}>{new Date(i.date).toLocaleString()}</td>
                                    <td>{i.intake_type || '—'}</td>
                                    <td style={{ color: '#34d399', fontWeight: 600 }}>{i.intake_amount ? `${i.intake_amount} mL` : '—'}</td>
                                    <td>{i.output_type || '—'}</td>
                                    <td style={{ color: '#f87171', fontWeight: 600 }}>{i.output_amount ? `${i.output_amount} mL` : '—'}</td>
                                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{i.by}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No Intake/Output log entries found.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--surface-border, #334155)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'rgba(15, 23, 42, 0.4)'
            }}>
              <button className="btn btn-secondary" onClick={() => setSelectedRecord(null)}>Close EMR</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
