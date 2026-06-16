import { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';
import ClockTimePicker from '../../components/ClockTimePicker';

const API_BASE = 'http://localhost:5001/api';

export default function DoctorIPD({ user }) {
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('progress');
  const [admitted, setAdmitted] = useState([]);
  const [loading, setLoading] = useState(true);

  const [vitals, setVitals] = useState([]);
  const [medications, setMedications] = useState([]);

  // Clinical tracking states
  const [progressNotes, setProgressNotes] = useState([]);
  const [newProgressNote, setNewProgressNote] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');

  // Med prescription states
  const [medsList, setMedsList] = useState([{ medName: '', dose: '', route: 'Oral', freq: 'OD', duration: '' }]);

  // Lab test states
  const [patientLabs, setPatientLabs] = useState([]);
  const [testName, setTestName] = useState('');

  // Surgery operation states
  const [opsList, setOpsList] = useState([]);
  const [opProcedure, setOpProcedure] = useState('');
  const [opDate, setOpDate] = useState('');
  const [opTime, setOpTime] = useState('');
  const [anesthesiologist, setAnesthesiologist] = useState('');
  const [surgeonNotes, setSurgeonNotes] = useState('');

  // Discharge states
  const [dischargeInstructions, setDischargeInstructions] = useState('');
  const [followUp, setFollowUp] = useState('');

  useEffect(() => {
    fetchAdmitted();
  }, [user]);

  useEffect(() => {
    if (selected) {
      const patientNoVal = selected.patientNo || selected.patientId;
      setProvisionalDiagnosis(selected.diagnosis || '');
      setFinalDiagnosis(selected.finalDiagnosis || '');
      setNewProgressNote('');
      setNewPlan('');
      setTestName('');
      setMedsList([{ medName: '', dose: '', route: 'Oral', freq: 'OD', duration: '' }]);
      setOpProcedure('');
      setOpDate('');
      setOpTime('');
      setAnesthesiologist('');
      setSurgeonNotes('');
      setDischargeInstructions('');
      setFollowUp('');

      // Fetch vitals
      fetch(`${API_BASE}/nurse/vitals?patientNo=${patientNoVal}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setVitals(data);
          }
        })
        .catch(err => console.log('Failed to fetch patient vitals:', err));

      // Fetch medications
      fetch(`${API_BASE}/nurse/medication?patientNo=${patientNoVal}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMedications(data);
          }
        })
        .catch(err => console.log('Failed to fetch patient meds:', err));

      // Fetch progress notes
      fetch(`${API_BASE}/nurse/progress-note?patientNo=${patientNoVal}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setProgressNotes(data);
          }
        })
        .catch(err => console.log('Failed to fetch progress notes:', err));

      // Fetch labs
      fetch(`${API_BASE}/doctors/labs?patientNo=${patientNoVal}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPatientLabs(data);
          }
        })
        .catch(err => console.log('Failed to fetch patient labs:', err));

      // Fetch operations
      fetch(`${API_BASE}/doctors/operations?patientNo=${patientNoVal}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setOpsList(data);
          }
        })
        .catch(err => console.log('Failed to fetch patient operations:', err));
    }
  }, [selected]);

  const handleSaveProgressNote = () => {
    if (!selected || !newProgressNote.trim()) return;
    const patientNoVal = selected.patientNo || selected.patientId;
    fetch(`${API_BASE}/nurse/progress-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient: patientNoVal,
        note: newProgressNote + (newPlan.trim() ? ` [Plan: ${newPlan}]` : ''),
        by: user?.name || 'Doctor'
      })
    })
      .then(res => res.json())
      .then(data => {
        alert('Progress note saved successfully!');
        setNewProgressNote('');
        setNewPlan('');
        // Refresh progress notes
        fetch(`${API_BASE}/nurse/progress-note?patientNo=${patientNoVal}`)
          .then(res => res.json())
          .then(d => {
            if (Array.isArray(d)) setProgressNotes(d);
          });
      })
      .catch(err => {
        console.error('Failed to save progress note:', err);
        alert('Failed to save progress note');
      });
  };

  const handleSaveDiagnosis = () => {
    if (!selected) return;
    const ipdIdVal = selected.ipdId || selected.id;
    fetch(`${API_BASE}/ipd/${ipdIdVal}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosis: provisionalDiagnosis })
    })
      .then(res => res.json())
      .then(data => {
        alert('Diagnosis saved successfully!');
        fetchAdmitted();
      })
      .catch(err => {
        console.error('Failed to save diagnosis:', err);
        alert('Failed to save diagnosis');
      });
  };

  const handleSavePrescription = async () => {
    if (!selected) return;
    const patientNoVal = selected.patientNo || selected.patientId;
    const validMeds = medsList.filter(m => m.medName.trim() !== '');
    if (validMeds.length === 0) {
      alert('Please add at least one medicine with a name.');
      return;
    }

    try {
      for (const med of validMeds) {
        await fetch(`${API_BASE}/nurse/medication`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient: patientNoVal,
            medName: med.medName,
            dose: med.dose,
            route: med.route,
            freq: med.freq,
            status: 'Prescribed',
            by: user?.name || 'Doctor'
          })
        });
      }
      alert('Prescription saved successfully!');
      fetch(`${API_BASE}/nurse/medication?patientNo=${patientNoVal}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMedications(data);
          }
        });
      setMedsList([{ medName: '', dose: '', route: 'Oral', freq: 'OD', duration: '' }]);
    } catch (err) {
      console.error('Failed to save prescription:', err);
      alert('Failed to save prescription');
    }
  };

  const handleRequestLab = () => {
    if (!selected || !testName.trim()) return;
    const patientNoVal = selected.patientNo || selected.patientId;
    fetch(`${API_BASE}/doctors/labs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientNo: patientNoVal,
        testName,
        status: 'Pending',
        requestedBy: user?.name || 'Doctor'
      })
    })
      .then(res => res.json())
      .then(data => {
        alert('Lab request submitted successfully!');
        setTestName('');
        fetch(`${API_BASE}/doctors/labs?patientNo=${patientNoVal}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setPatientLabs(data);
            }
          });
      })
      .catch(err => {
        console.error('Failed to submit lab request:', err);
        alert('Failed to submit lab request');
      });
  };

  const handleScheduleOperation = () => {
    if (!selected || !opProcedure.trim()) return;
    const patientNoVal = selected.patientNo || selected.patientId;
    fetch(`${API_BASE}/doctors/operations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientNo: patientNoVal,
        procedureName: opProcedure,
        opDate,
        opTime,
        anesthesiologist,
        surgeonNotes,
        status: 'Scheduled'
      })
    })
      .then(res => res.json())
      .then(data => {
        alert('Operation scheduled successfully!');
        setOpProcedure('');
        setOpDate('');
        setOpTime('');
        setAnesthesiologist('');
        setSurgeonNotes('');
        // Refresh operations list
        fetch(`${API_BASE}/doctors/operations?patientNo=${patientNoVal}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setOpsList(data);
            }
          });
      })
      .catch(err => {
        console.error('Failed to schedule operation:', err);
        alert('Failed to schedule operation');
      });
  };

  const handleDischargeSummary = async () => {
    if (!selected) return;
    const patientNoVal = selected.patientNo || selected.patientId;
    const ipdIdVal = selected.ipdId || selected.id;

    try {
      // Create nurse/doctor discharge record
      await fetch(`${API_BASE}/nurse/discharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: patientNoVal,
          dischargeDate: new Date().toISOString(),
          conditionAtDischarge: dischargeInstructions || 'Improved',
          followUpInstructions: followUp || 'As advised',
          by: user?.name || 'Doctor'
        })
      });

      // Update IPD status to Discharged
      await fetch(`${API_BASE}/ipd/${ipdIdVal}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Discharged' })
      });

      alert('Discharge summary saved and patient discharged successfully!');
      setSelected(null);
      fetchAdmitted();
    } catch (err) {
      console.error('Failed to complete discharge process:', err);
      alert('Failed to discharge patient');
    }
  };

  const fetchAdmitted = () => {
    setLoading(true);
    fetch(`${API_BASE}/ipd`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter(r => {
            const matchesStatus = r.status === 'Admitted';
            const matchesDoctorId = String(r.doctorId) === String(user?.id) || String(r.doctor_id) === String(user?.id);
            const docName = String(user?.name || '').toLowerCase();
            const matchesDoctorName = docName && String(r.doctor || '').toLowerCase().includes(docName.replace('dr. ', '').toLowerCase());
            return matchesStatus && (matchesDoctorId || matchesDoctorName);
          });
          setAdmitted(filtered);
        } else {
          setAdmitted([]);
        }
      })
      .catch(err => {
        console.error('Failed to load doctor IPD roster:', err);
        setAdmitted([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const clinicTabs = [
    { key:'progress', label:'Progress Notes' },
    { key:'medication', label:'Medications' },
    { key:'lab', label:'Lab & Tests' },
    { key:'operation', label:'Surgery & OT' },
    { key:'discharge', label:'Discharge Summary' }
  ];

  return (
    <div>
      <Topbar title="Doctor — In-Patient" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>IPD Ward Roster</h2>
            <p>Manage in-patient clinical records</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Admitted Inpatients...</h4>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>IPD No.</th>
                    <th>Patient</th>
                    <th>Department</th>
                    <th>Admitted</th>
                    <th>Room/Bed</th>
                    <th>Diagnosis</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admitted.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily:'monospace', color:'var(--primary)', fontWeight: 600 }}>{r.ioId}</td>
                      <td>
                        <div style={{ fontWeight:600 }}>{r.patientName}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.patientNo}</div>
                      </td>
                      <td>{r.department}</td>
                      <td style={{ fontSize:12 }}>{r.dateAdmit}</td>
                      <td style={{ fontFamily:'monospace', fontSize:12 }}>Rm {r.room} / {r.bed}</td>
                      <td style={{ fontSize:12, maxWidth:130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.diagnosis}</td>
                      <td><span className="badge badge-info">Admitted</span></td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelected(r); setTab('progress'); }}>
                          <FileText size={13}/> Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                  {admitted.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                        No patients currently admitted in the wards.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '95%', maxWidth: 1150, borderRadius: 16, display: 'flex', flexDirection: 'column', padding: 0 }}>
              <div className="modal-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--surface-border)' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>Clinical Case File — {selected.patientName}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>IPD No: <strong>{selected.ioId}</strong> · Patient No: {selected.patientNo} · Department: {selected.department}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{ fontSize: 18 }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 480 }}>
                {/* Left Panel: Clinical Context (Vitals & Diagnosis) */}
                <div style={{ borderRight: '1px solid var(--surface-border)', padding: 20, background: 'rgba(249, 250, 251, 0.3)', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: '70vh' }}>
                  {/* Patient Info Card */}
                  <div style={{ background: '#fff', border: '1px solid var(--surface-border)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Patient Location</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Room {selected.room}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Bed No: {selected.bed}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Admitted On: {selected.dateAdmit}</div>
                  </div>

                  {/* Vitals Summary Card */}
                  <div style={{ background: '#fff', border: '1px solid var(--surface-border)', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Latest Vitals</span>
                      {vitals.length > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {new Date(vitals[vitals.length - 1].date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {vitals.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          { label: 'Blood Pressure', value: vitals[vitals.length-1].bp, unit: 'mmHg', color: '#ef4444' },
                          { label: 'Temperature', value: vitals[vitals.length-1].temp, unit: '°F', color: '#f59e0b' },
                          { label: 'Pulse Rate', value: vitals[vitals.length-1].pulse, unit: 'bpm', color: '#ec4899' },
                          { label: 'SpO2 Level', value: vitals[vitals.length-1].spo2, unit: '%', color: '#10b981' },
                          { label: 'Resp. Rate', value: vitals[vitals.length-1].resp, unit: '/min', color: '#3b82f6' },
                          { label: 'Body Weight', value: vitals[vitals.length-1].weight, unit: 'kg', color: '#6366f1' }
                        ].map(v => (
                          <div key={v.label} style={{ background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.08)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{v.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: v.color, marginTop: 2 }}>{v.value || '--'} <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-secondary)' }}>{v.unit}</span></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                        No vitals logged yet
                      </div>
                    )}
                  </div>

                  {/* Diagnosis Management */}
                  <div style={{ background: '#fff', border: '1px solid var(--surface-border)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Diagnosis Info</div>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label" style={{ fontSize: 11, fontWeight: 600 }}>Provisional Diagnosis</label>
                      <textarea 
                        className="form-control" 
                        rows={2} 
                        style={{ fontSize: 12, padding: '6px 8px' }}
                        value={provisionalDiagnosis} 
                        onChange={e => setProvisionalDiagnosis(e.target.value)}
                        placeholder="Pending diagnosis details..."
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label" style={{ fontSize: 11, fontWeight: 600 }}>Final Diagnosis</label>
                      <textarea 
                        className="form-control" 
                        rows={2} 
                        style={{ fontSize: 12, padding: '6px 8px' }}
                        placeholder="Final diagnosis..." 
                        value={finalDiagnosis}
                        onChange={e => setFinalDiagnosis(e.target.value)}
                      />
                    </div>
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ width: '100%', fontSize: 11, padding: '6px 12px', justifyContent: 'center' }} 
                      onClick={handleSaveDiagnosis}
                    >
                      Save Diagnosis Details
                    </button>
                  </div>
                </div>

                {/* Right Panel: Clinical Action Workspace */}
                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
                  {/* Action tabs strip */}
                  <div style={{ display:'flex', borderBottom:'1px solid var(--surface-border)', padding:'0 24px', gap:12, overflowX:'auto', background: 'rgba(249, 250, 251, 0.4)' }}>
                    {clinicTabs.map(t => (
                      <button 
                        key={t.key} 
                        onClick={() => setTab(t.key)}
                        style={{ 
                          padding:'14px 16px', 
                          border:'none', 
                          background:'none', 
                          cursor:'pointer', 
                          fontSize:13, 
                          fontWeight:tab===t.key?700:500, 
                          color:tab===t.key?'var(--primary)':'var(--text-secondary)', 
                          borderBottom:tab===t.key?'3px solid var(--primary)':'3px solid transparent', 
                          whiteSpace:'nowrap',
                          transition: 'all 0.2s'
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab contents (scrollable workspace) */}
                  <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                    {tab === 'progress' && (
                      <div>
                        {progressNotes.length > 0 && (
                          <div style={{ marginBottom: 20 }}>
                            <h4 style={{ fontSize: 13, marginBottom: 8, fontWeight: 700 }}>Progress Note History</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto', marginBottom: 12 }}>
                              {progressNotes.map((n, idx) => (
                                <div key={idx} style={{ background:'rgba(92, 84, 243, 0.04)', borderRadius:8, padding:12, border: '1px solid var(--surface-border)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                                    <span>By: {n.by}</span>
                                    <span>{new Date(n.date).toLocaleString()}</span>
                                  </div>
                                  <div style={{ fontSize: 12.5, marginTop: 4, fontWeight: 500 }}>{n.note}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <h4 style={{ fontSize: 13, marginBottom: 8, fontWeight: 700 }}>Add New Progress Note</h4>
                        <div className="form-group">
                          <label className="form-label">Doctor's Progress Note</label>
                          <textarea 
                            className="form-control" 
                            rows={3} 
                            placeholder="Enter daily progress note..." 
                            value={newProgressNote}
                            onChange={e => setNewProgressNote(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Plan / Orders</label>
                          <textarea 
                            className="form-control" 
                            rows={2} 
                            placeholder="Enter clinical plan..." 
                            value={newPlan}
                            onChange={e => setNewPlan(e.target.value)}
                          />
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={handleSaveProgressNote}>Save Progress Note</button>
                      </div>
                    )}

                    {tab === 'medication' && (
                      <div>
                        <div style={{ marginBottom: 20 }}>
                          <h4 style={{ fontSize: 13, marginBottom: 8, fontWeight: 700 }}>Medication Administration Log</h4>
                          <div className="table-wrapper">
                            <table>
                              <thead>
                                <tr>
                                  <th>Medicine</th>
                                  <th>Dosage</th>
                                  <th>Route</th>
                                  <th>Frequency</th>
                                  <th>Status</th>
                                  <th>Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {medications.map((m, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{m.medName}</td>
                                    <td>{m.dose}</td>
                                    <td>{m.route}</td>
                                    <td><span className="badge badge-purple">{m.freq}</span></td>
                                    <td><span className="badge badge-primary">{m.status}</span></td>
                                    <td style={{ fontSize: 12 }}>{new Date(m.date).toLocaleString()}</td>
                                  </tr>
                                ))}
                                {medications.length === 0 && (
                                  <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-muted)' }}>No medications administered yet.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <h4 style={{ fontSize: 13, marginBottom: 8, fontWeight: 700 }}>Prescribe New Medicine</h4>
                        <div className="table-wrapper">
                          <table>
                            <thead>
                              <tr>
                                <th>Medicine</th>
                                <th>Dosage</th>
                                <th>Route</th>
                                <th>Frequency</th>
                                <th>Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {medsList.map((row, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <input 
                                      className="form-control" 
                                      placeholder="Medicine name" 
                                      style={{ minWidth:180 }}
                                      value={row.medName}
                                      onChange={e => {
                                        const updated = [...medsList];
                                        updated[idx].medName = e.target.value;
                                        setMedsList(updated);
                                      }}
                                    />
                                  </td>
                                  <td>
                                    <input 
                                      className="form-control" 
                                      placeholder="1 tab"
                                      value={row.dose}
                                      onChange={e => {
                                        const updated = [...medsList];
                                        updated[idx].dose = e.target.value;
                                        setMedsList(updated);
                                      }}
                                    />
                                  </td>
                                  <td>
                                    <select 
                                      className="form-control"
                                      value={row.route}
                                      onChange={e => {
                                        const updated = [...medsList];
                                        updated[idx].route = e.target.value;
                                        setMedsList(updated);
                                      }}
                                    >
                                      <option>Oral</option>
                                      <option>IV</option>
                                      <option>IM</option>
                                      <option>Subcutaneous</option>
                                    </select>
                                  </td>
                                  <td>
                                    <select 
                                      className="form-control"
                                      value={row.freq}
                                      onChange={e => {
                                        const updated = [...medsList];
                                        updated[idx].freq = e.target.value;
                                        setMedsList(updated);
                                      }}
                                    >
                                      <option>OD</option>
                                      <option>BID</option>
                                      <option>TID</option>
                                      <option>QID</option>
                                      <option>PRN</option>
                                    </select>
                                  </td>
                                  <td>
                                    <input 
                                      className="form-control" 
                                      placeholder="5 days"
                                      value={row.duration}
                                      onChange={e => {
                                        const updated = [...medsList];
                                        updated[idx].duration = e.target.value;
                                        setMedsList(updated);
                                      }}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => setMedsList([...medsList, { medName: '', dose: '', route: 'Oral', freq: 'OD', duration: '' }])}
                          >
                            + Add Medicine
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={handleSavePrescription}>Save Prescription</button>
                        </div>
                      </div>
                    )}

                    {tab === 'lab' && (
                      <div>
                        <h4 style={{ fontSize: 13, marginBottom: 8, fontWeight: 700 }}>Requested Lab Tests</h4>
                        <div style={{ marginBottom:16 }}>
                          {patientLabs.length > 0 ? (
                            patientLabs.map((l, idx) => (
                              <div key={idx} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--surface-border)' }}>
                                <span style={{ fontSize:13, fontWeight:600 }}>{l.testName}</span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <span style={{ fontSize:12, color:'var(--text-secondary)' }}>Val: {l.testValue || 'Pending'}</span>
                                  <span className={`badge ${l.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>{l.status}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: 12, padding: '10px 0' }}>No lab tests requested yet.</p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                          <input 
                            className="form-control form-control-sm" 
                            placeholder="Enter test name (e.g. CBC, Lipid Profile)"
                            style={{ maxWidth: 300 }}
                            value={testName}
                            onChange={e => setTestName(e.target.value)}
                          />
                          <button className="btn btn-primary btn-sm" onClick={handleRequestLab}>Request Lab Test</button>
                        </div>
                      </div>
                    )}

                    {tab === 'operation' && (
                      <div>
                        {opsList.length > 0 && (
                          <div style={{ marginBottom: 20 }}>
                            <h4 style={{ fontSize: 13, marginBottom: 8, fontWeight: 700 }}>Scheduled Operations</h4>
                            <div className="table-wrapper">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Procedure</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Anesthesiologist</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {opsList.map((op, idx) => (
                                    <tr key={idx}>
                                      <td style={{ fontWeight: 600 }}>{op.procedureName}</td>
                                      <td>{op.opDate}</td>
                                      <td>{op.opTime}</td>
                                      <td>{op.anesthesiologist}</td>
                                      <td><span className="badge badge-info">{op.status}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        <h4 style={{ fontSize: 13, marginBottom: 8, fontWeight: 700 }}>Schedule Surgery/Procedure</h4>
                        <div className="form-group">
                          <label className="form-label">Operation Procedure</label>
                          <input 
                            className="form-control" 
                            placeholder="e.g. Appendectomy" 
                            value={opProcedure}
                            onChange={e => setOpProcedure(e.target.value)}
                          />
                        </div>
                        <div className="grid-2">
                          <div className="form-group">
                            <label className="form-label">Date</label>
                            <input 
                              type="date" 
                              className="form-control" 
                              value={opDate}
                              onChange={e => setOpDate(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <ClockTimePicker
                              label="Time"
                              value={opTime}
                              onChange={val => setOpTime(val)}
                              className="form-group"
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Anesthesiologist</label>
                          <input 
                            className="form-control" 
                            placeholder="Name" 
                            value={anesthesiologist}
                            onChange={e => setAnesthesiologist(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Surgeon Notes</label>
                          <textarea 
                            className="form-control" 
                            rows={3} 
                            placeholder="Pre-operative notes..." 
                            value={surgeonNotes}
                            onChange={e => setSurgeonNotes(e.target.value)}
                          />
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={handleScheduleOperation}>Schedule Operation</button>
                      </div>
                    )}

                    {tab === 'discharge' && (
                      <div>
                        <div className="form-group">
                          <label className="form-label">Final Diagnosis</label>
                          <textarea 
                            className="form-control" 
                            rows={2} 
                            value={finalDiagnosis}
                            onChange={e => setFinalDiagnosis(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Discharge Instructions</label>
                          <textarea 
                            className="form-control" 
                            rows={3} 
                            placeholder="Diet, activity, medications at home..." 
                            value={dischargeInstructions}
                            onChange={e => setDischargeInstructions(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Follow-up</label>
                          <input 
                            className="form-control" 
                            placeholder="e.g. 2 weeks post-discharge" 
                            value={followUp}
                            onChange={e => setFollowUp(e.target.value)}
                          />
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={handleDischargeSummary}>Generate Discharge Summary</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '12px 24px', borderTop: '1px solid var(--surface-border)', background: 'rgba(249, 250, 251, 0.4)', justifyContent: 'flex-end', display: 'flex' }}>
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close Case File</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
