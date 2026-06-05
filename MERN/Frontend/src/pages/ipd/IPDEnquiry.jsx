import { useState, useEffect } from 'react';
import { Eye, Pill, Activity, Thermometer, FileText, ArrowLeftRight, LogOut, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function IPDEnquiry({ user }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('All');
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIPDRecords();
  }, []);

  const fetchIPDRecords = () => {
    setLoading(true);
    fetch(`${API_BASE}/ipd`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecords(data);
        } else {
          setRecords([]);
        }
      })
      .catch(err => {
        console.error('Error fetching IPD records:', err);
        setRecords([]);
      })
      .finally(() => setLoading(false));
  };

  const filtered = records.filter(r => {
    const matchSearch = `${r.patientName || ''} ${r.ioId || ''} ${r.doctor || ''} ${r.department || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'All' || r.status === tab;
    return matchSearch && matchTab;
  });

  const clinicalTabs = [
    { key:'info', label:'Patient Info', icon: FileText },
    { key:'vital', label:'Vital Signs', icon: Thermometer },
    { key:'medication', label:'Medication', icon: Pill },
    { key:'progress', label:'Progress Note', icon: Activity },
    { key:'transfer', label:'Room Transfer', icon: ArrowLeftRight },
    { key:'discharge', label:'Discharge Summary', icon: LogOut },
  ];

  return (
    <div>
      <Topbar title="In-Patient Enquiry" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div><h2>In-Patient Enquiry</h2><p>All admitted patient records</p></div>
          <div className="page-actions">
            <div className="search-bar"><input placeholder="Search IPD records..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 16 }}>
          {['All','Admitted','Discharged'].map(t => <button key={t} className={`tab${tab===t?' active':''}`} onClick={() => setTab(t)}>{t}</button>)}
        </div>

        <div className="card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40, gap: 10, color: 'var(--text-secondary)' }}>
              <Loader2 className="animate-spin" size={18} />
              Loading inpatient records...
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>IPD No.</th><th>Patient</th><th>Doctor</th><th>Dept.</th><th>Admitted</th><th>Room/Bed</th><th>Diagnosis</th><th>Status</th><th></th></tr></thead>
                <tbody>{filtered.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily:'monospace', color:'var(--accent-light)' }}>{r.ioId}</td>
                    <td><div style={{ fontWeight:600 }}>{r.patientName}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.patientNo}</div></td>
                    <td>{r.doctor}</td><td>{r.department}</td>
                    <td style={{ fontSize:12 }}>{r.dateAdmit}</td>
                    <td style={{ fontFamily:'monospace', fontSize:12 }}>{r.room} / {r.bed}</td>
                    <td style={{ fontSize:12, maxWidth:140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.diagnosis}</td>
                    <td><span className={`badge ${r.status==='Admitted'?'badge-info':'badge-success'}`}>{r.status}</span></td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => { setSelected(r); setActiveTab('info'); }}><Eye size={14}/></button></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="empty-state">No IPD records found</td></tr>
                )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:720 }}>
              <div className="modal-header">
                <div>
                  <h3>IPD Record — {selected.ioId}</h3>
                  <p style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{selected.patientName} · {selected.department}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 24px', gap:4, overflowX:'auto' }}>
                {clinicalTabs.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    style={{ padding:'10px 14px', border:'none', background:'none', cursor:'pointer', fontSize:12, fontWeight:activeTab===t.key?700:500, color:activeTab===t.key?'var(--accent-light)':'var(--text-secondary)', borderBottom:activeTab===t.key?'2px solid var(--accent)':'2px solid transparent', display:'flex', alignItems:'center', gap:6 }}>
                    <t.icon size={13}/> {t.label}
                  </button>
                ))}
              </div>
              <div className="modal-body">
                {activeTab === 'info' && (
                  <div>{[['IPD No.',selected.ioId],['Patient',selected.patientName],['Patient No.',selected.patientNo],['Doctor Incharge',selected.doctor],['Department',selected.department],['Date Admitted',selected.dateAdmit],['Room Assigned',selected.room],['Bed Assigned',selected.bed],['Admitting Diagnosis',selected.diagnosis],['Current Status',selected.status]].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ color:'var(--text-secondary)', fontSize:13 }}>{k}</span><span style={{ fontWeight:600, fontSize:13 }}>{v}</span>
                    </div>
                  ))}</div>
                )}
                {activeTab === 'vital' && (
                  <div className="grid-2" style={{ gap:12 }}>
                    {[['Blood Pressure','120/80 mmHg'],['Temperature','98.4°F'],['Pulse Rate','72 bpm'],['Respiratory Rate','18/min'],['Oxygen Saturation','99%'],['Weight','67 kg']].map(([k,v]) => (
                      <div key={k} style={{ background:'var(--bg-primary)', borderRadius:8, padding:'14px 16px' }}>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{k}</div>
                        <div style={{ fontSize:20, fontWeight:800, color:'var(--accent-light)', marginTop:4 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'medication' && (
                  <div>
                    <table><thead><tr><th>Medicine</th><th>Dosage</th><th>Route</th><th>Frequency</th><th>Status</th></tr></thead>
                    <tbody>
                      {[['Paracetamol 500mg','1 tablet','Oral','TID','Active'],['Amoxicillin 500mg','1 capsule','Oral','BID','Active'],['Normal Saline 0.9%','500ml','IV','Q8H','Completed']].map(([m,d,r,f,st]) => (
                        <tr key={m}><td>{m}</td><td>{d}</td><td>{r}</td><td>{f}</td><td><span className="badge badge-success">{st}</span></td></tr>
                      ))}
                    </tbody></table>
                  </div>
                )}
                {activeTab === 'progress' && (
                  <div>
                    {[{ date: selected.dateAdmit, note:'Patient admitted to ward. Initiated IV fluids and baseline diagnostic tracking.', nurse:'Sr. Incharge' }].map((n,i) => (
                      <div key={i} style={{ background:'var(--bg-primary)', borderRadius:8, padding:16, marginBottom:12 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontWeight:600 }}>{n.date}</span><span style={{ fontSize:12, color:'var(--text-muted)' }}>By: {n.nurse}</span>
                        </div>
                        <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{n.note}</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'transfer' && (
                  <div className="empty-state"><ArrowLeftRight size={40}/><p style={{ marginTop:12 }}>No room transfers recorded for this patient.</p></div>
                )}
                {activeTab === 'discharge' && (
                  <div>
                    {selected.status === 'Discharged' ? (
                      <div>{[['Discharge Date',selected.dateAdmit],['Final Diagnosis',selected.diagnosis],['Condition at Discharge','Improved'],['Doctor',selected.doctor]].map(([k,v]) => (
                        <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                          <span style={{ color:'var(--text-secondary)', fontSize:13 }}>{k}</span><span style={{ fontWeight:600 }}>{v}</span>
                        </div>
                      ))}</div>
                    ) : (
                      <div className="empty-state"><LogOut size={40}/><p style={{ marginTop:12 }}>Patient is still admitted. Discharge summary not yet generated.</p></div>
                    )}
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
