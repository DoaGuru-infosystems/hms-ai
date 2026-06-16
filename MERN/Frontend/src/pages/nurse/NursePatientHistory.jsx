import { Eye, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function NursePatientHistory({ user }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [patientsList, setPatientsList] = useState([]);
  const [opdList, setOpdList] = useState([]);
  const [ipdList, setIpdList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/patients`).then(res => res.json()),
      fetch(`${API_BASE}/opd`).then(res => res.json()),
      fetch(`${API_BASE}/ipd`).then(res => res.json())
    ])
      .then(([pData, opdData, ipdData]) => {
        if (Array.isArray(pData)) setPatientsList(pData);
        if (Array.isArray(opdData)) setOpdList(opdData);
        if (Array.isArray(ipdData)) setIpdList(ipdData);
      })
      .catch(err => console.error('Failed to load history indices:', err))
      .finally(() => setLoading(false));
  }, []);

  const results = patientsList.filter(p => {
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
    const patientNo = (p.patientNo || '').toLowerCase();
    const term = search.toLowerCase();
    return fullName.includes(term) || patientNo.includes(term);
  });

  const patientOPD = selected ? opdList.filter(r => r.patientNo === selected.patientNo) : [];
  const patientIPD = selected ? ipdList.filter(r => r.patientNo === selected.patientNo) : [];

  return (
    <div className="nurse-theme">
      <Topbar title="Nurse — Patient History" user={user?.name} />
      <div className="page-body">
        <div className="page-header"><div><h2>Patient History</h2><p>View complete clinical history of any patient</p></div></div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Patient Registries...</h4>
          </div>
        ) : (
          <div>
            <div className="card" style={{ marginBottom:20 }}>
              <div className="section-title"><span></span>Search Patient</div>
              <div className="search-bar" style={{ maxWidth:'100%', marginBottom:12 }}>
                <input placeholder="Search by Patient No or Name..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {search && !selected && (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Patient No.</th><th>Name</th><th>Age</th><th>Gender</th><th>Blood Group</th><th></th></tr></thead>
                    <tbody>{results.map(p => (
                      <tr key={p.id}><td style={{ fontFamily:'monospace', color:'var(--accent-light)' }}>{p.patientNo}</td>
                      <td style={{ fontWeight:600 }}>{p.firstName} {p.lastName}</td><td>{p.age} yrs</td><td>{p.gender}</td>
                      <td><span className="badge badge-purple">{p.bloodGroup}</span></td>
                      <td><button className="btn btn-primary btn-sm" onClick={() => { setSelected(p); setSearch(''); }}>View History</button></td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>

            {selected && (
              <div>
                <div className="card" style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', gap:24 }}>
                      {[['Patient No.', selected.patientNo],['Name', `${selected.firstName} ${selected.lastName}`],['Age', `${selected.age} yrs`],['Gender', selected.gender],['Blood Group', selected.bloodGroup],['Phone', selected.phone]].map(([k,v]) => (
                        <div key={k}><div style={{ fontSize:11, color:'var(--text-muted)' }}>{k}</div><div style={{ fontWeight:700 }}>{v}</div></div>
                      ))}
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>✕ Clear</button>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="section-title"><span></span>OPD Visits ({patientOPD.length})</div>
                    {patientOPD.length ? (
                      <div className="table-wrapper"><table>
                        <thead><tr><th>OPD No.</th><th>Date</th><th>Doctor</th><th>Dept.</th><th>Diagnosis</th></tr></thead>
                        <tbody>{patientOPD.map(r => <tr key={r.id}><td style={{ fontFamily:'monospace', fontSize:12, color:'var(--accent-light)' }}>{r.ioId}</td><td style={{ fontSize:12 }}>{r.dateVisit}</td><td style={{ fontSize:12 }}>{r.doctor}</td><td style={{ fontSize:12 }}>{r.department}</td><td style={{ fontSize:12 }}>{r.diagnosis}</td></tr>)}</tbody>
                      </table></div>
                    ) : <div className="empty-state"><p>No OPD records found.</p></div>}
                  </div>
                  <div className="card">
                    <div className="section-title"><span></span>IPD Admissions ({patientIPD.length})</div>
                    {patientIPD.length ? (
                      <div className="table-wrapper"><table>
                        <thead><tr><th>IPD No.</th><th>Admitted</th><th>Doctor</th><th>Room</th><th>Status</th></tr></thead>
                        <tbody>{patientIPD.map(r => <tr key={r.id}><td style={{ fontFamily:'monospace', fontSize:12, color:'var(--accent-light)' }}>{r.ioId}</td><td style={{ fontSize:12 }}>{r.dateAdmit}</td><td style={{ fontSize:12 }}>{r.doctor}</td><td style={{ fontSize:12 }}>Rm {r.room}</td><td><span className={`badge ${r.status==='Admitted'?'badge-info':'badge-success'}`}>{r.status}</span></td></tr>)}</tbody>
                      </table></div>
                    ) : <div className="empty-state"><p>No IPD records found.</p></div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
