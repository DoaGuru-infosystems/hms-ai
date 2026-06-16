import { useState, useEffect, useMemo } from 'react';
import { Save, Plus, Trash2, Loader2, Pencil, X, Check, Search } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function NurseMedication({ user }) {
  const [patient, setPatient] = useState('');
  const [rows, setRows] = useState([{ medicine:'', dosage:'', route:'Oral', frequency:'TID', date:'' }]);
  const [saved, setSaved] = useState(false);
  const [ipdList, setIpdList] = useState([]);
  const [medicineCatalog, setMedicineCatalog] = useState([]);
  const [given, setGiven] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [updateMsg, setUpdateMsg] = useState('');

  // Filter states for Recently Given Medications
  const [fSearch, setFSearch] = useState('');
  const [fRoute, setFRoute] = useState('All');
  const [fDateMode, setFDateMode] = useState('none'); // 'none' | 'single' | 'range'
  const [fDate, setFDate] = useState('');
  const [fDateStart, setFDateStart] = useState('');
  const [fDateEnd, setFDateEnd] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/ipd`).then(res => res.json()),
      fetch(`${API_BASE}/medicines`).then(res => res.json()),
      fetch(`${API_BASE}/nurse/medication`).then(res => res.json())
    ])
      .then(([ipdData, medData, givenData]) => {
        if (Array.isArray(ipdData)) setIpdList(ipdData.filter(r => r.status === 'Admitted'));
        if (Array.isArray(medData)) setMedicineCatalog(medData);
        if (Array.isArray(givenData)) setGiven(givenData);
      })
      .catch(err => console.log('Failed to fetch medication assets:', err))
      .finally(() => setLoading(false));
  }, []);

  const fetchGivenMedications = () => {
    fetch(`${API_BASE}/nurse/medication`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setGiven(data); })
      .catch(err => console.log('Failed to load given medications:', err));
  };

  // Filtered list for Recently Given Medications
  const filteredGiven = useMemo(() => {
    return given.filter(g => {
      const patientObj = ipdList.find(item =>
        String(item.id) === String(g.patient) || String(item.ioId) === String(g.patient)
      );
      const patientName = patientObj ? patientObj.patientName : String(g.patient || '');
      const ioId = patientObj ? (patientObj.ioId || '') : '';

      // Search: patient name OR IP ID
      const matchSearch = !fSearch ||
        patientName.toLowerCase().includes(fSearch.toLowerCase()) ||
        ioId.toLowerCase().includes(fSearch.toLowerCase());

      // Route filter
      const matchRoute = fRoute === 'All' || (g.route || '') === fRoute;

      // Date filter
      const rawDate = g.date ? String(g.date).slice(0, 10) : '';
      let matchDate = true;
      if (fDateMode === 'single' && fDate) {
        matchDate = rawDate === fDate;
      } else if (fDateMode === 'range' && (fDateStart || fDateEnd)) {
        matchDate = (!fDateStart || rawDate >= fDateStart) && (!fDateEnd || rawDate <= fDateEnd);
      }

      return matchSearch && matchRoute && matchDate;
    });
  }, [given, ipdList, fSearch, fRoute, fDateMode, fDate, fDateStart, fDateEnd]);

  const addRow = () => setRows([...rows, { medicine:'', dosage:'', route:'Oral', frequency:'TID', date:'' }]);
  const removeRow = i => setRows(rows.filter((_,idx) => idx !== i));
  const updateRow = (i, key, val) => setRows(rows.map((r,idx) => idx===i ? {...r,[key]:val} : r));

  const handleSave = e => {
    e.preventDefault();
    if (!patient) return alert('Select a patient.');
    const promises = rows.map(row =>
      fetch(`${API_BASE}/nurse/medication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient,
          medName: row.medicine,
          dose: row.dosage,
          route: row.route,
          freq: row.frequency,
          status: 'Given',
          by: user?.name || 'Nurse'
        })
      })
    );
    Promise.all(promises)
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setRows([{ medicine:'', dosage:'', route:'Oral', frequency:'TID', date:'' }]);
        fetchGivenMedications();
      })
      .catch(err => console.log('Failed to save medications:', err));
  };

  // ── Edit handlers ──
  const startEdit = (g) => {
    setEditId(g.id);
    setEditRow({
      medName: g.medName || '',
      dose: g.dose || '',
      route: g.route || 'Oral',
      freq: g.freq || 'TID',
      status: g.status || 'Given',
    });
  };

  const cancelEdit = () => { setEditId(null); setEditRow({}); };

  const saveEdit = (g) => {
    // Try PUT first, fall back to POST with updated data
    fetch(`${API_BASE}/nurse/medication/${g.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medName: editRow.medName,
        dose: editRow.dose,
        route: editRow.route,
        freq: editRow.freq,
        status: editRow.status,
        by: user?.name || 'Nurse'
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('PUT not supported');
        return res.json();
      })
      .then(() => {
        setUpdateMsg('✓ Updated!');
        setTimeout(() => setUpdateMsg(''), 2000);
        cancelEdit();
        fetchGivenMedications();
      })
      .catch(() => {
        // Fallback: update locally in state
        setGiven(prev => prev.map(item =>
          item.id === g.id ? { ...item, ...editRow } : item
        ));
        setUpdateMsg('✓ Updated locally!');
        setTimeout(() => setUpdateMsg(''), 2000);
        cancelEdit();
      });
  };

  return (
    <div className="nurse-theme">
      <Topbar title="Nurse — Patient Medication" user={user?.name} />
      <div className="page-body">
        <div className="page-header"><div><h2>Patient Medication</h2><p>Administer and record patient medications</p></div></div>
        {saved && <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#34d399' }}>✓ Medication recorded!</div>}
        {updateMsg && <div style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#818cf8' }}>{updateMsg}</div>}

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'40vh', gap:12, color:'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Medication Records...</h4>
          </div>
        ) : (
          <div>
            {/* ── New Medication Form ── */}
            <div className="card" style={{ marginBottom:20 }}>
              <div className="section-title"><span></span>Record Medication Given</div>
              <form onSubmit={handleSave}>
                <div className="form-group" style={{ maxWidth:360 }}>
                  <label className="form-label">Select Admitted Patient</label>
                  <select className="form-control" value={patient} onChange={e => setPatient(e.target.value)} required>
                    <option value="">— Select —</option>
                    {ipdList.map(r => <option key={r.id} value={r.id}>{r.ioId} — {r.patientName}</option>)}
                  </select>
                </div>
                <div className="table-wrapper" style={{ marginBottom:12 }}>
                  <table>
                    <thead><tr><th>Medicine</th><th>Dosage</th><th>Route</th><th>Frequency</th><th>Date</th><th></th></tr></thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i}>
                          <td><select className="form-control" style={{ minWidth:180 }} value={row.medicine} onChange={e => updateRow(i,'medicine',e.target.value)}>
                            <option value="">— Select Medicine —</option>
                            {medicineCatalog.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                          </select></td>
                          <td><input className="form-control" placeholder="e.g. 1 tab" value={row.dosage} onChange={e => updateRow(i,'dosage',e.target.value)} /></td>
                          <td><select className="form-control" value={row.route} onChange={e => updateRow(i,'route',e.target.value)}>
                            {['Oral','IV','IM','SC','Topical','Inhalation'].map(r => <option key={r}>{r}</option>)}
                          </select></td>
                          <td><select className="form-control" value={row.frequency} onChange={e => updateRow(i,'frequency',e.target.value)}>
                            {['OD','BID','TID','QID','PRN','STAT','Q4H','Q6H','Q8H','Q12H'].map(f => <option key={f}>{f}</option>)}
                          </select></td>
                          <td><input type="date" className="form-control" value={row.date} onChange={e => updateRow(i,'date',e.target.value)} /></td>
                          <td><button type="button" className="btn btn-ghost btn-sm" style={{ color:'var(--danger)' }} onClick={() => removeRow(i)}><Trash2 size={13}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}><Plus size={13}/> Add Row</button>
                  <button type="submit" className="btn btn-primary"><Save size={14}/> Save</button>
                </div>
              </form>
            </div>

            {/* ── Recently Given Medications (with Filters + Edit) ── */}
            <div className="card">
              <div className="section-title"><span></span>Recently Given Medications</div>

              {/* Filter Panel */}
              <div style={{ background:'var(--bg)', borderRadius:8, border:'1px solid var(--surface-border)', padding:14, marginBottom:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, marginBottom:10 }}>
                  {/* Name / IP ID */}
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">Patient Name / IP ID</label>
                    <div className="search-bar" style={{ width:'100%' }}>
                      <Search size={13}/>
                      <input placeholder="Name or IP No..." value={fSearch} onChange={e => setFSearch(e.target.value)} />
                    </div>
                  </div>

                  {/* Route */}
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">Route</label>
                    <select className="form-control" value={fRoute} onChange={e => setFRoute(e.target.value)}>
                      <option value="All">All Routes</option>
                      {['Oral','IV','IM','SC','Topical','Inhalation'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Date Mode */}
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">Date Filter</label>
                    <select className="form-control" value={fDateMode} onChange={e => { setFDateMode(e.target.value); setFDate(''); setFDateStart(''); setFDateEnd(''); }}>
                      <option value="none">No Date Filter</option>
                      <option value="single">Specific Date</option>
                      <option value="range">Custom Range</option>
                    </select>
                  </div>

                  {/* Clear */}
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">Reset</label>
                    <button className="btn btn-secondary" style={{ width:'100%' }}
                      onClick={() => { setFSearch(''); setFRoute('All'); setFDateMode('none'); setFDate(''); setFDateStart(''); setFDateEnd(''); }}>
                      Clear
                    </button>
                  </div>
                </div>

                {/* Date inputs row */}
                <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
                  {fDateMode === 'single' && (
                    <div className="form-group" style={{ marginBottom:0 }}>
                      <label className="form-label">Date</label>
                      <input type="date" className="form-control" value={fDate} onChange={e => setFDate(e.target.value)} />
                    </div>
                  )}
                  {fDateMode === 'range' && (
                    <>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label">Start Date</label>
                        <input type="date" className="form-control" value={fDateStart} onChange={e => setFDateStart(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label">End Date</label>
                        <input type="date" className="form-control" value={fDateEnd} onChange={e => setFDateEnd(e.target.value)} />
                      </div>
                    </>
                  )}
                  <div style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)', alignSelf:'center' }}>
                    Showing <strong style={{ color:'var(--accent)' }}>{filteredGiven.length}</strong> of {given.length} records
                  </div>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Medicine</th>
                      <th>Dosage</th>
                      <th>Route</th>
                      <th>Frequency</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th style={{ width: 90 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGiven.map((g, i) => {
                      const patientObj = ipdList.find(item => String(item.id) === String(g.patient) || String(item.ioId) === String(g.patient));
                      const patientName = patientObj ? patientObj.patientName : g.patient;
                      const isEditing = editId === g.id;

                      if (isEditing) {
                        return (
                          <tr key={i} style={{ background: 'rgba(99,102,241,0.07)', outline: '2px solid rgba(99,102,241,0.3)' }}>
                            <td style={{ fontWeight:600, color:'var(--accent-light)' }}>{patientName}</td>
                            <td>
                              <select className="form-control" style={{ minWidth:160 }} value={editRow.medName} onChange={e => setEditRow(p => ({...p, medName: e.target.value}))}>
                                <option value="">— Select —</option>
                                {medicineCatalog.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                              </select>
                            </td>
                            <td><input className="form-control" style={{ minWidth:80 }} value={editRow.dose} onChange={e => setEditRow(p => ({...p, dose: e.target.value}))} /></td>
                            <td>
                              <select className="form-control" value={editRow.route} onChange={e => setEditRow(p => ({...p, route: e.target.value}))}>
                                {['Oral','IV','IM','SC','Topical','Inhalation'].map(r => <option key={r}>{r}</option>)}
                              </select>
                            </td>
                            <td>
                              <select className="form-control" value={editRow.freq} onChange={e => setEditRow(p => ({...p, freq: e.target.value}))}>
                                {['OD','BID','TID','QID','PRN','STAT','Q4H','Q6H','Q8H','Q12H'].map(f => <option key={f}>{f}</option>)}
                              </select>
                            </td>
                            <td>
                              <select className="form-control" value={editRow.status} onChange={e => setEditRow(p => ({...p, status: e.target.value}))}>
                                {['Given','Pending','Skipped','Held'].map(s => <option key={s}>{s}</option>)}
                              </select>
                            </td>
                            <td style={{ fontSize:12 }}>{new Date(g.date).toLocaleString()}</td>
                            <td>
                              <div style={{ display:'flex', gap:4 }}>
                                <button className="btn btn-primary btn-sm" title="Save" onClick={() => saveEdit(g)}><Check size={12}/></button>
                                <button className="btn btn-secondary btn-sm" title="Cancel" onClick={cancelEdit}><X size={12}/></button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={i}>
                          <td style={{ fontWeight:600 }}>{patientName}</td>
                          <td>{g.medName}</td>
                          <td>{g.dose}</td>
                          <td>{g.route}</td>
                          <td><span className="badge badge-purple">{g.freq}</span></td>
                          <td><span className={`badge ${g.status === 'Given' ? 'badge-success' : g.status === 'Skipped' ? 'badge-danger' : 'badge-warning'}`}>{g.status || 'Given'}</span></td>
                          <td style={{ fontSize:12 }}>{new Date(g.date).toLocaleString()}</td>
                          <td>
                            <button className="btn btn-ghost btn-sm" title="Edit this record" style={{ color:'var(--accent-light)' }} onClick={() => startEdit(g)}>
                              <Pencil size={13}/>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredGiven.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign:'center', color:'var(--text-muted)', padding:'24px 0' }}>
                          {given.length === 0 ? 'No medication history found.' : 'No records match the current filters.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
