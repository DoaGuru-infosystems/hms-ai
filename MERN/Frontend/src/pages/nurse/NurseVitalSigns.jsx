import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function NurseVitalSigns({ user }) {
  const [form, setForm] = useState({ patient:'', bp:'', temp:'', pulse:'', resp:'', spo2:'', weight:'', note:'' });
  const [saved, setSaved] = useState(false);
  const [ipdList, setIpdList] = useState([]);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmittedPatients();
    fetchReadings();
  }, []);

  const fetchAdmittedPatients = () => {
    setLoading(true);
    fetch(`${API_BASE}/ipd`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIpdList(data.filter(r => r.status === 'Admitted'));
        }
      })
      .catch(err => console.log('Failed to fetch admitted patient lists:', err))
      .finally(() => setLoading(false));
  };

  const fetchReadings = () => {
    fetch(`${API_BASE}/nurse/vitals`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReadings(data);
        }
      })
      .catch(err => console.log('Failed to fetch vitals:', err));
  };

  const handleSave = e => {
    e.preventDefault();
    fetch(`${API_BASE}/nurse/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        by: user?.name || 'Sr. Mary D\'Souza'
      })
    })
      .then(res => res.json())
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setForm({ patient:'', bp:'', temp:'', pulse:'', resp:'', spo2:'', weight:'', note:'' });
        fetchReadings();
      })
      .catch(err => console.log('Failed to save vital signs:', err));
  };

  return (
    <div>
      <Topbar title="Nurse — Vital Signs" user={user?.name} />
      <div className="page-body">
        <div className="page-header"><div><h2>Vital Signs</h2><p>Record patient vital measurements</p></div></div>
        {saved && <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#34d399' }}>✓ Vital signs recorded!</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Patient Registries...</h4>
          </div>
        ) : (
          <div className="grid-2" style={{ alignItems:'start' }}>
            <div className="card">
              <div className="section-title"><span></span>Record New Vital Signs</div>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Select Patient (IPD)</label>
                  <select className="form-control" value={form.patient} onChange={e => setForm({...form, patient:e.target.value})} required>
                    <option value="">— Select Admitted Patient —</option>
                    {ipdList.map(r => <option key={r.id} value={r.id}>{r.ioId} — {r.patientName}</option>)}
                  </select>
                </div>
                <div className="grid-2">
                  {[['bp','Blood Pressure (mmHg)','120/80'],['temp','Temperature (°F)','98.6'],['pulse','Pulse Rate (bpm)','72'],['resp','Respiratory Rate (/min)','18'],['spo2','SpO2 (%)','98'],['weight','Weight (kg)','65']].map(([k,l,ph]) => (
                    <div key={k} className="form-group">
                      <label className="form-label">{l}</label>
                      <input className="form-control" placeholder={ph} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} />
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <textarea className="form-control" rows={2} value={form.note} onChange={e => setForm({...form,note:e.target.value})} placeholder="Any observations..." />
                </div>
                <button type="submit" className="btn btn-primary"><Save size={14}/> Save Vital Signs</button>
              </form>
            </div>
            <div className="card">
              <div className="section-title"><span></span>Recent Readings</div>
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {readings.map(r => {
                  const patientObj = ipdList.find(i => String(i.id) === String(r.patient) || String(i.ioId) === String(r.patient));
                  const patientName = patientObj ? patientObj.patientName : r.patient;
                  const ipdNo = patientObj ? patientObj.ioId : 'IPD Patient';
                  return (
                    <div key={r.id} style={{ background:'var(--bg-primary)', borderRadius:8, padding:16, marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                        <div><div style={{ fontWeight:700 }}>{patientName}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>{ipdNo} · {new Date(r.date).toLocaleString()}</div></div>
                        <span style={{ fontSize:11, color:'var(--accent-light)' }}>By: {r.by}</span>
                      </div>
                      <div className="grid-3" style={{ gap:8 }}>
                        {[['BP', r.bp+' mmHg'],['Temp', r.temp+'°F'],['Pulse', r.pulse+' bpm'],['Resp', r.resp+'/min'],['SpO2', r.spo2+'%'],['Weight', r.weight+' kg']].map(([k,v]) => (
                          <div key={k} style={{ background:'var(--bg-card)', borderRadius:6, padding:'8px 10px' }}>
                            <div style={{ fontSize:10, color:'var(--text-muted)' }}>{k}</div>
                            <div style={{ fontWeight:700, color:'var(--accent-light)', fontSize:13 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {readings.length === 0 && (
                  <p style={{ color:'var(--text-muted)', textAlign:'center', marginTop:20 }}>No vital signs recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
