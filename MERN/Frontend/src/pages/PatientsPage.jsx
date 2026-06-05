import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import Topbar from '../components/Topbar';

const STATUS_BADGE = { Active: 'badge-success', Admitted: 'badge-info', Discharged: 'badge-gray' };

export default function PatientsPage({ user }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [patientsList, setPatientsList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    age: '',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    address: ''
  });

  const resetForm = () => {
    setNewPatient({
      firstName: '',
      lastName: '',
      gender: 'Male',
      age: '',
      bloodGroup: 'O+',
      phone: '',
      email: '',
      address: ''
    });
    setIsEditing(false);
    setEditId(null);
    setSelected(null);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = () => {
    fetch('http://localhost:5001/api/patients')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPatientsList(data);
        } else {
          setPatientsList([]);
        }
      })
      .catch(err => {
        console.log('Patients fetch offline.', err);
        setPatientsList([]);
      });
  };

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

    fetch(`http://localhost:5001/api/patients/${id}`, {
      method: 'DELETE'
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete patient');
        return res.json();
      })
      .then(() => {
        fetchPatients();
      })
      .catch(err => {
        console.log('Failed to delete patient, running offline fallback.', err);
        setPatientsList(prev => prev.filter(p => p.id !== id && p.patientNo !== id));
      });
  };

  const handleSave = () => {
    if (!newPatient.firstName || !newPatient.lastName) {
      alert('Please fill in Name fields.');
      return;
    }

    if (isEditing) {
      fetch(`http://localhost:5001/api/patients/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to update patient');
          return res.json();
        })
        .then(() => {
          fetchPatients();
          setShowModal(false);
          resetForm();
        })
        .catch(err => {
          console.log('Failed to update patient, running offline fallback.', err);
          setPatientsList(prev => prev.map(p => 
            (p.id === editId || p.patientNo === editId) 
              ? { ...p, ...newPatient } 
              : p
          ));
          setShowModal(false);
          resetForm();
        });
    } else {
      fetch('http://localhost:5001/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      })
        .then(res => res.json())
        .then(data => {
          fetchPatients();
          setShowModal(false);
          resetForm();
        })
        .catch(err => {
          console.log('Failed to save patient, running offline fallback.', err);
          const fallback = {
            ...newPatient,
            id: String(patientsList.length + 1),
            patientNo: `P-00000${patientsList.length + 1}`,
            dateEntry: new Date().toISOString().split('T')[0],
            status: 'Active'
          };
          setPatientsList([...patientsList, fallback]);
          setShowModal(false);
          resetForm();
        });
    }
  };

  const filtered = patientsList.filter(p =>
    `${p.firstName} ${p.lastName} ${p.patientNo}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Topbar title="Patient Master" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Patient Directory</h2>
            <p>{patientsList.length} registered patients</p>
          </div>
          <div className="page-actions">
            <div className="search-bar">
              <Search />
              <input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
              <Plus size={15} /> New Patient
            </button>
          </div>
        </div>

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
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>{p.patientNo}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '50%', 
                          background: 'var(--gradient-primary)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justify: 'center', 
                          fontSize: 12, 
                          fontWeight: 700,
                          color: 'white',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
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
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input className="form-control" value={newPatient.firstName} onChange={e => setNewPatient({ ...newPatient, firstName: e.target.value })} placeholder="Enter First Name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input className="form-control" value={newPatient.lastName} onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })} placeholder="Enter Last Name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select className="form-control" value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}>
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Age (Years)</label>
                      <input className="form-control" type="number" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} placeholder="Enter Age" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="form-control" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} placeholder="Enter Phone" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-control" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} placeholder="Enter Email" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Blood Group</label>
                      <input className="form-control" value={newPatient.bloodGroup} onChange={e => setNewPatient({ ...newPatient, bloodGroup: e.target.value })} placeholder="Enter Blood Group" />
                    </div>
                    <div className="form-group w-full" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Address</label>
                      <input className="form-control" value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} placeholder="Enter Address" />
                    </div>
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
