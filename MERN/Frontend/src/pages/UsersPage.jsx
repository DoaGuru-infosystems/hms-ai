import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, Shield, UserPlus, Key, ClipboardList, Check, Loader2 } from 'lucide-react';
import Topbar from '../components/Topbar';

const ROLE_BADGE = { 
  Administrator: 'badge-purple', 
  Doctor: 'badge-info', 
  Nurse: 'badge-success', 
  Receptionist: 'badge-gray', 
  Pharmacist: 'badge-warning',
  Cashier: 'badge-warning'
};

const initialRoles = [
  { role: 'Administrator', desc: 'Full administrative access to all system settings, backups, financial data, and staff logs.', usersCount: 1, permissions: ['OPD', 'IPD', 'Billing', 'Users', 'Reports', 'Admin'] },
  { role: 'Doctor', desc: 'Medical records access, clinical diagnoses, OPD/IPD consultations, patient prescriptions, and vital histories.', usersCount: 3, permissions: ['OPD', 'IPD', 'Reports'] },
  { role: 'Nurse', desc: 'Patient clinical charting, bed assignments, vital signs recording, medication tracking, progress notes, and intake/output logs.', usersCount: 1, permissions: ['OPD', 'IPD', 'Reports'] },
  { role: 'Receptionist', desc: 'Patient admissions, registration, appointment scheduling, search patient registers, and room queries.', usersCount: 1, permissions: ['OPD', 'IPD'] },
  { role: 'Pharmacist', desc: 'Medicine inventory management, drug dispensing register, and drug order requests.', usersCount: 0, permissions: ['OPD', 'Reports'] },
  { role: 'Cashier', desc: 'Invoicing, POS checkout terminal, bill payments, OR receipts logging.', usersCount: 0, permissions: ['Billing'] },
];

export default function UsersPage({ user }) {
  const location = useLocation();
  const path = location.pathname;

  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [deptsList, setDeptsList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Registration form states
  const [empNo, setEmpNo] = useState('EMP-101');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRole, setSelectedRole] = useState('Doctor');
  const [selectedDept, setSelectedDept] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes] = await Promise.all([
        fetch('http://localhost:5001/api/users'),
        fetch('http://localhost:5001/api/departments')
      ]);

      if (usersRes.ok && deptsRes.ok) {
        const uData = await usersRes.json();
        const dData = await deptsRes.json();
        setUsersList(uData);
        setDeptsList(dData);

        if (dData.length > 0) {
          setSelectedDept(dData[0].name);
        }

        setEmpNo('EMP-' + String(100 + uData.length + 1));
      }
    } catch (err) {
      console.error('Error fetching staff info:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return usersList.filter(u =>
      `${u.firstName || ''} ${u.lastName || ''} ${u.role || ''} ${u.department || ''}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [usersList, search]);

  const handleRegister = (e) => {
    e.preventDefault();
    
    const payload = {
      firstName,
      lastName,
      role: selectedRole,
      department: selectedDept || 'General Medicine',
      designation,
      email,
      phone,
      username: firstName.toLowerCase() + String(Math.floor(10 + Math.random() * 90)),
      password: 'password'
    };

    fetch('http://localhost:5001/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        setSuccessMsg('✓ Employee ' + firstName + ' ' + lastName + ' successfully registered with ID ' + (data.empNo || empNo));
        fetchData();
        // Reset Form
        setFirstName('');
        setLastName('');
        setDesignation('');
        setEmail('');
        setPhone('');
        setTimeout(() => setSuccessMsg(''), 4000);
      })
      .catch(err => {
        alert('Failed to register employee: ' + err.message);
      });
  };

  const renderContent = () => {
    switch (path) {
      case '/users/add':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Add New System User</h2>
                <p>Create credentials and assign hospital departments to a new employee</p>
              </div>
            </div>

            {successMsg && (
              <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#34d399', fontWeight: 600 }}>
                {successMsg}
              </div>
            )}

            <div className="card" style={{ maxWidth: 800 }}>
              <form onSubmit={handleRegister}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Employee Number / ID</label>
                    <input className="form-control" value={empNo} disabled style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select System Role</label>
                    <select className="form-control" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                      <option>Administrator</option>
                      <option>Doctor</option>
                      <option>Nurse</option>
                      <option>Receptionist</option>
                      <option>Pharmacist</option>
                      <option>Cashier</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-control" placeholder="Enter first name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-control" placeholder="Enter last name" value={lastName} onChange={e => setLastName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assigned Department</label>
                    <select className="form-control" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                      {deptsList.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation / Title</label>
                    <input className="form-control" placeholder="e.g. Senior Consultant / Staff Nurse" value={designation} onChange={e => setDesignation(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-control" placeholder="name@medicare.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-control" placeholder="Enter phone number" value={phone} onChange={e => setPhone(e.target.value)} required />
                  </div>
                </div>
                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                  <button type="submit" className="btn btn-primary"><UserPlus size={14}/> Register & Generate Profile</button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setFirstName(''); setLastName(''); }}>Clear Form</button>
                </div>
              </form>
            </div>
          </div>
        );

      case '/users/roles':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>User Roles & Security Permissions</h2>
                <p>Configure user security levels, modules visibility and system access tokens</p>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 24 }}>
              {initialRoles.map(r => (
                <div key={r.role} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Shield size={16} className="text-accent" />
                        {r.role}
                      </h3>
                      <span className={`badge ${ROLE_BADGE[r.role] || 'badge-gray'}`}>{usersList.filter(u => u.role === r.role).length} Staff Active</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>{r.desc}</p>
                    
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Module Permissions</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                      {['OPD', 'IPD', 'Billing', 'Users', 'Reports', 'Admin'].map(mod => {
                        const hasPerm = r.permissions.includes(mod);
                        return (
                          <span key={mod} className={`badge ${hasPerm ? 'badge-success' : 'badge-gray'}`} style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: hasPerm ? 1 : 0.4 }}>
                            {hasPerm && <Check size={10} />}
                            {mod}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 12 }} onClick={() => alert('Editing permissions is disabled for system defaults')}><Key size={12}/> Edit Access</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case '/users/list':
      default:
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Staff & User Masterlist</h2>
                <p>{usersList.length} registered employees and healthcare specialists</p>
              </div>
              <div className="page-actions">
                <div className="search-bar">
                  <Search />
                  <input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
              {['Doctor', 'Nurse', 'Other'].map(role => (
                <div key={role} className="card" style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>
                    {role === 'Other' ? usersList.filter(u => u.role !== 'Doctor' && u.role !== 'Nurse').length : usersList.filter(u => u.role === role).length}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {role === 'Other' ? 'Admin / Front Desk Support' : role + 's Registered'}
                  </div>
                </div>
              ))}
            </div>

            {/* User List Table */}
            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Emp No.</th><th>Name</th><th>Role</th><th>Department</th><th>Designation</th><th>Email</th><th>Phone</th><th>Joined</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.id}>
                        <td><span style={{ fontFamily: 'monospace', color: 'var(--accent-light)', fontSize: 12, fontWeight: 600 }}>{u.empNo}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                              {(u.firstName || 'S')[0]}
                            </div>
                            <span style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td><span className={`badge ${ROLE_BADGE[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                        <td>{u.department}</td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{u.designation}</td>
                        <td style={{ fontSize: 12 }}>{u.email}</td>
                        <td style={{ fontSize: 12 }}>{u.phone}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.joinDate}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => alert('Edit triggered')}><Edit2 size={14} /></button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => alert('Delete triggered')}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={9} className="empty-state">No staff members found matching query</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <Topbar title="Staff & Users" user={user?.name} />
      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, gap: 10, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h3>Fetching Medicare Directory...</h3>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
}
