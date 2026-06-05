import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function NurseMedication({ user }) {
  const [patient, setPatient] = useState('');
  const [rows, setRows] = useState([{ medicine:'', dosage:'', route:'Oral', frequency:'TID', date:'' }]);
  const [saved, setSaved] = useState(false);
  const [ipdList, setIpdList] = useState([]);
  const [medicineCatalog, setMedicineCatalog] = useState([]);
  const [given, setGiven] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/ipd`).then(res => res.json()),
      fetch(`${API_BASE}/medicines`).then(res => res.json()),
      fetch(`${API_BASE}/nurse/medication`).then(res => res.json())
    ])
      .then(([ipdData, medData, givenData]) => {
        if (Array.isArray(ipdData)) {
          setIpdList(ipdData.filter(r => r.status === 'Admitted'));
        }
        if (Array.isArray(medData)) {
          setMedicineCatalog(medData);
        }
        if (Array.isArray(givenData)) {
          setGiven(givenData);
        }
      })
      .catch(err => console.log('Failed to fetch medication assets:', err))
      .finally(() => setLoading(false));
  }, []);

  const fetchGivenMedications = () => {
    fetch(`${API_BASE}/nurse/medication`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGiven(data);
      })
      .catch(err => console.log('Failed to load given medications:', err));
  };

  const addRow = () => setRows([...rows, { medicine:'', dosage:'', route:'Oral', frequency:'TID', date:'' }]);
  const removeRow = i => setRows(rows.filter((_,idx) => idx !== i));
  const updateRow = (i, key, val) => setRows(rows.map((r,idx) => idx===i ? {...r,[key]:val} : r));

  const handleSave = e => {
    e.preventDefault();
    if (!patient) return alert('Select a patient.');
    
    const promises = rows.map(row => {
      return fetch(`${API_BASE}/nurse/medication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient,
          medName: row.medicine,
          dose: row.dosage,
          route: row.route,
          freq: row.frequency,
          status: 'Given',
          by: user?.name || 'Sr. Mary D\'Souza'
        })
      });
    });

    Promise.all(promises)
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setRows([{ medicine:'', dosage:'', route:'Oral', frequency:'TID', date:'' }]);
        fetchGivenMedications();
      })
      .catch(err => console.log('Failed to save medications:', err));
  };

  return (
    <div>
      <Topbar title="Nurse — Patient Medication" user={user?.name} />
      <div className="page-body">
        <div className="page-header"><div><h2>Patient Medication</h2><p>Administer and record patient medications</p></div></div>
        {saved && <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#34d399' }}>✓ Medication recorded!</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Medication Records...</h4>
          </div>
        ) : (
          <div>
            <div className="card" style={{ marginBottom:20 }}>
              <div className="section-title"><span></span>Record Medication Given</div>
              <form onSubmit={handleSave}>
                <div className="form-group" style={{ maxWidth:360 }}>
                  <label className="form-label">Select Admitted Patient</label>
                  <select className="form-control" value={patient} onChange={e => setPatient(e.target.value)} required>
                    <option value="">— Select —</option>
                    {ipdList.map(r => <option key={r.id} value={r.id}>{r.ioId} — {r.patientName}</option>)}
                  </select>
                </div>
                <div className="table-wrapper" style={{ marginBottom:12 }}>
                  <table>
                    <thead><tr><th>Medicine</th><th>Dosage</th><th>Route</th><th>Frequency</th><th>Date</th><th></th></tr></thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i}>
                          <td><select className="form-control" style={{ minWidth:180 }} value={row.medicine} onChange={e => updateRow(i,'medicine',e.target.value)}>
                            <option value="">— Select Medicine —</option>
                            {medicineCatalog.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                          </select></td>
                          <td><input className="form-control" placeholder="e.g. 1 tab" value={row.dosage} onChange={e => updateRow(i,'dosage',e.target.value)} /></td>
                          <td><select className="form-control" value={row.route} onChange={e => updateRow(i,'route',e.target.value)}>
                            {['Oral','IV','IM','SC','Topical','Inhalation'].map(r => <option key={r}>{r}</option>)}
                          </select></td>
                          <td><select className="form-control" value={row.frequency} onChange={e => updateRow(i,'frequency',e.target.value)}>
                            {['OD','BID','TID','QID','PRN','STAT','Q4H','Q6H','Q8H','Q12H'].map(f => <option key={f}>{f}</option>)}
                          </select></td>
                          <td><input type="date" className="form-control" value={row.date} onChange={e => updateRow(i,'date',e.target.value)} /></td>
                          <td><button type="button" className="btn btn-ghost btn-sm" style={{ color:'var(--danger)' }} onClick={() => removeRow(i)}><Trash2 size={13}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}><Plus size={13}/> Add Row</button>
                  <button type="submit" className="btn btn-primary"><Save size={14}/> Save</button>
                </div>
              </form>
            </div>

            <div className="card">
              <div className="section-title"><span></span>Recently Given Medications</div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Patient</th><th>Medicine</th><th>Dosage</th><th>Route</th><th>Frequency</th><th>Date</th></tr></thead>
                  <tbody>{given.map((g,i) => {
                    const patientObj = ipdList.find(item => String(item.id) === String(g.patient) || String(item.ioId) === String(g.patient));
                    const patientName = patientObj ? patientObj.patientName : g.patient;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight:600 }}>{patientName}</td>
                        <td>{g.medName}</td>
                        <td>{g.dose}</td>
                        <td>{g.route}</td>
                        <td><span className="badge badge-purple">{g.freq}</span></td>
                        <td style={{ fontSize:12 }}>{new Date(g.date).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  {given.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                        No medication history found.
                      </td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
