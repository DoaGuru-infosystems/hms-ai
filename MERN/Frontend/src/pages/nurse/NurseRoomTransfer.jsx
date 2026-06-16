import { useState, useEffect } from 'react';
import { Save, Loader2, Calendar, History, Search, Clock, X } from 'lucide-react';
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

  // States for history modal & filters
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [historySearch, setHistorySearch] = useState('');

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

  // Robust date parser that handles native Date, ISO string, and DD/MM/YYYY string format
  const safeParseDate = (dateVal) => {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    
    let d = new Date(dateVal);
    if (typeof dateVal === 'string') {
      const parts = dateVal.split(',');
      const datePart = parts[0].trim();
      const slashCount = (datePart.match(/\//g) || []).length;
      
      if (slashCount === 2) {
        const dateSubparts = datePart.split('/');
        if (dateSubparts.length === 3) {
          const first = parseInt(dateSubparts[0], 10);
          const second = parseInt(dateSubparts[1], 10);
          const third = parseInt(dateSubparts[2], 10);
          
          const day = first;
          const month = second - 1;
          const year = third;
          
          let hours = 0;
          let minutes = 0;
          let seconds = 0;
          
          if (parts[1]) {
            const timePart = parts[1].trim();
            const ampmMatch = timePart.match(/(\d{1,2}):(\d{1,2}):?(\d{1,2})?\s*(AM|PM)?/i);
            if (ampmMatch) {
              hours = parseInt(ampmMatch[1], 10);
              minutes = parseInt(ampmMatch[2], 10);
              if (ampmMatch[3]) seconds = parseInt(ampmMatch[3], 10);
              const ampm = ampmMatch[4];
              if (ampm) {
                if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
                if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
              }
            }
          }
          
          const customDateObj = new Date(year, month, day, hours, minutes, seconds);
          if (!isNaN(customDateObj.getTime())) {
            return customDateObj;
          }
        }
      }
    }
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const isToday = (dateVal) => {
    const d = safeParseDate(dateVal);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  // Filter transfers to only show today's room transfers on the main view
  const todayTransfers = transfers.filter(t => isToday(t.date));

  // Filter transfers for the History Modal view
  const getFilteredTransfers = () => {
    return transfers.filter(t => {
      const transferDate = safeParseDate(t.date);
      const today = new Date();

      let matchesFilter = false;
      if (historyFilter === 'all') {
        matchesFilter = true;
      } else if (historyFilter === 'today') {
        matchesFilter = transferDate.getDate() === today.getDate() &&
                        transferDate.getMonth() === today.getMonth() &&
                        transferDate.getFullYear() === today.getFullYear();
      } else if (historyFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesFilter = transferDate.getDate() === yesterday.getDate() &&
                        transferDate.getMonth() === yesterday.getMonth() &&
                        transferDate.getFullYear() === yesterday.getFullYear();
      } else if (historyFilter === 'week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);
        matchesFilter = transferDate >= startOfWeek;
      } else if (historyFilter === 'month') {
        matchesFilter = transferDate.getMonth() === today.getMonth() &&
                        transferDate.getFullYear() === today.getFullYear();
      } else if (historyFilter === 'custom') {
        if (!customDate) {
          matchesFilter = true;
        } else {
          const [year, month, day] = customDate.split('-').map(Number);
          matchesFilter = transferDate.getFullYear() === year &&
                          transferDate.getMonth() === (month - 1) &&
                          transferDate.getDate() === day;
        }
      }

      let matchesSearch = true;
      if (historySearch.trim()) {
        const searchLower = historySearch.toLowerCase();
        const patientObj = ipdList.find(i => String(i.id) === String(t.patient) || String(i.ioId) === String(t.patient));
        const patientName = patientObj ? patientObj.patientName.toLowerCase() : String(t.patient).toLowerCase();
        const oldRoomVal = (t.oldRoom || '').toLowerCase();
        const newRoomVal = (t.newRoom || '').toLowerCase();
        const reasonVal = (t.reason || '').toLowerCase();
        const byUser = (t.by || '').toLowerCase();
        matchesSearch = patientName.includes(searchLower) ||
                        oldRoomVal.includes(searchLower) ||
                        newRoomVal.includes(searchLower) ||
                        reasonVal.includes(searchLower) ||
                        byUser.includes(searchLower);
      }

      return matchesFilter && matchesSearch;
    });
  };

  const filteredTransfers = getFilteredTransfers();

  const selectedPatientObj = ipdList.find(i => String(i.id) === String(form.patient));
  const currentRoomBed = selectedPatientObj ? `${selectedPatientObj.room} / Bed ${selectedPatientObj.bed}` : 'No patient selected';

  const filteredRooms = roomsCatalog.filter(r => !roomFilter || r.id.toString() === roomFilter);

  const generatedBeds = selectedRoom ? (() => {
    const total = selectedRoom.totalBeds || 10;
    const list = [];
    for (let i = 1; i <= total; i++) {
      const bedNo = `RM-${selectedRoom.name}-${i.toString().padStart(2, '0')}`;
      const isOccupied = ipdList.some(p => {
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

  const filteredBeds = generatedBeds.filter(b => {
    if (bedFilter === 'occupied') return b.status === 'Occupied';
    if (bedFilter === 'unoccupied') return b.status === 'Vacant';
    return true;
  });

  return (
    <div className="nurse-theme">
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
          <div className="grid-2" style={{ alignItems:'start', gap: 20 }}>
            {/* Left Column: Transfer details and History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Card 1: New Room Transfer */}
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

              {/* Card 2: Transfer History (Today) */}
              <div className="card">
                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span></span>Transfer History (Today)
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => setShowHistoryModal(true)}
                  >
                    <History size={14} /> History
                  </button>
                </div>
                
                <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                  {todayTransfers.map(t => {
                    const patientObj = ipdList.find(i => String(i.id) === String(t.patient) || String(i.ioId) === String(t.patient));
                    const patientName = patientObj ? patientObj.patientName : t.patient;
                    return (
                      <div key={t.id} style={{ background:'var(--bg)', borderRadius:8, padding:16, marginBottom:12, border: '1px solid var(--surface-border)' }}>
                        <div style={{ fontWeight:700, marginBottom:8 }}>{patientName}</div>
                        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                          {[['From', t.oldRoom],['To', t.newRoom],['Reason', t.reason],['Date', safeParseDate(t.date).toLocaleString()],['By', t.by]].map(([k,v]) => (
                            <div key={k} style={{ minWidth: '45%' }}><div style={{ fontSize:11, color:'var(--text-muted)' }}>{k}</div><div style={{ fontSize:13, fontWeight:600 }}>{v}</div></div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {todayTransfers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <p style={{ color:'var(--text-muted)', margin: '0 0 12px 0' }}>No room transfers today.</p>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}
                        onClick={() => setShowHistoryModal(true)}
                      >
                        <History size={14} /> View Previous Transfers
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
                      onClick={() => setShowHistoryModal(true)}
                    >
                      <History size={14} /> View All & Previous Transfers
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Room & Bed Selector */}
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
              <div className="table-wrapper" style={{ marginBottom:16, maxHeight: '250px', overflowY: 'auto' }}>
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
              <div className="table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
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
          </div>
        )}
      </div>

      {/* History & Filters Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal" style={{ maxWidth: '850px', width: '90%', display: 'flex', flexDirection: 'column', height: '80vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={18} style={{ color: 'var(--primary)' }} />
                <h3>Room Transfer History</h3>
              </div>
              <button
                className="btn-ghost"
                style={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setShowHistoryModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Filters Toolbar */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-2)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: 4 }}>Filter:</span>
                {[
                  { id: 'all', label: 'All Records' },
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'week', label: 'This Week' },
                  { id: 'month', label: 'This Month' },
                  { id: 'custom', label: 'Custom Date' }
                ].map(btn => (
                  <button
                    key={btn.id}
                    type="button"
                    className={`btn btn-sm ${historyFilter === btn.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', borderRadius: '20px' }}
                    onClick={() => {
                      setHistoryFilter(btn.id);
                      if (btn.id !== 'custom') setCustomDate('');
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Date picker and Search input */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  {historyFilter === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label className="form-label" style={{ margin: 0 }}>Select Date:</label>
                      <input
                        type="date"
                        className="form-control"
                        style={{ width: 'auto', padding: '6px 10px', height: '34px' }}
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '280px' }}>
                  <div className="search-bar" style={{ maxWidth: '100%', width: '100%', padding: '6px 10px' }}>
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search patient, room, reason..."
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body - Scrollable list */}
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: 'var(--bg)' }}>
              {filteredTransfers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredTransfers.map((t, i) => {
                    const patientObj = ipdList.find(item => String(item.id) === String(t.patient) || String(item.ioId) === String(t.patient));
                    const patientName = patientObj ? patientObj.patientName : t.patient;
                    return (
                      <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{patientName}</div>
                          <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, background: 'var(--primary-soft)', padding: '2px 8px', borderRadius: '4px' }}>
                            By: {t.by}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                          <Clock size={11} />
                          <strong>Transferred On: </strong> {safeParseDate(t.date).toLocaleString()}
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', background: 'var(--bg-primary)', padding: 12, borderRadius: 6, border: '1px solid var(--surface-border)' }}>
                          <div style={{ minWidth: '45%' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>From Room</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{t.oldRoom}</div>
                          </div>
                          <div style={{ minWidth: '45%' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>To Room</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{t.newRoom}</div>
                          </div>
                          <div style={{ minWidth: '95%', marginTop: 4 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reason for Transfer</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{t.reason || 'Not specified'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 12, padding: '40px 0' }}>
                  <Calendar size={32} />
                  <h4 style={{ margin: 0 }}>No records found</h4>
                  <p style={{ fontSize: '13px', margin: 0 }}>Try adjusting your filters or search terms.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Showing <strong>{filteredTransfers.length}</strong> of <strong>{transfers.length}</strong> room transfers
              </span>
              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
