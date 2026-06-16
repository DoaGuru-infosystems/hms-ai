import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit2, Trash2, ArrowLeft, UserPlus, Filter, X } from 'lucide-react';
import Topbar from '../components/Topbar';

const STATUS_BADGE = { Active: 'badge-success', Admitted: 'badge-info', Discharged: 'badge-gray' };
const DEBOUNCE_MS = 400;

export default function PatientsPage({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAddPage = location.pathname === '/patient/add';

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [patientsList, setPatientsList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filterName, setFilterName] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterPatientNo, setFilterPatientNo] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  const [newPatient, setNewPatient] = useState({
    firstName: '', lastName: '', gender: 'Male', age: '', bloodGroup: 'O+',
    phone: '', email: '', address: ''
  });

  const resetForm = () => {
    setNewPatient({ firstName: '', lastName: '', gender: 'Male', age: '', bloodGroup: 'O+', phone: '', email: '', address: '' });
    setIsEditing(false);
    setEditId(null);
    setSelected(null);
  };

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterName) params.set('name', filterName);
    if (filterPatientNo) params.set('patientNo', filterPatientNo);
    if (filterAge) params.set('age', filterAge);
    if (filterDate) params.set('date', filterDate);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return params.toString();
  }, [search, filterName, filterPatientNo, filterAge, filterDate, startDate, endDate]);

  const fetchPatients = useCallback(() => {
    setLoading(true);
    const qs = buildQueryString();
    fetch(`http://localhost:5001/api/patients${qs ? `?${qs}` : ''}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPatientsList(data);
          if (!search && !filterName && !filterPatientNo && !filterAge && !filterDate && !startDate && !endDate) {
            setTotalCount(data.length);
          }
        } else {
          setPatientsList([]);
        }
      })
      .catch(err => {
        console.log('Patients fetch offline.', err);
        setPatientsList([]);
      })
      .finally(() => setLoading(false));
  }, [buildQueryString]);

  // Initial load + poll every 10s (without filter params, just to keep count updated)
  useEffect(() => {
    fetch('http://localhost:5001/api/patients')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTotalCount(data.length); })
      .catch(() => {});
    const interval = setInterval(() => {
      fetch('http://localhost:5001/api/patients')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setTotalCount(data.length); })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Debounced fetch whenever any filter/search changes
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(fetchPatients, DEBOUNCE_MS);
    return () => clearTimeout(debounceTimer.current);
  }, [fetchPatients]);

  const handleEditClick = (patient) => {
    setNewPatient({
      firstName: patient.firstName || patient.firstname || '',
      lastName: patient.lastName || patient.lastname || '',
      gender: patient.gender === 1 ? 'Male' : (patient.gender === 2 ? 'Female' : (patient.gender || 'Male')),
      age: patient.age || '',
      bloodGroup: patient.bloodGroup || 'O+',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || patient.address1 || ''
    });
    setEditId(patient.id || patient.patientNo);
    setIsEditing(true);
    setSelected(null);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    fetch(`http://localhost:5001/api/patients/${id}`, { method: 'DELETE' })
      .then(res => { if (!res.ok) throw new Error('Failed to delete'); return res.json(); })
      .then(() => fetchPatients())
      .catch(err => {
        console.log('Failed to delete patient.', err);
        setPatientsList(prev => prev.filter(p => p.id !== id && p.patientNo !== id));
      });
  };

  const handleSave = () => {
    if (!newPatient.firstName || !newPatient.lastName) { alert('Please fill in Name fields.'); return; }
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `http://localhost:5001/api/patients/${editId}` : 'http://localhost:5001/api/patients';
    fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPatient) })
      .then(res => { if (!res.ok) throw new Error('Failed to save'); return res.json(); })
      .then(() => { fetchPatients(); setShowModal(false); resetForm(); if (isAddPage) navigate('/patient/master'); })
      .catch(err => {
        console.log('Failed to save patient.', err);
        setShowModal(false);
        resetForm();
        if (isAddPage) navigate('/patient/master');
      });
  };

  const activeFiltersCount =
    (filterName ? 1 : 0) + (filterAge ? 1 : 0) + (filterPatientNo ? 1 : 0) +
    (filterDate ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  const clearFilters = () => {
    setFilterName(''); setFilterAge(''); setFilterPatientNo('');
    setFilterDate(''); setStartDate(''); setEndDate('');
  };

  return (
    <div>
      <Topbar title={isAddPage ? "Register Patient" : "Patient Master"} user={user?.name} />
      <div className="page-body">
        {isAddPage ? (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/patient/master')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={14} /> Back to Directory
              </button>
            </div>
            <div className="card" style={{ padding: 28, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--surface-border)', paddingBottom: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Register New Patient</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Enter details to create a new patient health record</p>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 20 }}>
                <div className="form-group"><label className="form-label" style={{ fontWeight: 600 }}>First Name <span style={{ color: 'var(--danger)' }}>*</span></label><input className="form-control" value={newPatient.firstName} onChange={e => setNewPatient({ ...newPatient, firstName: e.target.value })} placeholder="Enter First Name" /></div>
                <div className="form-group"><label className="form-label" style={{ fontWeight: 600 }}>Last Name <span style={{ color: 'var(--danger)' }}>*</span></label><input className="form-control" value={newPatient.lastName} onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })} placeholder="Enter Last Name" /></div>
                <div className="form-group"><label className="form-label" style={{ fontWeight: 600 }}>Gender</label><select className="form-control" value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select></div>
                <div className="form-group"><label className="form-label" style={{ fontWeight: 600 }}>Age (Years)</label><input className="form-control" type="number" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} placeholder="Enter Age" /></div>
                <div className="form-group"><label className="form-label" style={{ fontWeight: 600 }}>Phone Number</label><input className="form-control" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} placeholder="Enter Phone" /></div>
                <div className="form-group"><label className="form-label" style={{ fontWeight: 600 }}>Email Address</label><input className="form-control" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} placeholder="Enter Email" /></div>
                <div className="form-group"><label className="form-label" style={{ fontWeight: 600 }}>Blood Group</label><select className="form-control" value={newPatient.bloodGroup} onChange={e => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}><option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option></select></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label" style={{ fontWeight: 600 }}>Permanent Address</label><textarea className="form-control" rows={3} value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} placeholder="Enter full address details" /></div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28, borderTop: '1px solid var(--surface-border)', paddingTop: 20 }}>
                <button className="btn btn-secondary" type="button" onClick={() => { resetForm(); navigate('/patient/master'); }}>Cancel</button>
                <button className="btn btn-primary" type="button" onClick={handleSave}>Register Patient</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="page-header">
              <div>
                <h2>Patient Directory</h2>
                <p>{totalCount} registered patients{loading && ' · searching...'}</p>
              </div>
              <div className="page-actions">
                <div className="search-bar">
                  <Search />
                  <input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button
                  className={`btn ${activeFiltersCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowFilters(!showFilters)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Filter size={15} />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span style={{ background: activeFiltersCount > 0 && showFilters ? 'white' : 'var(--primary)', color: activeFiltersCount > 0 && showFilters ? 'var(--primary)' : 'white', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginLeft: 2 }}>
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                <button className="btn btn-primary" onClick={() => { resetForm(); navigate('/patient/add'); }}>
                  <Plus size={15} /> New Patient
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="card" style={{ padding: '16px 20px', marginBottom: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, borderBottom: '1px solid var(--surface-border)', paddingBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Filter size={14} color="var(--primary)" /> Filter Directory
                  </span>
                  <button className="btn btn-ghost btn-xs" onClick={clearFilters} style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', color: 'var(--primary)' }}>
                    Clear Filters
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Patient No.</label>
                    <input className="form-control" style={{ padding: '6px 10px', fontSize: 12.5 }} placeholder="e.g. P-000001" value={filterPatientNo} onChange={e => setFilterPatientNo(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Name</label>
                    <input className="form-control" style={{ padding: '6px 10px', fontSize: 12.5 }} placeholder="Search name..." value={filterName} onChange={e => setFilterName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Age</label>
                    <input className="form-control" type="number" style={{ padding: '6px 10px', fontSize: 12.5 }} placeholder="e.g. 35" value={filterAge} onChange={e => setFilterAge(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Date</label>
                    <input className="form-control" type="date" style={{ padding: '4px 8px', fontSize: 12.5 }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Start Date</label>
                    <input className="form-control" type="date" style={{ padding: '4px 8px', fontSize: 12.5 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>End Date</label>
                    <input className="form-control" type="date" style={{ padding: '4px 8px', fontSize: 12.5 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Patient No.</th><th>Name</th><th>Gender</th><th>Age</th>
                      <th>Blood Group</th><th>Phone</th><th>Registered</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Searching...</td></tr>
                    ) : patientsList.length === 0 ? (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No patients found.</td></tr>
                    ) : patientsList.map(p => (
                      <tr key={p.id}>
                        <td><span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>{p.patientNo}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                              {p.firstName ? p.firstName[0] : (p.firstname ? p.firstname[0] : 'P')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{p.firstName || p.firstname} {p.lastName || p.lastname}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email || p.email_address}</div>
                            </div>
                          </div>
                        </td>
                        <td>{p.gender === 1 ? 'Male' : (p.gender === 2 ? 'Female' : (p.gender || 'Male'))}</td>
                        <td>{p.age} yrs</td>
                        <td><span className="badge badge-purple">{p.bloodGroup || 'O+'}</span></td>
                        <td>{p.phone || p.phone_no || p.mobile_no}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.dateEntry || (p.date_entry ? p.date_entry.split(' ')[0] : '')}</td>
                        <td><span className={`badge ${STATUS_BADGE[p.status] || (p.InActive === 0 ? 'badge-success' : 'badge-gray')}`}>{p.status || (p.InActive === 0 ? 'Active' : 'Inactive')}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(p); setShowModal(true); }}><Eye size={14} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleEditClick(p)} title="Edit Patient"><Edit2 size={14} /></button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(p.id || p.patientNo)} title="Delete Patient"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => { resetForm(); setShowModal(false); }}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selected ? 'Patient Details' : (isEditing ? 'Edit Patient' : 'Register New Patient')}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => { resetForm(); setShowModal(false); }}>✕</button>
              </div>
              <div className="modal-body">
                {selected ? (
                  <div>
                    {[
                      ['Patient No.', selected.patientNo || selected.id],
                      ['Full Name', `${selected.firstName || selected.firstname} ${selected.lastName || selected.lastname}`],
                      ['Gender', selected.gender === 1 ? 'Male' : (selected.gender === 2 ? 'Female' : (selected.gender || 'Male'))],
                      ['Age', `${selected.age} years`],
                      ['Blood Group', selected.bloodGroup || 'O+'],
                      ['Phone', selected.phone || selected.phone_no || selected.mobile_no],
                      ['Email', selected.email || selected.email_address],
                      ['Address', selected.address || selected.address1],
                      ['Registered', selected.dateEntry || (selected.date_entry ? selected.date_entry.split(' ')[0] : '')],
                      ['Status', selected.status || (selected.InActive === 0 ? 'Active' : 'Inactive')],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{k}</span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid-2">
                    <div className="form-group"><label className="form-label">First Name</label><input className="form-control" value={newPatient.firstName} onChange={e => setNewPatient({ ...newPatient, firstName: e.target.value })} placeholder="Enter First Name" /></div>
                    <div className="form-group"><label className="form-label">Last Name</label><input className="form-control" value={newPatient.lastName} onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })} placeholder="Enter Last Name" /></div>
                    <div className="form-group"><label className="form-label">Gender</label><select className="form-control" value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}><option>Male</option><option>Female</option></select></div>
                    <div className="form-group"><label className="form-label">Age (Years)</label><input className="form-control" type="number" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} placeholder="Enter Age" /></div>
                    <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} placeholder="Enter Phone" /></div>
                    <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} placeholder="Enter Email" /></div>
                    <div className="form-group"><label className="form-label">Blood Group</label><input className="form-control" value={newPatient.bloodGroup} onChange={e => setNewPatient({ ...newPatient, bloodGroup: e.target.value })} placeholder="Enter Blood Group" /></div>
                    <div className="form-group w-full" style={{ gridColumn: '1/-1' }}><label className="form-label">Address</label><input className="form-control" value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} placeholder="Enter Address" /></div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { resetForm(); setShowModal(false); }}>Close</button>
                {!selected && <button className="btn btn-primary" onClick={handleSave}>{isEditing ? 'Save Changes' : 'Save Patient'}</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
