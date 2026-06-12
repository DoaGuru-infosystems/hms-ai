import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function NurseRoomTransfer({ user }) {
  const [form, setForm] = useState({ patient: '', reason: '' });
  const [saved, setSaved] = useState(false);
  const [ipdList, setIpdList] = useState([]);
  const [roomsCatalog, setRoomsCatalog] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Room & Bed Selection States
  const [roomFilter, setRoomFilter] = useState('');
  const [bedFilter, setBedFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);

  const refreshData = () => {
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
          const mappedRooms = roomsData.map(r => {
            const occupiedCount = (Array.isArray(ipdData) ? ipdData : []).filter(p => {
              if (p.status !== 'Admitted') return false;
              if (!p.room || !r.name) return false;
              const pRoomStr = p.room.toString().toLowerCase().replace('room', '').trim();
              const sRoomStr = r.name.toString().toLowerCase().replace('room', '').trim();
              return pRoomStr === sRoomStr;
            }).length;
            return {
              ...r,
              vacantBeds: Math.max(0, r.totalBeds - occupiedCount)
            };
          });
          setRoomsCatalog(mappedRooms);
        }
        if (Array.isArray(transferData)) {
          setTransfers(transferData);
        }
      })
      .catch(err => console.log('Failed to fetch rooms and patients:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSave = e => {
    e.preventDefault();
    if (!form.patient) return alert('Select a patient.');
    if (!selectedRoom || !selectedBed) return alert('Select a destination room and bed.');

    const patientObj = ipdList.find(i => String(i.id) === String(form.patient) || String(i.ioId) === String(form.patient));
    const oldRoom = patientObj ? `${patientObj.room} / Bed ${patientObj.bed}` : 'Unknown Room';

    fetch(`${API_BASE}/nurse/room-transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient: form.patient,
        oldRoom,
        newRoom: `Room ${selectedRoom.name} / ${selectedBed.bedNo}`,
        reason: form.reason,
        by: user?.name || 'Sr. Mary D\'Souza'
      })
    })
      .then(res => res.json())
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setForm({ patient: '', reason: '' });
        setSelectedRoom(null);
        setSelectedBed(null);
        refreshData();
      })
      .catch(err => console.log('Failed to save room transfer:', err));
  };

  const selectedPatientObj = ipdList.find(i => String(i.id) === String(form.patient));
  const currentRoomBed = selectedPatientObj ? `${selectedPatientObj.room} / Bed ${selectedPatientObj.bed}` : 'No patient selected';

  const filteredRooms = roomsCatalog.filter(r => !roomFilter || r.id.toString() === roomFilter);

  const generatedBeds = selectedRoom ? (() => {
    const total = selectedRoom.totalBeds || 10;
    const list = [];
    for (let i = 1; i <= total; i++) {
      const bedNo = `RM-${selectedRoom.name}-${i.toString().padStart(2, '0')}`;
      const isOccupied = ipdList.some(p => {
        // Room check: Must match selected room name (case-insensitive and trimmed)
        if (!p.room || !selectedRoom.name) return false;
        const pRoomStr = p.room.toString().toLowerCase().replace('room', '').trim();
        const sRoomStr = selectedRoom.name.toString().toLowerCase().replace('room', '').trim();
        if (pRoomStr !== sRoomStr) return false;

        // Bed check:
        // 1. Direct match with current generated bed name (e.g. "RM-ICU-A-01")
        if (p.bed === bedNo) return true;
        
        // 2. Match with alternative format (e.g. "Bed ICU-A-1")
        const altBedName = `Bed ${selectedRoom.name}-${i}`;
        if (p.bed === altBedName) return true;

        // 3. Extract numeric index from p.bed and compare with i
        let bedIndex = null;
        if (p.bed) {
          const matchIndex = p.bed.match(/-0*(\d+)$/) || p.bed.match(/Bed\s+0*(\d+)$/i) || p.bed.match(/^0*(\d+)$/);
          if (matchIndex) {
            bedIndex = parseInt(matchIndex[1], 10);
          }
        }
        return bedIndex === i;
      });

      list.push({
        id: `${selectedRoom.id}-${i}`,
        bedNo,
        status: isOccupied ? 'Occupied' : 'Vacant'
      });
    }
    return list;
  })() : [];

  const filteredBeds = generatedBeds.filter(b => {
    if (bedFilter === 'occupied') return b.status === 'Occupied';
    if (bedFilter === 'unoccupied') return b.status === 'Vacant';
    return true;
  });

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
          <div className="grid-3" style={{ alignItems:'start', gap: 16 }}>
            {/* Column 1: Transfer Details */}
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
                  <label className="form-label">Current Room & Bed</label>
                  <input className="form-control" value={currentRoomBed} readOnly style={{ opacity: 0.7 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Transfer To Room</label>
                  <input className="form-control" value={selectedRoom ? `${selectedRoom.name} (${selectedRoom.category})` : ''} readOnly placeholder="Click a room to select" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Bed No.</label>
                  <input className="form-control" value={selectedBed ? selectedBed.bedNo : ''} readOnly placeholder="Click a bed to select" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason for Transfer</label>
                  <textarea className="form-control" rows={3} value={form.reason} onChange={e => setForm({...form,reason:e.target.value})} placeholder="Enter reason..." />
                </div>
                <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}><Save size={14}/> Save Transfer</button>
              </form>
            </div>

            {/* Column 2: Room & Bed Selector */}
            <div className="card">
              <div className="section-title"><span></span>Select Room & Bed</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                <select className="form-control" value={roomFilter} onChange={e => { setRoomFilter(e.target.value); setSelectedRoom(null); setSelectedBed(null); }}>
                  <option value="">All Room Types</option>
                  {roomsCatalog.map(r => <option key={r.id} value={r.id.toString()}>{r.category} ({r.name})</option>)}
                </select>
                <select className="form-control" value={bedFilter} onChange={e => setBedFilter(e.target.value)}>
                  <option value="all">All Beds</option>
                  <option value="occupied">Occupied Beds</option>
                  <option value="unoccupied">Unoccupied Beds</option>
                </select>
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>Rooms</div>
              <div className="table-wrapper" style={{ marginBottom:16, maxHeight: '200px', overflowY: 'auto' }}>
                <table>
                  <thead><tr><th>Status</th><th>Room No.</th><th>Type</th><th>Free</th></tr></thead>
                  <tbody>{filteredRooms.map(r => (
                    <tr key={r.id} style={{ cursor:'pointer', background: selectedRoom?.id===r.id ? 'rgba(99,102,241,0.15)' : '' }} onClick={() => { setSelectedRoom(r); setSelectedBed(null); }}>
                      <td><span className={`badge ${r.vacantBeds>0?'badge-success':'badge-danger'}`} style={{ padding: '2px 6px', fontSize: 10 }}>{r.vacantBeds>0?'Available':'Full'}</span></td>
                      <td>{r.name}</td><td>{r.category}</td><td>{r.vacantBeds}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>Beds {selectedRoom ? `— Room ${selectedRoom.name}` : ''}</div>
              <div className="table-wrapper" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table>
                  <thead><tr><th>Select</th><th>Bed No.</th><th>Status</th></tr></thead>
                  <tbody>
                    {selectedRoom ? (
                      filteredBeds.map(b => (
                        <tr key={b.id}>
                          <td>
                            {b.status === 'Vacant' && <button type="button" className="btn btn-primary btn-sm" onClick={() => setSelectedBed(b)} style={{ padding: '2px 8px', fontSize: 11 }}>Select</button>}
                            {b.status === 'Occupied' && <span style={{ color:'var(--text-muted)', fontSize:11 }}>Occupied</span>}
                          </td>
                          <td style={{ fontFamily:'monospace', fontWeight:600, fontSize:12 }}>{b.bedNo}</td>
                          <td><span className={`badge ${b.status==='Vacant'?'badge-success':'badge-danger'}`} style={{ padding: '2px 6px', fontSize: 10 }}>{b.status}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="empty-state" style={{ fontSize:12, padding:12, textAlign: 'center' }}>Please click a room in the table above first</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column 3: Transfer History */}
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
                          <div key={k} style={{ minWidth: '45%' }}><div style={{ fontSize:11, color:'var(--text-muted)' }}>{k}</div><div style={{ fontSize:13, fontWeight:600 }}>{v}</div></div>
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
