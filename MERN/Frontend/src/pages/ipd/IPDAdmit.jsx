import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function IPDAdmit({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Dynamic lists from backend
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Filter lists
  const [roomFilter, setRoomFilter] = useState('');
  const [bedFilter, setBedFilter] = useState('all');
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [form, setForm] = useState({ 
    department: '', 
    doctor: '', 
    provDiagnosis: '', 
    complaint: '',
    convertedFromOPDId: ''
  });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Quick Register Modal State
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickForm, setQuickForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    age: '',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    address: ''
  });

  // Automatically parse search text to prefill first/last name when quick register opens
  useEffect(() => {
    if (showQuickRegister && search) {
      const parts = search.trim().split(/\s+/);
      setQuickForm(prev => ({
        ...prev,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
      }));
    }
  }, [showQuickRegister, search]);

  // Fetch lists on mount
  useEffect(() => {
    fetchData();
  }, []);

  // OPD to IPD Conversion auto-prefill hook
  useEffect(() => {
    if (location.state?.convertFromOPD && patients.length > 0) {
      const opdRecord = location.state.convertFromOPD;
      
      // Avoid infinite loop
      if (form.convertedFromOPDId === opdRecord.ioId) return;

      const matchedPatient = patients.find(p => p.patientNo === opdRecord.patientNo);
      if (matchedPatient) {
        setSelectedPatient(matchedPatient);
      } else {
        setSelectedPatient({
          id: opdRecord.patientNo,
          patientNo: opdRecord.patientNo,
          firstName: opdRecord.patientName.split(' ')[0] || 'Unknown',
          lastName: opdRecord.patientName.split(' ').slice(1).join(' ') || 'Patient',
          age: 35,
          gender: 'Male',
          phone: ''
        });
      }

      const matchedDept = departments.find(d => d.name === opdRecord.department);
      const matchedDoc = doctors.find(d => {
        const fullName = `${d.firstName} ${d.lastName}`.toLowerCase();
        return opdRecord.doctor.toLowerCase().includes(fullName) || fullName.includes(opdRecord.doctor.toLowerCase().replace('dr. ', ''));
      });

      setForm({
        department: matchedDept ? matchedDept.id : '',
        doctor: matchedDoc ? matchedDoc.id : '',
        provDiagnosis: opdRecord.diagnosis || '',
        complaint: opdRecord.complaints || '',
        convertedFromOPDId: opdRecord.ioId
      });
    }
  }, [location.state, patients, departments, doctors, form.convertedFromOPDId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientsRes, deptsRes, doctorsRes, roomsRes] = await Promise.all([
        fetch(`${API_BASE}/patients`),
        fetch(`${API_BASE}/departments`),
        fetch(`${API_BASE}/doctors`),
        fetch(`${API_BASE}/rooms`)
      ]);

      if (patientsRes.ok && deptsRes.ok && doctorsRes.ok && roomsRes.ok) {
        const [pData, dData, docData, rData] = await Promise.all([
          patientsRes.json(),
          deptsRes.json(),
          doctorsRes.json(),
          roomsRes.json()
        ]);
        
        const normalizedPatients = pData.map(p => ({
          ...p,
          firstName: p.firstName || p.firstname || '',
          lastName: p.lastName || p.lastname || '',
          phone: p.phone || p.phone_no || ''
        }));

        setPatients(normalizedPatients);
        setDepartments(dData);
        setDoctors(docData);
        setRooms(rData);
      }
    } catch (err) {
      console.error('Error fetching IPD resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const patientResults = patients.filter(p =>
    `${p.patientNo} ${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRooms = rooms.filter(r => !roomFilter || r.id.toString() === roomFilter);

  // Dynamically generate beds based on room capacity
  const generatedBeds = selectedRoom ? (() => {
    const total = selectedRoom.totalBeds || 10;
    const vacant = selectedRoom.vacantBeds || 10;
    const occupiedCount = total - vacant;
    const list = [];
    for (let i = 1; i <= total; i++) {
      const isOccupied = i <= occupiedCount;
      list.push({
        id: `${selectedRoom.id}-${i}`,
        bedNo: `RM-${selectedRoom.name}-${i.toString().padStart(2, '0')}`,
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

  const handleQuickRegister = async () => {
    if (!quickForm.firstName || !quickForm.lastName || !quickForm.age || !quickForm.phone) {
      return alert('First Name, Last Name, Age and Phone are required.');
    }

    try {
      const res = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quickForm)
      });

      if (!res.ok) throw new Error('Failed to register patient.');

      const newlyCreatedPatient = await res.json();
      
      // Update patients list
      setPatients(prev => [newlyCreatedPatient, ...prev]);
      
      // Auto select newly created patient
      setSelectedPatient(newlyCreatedPatient);
      
      // Close modal and reset quick fields
      setShowQuickRegister(false);
      setSearch('');
      setQuickForm({
        firstName: '',
        lastName: '',
        gender: 'Male',
        age: '',
        bloodGroup: 'O+',
        phone: '',
        email: '',
        address: ''
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return alert('Select a patient first.');
    if (!selectedBed) return alert('Select a bed to admit the patient.');
    if (!form.department || !form.doctor) return alert('Department and Doctor are required.');

    try {
      setSaving(true);
      const selectedDoc = doctors.find(d => d.id === form.doctor);
      const selectedDept = departments.find(d => d.id === form.department);

      const payload = {
        patientNo: selectedPatient.patientNo,
        patientName: `${selectedPatient.firstName || selectedPatient.firstname || ''} ${selectedPatient.lastName || selectedPatient.lastname || ''}`.trim() || 'Unknown Patient',
        doctor: selectedDoc ? (selectedDoc.firstName.startsWith('Dr.') ? `${selectedDoc.firstName} ${selectedDoc.lastName}` : `Dr. ${selectedDoc.firstName} ${selectedDoc.lastName}`) : 'Dr. Incharge',
        department: selectedDept ? selectedDept.name : 'General Medicine',
        room: selectedRoom.name,
        bed: selectedBed.bedNo,
        diagnosis: form.provDiagnosis
      };

      const res = await fetch(`${API_BASE}/ipd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to register IPD admission.');

      // If it was a conversion, update the OPD record status to 'Converted to IPD'!
      if (form.convertedFromOPDId) {
        await fetch(`${API_BASE}/opd/${form.convertedFromOPDId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Converted to IPD' })
        }).catch(err => console.error("Error updating OPD status:", err));
      }

      setSaved(true);
      setForm({ department: '', doctor: '', provDiagnosis: '', complaint: '', convertedFromOPDId: '' });
      setSelectedPatient(null);
      setSelectedRoom(null);
      setSelectedBed(null);
      setSearch('');
      
      // Clear React Router location state so it doesn't prefill again
      navigate(location.pathname, { replace: true, state: {} });

      // Refresh rooms capacity list
      const roomsRes = await fetch(`${API_BASE}/rooms`);
      if (roomsRes.ok) {
        const rData = await roomsRes.json();
        setRooms(rData);
      }

      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Topbar title="IPD — Admit Patient" user={user?.name} />
      <div className="page-body">
        <div className="page-header"><div><h2>IPD Admission Registry</h2><p>Admit a patient to in-patient ward</p></div></div>

        {saved && (
          <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#34d399' }}>
            ✓ Patient admitted successfully!
          </div>
        )}

        {/* OPD to IPD Alert Banner */}
        {form.convertedFromOPDId && (
          <div style={{ background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#d97706', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.3s ease' }}>
            <span>
              ⚡ <strong>OPD to IPD Conversion Active:</strong> You are converting Out-Patient record <strong>{form.convertedFromOPDId}</strong>. Patient details and clinical diagnosis have been prefilled. <strong>Select a Room and Bed</strong> to complete.
            </span>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              style={{ padding: '4px 8px', fontSize: 11, background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', borderColor: 'rgba(217, 119, 6, 0.2)' }}
              onClick={() => {
                setSelectedPatient(null);
                setForm({ department: '', doctor: '', provDiagnosis: '', complaint: '', convertedFromOPDId: '' });
                navigate(location.pathname, { replace: true, state: {} });
              }}
            >
              Cancel Conversion
            </button>
          </div>
        )}

        {/* Search Patient */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-title" style={{ margin: 0 }}><span></span>Search Patient</div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowQuickRegister(true)}>
              + Register New Patient
            </button>
          </div>
          <div className="search-bar" style={{ maxWidth:'100%', marginBottom:12 }}>
            <input placeholder="Patient No / Name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {!selectedPatient && !search && patients.length > 0 && (
            <div style={{ marginTop: 12, marginBottom: 8, animation: 'fadeIn 0.3s ease' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚡</span> Quick Select (Recently Registered Patients):
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {patients.slice(0, 5).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: 12, 
                      borderRadius: 20, 
                      background: 'rgba(99, 102, 241, 0.08)',
                      color: 'var(--accent-light)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    onClick={() => setSelectedPatient(p)}
                  >
                    👤 {p.firstName} {p.lastName} <span style={{ opacity: 0.6, fontSize: 10 }}>({p.patientNo})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: 10, fontSize: 13, color: 'var(--text-secondary)' }}>Loading registers...</div>
          ) : (
            search && (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Patient No.</th><th>Name</th><th>Age</th><th>Gender</th><th></th></tr></thead>
                  <tbody>
                    {patientResults.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontFamily:'monospace', color:'var(--accent-light)' }}>{p.patientNo}</td>
                        <td style={{ fontWeight:600 }}>{p.firstName} {p.lastName}</td>
                        <td>{p.age} yrs</td>
                        <td>{p.gender === 1 ? 'Male' : (p.gender === 2 ? 'Female' : p.gender)}</td>
                        <td><button className="btn btn-primary btn-sm" onClick={() => { setSelectedPatient(p); setSearch(''); }}>Select</button></td>
                      </tr>
                    ))}
                    {patientResults.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px 0' }}>
                          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No patients found matching "{search}"</p>
                          <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowQuickRegister(true)}>
                            Register "{search}" as New Patient
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          )}
          {selectedPatient && (
            <div style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:8, padding:'12px 16px', display:'flex', gap:24, flexWrap:'wrap' }}>
              {[['Patient No.', selectedPatient.patientNo],['Name', `${selectedPatient.firstName} ${selectedPatient.lastName}`],['Age', `${selectedPatient.age} yrs`],['Gender', selectedPatient.gender === 1 ? 'Male' : (selectedPatient.gender === 2 ? 'Female' : selectedPatient.gender)]].map(([k,v]) => (
                <div key={k}><div style={{ fontSize:11, color:'var(--text-muted)' }}>{k}</div><div style={{ fontWeight:700, color:'var(--accent-light)' }}>{v}</div></div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPatient(null)} style={{ marginLeft:'auto', color:'var(--danger)' }}>✕</button>
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* Left: Form */}
            <div className="card">
              <div className="section-title"><span></span>Admission Details</div>
              <div className="form-group">
                <label className="form-label">IOP No.</label>
                <input className="form-control" value="IP-AUTO" readOnly style={{ opacity:0.6 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select className="form-control" value={form.department} onChange={e => setForm({...form, department:e.target.value})} required>
                  <option value="">— Select —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Doctor Incharge *</label>
                <select className="form-control" value={form.doctor} onChange={e => setForm({...form, doctor:e.target.value})} required>
                  <option value="">— Select —</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Room Name</label>
                <input className="form-control" value={selectedRoom ? `${selectedRoom.name} (${selectedRoom.category})` : ''} readOnly placeholder="Click a room below to select" style={{ opacity:0.7 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Bed Name / No.</label>
                <input className="form-control" value={selectedBed ? selectedBed.bedNo : ''} readOnly placeholder="Click a bed below to select" style={{ opacity:0.7 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Provisional Diagnosis</label>
                <textarea className="form-control" rows={3} value={form.provDiagnosis} onChange={e => setForm({...form, provDiagnosis:e.target.value})} placeholder="Enter diagnosis..." />
              </div>
              <div className="form-group">
                <label className="form-label">Complaint</label>
                <textarea className="form-control" rows={3} value={form.complaint} onChange={e => setForm({...form, complaint:e.target.value})} placeholder="Enter complaint..." />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ justifyContent:'center' }} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Admit Patient
              </button>
            </div>

            {/* Right: Room + Bed Selection */}
            <div className="card">
              <div className="section-title"><span></span>Admission Master — Select Room & Bed</div>
              <div className="grid-2" style={{ marginBottom:12 }}>
                <select className="form-control" value={roomFilter} onChange={e => { setRoomFilter(e.target.value); setSelectedRoom(null); setSelectedBed(null); }}>
                  <option value="">All Room Types</option>
                  {rooms.map(r => <option key={r.id} value={r.id.toString()}>{r.category} ({r.name})</option>)}
                </select>
                <select className="form-control" value={bedFilter} onChange={e => setBedFilter(e.target.value)}>
                  <option value="all">All Beds</option>
                  <option value="occupied">Occupied Beds</option>
                  <option value="unoccupied">Unoccupied Beds</option>
                </select>
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>Rooms</div>
              <div className="table-wrapper" style={{ marginBottom:16 }}>
                <table>
                  <thead><tr><th>Status</th><th>Floor</th><th>Room No.</th><th>Type</th><th>Total</th><th>Free</th></tr></thead>
                  <tbody>{filteredRooms.map(r => (
                    <tr key={r.id} style={{ cursor:'pointer', background: selectedRoom?.id===r.id ? 'rgba(99,102,241,0.15)' : '' }} onClick={() => { setSelectedRoom(r); setSelectedBed(null); }}>
                      <td><span className={`badge ${r.vacantBeds>0?'badge-success':'badge-danger'}`}>{r.vacantBeds>0?'Available':'Full'}</span></td>
                      <td>{r.floor}</td><td>{r.name}</td><td>{r.category}</td><td>{r.totalBeds}</td><td>{r.vacantBeds}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>Beds {selectedRoom ? `— Room ${selectedRoom.name}` : ''}</div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Select</th><th>Bed No.</th><th>Status</th></tr></thead>
                  <tbody>
                    {selectedRoom ? (
                      filteredBeds.map(b => (
                        <tr key={b.id}>
                          <td>
                            {b.status === 'Vacant' && <button type="button" className="btn btn-primary btn-sm" onClick={() => setSelectedBed(b)}>Admit Here</button>}
                            {b.status === 'Occupied' && <span style={{ color:'var(--text-muted)', fontSize:12 }}>Occupied</span>}
                          </td>
                          <td style={{ fontFamily:'monospace', fontWeight:600 }}>{b.bedNo}</td>
                          <td><span className={`badge ${b.status==='Vacant'?'badge-success':'badge-danger'}`}>{b.status}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="empty-state">Please click a room in the table above first</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </form>

        {/* Quick Register Modal */}
        {showQuickRegister && (
          <div className="modal-overlay" onClick={() => setShowQuickRegister(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
              <div className="modal-header">
                <div><h3>Quick Register New Patient</h3><p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Create patient master record instantly</p></div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowQuickRegister(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input className="form-control" value={quickForm.firstName} onChange={e => setQuickForm({...quickForm, firstName: e.target.value})} required placeholder="e.g. John" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input className="form-control" value={quickForm.lastName} onChange={e => setQuickForm({...quickForm, lastName: e.target.value})} required placeholder="e.g. Doe" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-control" value={quickForm.gender} onChange={e => setQuickForm({...quickForm, gender: e.target.value})}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age *</label>
                    <input type="number" className="form-control" value={quickForm.age} onChange={e => setQuickForm({...quickForm, age: e.target.value})} required placeholder="e.g. 35" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select className="form-control" value={quickForm.bloodGroup} onChange={e => setQuickForm({...quickForm, bloodGroup: e.target.value})}>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-control" value={quickForm.phone} onChange={e => setQuickForm({...quickForm, phone: e.target.value})} required placeholder="e.g. 9876543210" />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Address</label>
                    <textarea className="form-control" rows={2} value={quickForm.address} onChange={e => setQuickForm({...quickForm, address: e.target.value})} placeholder="Patient's residential address..." />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuickRegister(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleQuickRegister}>Register & Select</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
