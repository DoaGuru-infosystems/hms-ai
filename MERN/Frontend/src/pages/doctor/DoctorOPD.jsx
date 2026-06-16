import { useState, useEffect } from 'react';
import { FileText, Loader2, Calendar, Clock, User, ArrowLeft, ArrowRight, List, ChevronRight, CheckCircle2, Check, X, Plus } from 'lucide-react';
import Topbar from '../../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

const TIMELINE_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // 9 AM to 6 PM

export default function DoctorOPD({ user }) {
  const [viewMode, setViewMode] = useState('queue'); // 'queue' or 'timeline'
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('complaint');
  const [myPatients, setMyPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Timeline state
  const [timelineDate, setTimelineDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Vitals & History states for selected patient
  const [vitals, setVitals] = useState([]);
  const [history, setHistory] = useState(null);

  // Consultation states
  const [complaints, setComplaints] = useState('');
  const [hpi, setHpi] = useState('');
  const [physicalExam, setPhysicalExam] = useState('');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  
  // Medications state
  const [medsList, setMedsList] = useState([{ medName: '', dose: '', route: 'Oral', freq: 'OD', duration: '' }]);
  const [existingMeds, setExistingMeds] = useState([]);

  // Lab requests state
  const [labsList, setLabsList] = useState([{ testName: '' }]);
  const [patientLabs, setPatientLabs] = useState([]);

  // Unified save loading state
  const [savingConsultation, setSavingConsultation] = useState(false);

  // Fetch vitals and history when a patient is selected for consultation
  useEffect(() => {
    if (selected) {
      // Decode combined complaints and diagnosis if stored in JSON format
      try {
        const parsedComplaints = JSON.parse(selected.complaints || '{}');
        if (parsedComplaints && (parsedComplaints.chief !== undefined || parsedComplaints.hpi !== undefined || parsedComplaints.physicalExam !== undefined)) {
          setComplaints(parsedComplaints.chief || '');
          setHpi(parsedComplaints.hpi || '');
          setPhysicalExam(parsedComplaints.physicalExam || '');
        } else {
          setComplaints(selected.complaints || '');
          setHpi('');
          setPhysicalExam('');
        }
      } catch (e) {
        setComplaints(selected.complaints || '');
        setHpi('');
        setPhysicalExam('');
      }

      try {
        const parsedDiagnosis = JSON.parse(selected.diagnosis || '{}');
        if (parsedDiagnosis && (parsedDiagnosis.provisional !== undefined || parsedDiagnosis.final !== undefined)) {
          setProvisionalDiagnosis(parsedDiagnosis.provisional || '');
          setFinalDiagnosis(parsedDiagnosis.final || '');
        } else {
          setProvisionalDiagnosis(selected.diagnosis || '');
          setFinalDiagnosis('');
        }
      } catch (e) {
        setProvisionalDiagnosis(selected.diagnosis || '');
        setFinalDiagnosis('');
      }

      setLabsList([{ testName: '' }]);
      setMedsList([{ medName: '', dose: '', route: 'Oral', freq: 'OD', duration: '' }]);

      const patientNoVal = selected.patientNo || selected.patientId;
      // Fetch vitals
      fetch(`${API_BASE}/nurse/vitals?patientNo=${patientNoVal}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setVitals(data);
          }
        })
        .catch(err => console.log('Failed to fetch patient vitals:', err));

      // Fetch history
      fetch(`${API_BASE}/nurse/patient-history?patientNo=${patientNoVal}`)
        .then(res => res.json())
        .then(data => {
          setHistory(data);
        })
        .catch(err => console.log('Failed to fetch patient history:', err));

      // Fetch medications
      fetch(`${API_BASE}/nurse/medication?patientNo=${patientNoVal}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setExistingMeds(data);
          }
        })
        .catch(err => console.log('Failed to fetch patient meds:', err));

      // Fetch labs
      fetch(`${API_BASE}/doctors/labs?patientNo=${patientNoVal}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPatientLabs(data);
          }
        })
        .catch(err => console.log('Failed to fetch patient labs:', err));
    }
  }, [selected]);

  // Fetch queue
  useEffect(() => {
    fetchMyPatients();
  }, [user]);

  // Fetch timeline appointments when date changes or mode changes
  useEffect(() => {
    if (viewMode === 'timeline') {
      fetchTimelineAppointments();
    }
  }, [viewMode, timelineDate]);

  const handleUpdateAppointmentStatus = async (appId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update appointment status');
      alert(`Appointment status updated to ${newStatus}`);
      fetchTimelineAppointments();
    } catch (err) {
      console.error(err);
      alert('Error updating status: ' + err.message);
    }
  };

  const handleSaveAndCompleteConsultation = async () => {
    if (!selected) return;
    setSavingConsultation(true);

    const patientNoVal = selected.patientNo || selected.patientId;
    const combinedComplaints = JSON.stringify({
      chief: complaints,
      hpi: hpi,
      physicalExam: physicalExam
    });
    const combinedDiagnosis = JSON.stringify({
      provisional: provisionalDiagnosis,
      final: finalDiagnosis
    });

    try {
      let activeIoId = selected.ioId;

      // 1. Create or update OPD Record
      if (activeIoId && activeIoId.startsWith('OP-')) {
        // Update existing OPD Record
        const res = await fetch(`${API_BASE}/opd/${activeIoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            complaints: combinedComplaints,
            diagnosis: combinedDiagnosis
          })
        });
        if (!res.ok) throw new Error('Failed to update OPD consultation record');

        // Check if there is an active appointment for today for this patient with this doctor, and complete it
        const todayStr = new Date().toISOString().split('T')[0];
        const docId = user?.id || user?.empNo || '';
        const apptCheck = await fetch(`${API_BASE}/appointments?doctorId=${docId}&date=${todayStr}`);
        if (apptCheck.ok) {
          const appts = await apptCheck.json();
          const matchApp = appts.find(a => 
            String(a.patientId) === String(patientNoVal) && 
            (a.status === 'Scheduled' || a.status === 'Confirmed')
          );
          if (matchApp) {
            await fetch(`${API_BASE}/appointments/${matchApp.id || matchApp._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'Completed' })
            });
          }
        }
      } else {
        // Creating OPD record since the patient is consulted directly from appointment / timeline
        const docName = user?.name || 'Dr. Incharge';
        const docId = user?.id || user?.empNo || '';
        const opdPayload = {
          patientNo: patientNoVal,
          doctor: docName,
          department: selected.department || 'General Medicine',
          complaints: combinedComplaints,
          diagnosis: combinedDiagnosis,
          isPaid: true
        };

        const res = await fetch(`${API_BASE}/opd`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(opdPayload)
        });
        if (!res.ok) throw new Error('Failed to create OPD consultation record');
        const newOpdRecord = await res.json();
        activeIoId = newOpdRecord.ioId;

        // Mark the timeline appointment as Completed
        if (selected.appointmentId) {
          const apptRes = await fetch(`${API_BASE}/appointments/${selected.appointmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Completed' })
          });
          if (!apptRes.ok) throw new Error('Failed to mark appointment as completed');
        }
      }

      // 2. Save prescribed medications (if any are filled out)
      const validMeds = medsList.filter(m => m.medName.trim() !== '');
      for (const med of validMeds) {
        const medRes = await fetch(`${API_BASE}/nurse/medication`, {
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
        if (!medRes.ok) throw new Error(`Failed to save prescription: ${med.medName}`);
      }

      // 3. Save requested lab tests (if any are filled out)
      const validLabs = labsList.filter(l => l.testName.trim() !== '');
      for (const lab of validLabs) {
        const labRes = await fetch(`${API_BASE}/doctors/labs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientNo: patientNoVal,
            testName: lab.testName,
            status: 'Pending',
            requestedBy: user?.name || 'Doctor'
          })
        });
        if (!labRes.ok) throw new Error(`Failed to submit lab request: ${lab.testName}`);
      }

      alert('Consultation saved and appointment marked as completed successfully!');
      setSelected(null);
      fetchMyPatients();
      fetchTimelineAppointments();
    } catch (err) {
      console.error(err);
      alert('Error during saving consultation: ' + err.message);
    } finally {
      setSavingConsultation(false);
    }
  };

  const fetchMyPatients = () => {
    setLoading(true);
    fetch(`${API_BASE}/opd`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter(r => {
            const matchesStatus = r.status === 'Active';
            
            const docIds = new Set([
              String(user?.id || '').toLowerCase(),
              String(user?.empNo || '').toLowerCase(),
              String(user?.name || '').toLowerCase().replace('dr. ', '').trim()
            ]);
            
            const rDocId = String(r.doctorId || r.doctor_id || '').toLowerCase();
            const rDocName = String(r.doctor || '').toLowerCase().replace('dr. ', '').trim();

            const matchesDoctorId = docIds.has(rDocId) || 
                                    (rDocId === '00007' && docIds.has('emp-007')) ||
                                    (rDocId === 'emp-007' && docIds.has('00007')) ||
                                    (rDocId === '00008' && docIds.has('emp-008')) ||
                                    (rDocId === 'emp-008' && docIds.has('00008')) ||
                                    (rDocId === '00011' && docIds.has('emp-011')) ||
                                    (rDocId === 'emp-011' && docIds.has('00011'));
            
            const matchesDoctorName = docIds.has(rDocName) || 
                                      (user?.name && rDocName.includes(String(user.name).toLowerCase().replace('dr. ', '').trim())) ||
                                      (rDocName && String(user?.name || '').toLowerCase().includes(rDocName));

            return matchesStatus && (matchesDoctorId || matchesDoctorName);
          });
          setMyPatients(filtered);
        } else {
          setMyPatients([]);
        }
      })
      .catch(err => {
        console.error('Failed to load doctor OPD schedule:', err);
        setMyPatients([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchTimelineAppointments = () => {
    setLoadingTimeline(true);
    // Filter by doctor's own id if they are a doctor
    const docId = user?.id || user?.empNo || '';
    fetch(`${API_BASE}/appointments?doctorId=${docId}&date=${timelineDate}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAppointments(data);
        } else {
          setAppointments([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch timeline appointments:', err);
        setAppointments([]);
      })
      .finally(() => {
        setLoadingTimeline(false);
      });
  };

  // Time conversion helper
  const parseTimeToHour = (timeStr) => {
    if (!timeStr) return 9;
    const parts = timeStr.split(' ');
    if (parts.length < 2) return 9;
    const timeVal = parts[0];
    const ampm = parts[1].toUpperCase();
    const [hStr, mStr] = timeVal.split(':');
    let h = parseInt(hStr, 10);
    let m = parseInt(mStr, 10);
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h + (m / 60);
  };

  const formatHourLabel = (h) => {
    if (h === 12) return '12 PM';
    if (h > 12) return `${h - 12} PM`;
    return `${h} AM`;
  };

  const clinicTabs = [
    { key:'complaint', label:'Complaints' },
    { key:'vitals', label:'Vital Signs' },
    { key:'diagnosis', label:'Diagnosis' },
    { key:'medication', label:'Medication' },
    { key:'lab', label:'Laboratory' },
    { key:'history', label:'Patient History' },
  ];

  return (
    <div>
      <Topbar title="Doctor Consultation Hub" user={user?.name} />
      <div className="page-body">
        
        {/* Subheader and Hub view tabs switcher */}
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <h2>Doctor Consultations & Agenda</h2>
            <p>Monitor patient queue list and scheduled appointments timeline</p>
          </div>
          <div style={{ display: 'flex', gap: 10, background: 'var(--surface)', padding: 4, borderRadius: 8, border: '1px solid var(--surface-border)' }}>
            <button 
              className={`btn btn-sm ${viewMode === 'queue' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('queue')}
              style={{ padding: '6px 12px', fontSize: 12.5 }}
            >
              <List size={14} style={{ marginRight: 6 }} /> Queue List
            </button>
            <button 
              className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('timeline')}
              style={{ padding: '6px 12px', fontSize: 12.5 }}
            >
              <Calendar size={14} style={{ marginRight: 6 }} /> Schedule Timeline
            </button>
          </div>
        </div>

        {/* --- QUEUE LIST VIEW MODE --- */}
        {viewMode === 'queue' && (
          loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12, color: 'var(--text-secondary)' }}>
              <Loader2 className="animate-spin" size={24} color="var(--primary)" />
              <h4>Loading Consultations...</h4>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>OPD No.</th>
                      <th>Patient</th>
                      <th>Department</th>
                      <th>Visit Date</th>
                      <th>Complaints</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPatients.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontFamily:'monospace', color:'var(--primary)', fontWeight: 600 }}>{r.ioId}</td>
                        <td>
                          <div style={{ fontWeight:600 }}>{r.patientName}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.patientNo}</div>
                        </td>
                        <td>{r.department}</td>
                        <td style={{ fontSize:12 }}>{r.dateVisit}</td>
                        <td style={{ fontSize:12, color:'var(--text-secondary)', maxWidth:160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.complaints}</td>
                        <td><span className="badge badge-success">Active</span></td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => { setSelected(r); setTab('complaint'); }}>
                            <FileText size={13}/> Consult
                          </button>
                        </td>
                      </tr>
                    ))}
                    {myPatients.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                          No patients registered in the queue today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* --- TIMELINE SCHEDULE VIEW MODE --- */}
        {viewMode === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filters Row */}
            <div className="card" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={18} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>Agenda Scheduler Date</span>
                <input 
                  type="date" 
                  className="form-control" 
                  style={{ width: 160, padding: '4px 10px', fontSize: 13 }}
                  value={timelineDate}
                  onChange={e => setTimelineDate(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const prev = new Date(timelineDate);
                    prev.setDate(prev.getDate() - 1);
                    setTimelineDate(prev.toISOString().split('T')[0]);
                  }}
                  style={{ padding: 6 }}
                >
                  <ArrowLeft size={14} />
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 12 }}
                  onClick={() => setTimelineDate(new Date().toISOString().split('T')[0])}
                >
                  Today
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const next = new Date(timelineDate);
                    next.setDate(next.getDate() + 1);
                    setTimelineDate(next.toISOString().split('T')[0]);
                  }}
                  style={{ padding: 6 }}
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {loadingTimeline ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12, color: 'var(--text-secondary)' }}>
                <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                <span style={{ fontSize: 13 }}>Fetching scheduled appointments...</span>
              </div>
            ) : (
              <div className="card" style={{ padding: 24, overflowX: 'auto' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                  Daily Scheduled Load Graph ({appointments.length} appointments)
                </h3>

                {appointments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                    <Calendar size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
                    <p style={{ fontWeight: 600 }}>No appointments scheduled for {timelineDate}</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>You have a clear agenda for this day.</p>
                  </div>
                ) : (
                  <div style={{ minWidth: 800, marginTop: 10 }}>
                    {/* Time Ruler (X-Axis) */}
                    <div style={{
                      display: 'flex',
                      borderBottom: '2px solid var(--surface-border)',
                      paddingBottom: 8,
                      marginBottom: 16
                    }}>
                      <div style={{ width: 200, fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)' }}>Patient / Remarks</div>
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                        {TIMELINE_HOURS.slice(0, -1).map(h => (
                          <div key={h} style={{ flex: 1, textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                            {formatHourLabel(h)}
                          </div>
                        ))}
                        <div style={{ position: 'absolute', right: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                          {formatHourLabel(TIMELINE_HOURS[TIMELINE_HOURS.length - 1])}
                        </div>
                      </div>
                    </div>

                    {/* Timeline Rows (Horizontal Bars) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {appointments.map((app) => {
                        const startHour = parseTimeToHour(app.time);
                        // Timeline spans 9 AM (9.0) to 6 PM (18.0)
                        const startOffset = Math.max(9, Math.min(18, startHour));
                        const offsetPercent = ((startOffset - 9) / 9) * 100;
                        const widthPercent = (0.75 / 9) * 100; // default 45 min slot width

                        // Status Color Mapping
                        const statusColors = {
                          Scheduled: { bg: 'rgba(59,91,219,0.1)', text: 'var(--primary)', border: '1px solid rgba(59,91,219,0.25)' },
                          Confirmed: { bg: 'rgba(18,184,134,0.1)', text: 'var(--success)', border: '1px solid rgba(18,184,134,0.25)' },
                          Completed: { bg: 'rgba(134,142,150,0.1)', text: 'var(--text-muted)', border: '1px solid rgba(134,142,150,0.25)' },
                          Cancelled: { bg: 'rgba(250,82,82,0.1)', text: 'var(--danger)', border: '1px solid rgba(250,82,82,0.25)' }
                        };

                        const currentColors = statusColors[app.status] || statusColors.Scheduled;

                        return (
                          <div key={app.id || app._id} style={{ display: 'flex', alignItems: 'center', height: 48, borderBottom: '1px solid #f1f3f5' }}>
                            {/* Patient Column */}
                            <div style={{ width: 220, paddingRight: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text)' }}>{app.patientName}</span>
                              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={10} /> {app.time}
                              </span>
                              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                {app.status === 'Scheduled' && (
                                  <>
                                    <button 
                                      className="btn btn-success btn-xs" 
                                      onClick={() => handleUpdateAppointmentStatus(app.id || app._id, 'Confirmed')}
                                      style={{ padding: '2px 6px', fontSize: 10, background: '#12b886', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      className="btn btn-danger btn-xs" 
                                      onClick={() => handleUpdateAppointmentStatus(app.id || app._id, 'Cancelled')}
                                      style={{ padding: '2px 6px', fontSize: 10, background: '#fa5252', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                {app.status === 'Confirmed' && (
                                  <>
                                    <button 
                                      className="btn btn-primary btn-xs" 
                                      onClick={() => {
                                        setSelected({
                                          ioId: `APP-${(app.id || app._id).slice(-4).toUpperCase()}`,
                                          appointmentId: app.id || app._id,
                                          patientName: app.patientName,
                                          patientNo: app.patientId,
                                          department: app.department || 'OPD',
                                          dateVisit: app.date,
                                          complaints: app.reason,
                                          status: 'Active'
                                        });
                                        setTab('complaint');
                                      }}
                                      style={{ padding: '2px 6px', fontSize: 10, background: '#3b5bdb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                                    >
                                      Consult
                                    </button>
                                    <button 
                                      className="btn btn-danger btn-xs" 
                                      onClick={() => handleUpdateAppointmentStatus(app.id || app._id, 'Cancelled')}
                                      style={{ padding: '2px 6px', fontSize: 10, background: '#fa5252', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                {app.status === 'Completed' && (
                                  <span className="badge badge-gray" style={{ fontSize: 10, padding: '2px 6px' }}>Completed</span>
                                )}
                                {app.status === 'Cancelled' && (
                                  <span className="badge badge-danger" style={{ fontSize: 10, padding: '2px 6px' }}>Cancelled</span>
                                )}
                              </div>
                            </div>

                            {/* Horizontal Graph Track */}
                            <div style={{
                              flex: 1,
                              height: '100%',
                              position: 'relative',
                              background: '#F8F9FA',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              {/* Vertical division markers */}
                              {TIMELINE_HOURS.slice(0, -1).map((_, i) => (
                                <div key={i} style={{
                                  position: 'absolute',
                                  left: `${(i / 9) * 100}%`,
                                  top: 0,
                                  bottom: 0,
                                  width: 1,
                                  borderLeft: '1px dashed #e9ecef',
                                  pointerEvents: 'none'
                                }} />
                              ))}

                              {/* Appointment Horizontal Bar */}
                              <div style={{
                                position: 'absolute',
                                left: `${offsetPercent}%`,
                                width: `calc(${widthPercent}% + 20px)`, // slightly wider for name display
                                minWidth: 140,
                                height: 32,
                                background: currentColors.bg,
                                color: currentColors.text,
                                border: currentColors.border,
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 10px',
                                fontSize: 11,
                                fontWeight: 700,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                zIndex: 2,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.06)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                              }}
                              >
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 90 }}>
                                  {app.patientName}
                                </span>
                                {app.status === 'Confirmed' ? (
                                  <button 
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => {
                                      setSelected({
                                        ioId: `APP-${(app.id || app._id).slice(-4).toUpperCase()}`,
                                        appointmentId: app.id || app._id,
                                        patientName: app.patientName,
                                        patientNo: app.patientId,
                                        department: app.department || 'OPD',
                                        dateVisit: app.date,
                                        complaints: app.reason,
                                        status: 'Active'
                                      });
                                      setTab('complaint');
                                    }}
                                    style={{ 
                                      padding: '2px 4px', 
                                      color: currentColors.text, 
                                      background: 'rgba(255,255,255,0.6)', 
                                      borderRadius: 4,
                                      fontSize: 9,
                                      fontWeight: 800,
                                      border: 'none',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    Consult <ChevronRight size={10} style={{ marginLeft: 2 }} />
                                  </button>
                                ) : (
                                  <span style={{ fontSize: 9, opacity: 0.8 }}>
                                    {app.status === 'Scheduled' ? 'Pending' : app.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- CONSULTATION MODAL --- */}
        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:760 }}>
              <div className="modal-header">
                <div>
                  <h3>Consultation — {selected.ioId}</h3>
                  <p style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{selected.patientName} · {selected.department}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div style={{ display:'flex', borderBottom:'1px solid var(--surface-border)', padding:'0 24px', gap:4, overflowX:'auto' }}>
                {clinicTabs.map(t => (
                  <button 
                    key={t.key} 
                    onClick={() => setTab(t.key)}
                    style={{ 
                      padding:'12px 14px', 
                      border:'none', 
                      background:'none', 
                      cursor:'pointer', 
                      fontSize:12.5, 
                      fontWeight:tab===t.key?700:500, 
                      color:tab===t.key?'var(--primary)':'var(--text-secondary)', 
                      borderBottom:tab===t.key?'2px solid var(--primary)':'2px solid transparent' 
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="modal-body">
                {tab === 'complaint' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Chief Complaints</label>
                      <textarea 
                        className="form-control" 
                        rows={3} 
                        value={complaints} 
                        onChange={e => setComplaints(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">History of Present Illness</label>
                      <textarea 
                        className="form-control" 
                        rows={3} 
                        placeholder="Enter history..." 
                        value={hpi}
                        onChange={e => setHpi(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Physical Examination</label>
                      <textarea 
                        className="form-control" 
                        rows={3} 
                        placeholder="Examination findings..." 
                        value={physicalExam}
                        onChange={e => setPhysicalExam(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {tab === 'vitals' && (
                  <div>
                    {vitals.length > 0 ? (
                      <div className="grid-3" style={{ gap: 14 }}>
                        {[['Blood Pressure', vitals[vitals.length-1].bp + ' mmHg'],
                          ['Temperature', vitals[vitals.length-1].temp + '°F'],
                          ['Pulse', vitals[vitals.length-1].pulse + ' bpm'],
                          ['SpO2', vitals[vitals.length-1].spo2 + '%'],
                          ['Respiratory Rate', vitals[vitals.length-1].resp + '/min'],
                          ['Weight', vitals[vitals.length-1].weight + ' kg']].map(([k,v]) => (
                          <div key={k} style={{ background:'rgba(92, 84, 243, 0.04)', borderRadius:8, padding:14, border: '1px solid var(--surface-border)' }}>
                            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{k}</div>
                            <div style={{ fontSize:18, fontWeight:800, color:'var(--primary)', marginTop:4 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No vitals recorded by nurse yet.</p>
                    )}
                  </div>
                )}
                {tab === 'diagnosis' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Provisional Diagnosis</label>
                      <textarea 
                        className="form-control" 
                        rows={3} 
                        value={provisionalDiagnosis} 
                        onChange={e => setProvisionalDiagnosis(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Final Diagnosis</label>
                      <textarea 
                        className="form-control" 
                        rows={3} 
                        placeholder="Enter final diagnosis..." 
                        value={finalDiagnosis}
                        onChange={e => setFinalDiagnosis(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {tab === 'medication' && (
                  <div>
                    {existingMeds.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: 13, marginBottom: 8 }}>Prescribed Medications</h4>
                        <div className="table-wrapper">
                           <table>
                            <thead>
                              <tr>
                                <th>Medicine</th>
                                <th>Dosage</th>
                                <th>Route</th>
                                <th>Frequency</th>
                                <th>Status</th>
                                <th>By</th>
                              </tr>
                            </thead>
                            <tbody>
                              {existingMeds.map((med, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 600 }}>{med.medName}</td>
                                  <td>{med.dose}</td>
                                  <td>{med.route}</td>
                                  <td>{med.freq}</td>
                                  <td><span className="badge badge-primary">{med.status}</span></td>
                                  <td style={{ fontSize: 11 }}>{med.by || 'Doctor'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <h4 style={{ fontSize: 13, marginBottom: 8 }}>Prescribe New Medicine</h4>
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
                    </div>
                  </div>
                )}
                {tab === 'lab' && (
                  <div>
                    <h4 style={{ fontSize: 13, marginBottom: 8 }}>Requested Lab Tests</h4>
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
                    <h4 style={{ fontSize: 13, marginBottom: 8 }}>Request New Lab Tests</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                      {labsList.map((row, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input 
                            className="form-control form-control-sm" 
                            placeholder="Enter test name (e.g. CBC, Lipid Profile)"
                            style={{ maxWidth: 300 }}
                            value={row.testName}
                            onChange={e => {
                              const updated = [...labsList];
                              updated[idx].testName = e.target.value;
                              setLabsList(updated);
                            }}
                          />
                          {labsList.length > 1 && (
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => setLabsList(labsList.filter((_, i) => i !== idx))}
                              style={{ color: 'var(--danger)', padding: 4 }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <div>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => setLabsList([...labsList, { testName: '' }])}
                        >
                          + Add Lab Test
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {tab === 'history' && (
                  <div>
                    <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:12 }}>Previous consultation records for <strong>{selected.patientName}</strong></p>
                    {history && history.notes && history.notes.length > 0 ? (
                      history.notes.map((h, i) => (
                        <div key={i} style={{ background:'rgba(92, 84, 243, 0.04)', borderRadius:8, padding:14, marginBottom:10, border: '1px solid var(--surface-border)' }}>
                          <div style={{ display:'flex', justifyContent:'space-between' }}>
                            <span style={{ fontWeight:600, color: 'var(--text)' }}>{h.note}</span>
                            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(h.date).toLocaleDateString()}</span>
                          </div>
                          <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>Logged by {h.by || 'Nurse'}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ background:'rgba(92, 84, 243, 0.04)', borderRadius:8, padding:14, marginBottom:10, border: '1px solid var(--surface-border)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontWeight:600, color: 'var(--text)' }}>{selected.diagnosis || 'Active Case'}</span>
                          <span style={{ fontSize:12, color:'var(--text-muted)' }}>{selected.dateVisit}</span>
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>OPD · {selected.doctor || 'Dr. Incharge'}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--surface-border)' }}>
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveAndCompleteConsultation}
                  style={{ background: 'var(--gradient-primary)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}
                  disabled={savingConsultation}
                >
                  {savingConsultation ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Save & Complete Consultation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
