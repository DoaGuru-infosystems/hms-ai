import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';
const HOURS = Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0'));
const MINS = ['00','15','30','45'];

export default function AppointmentAdd({ user }) {
  const navigate = useNavigate();
  
  // Lists fetched from backend
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  
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
    date: '', 
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

  // Sync department when doctor is selected
  const handleDoctorChange = (docId) => {
    const selectedDoc = doctors.find(d => d.id === docId || d._id === docId);
    let deptId = '';
    
    if (selectedDoc && selectedDoc.department) {
      // Find matching department in our departments list
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.patient || !form.doctor || !form.date) {
      return alert('Fill in required fields (*).');
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
        date: '', 
        hour: '09', 
        minute: '00', 
        ampm: 'AM', 
        reason: '' 
      });

      // Clear success banner and navigate back to list after delay
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

  return (
    <div>
      <Topbar title="Add New Appointment" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Add New Appointment</h2>
            <p>Schedule a patient appointment</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/appointment/list')}>
            <ArrowLeft size={14} style={{ marginRight: 6 }} /> Back to List
          </button>
        </div>

        {saved && (
          <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#34d399', fontWeight: 600 }}>
            ✓ Appointment scheduled successfully! Redirecting...
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#ef4444' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="card" style={{ maxWidth: 650 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: 12 }}>Loading patient and doctor data...</div>
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
                        {p.patientNo} — {p.firstName} {p.lastName}
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
                        Dr. {d.firstName} {d.lastName} ({d.department})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department (Auto-filled on doctor select)</label>
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
                <label className="form-label">Time</label>
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
                  placeholder="Enter reason for appointment..." 
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Plus size={14} style={{ marginRight: 4 }} /> {saving ? 'Saving...' : 'Save Appointment'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setForm({ patient: '', doctor: '', department: '', date: '', hour: '09', minute: '00', ampm: 'AM', reason: '' })}
                  disabled={saving}
                >
                  Reset
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
