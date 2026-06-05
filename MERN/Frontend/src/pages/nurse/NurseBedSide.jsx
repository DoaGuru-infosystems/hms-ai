import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function NurseBedSide({ user }) {
  const [patient, setPatient] = useState('');
  const [form, setForm] = useState({ procedure:'', date:'', time:'', findings:'', outcome:'' });
  const [saved, setSaved] = useState(false);
  const [ipdList, setIpdList] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const procedures = ['Wound Dressing','Catheter Care','IV Line Care','Nasogastric Tube Care','Suctioning','Positioning','Oral Care','Perineal Care','Bed Bath'];

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/ipd`).then(res => res.json()),
      fetch(`${API_BASE}/nurse/bed-side`).then(res => res.json())
    ])
      .then(([ipdData, bedsideData]) => {
        if (Array.isArray(ipdData)) {
          setIpdList(ipdData.filter(r => r.status === 'Admitted'));
        }
        if (Array.isArray(bedsideData)) {
          setHistory(bedsideData);
        }
      })
      .catch(err => console.log('Failed to fetch admitted patient lists:', err))
      .finally(() => setLoading(false));
  }, []);

  const fetchHistory = () => {
    fetch(`${API_BASE}/nurse/bed-side`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(err => console.log('Failed to load bedside history:', err));
  };

  const handleSave = e => {
    e.preventDefault();
    if (!patient) return alert('Select a patient.');
    
    fetch(`${API_BASE}/nurse/bed-side`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient,
        procedureName: form.procedure,
        note: `Findings: ${form.findings || ''} | Outcome: ${form.outcome || ''}`,
        by: user?.name || 'Sr. Mary D\'Souza'
      })
    })
      .then(res => res.json())
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setForm({ procedure:'', date:'', time:'', findings:'', outcome:'' });
        fetchHistory();
      })
      .catch(err => console.log('Failed to save procedure:', err));
  };

  return (
    <div>
      <Topbar title="Nurse — Bed Side Procedure" user={user?.name} />
      <div className="page-body">
        <div className="page-header"><div><h2>Bed Side Procedure</h2><p>Record bedside nursing procedures performed</p></div></div>
        {saved && <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#34d399' }}>✓ Procedure recorded!</div>}
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Patients...</h4>
          </div>
        ) : (
          <div className="grid-2" style={{ alignItems:'start' }}>
            <div className="card">
              <div className="section-title"><span></span>Record Procedure</div>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Patient</label>
                  <select className="form-control" value={patient} onChange={e => setPatient(e.target.value)} required>
                    <option value="">— Select Admitted Patient —</option>
                    {ipdList.map(r=><option key={r.id} value={r.id}>{r.ioId} — {r.patientName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Procedure Type</label>
                  <select className="form-control" value={form.procedure} onChange={e => setForm({...form,procedure:e.target.value})} required>
                    <option value="">— Select Procedure —</option>
                    {procedures.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" value={form.date} onChange={e => setForm({...form,date:e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Time</label><input type="time" className="form-control" value={form.time} onChange={e => setForm({...form,time:e.target.value})} /></div>
                </div>
                <div className="form-group"><label className="form-label">Findings / Observations</label><textarea className="form-control" rows={3} value={form.findings} onChange={e => setForm({...form,findings:e.target.value})} placeholder="Document findings..." /></div>
                <div className="form-group"><label className="form-label">Outcome / Patient Response</label><textarea className="form-control" rows={2} value={form.outcome} onChange={e => setForm({...form,outcome:e.target.value})} placeholder="Patient tolerated well..." /></div>
                <button type="submit" className="btn btn-primary"><Save size={14}/> Save</button>
              </form>
            </div>
            <div className="card">
              <div className="section-title"><span></span>Procedure History</div>
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {history.map((h,i) => {
                  const patientObj = ipdList.find(item => String(item.id) === String(h.patient) || String(item.ioId) === String(h.patient));
                  const patientName = patientObj ? patientObj.patientName : h.patient;
                  return (
                    <div key={i} style={{ background:'var(--bg-primary)', borderRadius:8, padding:16, marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span style={{ fontWeight:700 }}>{patientName}</span><span style={{ fontSize:11, color:'var(--accent-light)' }}>By: {h.by}</span></div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>{h.procedureName} · {new Date(h.date).toLocaleString()}</div>
                      <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{h.note}</div>
                    </div>
                  );
                })}
                {history.length === 0 && (
                  <p style={{ color:'var(--text-muted)', textAlign:'center', marginTop:20 }}>No procedure history found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
