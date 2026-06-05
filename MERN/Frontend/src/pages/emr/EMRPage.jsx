import { useState, useEffect } from 'react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function EMRPage({ type = 'opd', user }) {
  const isOPD = type === 'opd';
  const [records, setRecords] = useState([]);
  const title = isOPD ? 'Out-Patient EMR' : 'In-Patient EMR';

  useEffect(() => {
    fetchEMR();
  }, [type]);

  const fetchEMR = () => {
    const endpoint = isOPD ? `${API_BASE}/opd` : `${API_BASE}/ipd`;
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          if (isOPD) {
            setRecords(data);
          } else {
            setRecords(data.filter(r => r.status === 'Admitted'));
          }
        } else {
          setRecords([]);
        }
      })
      .catch(err => {
        console.error('Failed to load EMR records:', err);
        setRecords([]);
      });
  };

  return (
    <div>
      <Topbar title={title} user={user?.name} />
      <div className="page-body">
        <div className="page-header"><div><h2>EMR Sheet — {title}</h2><p>Electronic Medical Records</p></div></div>
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{isOPD ? 'OPD' : 'IPD'} No.</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Diagnosis</th>
                  <th>EMR Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily:'monospace', color:'var(--accent-light)' }}>{r.ioId}</td>
                    <td><div style={{ fontWeight:600 }}>{r.patientName}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.patientNo}</div></td>
                    <td>{r.doctor}</td>
                    <td>{r.department}</td>
                    <td style={{ fontSize:12 }}>{isOPD ? r.dateVisit : r.dateAdmit}</td>
                    <td style={{ fontSize:12, maxWidth:150 }}>{r.diagnosis}</td>
                    <td><span className="badge badge-success">Complete</span></td>
                    <td><button className="btn btn-primary btn-sm">View EMR</button></td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                      No active medical records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
