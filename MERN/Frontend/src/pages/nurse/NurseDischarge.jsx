import { useState, useEffect } from 'react';
import { Save, Printer, Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function NurseDischarge({ user }) {
  const [patient, setPatient] = useState('');
  const [form, setForm] = useState({ dischargeDate:'', finalDiagnosis:'', condition:'Improved', followUp:'', doctorInstructions:'', nurseNotes:'' });
  const [saved, setSaved] = useState(false);
  const [ipdList, setIpdList] = useState([]);
  const [loading, setLoading] = useState(true);

  const conditions = ['Improved','Stable','Transferred','DAMA (Discharge Against Medical Advice)','Expired'];

  useEffect(() => {
    fetchAdmittedPatients();
  }, []);

  const fetchAdmittedPatients = () => {
    setLoading(true);
    fetch(`${API_BASE}/ipd`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIpdList(data.filter(r => r.status === 'Admitted'));
        }
      })
      .catch(err => console.log('Failed to fetch admitted patient lists:', err))
      .finally(() => setLoading(false));
  };

  const handleSave = e => {
    e.preventDefault();
    if (!patient) return alert('Select a patient.');

    fetch(`${API_BASE}/nurse/discharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient,
        dischargeDate: form.dischargeDate,
        condition: form.condition,
        medicationAdvised: form.doctorInstructions,
        instructions: form.followUp,
        by: user?.name || 'Sr. Mary D\'Souza'
      })
    })
      .then(res => res.json())
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setForm({ dischargeDate:'', finalDiagnosis:'', condition:'Improved', followUp:'', doctorInstructions:'', nurseNotes:'' });
        setPatient('');
        fetchAdmittedPatients();
      })
      .catch(err => console.log('Failed to save discharge summary:', err));
  };

  return (
    <div>
      <Topbar title="Nurse — Discharge Summary" user={user?.name} />
      <div className="page-body">
        <div className="page-header"><div><h2>Discharge Summary</h2><p>Generate discharge summary for admitted patients</p></div></div>
        {saved && <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#34d399' }}>✓ Discharge summary saved & patient status updated!</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Patients...</h4>
          </div>
        ) : (
          <div className="card" style={{ maxWidth: 720 }}>
            <div className="section-title"><span></span>Discharge Summary Form</div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Select Patient (IPD)</label>
                <select className="form-control" value={patient} onChange={e => setPatient(e.target.value)} required>
                  <option value="">— Select Admitted Patient —</option>
                  {ipdList.map(r=><option key={r.id} value={r.id}>{r.ioId} — {r.patientName}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Discharge Date *</label>
                  <input type="date" className="form-control" value={form.dischargeDate} onChange={e => setForm({...form,dischargeDate:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Condition at Discharge</label>
                  <select className="form-control" value={form.condition} onChange={e => setForm({...form,condition:e.target.value})}>
                    {conditions.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Final Diagnosis</label>
                <textarea className="form-control" rows={2} value={form.finalDiagnosis} onChange={e => setForm({...form,finalDiagnosis:e.target.value})} placeholder="Enter final diagnosis..." />
              </div>
              <div className="form-group">
                <label className="form-label">Follow-up Instructions</label>
                <textarea className="form-control" rows={2} value={form.followUp} onChange={e => setForm({...form,followUp:e.target.value})} placeholder="e.g. Follow up after 2 weeks..." />
              </div>
              <div className="form-group">
                <label className="form-label">Doctor's Instructions / Medications at Home</label>
                <textarea className="form-control" rows={3} value={form.doctorInstructions} onChange={e => setForm({...form,doctorInstructions:e.target.value})} placeholder="Medications, diet, activity restrictions..." />
              </div>
              <div className="form-group">
                <label className="form-label">Nurse Notes</label>
                <textarea className="form-control" rows={2} value={form.nurseNotes} onChange={e => setForm({...form,nurseNotes:e.target.value})} placeholder="Additional nursing notes..." />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" className="btn btn-primary"><Save size={14}/> Save Discharge Summary</button>
                <button type="button" className="btn btn-secondary" onClick={() => window.print()}><Printer size={14}/> Print Summary</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
