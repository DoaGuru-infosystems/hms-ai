import { useState, useEffect } from 'react';
import { Save, Loader2, Calendar, History, Search, Clock, X } from 'lucide-react';
import Topbar from '../../components/Topbar';
import ClockTimePicker from '../../components/ClockTimePicker';

const API_BASE = 'http://localhost:5001/api';

export default function NurseProgressNote({ user }) {
  const [patient, setPatient] = useState('');
  const [form, setForm] = useState({ note:'', date: new Date().toISOString().slice(0,10), time: new Date().toTimeString().slice(0,5) });
  const [saved, setSaved] = useState(false);
  const [ipdList, setIpdList] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for previous notes history modal & filters
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [historySearch, setHistorySearch] = useState('');

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
          
          // Assuming DD/MM/YYYY
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

  // Filter notes to only show today's notes on the main dashboard view
  const todayNotes = notes.filter(n => isToday(n.date));

  // Filter notes for the History Modal view
  const getFilteredHistoryNotes = () => {
    return notes.filter(n => {
      const noteDate = safeParseDate(n.date);
      const today = new Date();

      let matchesFilter = false;
      if (historyFilter === 'all') {
        matchesFilter = true;
      } else if (historyFilter === 'today') {
        matchesFilter = noteDate.getDate() === today.getDate() &&
                        noteDate.getMonth() === today.getMonth() &&
                        noteDate.getFullYear() === today.getFullYear();
      } else if (historyFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesFilter = noteDate.getDate() === yesterday.getDate() &&
                        noteDate.getMonth() === yesterday.getMonth() &&
                        noteDate.getFullYear() === yesterday.getFullYear();
      } else if (historyFilter === 'week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);
        matchesFilter = noteDate >= startOfWeek;
      } else if (historyFilter === 'month') {
        matchesFilter = noteDate.getMonth() === today.getMonth() &&
                        noteDate.getFullYear() === today.getFullYear();
      } else if (historyFilter === 'custom') {
        if (!customDate) {
          matchesFilter = true;
        } else {
          const [year, month, day] = customDate.split('-').map(Number);
          matchesFilter = noteDate.getFullYear() === year &&
                          noteDate.getMonth() === (month - 1) &&
                          noteDate.getDate() === day;
        }
      }

      let matchesSearch = true;
      if (historySearch.trim()) {
        const searchLower = historySearch.toLowerCase();
        const patientObj = ipdList.find(i => String(i.id) === String(n.patient) || String(i.ioId) === String(n.patient));
        const patientName = patientObj ? patientObj.patientName.toLowerCase() : String(n.patient).toLowerCase();
        const noteText = (n.note || '').toLowerCase();
        const byUser = (n.by || '').toLowerCase();
        matchesSearch = patientName.includes(searchLower) ||
                        noteText.includes(searchLower) ||
                        byUser.includes(searchLower);
      }

      return matchesFilter && matchesSearch;
    });
  };

  const filteredHistoryNotes = getFilteredHistoryNotes();

  return (
    <div className="nurse-theme">
      <Topbar title="Nurse — Progress Note" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Nurse Progress Note</h2>
            <p>Document patient condition updates</p>
          </div>
        </div>
        {saved && (
          <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#34d399' }}>
            ✓ Progress note saved!
          </div>
        )}

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
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                  </div>
                  <ClockTimePicker label="Time" value={form.time} onChange={val => setForm({...form, time: val})} className="form-group" />
                </div>
                <div className="form-group">
                  <label className="form-label">Progress Note *</label>
                  <textarea className="form-control" rows={6} value={form.note} onChange={e => setForm({note:e.target.value})} placeholder="Document patient's current condition, observations, and nursing care provided..." required />
                </div>
                <button type="submit" className="btn btn-primary"><Save size={14}/> Save Note</button>
              </form>
            </div>

            <div className="card">
              <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span></span>Recent Progress Notes
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

              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {todayNotes.map(n => {
                  const patientObj = ipdList.find(i => String(i.id) === String(n.patient) || String(i.ioId) === String(n.patient));
                  const patientName = patientObj ? patientObj.patientName : n.patient;
                  return (
                    <div key={n.id} style={{ background:'var(--bg)', borderRadius:8, padding:16, marginBottom:12, border: '1px solid var(--surface-border)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <div style={{ fontWeight:700 }}>{patientName}</div>
                        <span style={{ fontSize:11, color:'var(--primary)', fontWeight: 600 }}>By: {n.by}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>
                        <Clock size={11} />
                        {safeParseDate(n.date).toLocaleString()}
                      </div>
                      <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, whiteSpace: 'pre-wrap' }}>{n.note}</p>
                    </div>
                  );
                })}

                {todayNotes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p style={{ color:'var(--text-muted)', margin: '0 0 12px 0' }}>No progress notes logged today.</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}
                      onClick={() => setShowHistoryModal(true)}
                    >
                      <History size={14} /> View Previous Notes
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
                    onClick={() => setShowHistoryModal(true)}
                  >
                    <History size={14} /> View All & Previous Notes
                  </button>
                )}
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
                <h3>Previous Progress Notes History</h3>
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
                      placeholder="Search patient, note, or nurse..."
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body - Scrollable list */}
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: 'var(--bg)' }}>
              {filteredHistoryNotes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredHistoryNotes.map(n => {
                    const patientObj = ipdList.find(i => String(i.id) === String(n.patient) || String(i.ioId) === String(n.patient));
                    const patientName = patientObj ? patientObj.patientName : n.patient;
                    return (
                      <div key={n.id} style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{patientName}</div>
                          <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, background: 'var(--primary-soft)', padding: '2px 8px', borderRadius: '4px' }}>
                            By: {n.by}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                          <Clock size={11} />
                          {safeParseDate(n.date).toLocaleString()}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                          {n.note}
                        </p>
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
                Showing <strong>{filteredHistoryNotes.length}</strong> of <strong>{notes.length}</strong> notes
              </span>
              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

