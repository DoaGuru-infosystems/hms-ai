import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';
import ClockTimePicker from '../../components/ClockTimePicker';

const API_BASE = 'http://localhost:5001/api';

export default function NurseIntakeOutput({ user }) {
  const [patient, setPatient] = useState('');
  const [intakeRows, setIntakeRows] = useState([{ type:'', amount:'', route:'', time:'' }]);
  const [outputRows, setOutputRows] = useState([{ type:'', amount:'', time:'' }]);
  const [saved, setSaved] = useState(false);
  const [ipdList, setIpdList] = useState([]);
  const [ioHistory, setIoHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const addRow = (setter, arr, blank) => setter([...arr, blank]);
  const removeRow = (setter, arr, i) => setter(arr.filter((_,idx) => idx !== i));
  const updateRow = (setter, arr, i, key, val) => setter(arr.map((r,idx) => idx===i ? {...r,[key]:val} : r));

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/ipd`).then(res => res.json()),
      fetch(`${API_BASE}/nurse/intake-output`).then(res => res.json())
    ])
      .then(([ipdData, historyData]) => {
        if (Array.isArray(ipdData)) {
          setIpdList(ipdData.filter(r => r.status === 'Admitted'));
        }
        if (Array.isArray(historyData)) {
          setIoHistory(historyData);
        }
      })
      .catch(err => console.log('Failed to fetch admitted patient lists:', err))
      .finally(() => setLoading(false));
  }, []);

  const fetchIoHistory = () => {
    fetch(`${API_BASE}/nurse/intake-output`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setIoHistory(data);
      })
      .catch(err => console.log('Failed to fetch I/O history:', err));
  };

  const handleSave = e => {
    e.preventDefault();
    if (!patient) return alert('Select a patient.');

    const intakePromises = intakeRows.filter(r => r.type && r.amount).map(row => {
      return fetch(`${API_BASE}/nurse/intake-output`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient,
          intakeType: row.type,
          intakeAmount: row.amount,
          outputType: '',
          outputAmount: '',
          by: user?.name || 'Sr. Mary D\'Souza'
        })
      });
    });

    const outputPromises = outputRows.filter(r => r.type && r.amount).map(row => {
      return fetch(`${API_BASE}/nurse/intake-output`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient,
          intakeType: '',
          intakeAmount: '',
          outputType: row.type,
          outputAmount: row.amount,
          by: user?.name || 'Sr. Mary D\'Souza'
        })
      });
    });

    Promise.all([...intakePromises, ...outputPromises])
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setIntakeRows([{ type:'', amount:'', route:'', time:'' }]);
        setOutputRows([{ type:'', amount:'', time:'' }]);
        fetchIoHistory();
      })
      .catch(err => console.log('Failed to save I/O record:', err));
  };

  const intakeTypes = ['IV Fluid','Oral Fluid','NGT','Blood Transfusion','Medication'];
  const outputTypes = ['Urine','Stool','Vomitus','Wound Drainage','NGT Drainage'];

  return (
    <div className="nurse-theme">
      <Topbar title="Nurse — Intake / Output" user={user?.name} />
      <div className="page-body">
        <div className="page-header"><div><h2>Intake / Output Record</h2><p>Track fluid balance for admitted patients</p></div></div>
        {saved && <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#34d399' }}>✓ I/O record saved!</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Patients...</h4>
          </div>
        ) : (
          <div>
            <div className="card" style={{ marginBottom:16 }}>
              <div className="form-group" style={{ maxWidth:360 }}>
                <label className="form-label">Select Admitted Patient</label>
                <select className="form-control" value={patient} onChange={e => setPatient(e.target.value)}>
                  <option value="">— Select —</option>
                  {ipdList.map(r => <option key={r.id} value={r.id}>{r.ioId} — {r.patientName}</option>)}
                </select>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid-2" style={{ alignItems:'start' }}>
                <div className="card">
                  <div className="section-title"><span></span>Intake</div>
                  <div className="table-wrapper" style={{ marginBottom:10 }}>
                    <table>
                      <thead><tr><th>Type</th><th>Amount (ml)</th><th>Route</th><th>Time</th><th></th></tr></thead>
                      <tbody>{intakeRows.map((row,i) => (
                        <tr key={i}>
                          <td><select className="form-control" value={row.type} onChange={e => updateRow(setIntakeRows,intakeRows,i,'type',e.target.value)}>
                            <option value="">—</option>{intakeTypes.map(t=><option key={t}>{t}</option>)}</select></td>
                          <td><input className="form-control" type="number" placeholder="0" value={row.amount} onChange={e => updateRow(setIntakeRows,intakeRows,i,'amount',e.target.value)} /></td>
                          <td><select className="form-control" value={row.route} onChange={e => updateRow(setIntakeRows,intakeRows,i,'route',e.target.value)}>
                            {['Oral','IV','NGT'].map(r=><option key={r}>{r}</option>)}</select></td>
                          <td><ClockTimePicker value={row.time} onChange={val => updateRow(setIntakeRows,intakeRows,i,'time',val)} /></td>
                          <td><button type="button" className="btn btn-ghost btn-sm" style={{ color:'var(--danger)' }} onClick={() => removeRow(setIntakeRows,intakeRows,i)}><Trash2 size={13}/></button></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => addRow(setIntakeRows,intakeRows,{ type:'',amount:'',route:'',time:'' })}><Plus size={13}/> Add Row</button>
                  <div style={{ marginTop:12, fontWeight:700, color:'var(--success)' }}>Total Intake: {intakeRows.reduce((s,r) => s+(parseInt(r.amount)||0),0)} ml</div>
                </div>
                <div className="card">
                  <div className="section-title"><span></span>Output</div>
                  <div className="table-wrapper" style={{ marginBottom:10 }}>
                    <table>
                      <thead><tr><th>Type</th><th>Amount (ml)</th><th>Time</th><th></th></tr></thead>
                      <tbody>{outputRows.map((row,i) => (
                        <tr key={i}>
                          <td><select className="form-control" value={row.type} onChange={e => updateRow(setOutputRows,outputRows,i,'type',e.target.value)}>
                            <option value="">—</option>{outputTypes.map(t=><option key={t}>{t}</option>)}</select></td>
                          <td><input className="form-control" type="number" placeholder="0" value={row.amount} onChange={e => updateRow(setOutputRows,outputRows,i,'amount',e.target.value)} /></td>
                          <td><ClockTimePicker value={row.time} onChange={val => updateRow(setOutputRows,outputRows,i,'time',val)} /></td>
                          <td><button type="button" className="btn btn-ghost btn-sm" style={{ color:'var(--danger)' }} onClick={() => removeRow(setOutputRows,outputRows,i)}><Trash2 size={13}/></button></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => addRow(setOutputRows,outputRows,{ type:'',amount:'',time:'' })}><Plus size={13}/> Add Row</button>
                  <div style={{ marginTop:12, fontWeight:700, color:'var(--danger)' }}>Total Output: {outputRows.reduce((s,r) => s+(parseInt(r.amount)||0),0)} ml</div>
                </div>
              </div>
              <div style={{ marginTop:20 }}>
                <button type="submit" className="btn btn-primary"><Save size={14}/> Save I/O Record</button>
              </div>
            </form>

            <div className="card" style={{ marginTop: 24 }}>
              <div className="section-title"><span></span>Fluid Balance History</div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Intake Record</th>
                      <th>Output Record</th>
                      <th>Recorded By</th>
                      <th>Date / Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ioHistory.map((h, idx) => {
                      const patientObj = ipdList.find(i => String(i.id) === String(h.patient) || String(i.ioId) === String(h.patient));
                      const patientName = patientObj ? patientObj.patientName : h.patient;
                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{patientName}</td>
                          <td>{h.intakeType ? `${h.intakeType}: ${h.intakeAmount} ml` : '—'}</td>
                          <td>{h.outputType ? `${h.outputType}: ${h.outputAmount} ml` : '—'}</td>
                          <td>{h.by}</td>
                          <td style={{ fontSize: 12 }}>{new Date(h.date).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {ioHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                          No fluid balance entries found.
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
