import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function NurseProgressNote({ user }) {
  const [patient, setPatient] = useState('');
  const [form, setForm] = useState({ note:'' });
  const [saved, setSaved] = useState(false);
  const [ipdList, setIpdList] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/ipd`).then(res => res.json()),
      fetch(`${API_BASE}/nurse/progress-note`).then(res => res.json())
    ])
      .then(([ipdData, notesData]) => {
        if (Array.isArray(ipdData)) {
          setIpdList(ipdData.filter(r => r.status === 'Admitted'));
        }
        if (Array.isArray(notesData)) {
          setNotes(notesData);
        }
      })
      .catch(err => console.log('Failed to fetch progress notes assets:', err))
      .finally(() => setLoading(false));
  }, []);

  const fetchNotes = () => {
    fetch(`${API_BASE}/nurse/progress-note`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotes(data);
      })
      .catch(err => console.log('Failed to load progress notes:', err));
  };

  const handleSave = e => {
    e.preventDefault();
    if (!patient || !form.note) return alert('Fill all fields.');

    fetch(`${API_BASE}/nurse/progress-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient,
        note: form.note,
        by: user?.name || 'Sr. Mary D\'Souza'
      })
    })
      .then(res => res.json())
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setForm({ note:'' });
        fetchNotes();
      })
      .catch(err => console.log('Failed to save progress note:', err));
  };

  return (
    <div>
      <Topbar title="Nurse — Progress Note" user={user?.name} />
      <div className="page-body">
        <div className="page-header"><div><h2>Nurse Progress Note</h2><p>Document patient condition updates</p></div></div>
        {saved && <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#34d399' }}>✓ Progress note saved!</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Patient List...</h4>
          </div>
        ) : (
          <div className="grid-2" style={{ alignItems:'start' }}>
            <div className="card">
              <div className="section-title"><span></span>Add New Progress Note</div>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Select Patient</label>
                  <select className="form-control" value={patient} onChange={e => setPatient(e.target.value)} required>
                    <option value="">— Select Admitted Patient —</option>
                    {ipdList.map(r=><option key={r.id} value={r.id}>{r.ioId} — {r.patientName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date & Time</label>
                  <input type="datetime-local" className="form-control" defaultValue={new Date().toISOString().slice(0,16)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Progress Note *</label>
                  <textarea className="form-control" rows={6} value={form.note} onChange={e => setForm({note:e.target.value})} placeholder="Document patient's current condition, observations, and nursing care provided..." required />
                </div>
                <button type="submit" className="btn btn-primary"><Save size={14}/> Save Note</button>
              </form>
            </div>
            <div className="card">
              <div className="section-title"><span></span>Recent Progress Notes</div>
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {notes.map(n => {
                  const patientObj = ipdList.find(i => String(i.id) === String(n.patient) || String(i.ioId) === String(n.patient));
                  const patientName = patientObj ? patientObj.patientName : n.patient;
                  return (
                    <div key={n.id} style={{ background:'var(--bg-primary)', borderRadius:8, padding:16, marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <div style={{ fontWeight:700 }}>{patientName}</div>
                        <span style={{ fontSize:11, color:'var(--accent-light)' }}>By: {n.by}</span>
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>{new Date(n.date).toLocaleString()}</div>
                      <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{n.note}</p>
                    </div>
                  );
                })}
                {notes.length === 0 && (
                  <p style={{ color:'var(--text-muted)', textAlign:'center', marginTop:20 }}>No progress notes found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
