import { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function DoctorIPD({ user }) {
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('progress');
  const [admitted, setAdmitted] = useState([]);
  const [loading, setLoading] = useState(true);

  const [vitals, setVitals] = useState([]);
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    fetchAdmitted();
  }, []);

  useEffect(() => {
    if (selected) {
      // Fetch vitals
      fetch(`${API_BASE}/nurse/vitals`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const pVitals = data.filter(v => String(v.patient) === String(selected.id) || String(v.patient) === String(selected.ioId));
            setVitals(pVitals);
          }
        })
        .catch(err => console.log('Failed to fetch patient vitals:', err));

      // Fetch medications
      fetch(`${API_BASE}/nurse/medication`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const pMeds = data.filter(m => String(m.patient) === String(selected.id) || String(m.patient) === String(selected.ioId));
            setMedications(pMeds);
          }
        })
        .catch(err => console.log('Failed to fetch patient meds:', err));
    }
  }, [selected]);

  const fetchAdmitted = () => {
    setLoading(true);
    fetch(`${API_BASE}/ipd`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAdmitted(data.filter(r => r.status === 'Admitted'));
        } else {
          setAdmitted([]);
        }
      })
      .catch(err => {
        console.error('Failed to load doctor IPD roster:', err);
        setAdmitted([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const clinicTabs = [
    { key:'progress', label:'Progress Note' },
    { key:'vitals', label:'Vital Signs' },
    { key:'medication', label:'Medication' },
    { key:'diagnosis', label:'Diagnosis' },
    { key:'lab', label:'Laboratory' },
    { key:'operation', label:'Operation Theater' },
    { key:'discharge', label:'Discharge Summary' },
  ];

  return (
    <div>
      <Topbar title="Doctor — In-Patient" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>IPD Ward Roster</h2>
            <p>Manage in-patient clinical records</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Admitted Inpatients...</h4>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>IPD No.</th>
                    <th>Patient</th>
                    <th>Department</th>
                    <th>Admitted</th>
                    <th>Room/Bed</th>
                    <th>Diagnosis</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admitted.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily:'monospace', color:'var(--primary)', fontWeight: 600 }}>{r.ioId}</td>
                      <td>
                        <div style={{ fontWeight:600 }}>{r.patientName}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.patientNo}</div>
                      </td>
                      <td>{r.department}</td>
                      <td style={{ fontSize:12 }}>{r.dateAdmit}</td>
                      <td style={{ fontFamily:'monospace', fontSize:12 }}>Rm {r.room} / {r.bed}</td>
                      <td style={{ fontSize:12, maxWidth:130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.diagnosis}</td>
                      <td><span className="badge badge-info">Admitted</span></td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelected(r); setTab('progress'); }}>
                          <FileText size={13}/> Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                  {admitted.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                        No patients currently admitted in the wards.
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
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:800 }}>
              <div className="modal-header">
                <div>
                  <h3>{selected.patientName} — {selected.ioId}</h3>
                  <p style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>Room {selected.room} · Bed {selected.bed} · {selected.department}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div style={{ display:'flex', borderBottom:'1px solid var(--surface-border)', padding:'0 24px', gap:2, overflowX:'auto', flexWrap:'wrap' }}>
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
                      borderBottom:tab===t.key?'2px solid var(--primary)':'2px solid transparent', 
                      whiteSpace:'nowrap' 
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="modal-body">
                {tab === 'progress' && (
                  <div>
                    <div className="form-group"><label className="form-label">Doctor's Progress Note</label><textarea className="form-control" rows={5} placeholder="Enter daily progress note..." /></div>
                    <div className="form-group"><label className="form-label">Plan / Orders</label><textarea className="form-control" rows={3} placeholder="Enter clinical plan..." /></div>
                    <button className="btn btn-primary btn-sm">Save Progress Note</button>
                  </div>
                )}
                {tab === 'vitals' && (
                  <div>
                    {vitals.length > 0 ? (
                      <div className="grid-3" style={{ gap: 14 }}>
                        {[['Blood Pressure', vitals[vitals.length-1].bp + ' mmHg'],
                          ['Temperature', vitals[vitals.length-1].temp + '°F'],
                          ['Pulse', vitals[vitals.length-1].pulse + ' bpm'],
                          ['SpO2', vitals[vitals.length-1].spo2 + '%'],
                          ['Respiratory Rate', vitals[vitals.length-1].resp + '/min'],
                          ['Weight', vitals[vitals.length-1].weight + ' kg']].map(([k,v]) => (
                          <div key={k} style={{ background:'rgba(92, 84, 243, 0.04)', borderRadius:8, padding:14, border: '1px solid var(--surface-border)' }}>
                            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{k}</div>
                            <div style={{ fontSize:18, fontWeight:800, color:'var(--primary)', marginTop:4 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No vitals recorded by nurse yet.</p>
                    )}
                  </div>
                )}
                {tab === 'diagnosis' && (
                  <div>
                    <div className="form-group"><label className="form-label">Provisional Diagnosis</label><textarea className="form-control" rows={2} defaultValue={selected.diagnosis} /></div>
                    <div className="form-group"><label className="form-label">Final Diagnosis</label><textarea className="form-control" rows={2} placeholder="Final diagnosis..." /></div>
                    <button className="btn btn-primary btn-sm">Save</button>
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
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medications.map((m, idx) => (
                            <tr key={idx}>
                              <td>{m.medName}</td>
                              <td>{m.dose}</td>
                              <td>{m.route}</td>
                              <td><span className="badge badge-purple">{m.freq}</span></td>
                              <td style={{ fontSize: 12 }}>{new Date(m.date).toLocaleString()}</td>
                            </tr>
                          ))}
                          {medications.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text-muted)' }}>No medications administered yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {tab === 'lab' && (
                  <div>
                    {[['CBC','Pending'],['Urinalysis','Normal'],['Chest X-Ray','Clear']].map(([t,v]) => (
                      <div key={t} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--surface-border)' }}><span>{t}</span><span className={`badge ${v==='Pending'?'badge-warning':'badge-success'}`}>{v}</span></div>
                    ))}
                    <button className="btn btn-secondary btn-sm" style={{ marginTop:12 }}>+ Request Lab Test</button>
                  </div>
                )}
                {tab === 'operation' && (
                  <div>
                    <div className="form-group"><label className="form-label">Operation Procedure</label><input className="form-control" placeholder="e.g. Appendectomy" /></div>
                    <div className="grid-2">
                      <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" /></div>
                      <div className="form-group"><label className="form-label">Time</label><input type="time" className="form-control" /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Anesthesiologist</label><input className="form-control" placeholder="Name" /></div>
                    <div className="form-group"><label className="form-label">Surgeon Notes</label><textarea className="form-control" rows={3} placeholder="Pre-operative notes..." /></div>
                    <button className="btn btn-primary btn-sm">Schedule Operation</button>
                  </div>
                )}
                {tab === 'discharge' && (
                  <div>
                    <div className="form-group"><label className="form-label">Final Diagnosis</label><textarea className="form-control" rows={2} defaultValue={selected.diagnosis} /></div>
                    <div className="form-group"><label className="form-label">Discharge Instructions</label><textarea className="form-control" rows={3} placeholder="Diet, activity, medications at home..." /></div>
                    <div className="form-group"><label className="form-label">Follow-up</label><input className="form-control" placeholder="e.g. 2 weeks post-discharge" /></div>
                    <button className="btn btn-primary btn-sm">Generate Discharge Summary</button>
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
