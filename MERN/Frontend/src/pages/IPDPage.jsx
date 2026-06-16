import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, ArrowLeftRight, Loader2 } from 'lucide-react';
import Topbar from '../components/Topbar';

export default function IPDPage({ user }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [ipdList, setIpdList] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const debounceTimer = useRef(null);

  // Ward Transfer States
  const [transferPatient, setTransferPatient] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [reason, setReason] = useState('Clinical Ward Transfer');
  const [savingTransfer, setSavingTransfer] = useState(false);

  const fetchIpd = useCallback((searchVal = '') => {
    const qs = searchVal ? `?search=${encodeURIComponent(searchVal)}` : '';
    fetch(`http://localhost:5001/api/ipd${qs}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setIpdList(data);
        else setIpdList([]);
      })
      .catch(err => {
        console.log('Failed to fetch IPD records.', err);
        setIpdList([]);
      });
  }, []);

  // Initial load + poll every 10s (unfiltered, for stats)
  useEffect(() => {
    fetchIpd();
    const interval = setInterval(() => fetchIpd(), 10000);
    return () => clearInterval(interval);
  }, [fetchIpd]);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchIpd(search), 400);
    return () => clearTimeout(debounceTimer.current);
  }, [search, fetchIpd]);

  const handleTransferSubmit = async () => {
    if (!selectedRoom || !selectedBed) return alert('Please select a room and bed.');
    
    setSavingTransfer(true);
    try {
      const oldRoom = `${transferPatient.room} / Bed ${transferPatient.bed}`;
      const newRoom = `Room ${selectedRoom.name} / ${selectedBed.bedNo}`;
      
      const res = await fetch('http://localhost:5001/api/nurse/room-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: transferPatient.ioId || transferPatient.patientNo,
          oldRoom,
          newRoom,
          reason,
          by: user?.name || 'Receptionist'
        })
      });
      
      if (!res.ok) throw new Error('Failed to submit transfer.');
      
      alert('Ward transfer completed and recorded successfully.');
      setTransferPatient(null);
      setSelectedRoom(null);
      setSelectedBed(null);
      setReason('Clinical Ward Transfer');
      fetchIpd(); // reload list to reflect changes
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingTransfer(false);
    }
  };

  // ipdList is already backend-filtered; use directly
  const filtered = ipdList;

  // Calculate vacant beds dynamically for room selection catalog
  const roomsCatalog = rooms.map(r => {
    const occupiedCount = ipdList.filter(p => {
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

  // Calculate bed availability for selected room
  const generatedBeds = selectedRoom ? (() => {
    const total = selectedRoom.totalBeds || 10;
    const list = [];
    for (let i = 1; i <= total; i++) {
      const bedNo = `RM-${selectedRoom.name}-${i.toString().padStart(2, '0')}`;
      const isOccupied = ipdList.some(p => {
        if (p.status !== 'Admitted') return false;
        if (!p.room || !selectedRoom.name) return false;
        const pRoomStr = p.room.toString().toLowerCase().replace('room', '').trim();
        const sRoomStr = selectedRoom.name.toString().toLowerCase().replace('room', '').trim();
        if (pRoomStr !== sRoomStr) return false;
        if (p.bed === bedNo) return true;
        const altBedName = `Bed ${selectedRoom.name}-${i}`;
        if (p.bed === altBedName) return true;
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

  return (
    <div>
      <Topbar title="IPD — In-Patient Department" user={user?.name} />
      <div className="page-body has-stats">
        <div className="page-header">
          <div>
            <h2>IPD Directory</h2>
            <p>Manage admitted patients</p>
          </div>
          <div className="page-actions">
            <div className="search-bar">
              <Search />
              <input placeholder="Search IPD..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/ipd/admit')}>
              <Plus size={15} /> Admit Patient
            </button>
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: 16, gap: 16 }}>
          {[
            { label: 'Currently Admitted', value: ipdList.filter(r => r.status === 'Admitted').length, color: '#4f46e5' },
            { label: 'Discharged (Month)', value: ipdList.filter(r => r.status === 'Discharged').length, color: '#10b981' },
            { label: 'Total Records', value: ipdList.length, color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: '12px 16px', gap: 12 }}>
              <div className="stat-icon" style={{ 
                width: 38, 
                height: 38, 
                borderRadius: 10, 
                background: `${s.color}12`, 
                border: `1px solid ${s.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: s.color, fontWeight: 800, fontSize: 14 }}>★</span>
              </div>
              <div className="stat-info">
                <h3 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: 800 }}>{s.value}</h3>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', letterSpacing: '0.3px', fontWeight: 700 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>IPD ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Admitted On</th>
                  <th>Room / Bed</th>
                  <th>Diagnosis</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>{r.ioId}</span></td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{r.patientName}</span>
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.patientNo}</span>
                    </td>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{r.doctor}</td>
                    <td>{r.department}</td>
                    <td style={{ fontSize: 12 }}>{r.dateAdmit}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 12 }}>Rm {r.room}</span>
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.bed}</span>
                    </td>
                    <td style={{ fontSize: 12.5, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.diagnosis}</td>
                    <td><span className={`badge ${r.status === 'Admitted' ? 'badge-info' : 'badge-success'}`}>{r.status}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" title="View details">
                        <Eye size={14} />
                      </button>
                      {r.status === 'Admitted' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--primary)' }}
                          onClick={() => {
                            setTransferPatient(r);
                            fetch('http://localhost:5001/api/rooms')
                              .then(res => res.json())
                              .then(data => {
                                if (Array.isArray(data)) {
                                  setRooms(data);
                                }
                              })
                              .catch(err => console.error("Error fetching rooms:", err));
                          }}
                          title="Ward/Bed Transfer"
                        >
                          <ArrowLeftRight size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ward Transfer Modal */}
      {transferPatient && (
        <div className="modal-overlay" onClick={() => setTransferPatient(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 750 }}>
            <div className="modal-header">
              <div>
                <h3>Ward / Bed Transfer</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Transferring: <strong>{transferPatient.patientName}</strong> ({transferPatient.patientNo})
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Current Room: Room {transferPatient.room} / Bed {transferPatient.bed}
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTransferPatient(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="grid-2" style={{ gap: 16 }}>
                {/* Left: Rooms list */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    1. Select Room
                  </div>
                  <div className="table-wrapper" style={{ maxHeight: 250, overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Room</th>
                          <th>Type</th>
                          <th>Available Beds</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomsCatalog.map(r => (
                          <tr
                            key={r.id}
                            style={{
                              cursor: 'pointer',
                              background: selectedRoom?.id === r.id ? 'rgba(99, 102, 241, 0.15)' : ''
                            }}
                            onClick={() => {
                              setSelectedRoom(r);
                              setSelectedBed(null);
                            }}
                          >
                            <td><strong>{r.name}</strong></td>
                            <td>{r.category}</td>
                            <td>
                              <span className={`badge ${r.vacantBeds > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                                {r.vacantBeds} free
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Beds list */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    2. Select Bed {selectedRoom ? `(Room ${selectedRoom.name})` : ''}
                  </div>
                  <div className="table-wrapper" style={{ maxHeight: 250, overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Bed No.</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRoom ? (
                          generatedBeds.map(b => (
                            <tr key={b.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{b.bedNo}</td>
                              <td>
                                <span className={`badge ${b.status === 'Vacant' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                                  {b.status}
                                </span>
                              </td>
                              <td>
                                {b.status === 'Vacant' ? (
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${selectedBed?.bedNo === b.bedNo ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setSelectedBed(b)}
                                    style={{ padding: '2px 8px', fontSize: 11 }}
                                  >
                                    {selectedBed?.bedNo === b.bedNo ? 'Selected' : 'Select'}
                                  </button>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Occupied</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="empty-state" style={{ textAlign: 'center', padding: 20, fontSize: 12, color: 'var(--text-muted)' }}>
                              Please select a room from the list first
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Reason for Transfer</label>
                <input
                  className="form-control"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Patient requested room upgrade, Clinical condition change..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setTransferPatient(null)} disabled={savingTransfer}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleTransferSubmit}
                disabled={savingTransfer || !selectedRoom || !selectedBed}
              >
                {savingTransfer ? <Loader2 className="animate-spin" size={14} style={{ marginRight: 6 }} /> : <ArrowLeftRight size={14} style={{ marginRight: 6 }} />} 
                {savingTransfer ? ' Processing...' : ' Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
