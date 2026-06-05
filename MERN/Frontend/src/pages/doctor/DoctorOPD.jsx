import { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function DoctorOPD({ user }) {
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('complaint');
  const [myPatients, setMyPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPatients();
  }, []);

  const fetchMyPatients = () => {
    setLoading(true);
    fetch(`${API_BASE}/opd`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMyPatients(data.filter(r => r.status === 'Active'));
        } else {
          setMyPatients([]);
        }
      })
      .catch(err => {
        console.error('Failed to load doctor OPD schedule:', err);
        setMyPatients([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const clinicTabs = [
    { key:'complaint', label:'Complaints' },
    { key:'vitals', label:'Vital Signs' },
    { key:'diagnosis', label:'Diagnosis' },
    { key:'medication', label:'Medication' },
    { key:'lab', label:'Laboratory' },
    { key:'history', label:'Patient History' },
  ];

  return (
    <div>
      <Topbar title="Doctor — Out-Patient" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Consultation Queue</h2>
            <p>Today's out-patient consultations</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Consultations...</h4>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>OPD No.</th>
                    <th>Patient</th>
                    <th>Department</th>
                    <th>Visit Date</th>
                    <th>Complaints</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myPatients.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily:'monospace', color:'var(--primary)', fontWeight: 600 }}>{r.ioId}</td>
                      <td>
                        <div style={{ fontWeight:600 }}>{r.patientName}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.patientNo}</div>
                      </td>
                      <td>{r.department}</td>
                      <td style={{ fontSize:12 }}>{r.dateVisit}</td>
                      <td style={{ fontSize:12, color:'var(--text-secondary)', maxWidth:160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.complaints}</td>
                      <td><span className="badge badge-success">Active</span></td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelected(r); setTab('complaint'); }}>
                          <FileText size={13}/> Consult
                        </button>
                      </td>
                    </tr>
                  ))}
                  {myPatients.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                        No patients registered in the queue today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:760 }}>
              <div className="modal-header">
                <div>
                  <h3>Consultation — {selected.ioId}</h3>
                  <p style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{selected.patientName} · {selected.department}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div style={{ display:'flex', borderBottom:'1px solid var(--surface-border)', padding:'0 24px', gap:4, overflowX:'auto' }}>
                {clinicTabs.map(t => (
                  <button 
                    key={t.key} 
                    onClick={() => setTab(t.key)}
                    style={{ 
                      padding:'12px 14px', 
                      border:'none', 
                      background:'none', 
                      cursor:'pointer', 
                      fontSize:12.5, 
                      fontWeight:tab===t.key?700:500, 
                      color:tab===t.key?'var(--primary)':'var(--text-secondary)', 
                      borderBottom:tab===t.key?'2px solid var(--primary)':'2px solid transparent' 
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="modal-body">
                {tab === 'complaint' && (
                  <div>
                    <div className="form-group"><label className="form-label">Chief Complaints</label><textarea className="form-control" rows={3} defaultValue={selected.complaints} /></div>
                    <div className="form-group"><label className="form-label">History of Present Illness</label><textarea className="form-control" rows={3} placeholder="Enter history..." /></div>
                    <div className="form-group"><label className="form-label">Physical Examination</label><textarea className="form-control" rows={3} placeholder="Examination findings..." /></div>
                    <button className="btn btn-primary btn-sm">Save</button>
                  </div>
                )}
                {tab === 'vitals' && (
                  <div className="grid-3" style={{ gap: 14 }}>
                    {[['Blood Pressure','120/80 mmHg'],['Temperature','98.4°F'],['Pulse','72 bpm'],['SpO2','98%'],['Weight','65 kg'],['Height','170 cm']].map(([k,v]) => (
                      <div key={k} style={{ background:'rgba(92, 84, 243, 0.04)', borderRadius:8, padding:14, border: '1px solid var(--surface-border)' }}>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{k}</div>
                        <div style={{ fontSize:18, fontWeight:800, color:'var(--primary)', marginTop:4 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
                {tab === 'diagnosis' && (
                  <div>
                    <div className="form-group"><label className="form-label">Provisional Diagnosis</label><textarea className="form-control" rows={3} defaultValue={selected.diagnosis} /></div>
                    <div className="form-group"><label className="form-label">Final Diagnosis</label><textarea className="form-control" rows={3} placeholder="Enter final diagnosis..." /></div>
                    <button className="btn btn-primary btn-sm">Save Diagnosis</button>
                  </div>
                )}
                {tab === 'medication' && (
                  <div>
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Dosage</th>
                            <th>Route</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><input className="form-control" placeholder="Medicine name" style={{ minWidth:180 }}/></td>
                            <td><input className="form-control" placeholder="1 tab"/></td>
                            <td><select className="form-control"><option>Oral</option><option>IV</option><option>IM</option></select></td>
                            <td><select className="form-control"><option>OD</option><option>BID</option><option>TID</option></select></td>
                            <td><input className="form-control" placeholder="5 days"/></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button className="btn btn-secondary btn-sm">+ Add Medicine</button>
                      <button className="btn btn-primary btn-sm">Save Prescription</button>
                    </div>
                  </div>
                )}
                {tab === 'lab' && (
                  <div>
                    <div style={{ marginBottom:16 }}>
                      {[['CBC (Complete Blood Count)','Normal'],['Blood Glucose (Fasting)','95 mg/dL'],['Serum Creatinine','0.9 mg/dL']].map(([t,v]) => (
                        <div key={t} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--surface-border)' }}>
                          <span style={{ fontSize:13 }}>{t}</span>
                          <span style={{ fontWeight:600, color:'var(--success)' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-secondary btn-sm">+ Request Lab Test</button>
                  </div>
                )}
                {tab === 'history' && (
                  <div>
                    <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:12 }}>Previous consultation records for <strong>{selected.patientName}</strong></p>
                    {[{ date:'2026-05-26', type:'OPD', diagnosis:selected.diagnosis || 'Active Case', doctor:selected.doctor || 'Dr. Rajesh' }].map((h,i) => (
                      <div key={i} style={{ background:'rgba(92, 84, 243, 0.04)', borderRadius:8, padding:14, marginBottom:10, border: '1px solid var(--surface-border)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontWeight:600, color: 'var(--text)' }}>{h.diagnosis}</span>
                          <span style={{ fontSize:12, color:'var(--text-muted)' }}>{h.date}</span>
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>{h.type} · {h.doctor}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
