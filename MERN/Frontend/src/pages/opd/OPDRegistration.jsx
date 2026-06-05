import { useState, useEffect } from 'react';
import { Search, Save, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function OPDRegistration({ user }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  
  // Dynamic lists from backend
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ 
    department: '', 
    doctor: '', 
    complaints: '', 
    diagnosis: '', 
    vitalBP: '', 
    vitalTemp: '', 
    vitalPulse: '', 
    vitalWeight: '', 
    isPaid: false 
  });

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
  }, [showQuickRegister]);

  // Load lists on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [patientsRes, deptsRes, doctorsRes] = await Promise.all([
          fetch(`${API_BASE}/patients`),
          fetch(`${API_BASE}/departments`),
          fetch(`${API_BASE}/doctors`)
        ]);

        if (patientsRes.ok && deptsRes.ok && doctorsRes.ok) {
          const [pData, dData, docData] = await Promise.all([
            patientsRes.json(),
            deptsRes.json(),
            doctorsRes.json()
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
        }
      } catch (err) {
        console.error('Error fetching OPD registry lists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const results = patients.filter(p =>
    `${p.patientNo} ${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
  );

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
      setSelected(newlyCreatedPatient);
      
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
    if (!selected) return alert('Please select a patient first.');
    if (!form.department || !form.doctor) return alert('Department and Doctor are required.');

    try {
      setSaving(true);
      
      const selectedDoc = doctors.find(d => d.id === form.doctor);
      const selectedDept = departments.find(d => d.id === form.department);

        const payload = {
          patientNo: selected.patientNo,
          patientName: `${selected.firstName || selected.firstname || ''} ${selected.lastName || selected.lastname || ''}`.trim() || 'Unknown Patient',
        doctor: selectedDoc ? (selectedDoc.firstName.startsWith('Dr.') ? `${selectedDoc.firstName} ${selectedDoc.lastName}` : `Dr. ${selectedDoc.firstName} ${selectedDoc.lastName}`) : 'Dr. Incharge',
        department: selectedDept ? selectedDept.name : 'General Medicine',
        complaints: form.complaints,
        diagnosis: form.diagnosis
      };

      const res = await fetch(`${API_BASE}/opd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to register OPD visit.');

      setSaved(true);
      setForm({ 
        department: '', 
        doctor: '', 
        complaints: '', 
        diagnosis: '', 
        vitalBP: '', 
        vitalTemp: '', 
        vitalPulse: '', 
        vitalWeight: '', 
        isPaid: false 
      });
      setSelected(null);
      setSearch('');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Topbar title="OPD Registration" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div><h2>OPD Registration</h2><p>Search patient → register out-patient visit</p></div>
        </div>

        {saved && (
          <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#34d399' }}>
            ✓ OPD visit registered successfully!
          </div>
        )}

        {/* Step 1: Search */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-title" style={{ margin: 0 }}><span></span>Step 1 — Search Patient</div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowQuickRegister(true)}>
              + Register New Patient
            </button>
          </div>
          <div className="search-bar" style={{ maxWidth: '100%', marginBottom: 16 }}>
            <Search />
            <input placeholder="Search by Patient No, First Name or Last Name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          
          {!selected && !search && patients.length > 0 && (
            <div style={{ marginBottom: 16, animation: 'fadeIn 0.3s ease' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13 }}>⚡</span> Quick Select (Recently Registered Patients):
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
                      gap: 4,
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setSelected(p)}
                  >
                    👤 {p.firstName} {p.lastName} <span style={{ opacity: 0.6, fontSize: 10 }}>({p.patientNo})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading registry lists...</div>
          ) : (
            search && (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Patient No.</th><th>Name</th><th>Age</th><th>Gender</th><th>Phone</th><th>Action</th></tr></thead>
                  <tbody>
                    {results.map(p => (
                      <tr key={p.id}>
                        <td style={{ color: 'var(--accent-light)', fontFamily: 'monospace' }}>{p.patientNo}</td>
                        <td style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</td>
                        <td>{p.age} yrs</td>
                        <td>{p.gender === 1 ? 'Male' : (p.gender === 2 ? 'Female' : p.gender)}</td>
                        <td>{p.phone}</td>
                        <td><button className="btn btn-primary btn-sm" onClick={() => { setSelected(p); setSearch(''); }}>Select</button></td>
                      </tr>
                    ))}
                    {results.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px 0' }}>
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
          
          {selected && (
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 20 }}>
              <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>SELECTED PATIENT</span><br /><strong style={{ color: 'var(--accent-light)' }}>{selected.patientNo}</strong></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>NAME</span><br /><strong>{selected.firstName} {selected.lastName}</strong></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>AGE / GENDER</span><br /><strong>{selected.age} yrs / {selected.gender === 1 ? 'Male' : (selected.gender === 2 ? 'Female' : selected.gender)}</strong></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>PHONE</span><br /><strong>{selected.phone}</strong></div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{ marginLeft: 'auto', color: 'var(--danger)' }}>✕ Clear</button>
            </div>
          )}
        </div>

        {/* Step 2: Registration Form */}
        <div className="card">
          <div className="section-title"><span></span>Step 2 — OPD Visit Details</div>
          <form onSubmit={handleSave}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select className="form-control" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required>
                  <option value="">— Select Department —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Doctor Incharge *</label>
                <select className="form-control" value={form.doctor} onChange={e => setForm({...form, doctor: e.target.value})} required>
                  <option value="">— Select Doctor —</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Complaints / Chief Complaint</label>
                <textarea className="form-control" rows={3} placeholder="Enter chief complaints..." value={form.complaints} onChange={e => setForm({...form, complaints: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Provisional Diagnosis</label>
                <textarea className="form-control" rows={3} placeholder="Enter diagnosis..." value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} />
              </div>
            </div>
            <div className="section-title" style={{ marginTop: 8 }}><span></span>Vital Signs</div>
            <div className="grid-4">
              {[['vitalBP','Blood Pressure','mmHg'],['vitalTemp','Temperature','°F'],['vitalPulse','Pulse Rate','bpm'],['vitalWeight','Weight','kg']].map(([key,label,unit]) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label} ({unit})</label>
                  <input className="form-control" placeholder={`e.g. ${key==='vitalBP'?'120/80':key==='vitalTemp'?'98.6':key==='vitalPulse'?'72':'65'}`} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} />
                </div>
              ))}
            </div>
            <div className="modal-footer" style={{ padding: 0, marginTop: 16, border: 'none', justifyContent: 'flex-start' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save OPD Visit
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setForm({ department:'',doctor:'',complaints:'',diagnosis:'',vitalBP:'',vitalTemp:'',vitalPulse:'',vitalWeight:'', isPaid:false }); setSelected(null); }} disabled={saving}>Reset</button>
            </div>
          </form>
        </div>

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
