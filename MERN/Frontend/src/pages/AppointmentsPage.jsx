import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Calendar, CheckCircle2, CheckSquare, XCircle } from 'lucide-react';
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
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDelete(id)}
                            title="Delete Appointment"
                          >
                            <Trash2 size={15} />
                          </button>
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
    </div>
  );
}
