import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function NurseRoomTransfer({ user }) {
  const [form, setForm] = useState({ patient:'', fromRoom:'', toRoom:'', toBed:'', reason:'' });
  const [saved, setSaved] = useState(false);
  const [ipdList, setIpdList] = useState([]);
  const [roomsCatalog, setRoomsCatalog] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/ipd`).then(res => res.json()),
      fetch(`${API_BASE}/rooms`).then(res => res.json()),
      fetch(`${API_BASE}/nurse/room-transfer`).then(res => res.json())
    ])
      .then(([ipdData, roomsData, transferData]) => {
        if (Array.isArray(ipdData)) {
          setIpdList(ipdData.filter(r => r.status === 'Admitted'));
        }
        if (Array.isArray(roomsData)) {
          setRoomsCatalog(roomsData);
        }
        if (Array.isArray(transferData)) {
          setTransfers(transferData);
        }
      })
      .catch(err => console.log('Failed to fetch rooms and patients:', err))
      .finally(() => setLoading(false));
  }, []);

  const fetchTransfers = () => {
    fetch(`${API_BASE}/nurse/room-transfer`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTransfers(data);
      })
      .catch(err => console.log('Failed to load transfers:', err));
  };

  const handleSave = e => {
    e.preventDefault();
    if (!form.patient) return alert('Select a patient.');

    const patientObj = ipdList.find(i => String(i.id) === String(form.patient) || String(i.ioId) === String(form.patient));
    const oldRoom = patientObj ? `${patientObj.room} / Bed ${patientObj.bed}` : 'Unknown Room';

    fetch(`${API_BASE}/nurse/room-transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient: form.patient,
        oldRoom,
        newRoom: `Room ${form.toRoom} / Bed ${form.toBed}`,
        reason: form.reason,
        by: user?.name || 'Sr. Mary D\'Souza'
      })
    })
      .then(res => res.json())
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setForm({ patient:'', fromRoom:'', toRoom:'', toBed:'', reason:'' });
        fetchTransfers();
      })
      .catch(err => console.log('Failed to save room transfer:', err));
  };

  return (
    <div>
      <Topbar title="Nurse — IP Room Transfer" user={user?.name} />
      <div className="page-body">
        <div className="page-header"><div><h2>IP Room Transfer</h2><p>Transfer admitted patient to another room/bed</p></div></div>
        {saved && <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#34d399' }}>✓ Room transfer recorded!</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Ward Layouts...</h4>
          </div>
        ) : (
          <div className="grid-2" style={{ alignItems:'start' }}>
            <div className="card">
              <div className="section-title"><span></span>New Room Transfer</div>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Select Patient</label>
                  <select className="form-control" value={form.patient} onChange={e => setForm({...form,patient:e.target.value})} required>
                    <option value="">— Select Admitted Patient —</option>
                    {ipdList.map(r=><option key={r.id} value={r.id}>{r.ioId} — {r.patientName} (Room {r.room})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Transfer To Room</label>
                  <select className="form-control" value={form.toRoom} onChange={e => setForm({...form,toRoom:e.target.value})}>
                    <option value="">— Select Room —</option>
                    {roomsCatalog.map(r => <option key={r.id} value={r.name}>Room {r.name} — {r.category} (Floor {r.floor})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bed No.</label>
                  <input className="form-control" placeholder="e.g. B-205" value={form.toBed} onChange={e => setForm({...form,toBed:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason for Transfer</label>
                  <textarea className="form-control" rows={3} value={form.reason} onChange={e => setForm({...form,reason:e.target.value})} placeholder="Enter reason..." />
                </div>
                <button type="submit" className="btn btn-primary"><Save size={14}/> Save Transfer</button>
              </form>
            </div>
            <div className="card">
              <div className="section-title"><span></span>Transfer History</div>
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {transfers.map(t => {
                  const patientObj = ipdList.find(i => String(i.id) === String(t.patient) || String(i.ioId) === String(t.patient));
                  const patientName = patientObj ? patientObj.patientName : t.patient;
                  return (
                    <div key={t.id} style={{ background:'var(--bg-primary)', borderRadius:8, padding:16, marginBottom:12 }}>
                      <div style={{ fontWeight:700, marginBottom:8 }}>{patientName}</div>
                      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                        {[['From', t.oldRoom],['To', t.newRoom],['Reason', t.reason],['Date', new Date(t.date).toLocaleString()],['By', t.by]].map(([k,v]) => (
                          <div key={k}><div style={{ fontSize:11, color:'var(--text-muted)' }}>{k}</div><div style={{ fontSize:13, fontWeight:600 }}>{v}</div></div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {transfers.length === 0 && (
                  <p style={{ color:'var(--text-muted)', textAlign:'center', marginTop:20 }}>No transfer history found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
