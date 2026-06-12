import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Calendar, CheckCircle2, CheckSquare, XCircle, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

const STATUS_OPTIONS = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'];

const STATUS_COLORS = { 
  Scheduled: 'badge-info', 
  Confirmed: 'badge-success', 
  Completed: 'badge-gray', 
  Cancelled: 'badge-danger' 
};

export default function AppointmentsPage({ user }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown list metadata and Rescheduling Modal state
  const [doctors, setDoctors] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [editForm, setEditForm] = useState({
    doctor: '',
    date: '',
    hour: '09',
    minute: '00',
    ampm: 'AM',
    reason: '',
    status: 'Scheduled'
  });
  const [editExistingApps, setEditExistingApps] = useState([]);
  const [loadingEditSchedule, setLoadingEditSchedule] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch appointments from backend
  const fetchAppointments = async (searchQuery = '') => {
    try {
      setLoading(true);
      const url = searchQuery 
        ? `${API_BASE}/appointments?search=${encodeURIComponent(searchQuery)}`
        : `${API_BASE}/appointments`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch appointments');
      const data = await res.json();
      setAppointments(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Please make sure it is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(search);
  }, [search]);

  // Fetch doctors on mount for the reschedule modal dropdown
  useEffect(() => {
    fetch(`${API_BASE}/doctors`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDoctors(data);
      })
      .catch(err => console.error("Error fetching doctors:", err));
  }, []);

  // Fetch doctor agenda when doctor/date changes in the reschedule modal
  useEffect(() => {
    if (showEditModal && editForm.doctor && editForm.date) {
      setLoadingEditSchedule(true);
      fetch(`${API_BASE}/appointments?doctorId=${editForm.doctor}&date=${editForm.date}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Exclude the current appointment being rescheduled so it doesn't block itself
            const otherApps = data.filter(app => {
              const appValId = app.id || app._id;
              const editValId = editingApp?.id || editingApp?._id;
              return appValId !== editValId;
            });
            setEditExistingApps(otherApps);
          } else {
            setEditExistingApps([]);
          }
        })
        .catch(err => {
          console.error("Error fetching doctor schedule for reschedule:", err);
          setEditExistingApps([]);
        })
        .finally(() => {
          setLoadingEditSchedule(false);
        });
    } else {
      setEditExistingApps([]);
    }
  }, [editForm.doctor, editForm.date, showEditModal, editingApp]);

  // Handle status update
  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');
      
      // Update local state
      setAppointments(prev => prev.map(app => 
        (app.id === appointmentId || app._id === appointmentId) 
          ? { ...app, status: newStatus } 
          : app
      ));
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Handle delete
  const handleDelete = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/appointments/${appointmentId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete appointment');
      
      // Update local state
      setAppointments(prev => prev.filter(app => app.id !== appointmentId && app._id !== appointmentId));
    } catch (err) {
      alert('Error deleting appointment: ' + err.message);
    }
  };

  // Helper to determine slot availability in reschedule modal
  const getEditSlotDetails = (slotHour, slotAmPm) => {
    const slotApps = editExistingApps.filter(app => {
      if (!app.time) return false;
      const parts = app.time.split(' ');
      if (parts.length < 2) return false;
      const timeVal = parts[0];
      const ampmVal = parts[1];
      const appHour = timeVal.split(':')[0];
      
      const matchesTime = appHour === slotHour && ampmVal.toUpperCase() === slotAmPm.toUpperCase();
      // Ignore completed and cancelled appointments
      const isActive = app.status !== 'Cancelled' && app.status !== 'Completed';
      
      return matchesTime && isActive;
    });

    const count = slotApps.length;
    let percentage = 100;
    let label = 'Available';
    let color = 'var(--success)';
    
    if (count >= 1) {
      percentage = 15;
      label = 'Fully Booked';
      color = 'var(--danger)';
    }

    return { count, percentage, label, color, apps: slotApps };
  };

  // Populate form and open the reschedule modal
  const handleEditClick = (app) => {
    setEditingApp(app);
    let hr = '09';
    let min = '00';
    let ampmVal = 'AM';
    if (app.time) {
      const parts = app.time.split(' ');
      if (parts.length >= 2) {
        const t = parts[0].split(':');
        hr = t[0];
        min = t[1] || '00';
        ampmVal = parts[1];
      }
    }
    
    // Find doctor id by matching name or searching doctors list
    let matchedDocId = app.doctorId || '';
    if (!matchedDocId && app.doctor) {
      const docNameClean = app.doctor.replace('Dr. ', '').toLowerCase();
      const docFound = doctors.find(d => 
        `${d.firstName} ${d.lastName}`.toLowerCase() === docNameClean
      );
      if (docFound) {
        matchedDocId = docFound.id || docFound._id;
      }
    }

    setEditForm({
      doctor: matchedDocId,
      date: app.date || '',
      hour: hr,
      minute: min,
      ampm: ampmVal,
      reason: app.reason || '',
      status: app.status || 'Scheduled'
    });
    setShowEditModal(true);
  };

  // Submit rescheduled appointment to backend
  const handleUpdateSave = async () => {
    if (!editForm.doctor || !editForm.date) {
      return alert('Fill in required fields (*).');
    }

    // Double-booking check
    const detail = getEditSlotDetails(editForm.hour, editForm.ampm);
    if (detail.count >= 1) {
      return alert(`This time slot (${editForm.hour}:00 ${editForm.ampm}) is already booked for this doctor on this date. Please choose a different slot.`);
    }

    try {
      setSavingEdit(true);
      const res = await fetch(`${API_BASE}/appointments/${editingApp.id || editingApp._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor: editForm.doctor,
          date: editForm.date,
          hour: editForm.hour,
          minute: editForm.minute,
          ampm: editForm.ampm,
          status: editForm.status,
          reason: editForm.reason
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reschedule appointment');
      }

      alert('Appointment rescheduled successfully!');
      setShowEditModal(false);
      fetchAppointments(search);
    } catch (err) {
      alert('Error updating appointment: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Calculate dynamic stats
  const stats = {
    Scheduled: appointments.filter(a => a.status === 'Scheduled').length,
    Confirmed: appointments.filter(a => a.status === 'Confirmed').length,
    Completed: appointments.filter(a => a.status === 'Completed').length,
    Cancelled: appointments.filter(a => a.status === 'Cancelled').length,
  };

  return (
    <div>
      <Topbar title="Appointments" user={user?.name} />
      <div className="page-body has-stats">
        <div className="page-header">
          <div>
            <h2>Appointment Registry</h2>
            <p>{appointments.length} active appointments in database</p>
          </div>
          <div className="page-actions">
            <div className="search-bar">
              <Search />
              <input 
                placeholder="Search patient, doctor, dept..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/appointment/add')}>
              <Plus size={15} /> New Appointment
            </button>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div className="grid-4" style={{ marginBottom: 16, gap: 16 }}>
          {[
            { label: 'Scheduled', count: stats.Scheduled, color: '#3b82f6', icon: <Calendar size={16} /> },
            { label: 'Confirmed', count: stats.Confirmed, color: '#10b981', icon: <CheckCircle2 size={16} /> },
            { label: 'Completed', count: stats.Completed, color: '#64748b', icon: <CheckSquare size={16} /> },
            { label: 'Cancelled', count: stats.Cancelled, color: '#ef4444', icon: <XCircle size={16} /> },
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
                <span style={{ color: s.color, display: 'inline-flex' }}>{s.icon}</span>
              </div>
              <div className="stat-info">
                <h3 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: 800 }}>{s.count}</h3>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', letterSpacing: '0.3px', fontWeight: 700 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      Loading appointments from server...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => {
                    const id = a.id || a._id;
                    return (
                      <tr key={id}>
                        <td style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>#{id.slice(-6)}</td>
                        <td style={{ fontWeight: 600 }}>{a.patientName}</td>
                        <td style={{ color: 'var(--text)', fontWeight: 500 }}>{a.doctor}</td>
                        <td><span className="badge badge-gray" style={{ fontSize: 11 }}>{a.department || 'N/A'}</span></td>
                        <td>{a.date}</td>
                        <td>{a.time}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12.5, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.reason}>
                          {a.reason || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No reason provided</span>}
                        </td>
                        <td>
                          <select 
                            value={a.status} 
                            onChange={e => handleStatusChange(id, e.target.value)}
                            className={`badge ${STATUS_COLORS[a.status] || 'badge-gray'}`}
                            style={{ 
                              border: 'none', 
                              cursor: 'pointer', 
                              outline: 'none', 
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              appearance: 'none',
                              textAlign: 'center'
                            }}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt} value={opt} style={{ color: '#000', background: '#fff' }}>{opt}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              style={{ color: 'var(--primary)', padding: 4 }}
                              onClick={() => handleEditClick(a)}
                              title="Reschedule / Edit"
                            >
                              <Edit size={15} />
                            </button>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              style={{ color: 'var(--danger)', padding: 4 }}
                              onClick={() => handleDelete(id)}
                              title="Delete Appointment"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showEditModal && editingApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '850px',
            background: 'var(--card-bg, #ffffff)',
            borderRadius: 16,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-light, #f8fafc)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 750, color: 'var(--text)' }}>Reschedule / Edit Booking</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  Modify scheduled patient visit or change time and doctor.
                </p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  lineHeight: '1'
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              padding: 24,
              overflowY: 'auto',
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: 24
            }}>
              {/* Form Side */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Patient (Read-only)</label>
                  <input 
                    type="text" 
                    value={editingApp.patientName} 
                    disabled 
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color, #e2e8f0)',
                      background: 'var(--bg-light, #f8fafc)',
                      color: 'var(--text-muted, #64748b)',
                      fontSize: 13.5,
                      fontWeight: 500
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Consultant Doctor *</label>
                  <select 
                    value={editForm.doctor}
                    onChange={e => setEditForm(prev => ({ ...prev, doctor: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color, #e2e8f0)',
                      fontSize: 13.5,
                      fontWeight: 500,
                      background: 'var(--card-bg, #ffffff)',
                      color: 'var(--text)'
                    }}
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(doc => (
                      <option key={doc.id || doc._id} value={doc.id || doc._id}>
                        Dr. {doc.firstName} {doc.lastName} ({doc.department || doc.designation || 'Specialist'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Appointment Date *</label>
                    <input 
                      type="date" 
                      value={editForm.date}
                      onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border-color, #e2e8f0)',
                        fontSize: 13.5,
                        background: 'var(--card-bg, #ffffff)',
                        color: 'var(--text)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Booking Time *</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select 
                        value={editForm.hour}
                        onChange={e => setEditForm(prev => ({ ...prev, hour: e.target.value }))}
                        style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 13, background: 'var(--card-bg, #ffffff)', color: 'var(--text)' }}
                      >
                        {['09', '10', '11', '12', '01', '02', '03', '04', '05'].map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <select 
                        value={editForm.minute}
                        onChange={e => setEditForm(prev => ({ ...prev, minute: e.target.value }))}
                        style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 13, background: 'var(--card-bg, #ffffff)', color: 'var(--text)' }}
                      >
                        {['00', '15', '30', '45'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select 
                        value={editForm.ampm}
                        onChange={e => setEditForm(prev => ({ ...prev, ampm: e.target.value }))}
                        style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 13, background: 'var(--card-bg, #ffffff)', color: 'var(--text)' }}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Status *</label>
                    <select 
                      value={editForm.status}
                      onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border-color, #e2e8f0)',
                        fontSize: 13.5,
                        fontWeight: 500,
                        background: 'var(--card-bg, #ffffff)',
                        color: 'var(--text)'
                      }}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Reason for Visit</label>
                  <textarea 
                    rows="3"
                    value={editForm.reason}
                    onChange={e => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter diagnosis symptoms or checkup details..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color, #e2e8f0)',
                      fontSize: 13.5,
                      resize: 'none',
                      background: 'var(--card-bg, #ffffff)',
                      color: 'var(--text)'
                    }}
                  />
                </div>
              </div>

              {/* Availability Visualizer Side */}
              <div style={{ 
                borderLeft: '1px solid rgba(0, 0, 0, 0.06)', 
                paddingLeft: 24,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  Doctor Availability Load
                </h4>

                {!editForm.doctor ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-light, #f8fafc)', borderRadius: 10, border: '1.5px dashed var(--border-color, #e2e8f0)', padding: 20, textAlign: 'center' }}>
                    Select a consultant doctor to inspect slot availability load graph.
                  </div>
                ) : loadingEditSchedule ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Retrieving schedule timeline...
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      Slot Load Indicator
                    </div>

                    <div style={{ 
                      flex: 1, 
                      display: 'flex', 
                      gap: 8, 
                      alignItems: 'flex-end', 
                      height: 180, 
                      background: 'var(--bg-light, #f8fafc)', 
                      borderRadius: 10, 
                      padding: '16px 12px',
                      border: '1px solid rgba(0,0,0,0.03)',
                      position: 'relative'
                    }}>
                      {[
                        { hour: '09', ampm: 'AM', label: '9 AM' },
                        { hour: '10', ampm: 'AM', label: '10 AM' },
                        { hour: '11', ampm: 'AM', label: '11 AM' },
                        { hour: '12', ampm: 'PM', label: '12 PM' },
                        { hour: '01', ampm: 'PM', label: '1 PM' },
                        { hour: '02', ampm: 'PM', label: '2 PM' },
                        { hour: '03', ampm: 'PM', label: '3 PM' },
                        { hour: '04', ampm: 'PM', label: '4 PM' },
                        { hour: '05', ampm: 'PM', label: '5 PM' },
                      ].map(slot => {
                        const detail = getEditSlotDetails(slot.hour, slot.ampm);
                        const isSelected = editForm.hour === slot.hour && editForm.ampm === slot.ampm;
                        
                        return (
                          <div 
                            key={slot.label} 
                            onClick={() => {
                              if (detail.count >= 1) {
                                alert("This time slot is already booked and unavailable. Please select another slot.");
                                return;
                              }
                              setEditForm(prev => ({
                                ...prev,
                                hour: slot.hour,
                                minute: '00',
                                ampm: slot.ampm
                              }));
                            }}
                            style={{ 
                              flex: 1, 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              height: '100%', 
                              justifyContent: 'flex-end',
                              cursor: detail.count >= 1 ? 'not-allowed' : 'pointer',
                              position: 'relative'
                            }}
                          >
                            <div style={{
                              width: '100%',
                              height: `${detail.percentage}%`,
                              background: isSelected ? 'var(--primary, #3b5bdb)' : detail.color,
                              borderRadius: 4,
                              minHeight: 12,
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isSelected ? '0 0 10px rgba(59, 91, 219, 0.45)' : 'none',
                              opacity: (detail.count >= 1 && !isSelected) ? 0.45 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: 9,
                              fontWeight: 700
                            }}>
                              {detail.count >= 1 ? '✗' : '✓'}
                            </div>

                            <div 
                              style={{ 
                                marginTop: 8, 
                                fontSize: 9.5, 
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? 'var(--primary)' : 'var(--text-secondary)'
                              }}
                            >
                              {slot.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 14, fontSize: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--success)', display: 'inline-block' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Available</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--danger)', display: 'inline-block' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Booked (Unavailable)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              background: 'var(--bg-light, #f8fafc)'
            }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowEditModal(false)}
                disabled={savingEdit}
                style={{ minWidth: 100 }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleUpdateSave}
                disabled={savingEdit}
                style={{ minWidth: 150 }}
              >
                {savingEdit ? 'Rescheduling...' : 'Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
