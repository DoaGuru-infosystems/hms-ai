import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Loader2, Calendar, User, Clock, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';
const HOURS = Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0'));
const MINS = ['00','15','30','45'];

const TIMELINE_SLOTS = [
  { label: '9 AM', hour: '09', ampm: 'AM' },
  { label: '10 AM', hour: '10', ampm: 'AM' },
  { label: '11 AM', hour: '11', ampm: 'AM' },
  { label: '12 PM', hour: '12', ampm: 'PM' },
  { label: '1 PM', hour: '01', ampm: 'PM' },
  { label: '2 PM', hour: '02', ampm: 'PM' },
  { label: '3 PM', hour: '03', ampm: 'PM' },
  { label: '4 PM', hour: '04', ampm: 'PM' },
  { label: '5 PM', hour: '05', ampm: 'PM' }
];

export default function AppointmentAdd({ user }) {
  const navigate = useNavigate();
  
  // Lists fetched from backend
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Schedule availability details
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Form State
  const [form, setForm] = useState({ 
    patient: '', 
    doctor: '', 
    department: '', 
    date: new Date().toISOString().split('T')[0], 
    hour: '09', 
    minute: '00', 
    ampm: 'AM', 
    reason: '' 
  });

  // Fetch initial dropdown metadata from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [patientsRes, doctorsRes, deptsRes] = await Promise.all([
          fetch(`${API_BASE}/patients`),
          fetch(`${API_BASE}/doctors`),
          fetch(`${API_BASE}/departments`)
        ]);

        if (!patientsRes.ok || !doctorsRes.ok || !deptsRes.ok) {
          throw new Error('Failed to load list metadata from backend.');
        }

        const [patientsData, doctorsData, deptsData] = await Promise.all([
          patientsRes.json(),
          doctorsRes.json(),
          deptsRes.json()
        ]);

        setPatients(patientsData);
        setDoctors(doctorsData);
        setDepartments(deptsData);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Error fetching patient/doctor lists. Check if backend is running on port 5001.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch existing doctor appointments when doctor or date changes
  useEffect(() => {
    if (form.doctor && form.date) {
      setLoadingSchedule(true);
      fetch(`${API_BASE}/appointments?doctorId=${form.doctor}&date=${form.date}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setExistingAppointments(data);
          } else {
            setExistingAppointments([]);
          }
        })
        .catch(err => {
          console.error("Error fetching doctor schedule:", err);
          setExistingAppointments([]);
        })
        .finally(() => {
          setLoadingSchedule(false);
        });
    } else {
      setExistingAppointments([]);
    }
  }, [form.doctor, form.date]);

  // Sync department when doctor is selected
  const handleDoctorChange = (docId) => {
    const selectedDoc = doctors.find(d => d.id === docId || d._id === docId);
    let deptId = '';
    
    if (selectedDoc && selectedDoc.department) {
      const matchedDept = departments.find(d => 
        d.name.toLowerCase() === selectedDoc.department.toLowerCase() ||
        d.code.toLowerCase() === selectedDoc.department.toLowerCase()
      );
      if (matchedDept) {
        deptId = matchedDept.id || matchedDept._id;
      }
    }
    
    setForm(prev => ({ 
      ...prev, 
      doctor: docId,
      department: deptId || prev.department
    }));
  };

  // Check how many appointments in a slot
  const getSlotDetails = (slotHour, slotAmPm) => {
    const slotApps = existingAppointments.filter(app => {
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

  const handleSlotClick = (slotHour, slotAmPm, detail) => {
    if (detail.count >= 1) {
      alert("This time slot is already booked and unavailable. Please select another slot.");
      return;
    }
    setForm(prev => ({
      ...prev,
      hour: slotHour,
      minute: '00',
      ampm: slotAmPm
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.patient || !form.doctor || !form.date) {
      return alert('Fill in required fields (*).');
    }

    // Double-booking validation check before saving
    const detail = getSlotDetails(form.hour, form.ampm);
    if (detail.count >= 1) {
      return alert(`This time slot (${form.hour}:00 ${form.ampm}) is already booked for this doctor. Please choose a different time.`);
    }

    try {
      setSaving(true);
      setError('');
      
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save appointment');
      }

      setSaved(true);
      setForm({ 
        patient: '', 
        doctor: '', 
        department: '', 
        date: new Date().toISOString().split('T')[0], 
        hour: '09', 
        minute: '00', 
        ampm: 'AM', 
        reason: '' 
      });

      setTimeout(() => {
        setSaved(false);
        navigate('/appointment/list');
      }, 2000);

    } catch (err) {
      setError(err.message || 'Error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const selectedDoctorObj = doctors.find(d => d.id === form.doctor || d._id === form.doctor);

  return (
    <div>
      <Topbar title="Schedule Consultation Visit" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Book Appointment</h2>
            <p>Schedule a patient appointment with slot load visualizer</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/appointment/list')}>
            <ArrowLeft size={14} style={{ marginRight: 6 }} /> Back to List
          </button>
        </div>

        {saved && (
          <div style={{ background: 'var(--success-soft)', border: '1px solid rgba(18,184,134,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#0ca678', fontWeight: 600 }}>
            ✓ Appointment scheduled successfully! Redirecting...
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(250,82,82,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#fa5252' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }} className="grid-2">
          {/* Form Card */}
          <div className="card" style={{ flex: 1 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12, color: 'var(--text-secondary)' }}>
                <Loader2 className="animate-spin" size={24} />
                <span>Loading registration lists...</span>
              </div>
            ) : (
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select 
                    className="form-control" 
                    value={form.patient} 
                    onChange={e => setForm({ ...form, patient: e.target.value })} 
                    required
                  >
                    <option value="">— Select Patient —</option>
                    {patients.map(p => {
                      const id = p.id || p._id;
                      return (
                        <option key={id} value={id}>
                          {p.patientNo} — {p.firstName || p.firstname} {p.lastName || p.lastname}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Consultant Doctor *</label>
                  <select 
                    className="form-control" 
                    value={form.doctor} 
                    onChange={e => handleDoctorChange(e.target.value)} 
                    required
                  >
                    <option value="">— Select Doctor —</option>
                    {doctors.map(d => {
                      const id = d.id || d._id;
                      return (
                        <option key={id} value={id}>
                          Dr. {d.firstName || d.firstname} {d.lastName || d.lastname} ({d.department})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select 
                    className="form-control" 
                    value={form.department} 
                    onChange={e => setForm({ ...form, department: e.target.value })}
                  >
                    <option value="">— Select Department —</option>
                    {departments.map(d => {
                      const id = d.id || d._id;
                      return (
                        <option key={id} value={id}>
                          {d.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Appointment Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Appointment Time</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select 
                      className="form-control" 
                      value={form.hour} 
                      onChange={e => setForm({ ...form, hour: e.target.value })}
                    >
                      {HOURS.map(h => <option key={h}>{h}</option>)}
                    </select>
                    <select 
                      className="form-control" 
                      value={form.minute} 
                      onChange={e => setForm({ ...form, minute: e.target.value })}
                    >
                      {MINS.map(m => <option key={m}>{m}</option>)}
                    </select>
                    <select 
                      className="form-control" 
                      value={form.ampm} 
                      onChange={e => setForm({ ...form, ampm: e.target.value })}
                    >
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Remarks</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    value={form.reason} 
                    onChange={e => setForm({ ...form, reason: e.target.value })} 
                    placeholder="Enter visit remarks or illness brief..." 
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <Plus size={14} style={{ marginRight: 4 }} /> {saving ? 'Scheduling...' : 'Confirm Appointment'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setForm({ patient: '', doctor: '', department: '', date: new Date().toISOString().split('T')[0], hour: '09', minute: '00', ampm: 'AM', reason: '' })}
                    disabled={saving}
                  >
                    Reset Form
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Visualizer Panel */}
          <div className="card" style={{ flex: 1, minHeight: 460, display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--surface-border)', paddingBottom: 12, marginBottom: 12 }}>
              <Clock size={16} color="var(--primary)" />
              Doctor Availability Load Chart
            </h4>

            {!form.doctor ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: 24, textAlign: 'center' }}>
                <User size={36} color="var(--text-light)" style={{ marginBottom: 10 }} />
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>No Doctor Selected</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Select a consultant doctor to inspect availability timeline load graph.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary-soft)', border: '1px solid rgba(59,91,219,0.1)', padding: 10, borderRadius: 8, marginBottom: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 700
                  }}>
                    {selectedDoctorObj ? selectedDoctorObj.firstName[0] : 'D'}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
                      Dr. {selectedDoctorObj?.firstName} {selectedDoctorObj?.lastName}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                      {selectedDoctorObj?.department} · Date: {form.date}
                    </div>
                  </div>
                </div>

                {loadingSchedule ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Loader2 className="animate-spin" size={24} style={{ marginBottom: 10 }} />
                    <span style={{ fontSize: 12 }}>Analyzing doctor's agenda loads...</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                      Click on a vertical slot bar below to instantly pick that appointment hour.
                    </p>

                    {/* Chart Container */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: '#F8F9FD',
                      borderRadius: 10,
                      border: '1px solid var(--surface-border)',
                      padding: 16,
                      flex: 1,
                      minHeight: 220
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        height: 140,
                        position: 'relative',
                        paddingBottom: 4,
                        borderBottom: '2px solid var(--surface-border)'
                      }}>
                        {/* Horizontal Grid lines */}
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', height: 1, borderTop: '1px dashed #e2e8f0', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, borderTop: '1px dashed #e2e8f0', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', height: 1, borderTop: '1px dashed #e2e8f0', pointerEvents: 'none' }} />

                        {TIMELINE_SLOTS.map(slot => {
                          const detail = getSlotDetails(slot.hour, slot.ampm);
                          const isSelected = form.hour === slot.hour && form.ampm === slot.ampm;
                          const barColor = isSelected ? 'var(--primary)' : detail.color;
                          
                          return (
                            <div 
                              key={slot.label} 
                              onClick={() => handleSlotClick(slot.hour, slot.ampm, detail)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                flex: 1,
                                cursor: detail.count >= 2 ? 'not-allowed' : 'pointer',
                                height: '100%',
                                justifyContent: 'flex-end',
                                position: 'relative',
                                zIndex: 1
                              }}
                              title={`${slot.label}: ${detail.label}`}
                            >
                              {/* Count Tooltip */}
                              <span style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                                marginBottom: 4,
                                position: 'absolute',
                                top: -18
                              }}>
                                {detail.count === 0 ? 'Free' : `${detail.count} B`}
                              </span>

                              {/* Bar */}
                              <div style={{
                                width: 22,
                                height: `${detail.percentage}%`,
                                background: isSelected ? 'var(--gradient-primary)' : barColor,
                                borderRadius: '4px 4px 0 0',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: isSelected ? '1px solid var(--primary-dark)' : '1px solid transparent',
                                boxShadow: isSelected ? '0 4px 10px rgba(59,91,219,0.3)' : 'none',
                              }} 
                              onMouseEnter={e => {
                                if (detail.count < 2 && !isSelected) {
                                  e.currentTarget.style.filter = 'brightness(0.9)';
                                  e.currentTarget.style.transform = 'scaleY(1.05)';
                                }
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.filter = 'none';
                                e.currentTarget.style.transform = 'none';
                              }}
                              />

                              {/* Selected Tick Indicator */}
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '30%',
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  background: 'white',
                                  border: '2px solid var(--primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                }}>
                                  <Check size={8} color="var(--primary)" strokeWidth={4} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* X-axis labels */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        {TIMELINE_SLOTS.map(slot => (
                          <div 
                            key={slot.label} 
                            style={{ 
                              flex: 1, 
                              textAlign: 'center', 
                              fontSize: 9.5, 
                              fontWeight: (form.hour === slot.hour && form.ampm === slot.ampm) ? 700 : 500,
                              color: (form.hour === slot.hour && form.ampm === slot.ampm) ? 'var(--primary)' : 'var(--text-secondary)'
                            }}
                          >
                            {slot.label}
                          </div>
                        ))}
                      </div>
                    </div>

                     {/* Chart Legend */}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
