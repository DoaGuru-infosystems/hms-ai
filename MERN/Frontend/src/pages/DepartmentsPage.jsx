import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import Topbar from '../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function DepartmentsPage({ user }) {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/departments`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDepts(data);
        } else {
          setDepts([]);
        }
      })
      .catch(err => {
        console.error('Error fetching departments:', err);
        setDepts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Topbar title="Departments" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Departments</h2>
            <p>{depts.length} active departments</p>
          </div>
          <button className="btn btn-primary" onClick={() => alert('Add department feature triggered')}><Plus size={15} /> Add Department</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40, gap: 10, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={18} />
            Loading clinical departments...
          </div>
        ) : (
          <div className="grid-3">
            {depts.map(d => (
              <div key={d.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏥</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Code: {d.code}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm"><Edit2 size={13} /></button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {depts.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                No active departments found in the database.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
