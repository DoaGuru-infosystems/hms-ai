import { useState, useEffect } from 'react';
import { Search, Plus, Eye } from 'lucide-react';
import Topbar from '../components/Topbar';

export default function IPDPage({ user }) {
  const [search, setSearch] = useState('');
  const [ipdList, setIpdList] = useState([]);

  useEffect(() => {
    fetchIpd();
  }, []);

  const fetchIpd = () => {
    fetch('http://localhost:5001/api/ipd')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIpdList(data);
        } else {
          setIpdList([]);
        }
      })
      .catch(err => {
        console.log('Failed to fetch IPD records.', err);
        setIpdList([]);
      });
  };

  const filtered = ipdList.filter(r =>
    `${r.patientName || ''} ${r.ioId || ''} ${r.doctor || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Topbar title="IPD — In-Patient Department" user={user?.name} />
      <div className="page-body has-stats">
        <div className="page-header">
          <div>
            <h2>IPD Directory</h2>
            <p>Manage admitted patients</p>
          </div>
          <div className="page-actions">
            <div className="search-bar">
              <Search />
              <input placeholder="Search IPD..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary">
              <Plus size={15} /> Admit Patient
            </button>
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: 16, gap: 16 }}>
          {[
            { label: 'Currently Admitted', value: ipdList.filter(r => r.status === 'Admitted').length, color: '#4f46e5' },
            { label: 'Discharged (Month)', value: ipdList.filter(r => r.status === 'Discharged').length, color: '#10b981' },
            { label: 'Total Records', value: ipdList.length, color: '#8b5cf6' },
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
                <span style={{ color: s.color, fontWeight: 800, fontSize: 14 }}>★</span>
              </div>
              <div className="stat-info">
                <h3 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: 800 }}>{s.value}</h3>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', letterSpacing: '0.3px', fontWeight: 700 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>IPD ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Admitted On</th>
                  <th>Room / Bed</th>
                  <th>Diagnosis</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>{r.ioId}</span></td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{r.patientName}</span>
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.patientNo}</span>
                    </td>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{r.doctor}</td>
                    <td>{r.department}</td>
                    <td style={{ fontSize: 12 }}>{r.dateAdmit}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 12 }}>Rm {r.room}</span>
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.bed}</span>
                    </td>
                    <td style={{ fontSize: 12.5, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.diagnosis}</td>
                    <td><span className={`badge ${r.status === 'Admitted' ? 'badge-info' : 'badge-success'}`}>{r.status}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
