import { useState, useEffect } from 'react';
import { Search, Plus, Eye } from 'lucide-react';
import Topbar from '../components/Topbar';

export default function OPDPage({ user }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('All');
  const [opdList, setOpdList] = useState([]);

  useEffect(() => {
    fetchOpd();
  }, []);

  const fetchOpd = () => {
    fetch('http://localhost:5001/api/opd')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOpdList(data);
        } else {
          setOpdList([]);
        }
      })
      .catch(err => {
        console.log('Failed to fetch OPD log.', err);
        setOpdList([]);
      });
  };

  const filtered = opdList.filter(r => {
    const matchSearch = `${r.patientName || ''} ${r.ioId || ''} ${r.doctor || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'All' || r.status === tab;
    return matchSearch && matchTab;
  });

  return (
    <div>
      <Topbar title="OPD — Out-Patient Department" user={user?.name} />
      <div className="page-body has-tabs">
        <div className="page-header">
          <div>
            <h2>OPD Visit Log</h2>
            <p>Manage OPD visits and records</p>
          </div>
          <div className="page-actions">
            <div className="search-bar">
              <Search />
              <input placeholder="Search OPD..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary">
              <Plus size={15} /> OPD Registration
            </button>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 16 }}>
          {['All', 'Active', 'Discharged'].map(t => (
            <button 
              key={t} 
              className={`tab${tab === t ? ' active' : ''}`} 
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>OPD ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Complaints</th>
                  <th>Diagnosis</th>
                  <th>Status</th>
                  <th>Paid</th>
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
                    <td style={{ fontSize: 12 }}>{r.dateVisit}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.complaints}</td>
                    <td style={{ fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.diagnosis}</td>
                    <td><span className={`badge ${r.status === 'Active' ? 'badge-success' : 'badge-gray'}`}>{r.status}</span></td>
                    <td><span className={`badge ${r.isPaid ? 'badge-success' : 'badge-warning'}`}>{r.isPaid ? 'Paid' : 'Pending'}</span></td>
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
