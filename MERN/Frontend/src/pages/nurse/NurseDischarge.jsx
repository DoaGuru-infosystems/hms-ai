import { useState, useEffect } from 'react';
import { Save, Printer, Loader2, Calendar, History, Search, Clock, X, Plus, Trash2, Heart, Award, ArrowLeft, ArrowRight, User, Stethoscope, AlertTriangle, FileText, CheckCircle, Shield } from 'lucide-react';
import Topbar from '../../components/Topbar';
import ClockTimePicker from '../../components/ClockTimePicker';

const API_BASE = 'http://localhost:5001/api';

const defaultSummaryData = {
  // 1. Patient Information
  patientId: '',
  patientName: '',
  age: '',
  gender: 'Male',
  contactNumber: '',
  address: '',

  // 2. Admission Details
  admissionId: '',
  admissionDateTime: '',
  dischargeDateTime: new Date().toISOString().slice(0, 16),
  wardRoomBed: '',
  attendingDoctor: '',

  // 3. Diagnosis
  primaryDiagnosis: '',
  secondaryDiagnosis: '',
  finalDiagnosis: '',

  // 4. Chief Complaints
  symptomsAtAdmission: '',
  durationOfSymptoms: '',

  // 5. Medical History
  pastIllnesses: '',
  previousSurgeries: '',
  allergies: '',
  familyHistory: '',

  // 6. Treatment Summary
  proceduresPerformed: '',
  surgeriesConducted: '',
  treatmentsGiven: '',
  icuStayDetails: '',

  // 7. Medications During Hospital Stay
  stayMedications: [], // Array of { medicine: '', dosage: '', frequency: '', duration: '' }

  // 8. Investigation Results
  bloodTests: '',
  urineTests: '',
  xray: '',
  ctScan: '',
  mri: '',
  ecg: '',
  otherReports: '',

  // 9. Condition at Discharge
  conditionAtDischarge: 'Stable', // Stable, Improved, Recovered, Referred, Against Medical Advice (AMA)

  // 10. Discharge Medications
  dischargeMedications: [], // Array of { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }

  // 11. Follow-Up Instructions
  nextVisitDate: '',
  doctorToConsult: '',
  lifestyleAdvice: '',
  dietRecommendations: '',
  activityRestrictions: '',

  // 12. Special Instructions
  woundCare: '',
  physiotherapyAdvice: '',
  warningSigns: '',

  // 13. Billing Information
  totalCharges: '',
  paidAmount: '',
  dueAmount: '',

  // 14. Signatures
  doctorSignatureName: '',
  nurseSignatureName: '',
  patientAttendantSignatureName: '',
  hasHospitalSeal: true
};

export default function NurseDischarge({ user }) {
  const [patient, setPatient] = useState('');
  const [summaryData, setSummaryData] = useState({ ...defaultSummaryData });
  const [saved, setSaved] = useState(false);
  const [ipdList, setIpdList] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Navigation State
  const [activeTab, setActiveTab] = useState('patientInfo');
  
  // History Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Selected Record for viewing/printing
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const conditions = [
    { value: 'Stable', label: 'Stable' },
    { value: 'Improved', label: 'Improved' },
    { value: 'Recovered', label: 'Recovered' },
    { value: 'Referred', label: 'Referred' },
    { value: 'Against Medical Advice (AMA)', label: 'Against Medical Advice (AMA)' }
  ];

  const refreshData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/ipd`).then(res => res.json()),
      fetch(`${API_BASE}/patients`).then(res => res.json()),
      fetch(`${API_BASE}/nurse/discharge`).then(res => res.json())
    ])
      .then(([ipdData, patientsData, dischargeData]) => {
        if (Array.isArray(ipdData)) setIpdList(ipdData);
        if (Array.isArray(patientsData)) setPatientsList(patientsData);
        if (Array.isArray(dischargeData)) setHistory(dischargeData);
      })
      .catch(err => console.log('Failed to fetch data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handle patient select change: auto-populate EMR details
  const handlePatientChange = (selectedId) => {
    setPatient(selectedId);
    if (!selectedId) {
      setSummaryData({ ...defaultSummaryData });
      return;
    }

    const ipdRec = ipdList.find(i => String(i.id) === String(selectedId) || String(i.ioId) === String(selectedId));
    if (!ipdRec) return;

    const patientNoVal = ipdRec.patientNo || ipdRec.patient;
    const patRec = patientsList.find(p => String(p.patientNo) === String(patientNoVal) || String(p.id) === String(patientNoVal));

    // ── Step 1: Populate what we already have from IPD + Patient records ──
    const baseline = {
      ...defaultSummaryData,
      // Section 1: Patient Information (from Patient + IPD records)
      patientId: patientNoVal || '',
      patientName: ipdRec.patientName || '',
      age: patRec?.age || '',
      gender: patRec?.gender === 1 || patRec?.gender === 'Male' ? 'Male'
            : patRec?.gender === 2 || patRec?.gender === 'Female' ? 'Female' : 'Other',
      contactNumber: patRec?.phone || patRec?.mobile_no || '',
      address: patRec?.address || patRec?.address1 || '',

      // Section 2: Admission Details (from IPD record)
      admissionId: ipdRec.ioId || ipdRec.id || '',
      admissionDateTime: ipdRec.admitDate || ipdRec.dateAdmit || '',
      wardRoomBed: [ipdRec.room || ipdRec.roomNo, ipdRec.bed || ipdRec.bedNo].filter(Boolean).join(' / Bed ') || '',
      attendingDoctor: ipdRec.doctor || '',

      // Section 3: Diagnosis (from IPD — doctor's entered data)
      primaryDiagnosis: ipdRec.diagnosis || '',
      finalDiagnosis: ipdRec.diagnosis || '',

      // Section 4: Chief Complaints (from IPD admission)
      symptomsAtAdmission: ipdRec.complaints || '',
      doctorSignatureName: ipdRec.doctor || '',
      nurseSignatureName: user?.name || '',
      patientAttendantSignatureName: ipdRec.patientName || '',
      
      durationOfSymptoms: '',  // not stored in DB, nurse fills
      doctorToConsult: ipdRec.doctor || '',

      // Section 5: Medical History — enriched below from OPD & ops
      pastIllnesses: '',
      previousSurgeries: '',
      allergies: '',
      familyHistory: '',

      // Section 6: Treatment — enriched below
      proceduresPerformed: '',
      surgeriesConducted: '',
      treatmentsGiven: '',
      icuStayDetails: ipdRec.room && (ipdRec.room || '').toLowerCase().includes('icu')
        ? `ICU Room: ${ipdRec.room}, Bed: ${ipdRec.bed || ''}` : '',

      // Sections 7 & 10: Medications — fetched below
      stayMedications: [],
      dischargeMedications: [],

      // Section 8: Investigations — fetched below
      bloodTests: '', urineTests: '', xray: '', ctScan: '', mri: '', ecg: '', otherReports: '',

      // Section 9: Condition at Discharge — nurse fills
      conditionAtDischarge: 'Stable',
    };

    setSummaryData(baseline);

    // ── Step 2: Single consolidated fetch of ALL clinical + financial data ──
    Promise.all([
      fetch(`${API_BASE}/nurse/medication?patientNo=${patientNoVal}`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/doctors/labs?patientNo=${patientNoVal}`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/doctors/operations?patientNo=${patientNoVal}`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/nurse/patient-history?patientNo=${patientNoVal}`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/nurse/vitals?patientNo=${patientNoVal}`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/opd`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/bills`).then(r => r.json()).catch(() => []),
    ]).then(([meds, labs, ops, historyData, vitals, opdRecords, bills]) => {

      // ── Section 7: Nurse medication chart → stay medications table ──
      const stayMedsList = Array.isArray(meds) && meds.length > 0
        ? meds.map(m => ({
            medicine: m.medName || '',
            dosage: m.dose || '',
            frequency: m.freq || '',
            duration: m.duration || ''
          }))
        : [];

      // ── Section 8: Doctor-ordered labs → categorize by test name keyword ──
      const blood = [], urine = [], xray = [], ct = [], mri = [], ecg = [], others = [];
      if (Array.isArray(labs)) {
        labs.forEach(l => {
          const name = (l.testName || '').toLowerCase();
          const val = l.testValue && l.testValue !== 'Pending' ? `: ${l.testValue}` : ' (Pending)';
          const str = `${l.testName}${val} [By: ${l.requestedBy || 'Doctor'}]`;
          if (name.includes('blood') || name.includes('cbc') || name.includes('hemoglobin') || name.includes('platelet') || name.includes('lft') || name.includes('kft') || name.includes('wbc') || name.includes('rbc')) blood.push(str);
          else if (name.includes('urine') || name.includes('urinalysis')) urine.push(str);
          else if (name.includes('x-ray') || name.includes('xray') || name.includes('chest x')) xray.push(str);
          else if (name.includes('ct') || name.includes('scan') || name.includes('computed tomography')) ct.push(str);
          else if (name.includes('mri') || name.includes('resonance')) mri.push(str);
          else if (name.includes('ecg') || name.includes('ekg') || name.includes('electrocardiogram')) ecg.push(str);
          else others.push(str);
        });
      }

      // ── Section 6a: Surgeries (doctor-logged operations) ──
      let surgeriesConducted = '';
      if (Array.isArray(ops) && ops.length > 0) {
        surgeriesConducted = ops.map(o => [
          `Procedure: ${o.procedureName}`,
          o.opDate ? `Date: ${o.opDate}` : '',
          o.opTime ? `Time: ${o.opTime}` : '',
          o.anesthesiologist ? `Anaesthetist: ${o.anesthesiologist}` : '',
          o.surgeonNotes ? `Notes: ${o.surgeonNotes}` : '',
          `Status: ${o.status || 'Completed'}`
        ].filter(Boolean).join(' | ')).join('\n');
      }

      // ── Section 6b: Bedside procedures (nurse-logged) ──
      let proceduresPerformed = '';
      if (historyData && Array.isArray(historyData.bedside) && historyData.bedside.length > 0) {
        proceduresPerformed = historyData.bedside
          .map(b => `${b.procedureName}${b.note ? ` — ${b.note}` : ''}${b.by ? ` (by ${b.by})` : ''}`)
          .join('\n');
      }

      // ── Section 6c: Treatments given (nurse progress notes) ──
      let treatmentsGiven = '';
      if (historyData && Array.isArray(historyData.notes) && historyData.notes.length > 0) {
        treatmentsGiven = historyData.notes
          .map(n => `[${n.date ? new Date(n.date).toLocaleDateString('en-IN') : ''}] ${n.note}${n.by ? ` (by ${n.by})` : ''}`)
          .join('\n');
      }

      // ── Section 5a: Past illnesses → from this patient's previous OPD diagnoses ──
      const patOpdHistory = Array.isArray(opdRecords)
        ? opdRecords.filter(o => String(o.patientNo) === String(patientNoVal) && o.diagnosis)
        : [];
      const pastIllnesses = patOpdHistory.length > 0
        ? patOpdHistory.map(o => `${o.dateVisit || ''} — ${o.diagnosis} (Dr: ${o.doctor || 'N/A'})`).join('\n')
        : '';

      // ── Section 5b: Previous surgeries → completed ops ──
      const completedOps = Array.isArray(ops)
        ? ops.filter(o => (o.status || '').toLowerCase() === 'completed')
        : [];
      const previousSurgeries = completedOps.length > 0
        ? completedOps.map(o => `${o.procedureName} (${o.opDate || 'Date N/A'})`).join(', ')
        : '';

      // ── Latest vitals at discharge → append to treatments ──
      let latestVitals = '';
      if (Array.isArray(vitals) && vitals.length > 0) {
        const v = vitals[0];
        const parts = [];
        if (v.bp) parts.push(`BP: ${v.bp}`);
        if (v.temp) parts.push(`Temp: ${v.temp}°F`);
        if (v.pulse) parts.push(`Pulse: ${v.pulse} bpm`);
        if (v.resp) parts.push(`Resp: ${v.resp}/min`);
        if (v.spo2) parts.push(`SpO₂: ${v.spo2}%`);
        if (v.weight) parts.push(`Weight: ${v.weight} kg`);
        if (parts.length > 0) latestVitals = `Vitals at Discharge: ${parts.join(', ')}`;
      }
      const finalTreatments = [treatmentsGiven, latestVitals].filter(Boolean).join('\n\n');

      // ── Section 13: Billing → aggregate all patient bills ──
      let totalCharges = '', paidAmount = '', dueAmount = '';
      if (Array.isArray(bills)) {
        const patBills = bills.filter(b =>
          String(b.patientNo || b.patient_no) === String(patientNoVal)
        );
        if (patBills.length > 0) {
          const total = patBills.reduce((s, b) => s + (parseFloat(b.total) || parseFloat(b.total_amount) || 0), 0);
          const paid = patBills.reduce((s, b) => s + (parseFloat(b.paid) || 0), 0);
          const due = Math.max(0, total - paid);
          if (total > 0) { totalCharges = String(total); paidAmount = String(paid); dueAmount = String(due); }
        }
      }

      // ── Push all enriched data into the form at once ──
      setSummaryData(prev => ({
        ...prev,
        // Sec 5
        pastIllnesses,
        previousSurgeries,
        // Sec 6
        surgeriesConducted,
        proceduresPerformed,
        treatmentsGiven: finalTreatments,
        // Sec 7
        stayMedications: stayMedsList,
        // Sec 8
        bloodTests: blood.join('\n'),
        urineTests: urine.join('\n'),
        xray: xray.join('\n'),
        ctScan: ct.join('\n'),
        mri: mri.join('\n'),
        ecg: ecg.join('\n'),
        otherReports: others.join('\n'),
        // Sec 13
        totalCharges,
        paidAmount,
        dueAmount,
      }));

    }).catch(err => {
      console.error('Failed to fetch clinical enrichment data:', err);
    });
  };

  // Stay Medications Handlers
  const addStayMed = () => {
    setSummaryData(prev => ({
      ...prev,
      stayMedications: [...prev.stayMedications, { medicine: '', dosage: '', frequency: '', duration: '' }]
    }));
  };

  const removeStayMed = (idx) => {
    setSummaryData(prev => {
      const updated = [...prev.stayMedications];
      updated.splice(idx, 1);
      return { ...prev, stayMedications: updated };
    });
  };

  const updateStayMed = (idx, field, val) => {
    setSummaryData(prev => {
      const updated = [...prev.stayMedications];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, stayMedications: updated };
    });
  };

  // Discharge Medications Handlers
  const addDischargeMed = () => {
    setSummaryData(prev => ({
      ...prev,
      dischargeMedications: [...prev.dischargeMedications, { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }));
  };

  const removeDischargeMed = (idx) => {
    setSummaryData(prev => {
      const updated = [...prev.dischargeMedications];
      updated.splice(idx, 1);
      return { ...prev, dischargeMedications: updated };
    });
  };

  const updateDischargeMed = (idx, field, val) => {
    setSummaryData(prev => {
      const updated = [...prev.dischargeMedications];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, dischargeMedications: updated };
    });
  };

  // Save full summary
  const handleSave = e => {
    e.preventDefault();
    if (!patient) return alert('Please select an admitted patient.');

    const formattedMedsAdvised = summaryData.dischargeMedications
      .map(m => `${m.medicine || 'Med'} (Dose: ${m.dosage || 'N/A'}, Freq: ${m.frequency || 'N/A'}, Dur: ${m.duration || 'N/A'})`)
      .join('; ');

    const formattedInstructions = [
      summaryData.nextVisitDate ? `Next Visit: ${summaryData.nextVisitDate}` : '',
      summaryData.doctorToConsult ? `Consult: ${summaryData.doctorToConsult}` : '',
      summaryData.lifestyleAdvice ? `Advice: ${summaryData.lifestyleAdvice}` : '',
      summaryData.dietRecommendations ? `Diet: ${summaryData.dietRecommendations}` : ''
    ].filter(Boolean).join(' | ');

    const payload = {
      patient,
      dischargeDate: summaryData.dischargeDateTime.split('T')[0] || new Date().toISOString().slice(0,10),
      conditionAtDischarge: summaryData.conditionAtDischarge,
      medicationAdvised: formattedMedsAdvised || 'As scheduled',
      followUpInstructions: formattedInstructions || 'Follow up as advised',
      by: user?.name || 'Sr. Mary D\'Souza',
      summaryData: summaryData // Full detailed JSON object saved to longtext
    };

    fetch(`${API_BASE}/nurse/discharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setSummaryData({ ...defaultSummaryData });
        setPatient('');
        setActiveTab('patientInfo');
        refreshData();
      })
      .catch(err => console.log('Failed to save discharge summary:', err));
  };

  // Helper date parsing functions
  const safeParseDate = (dateVal) => {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    let d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const isToday = (dateVal) => {
    const d = safeParseDate(dateVal);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const todayDischarges = history.filter(d => isToday(d.date || d.dischargeDate));

  const getFilteredDischarges = () => {
    return history.filter(d => {
      const dischargeDateVal = safeParseDate(d.date || d.dischargeDate);
      const today = new Date();

      let matchesFilter = false;
      if (historyFilter === 'all') {
        matchesFilter = true;
      } else if (historyFilter === 'today') {
        matchesFilter = dischargeDateVal.getDate() === today.getDate() &&
                        dischargeDateVal.getMonth() === today.getMonth() &&
                        dischargeDateVal.getFullYear() === today.getFullYear();
      } else if (historyFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesFilter = dischargeDateVal.getDate() === yesterday.getDate() &&
                        dischargeDateVal.getMonth() === yesterday.getMonth() &&
                        dischargeDateVal.getFullYear() === yesterday.getFullYear();
      } else if (historyFilter === 'week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);
        matchesFilter = dischargeDateVal >= startOfWeek;
      } else if (historyFilter === 'month') {
        matchesFilter = dischargeDateVal.getMonth() === today.getMonth() &&
                        dischargeDateVal.getFullYear() === today.getFullYear();
      } else if (historyFilter === 'custom') {
        if (!customDate) {
          matchesFilter = true;
        } else {
          const [year, month, day] = customDate.split('-').map(Number);
          matchesFilter = dischargeDateVal.getFullYear() === year &&
                          dischargeDateVal.getMonth() === (month - 1) &&
                          dischargeDateVal.getDate() === day;
        }
      }

      let matchesSearch = true;
      if (historySearch.trim()) {
        const searchLower = historySearch.toLowerCase();
        const patientObj = ipdList.find(item => String(item.id) === String(d.patient) || String(item.ioId) === String(d.patient) || String(item.patientNo) === String(d.patient));
        const patientName = patientObj ? patientObj.patientName.toLowerCase() : String(d.patient).toLowerCase();
        const conditionVal = (d.conditionAtDischarge || d.condition || '').toLowerCase();
        const medAdvised = (d.medicationAdvised || '').toLowerCase();
        const notes = (d.followUpInstructions || d.instructions || '').toLowerCase();
        const byUser = (d.by || '').toLowerCase();
        matchesSearch = patientName.includes(searchLower) ||
                        conditionVal.includes(searchLower) ||
                        medAdvised.includes(searchLower) ||
                        notes.includes(searchLower) ||
                        byUser.includes(searchLower);
      }

      return matchesFilter && matchesSearch;
    });
  };

  const filteredDischarges = getFilteredDischarges();
  const admittedPatientsOnly = ipdList.filter(r => r.status === 'Admitted');

  // Modal print handler
  const printRecord = (record) => {
    setSelectedRecord(record);
    setShowPrintModal(true);
  };

  // Billing Auto calculation
  const total = Number(summaryData.totalCharges) || 0;
  const paid = Number(summaryData.paidAmount) || 0;
  const due = total - paid;

  // Sync auto calculation back to state
  useEffect(() => {
    setSummaryData(prev => ({ ...prev, dueAmount: due.toString() }));
  }, [summaryData.totalCharges, summaryData.paidAmount]);

  // Tabs navigation elements
  const tabsList = [
    { id: 'patientInfo', label: '1. Patient & Admission', icon: User },
    { id: 'clinicalHistory', label: '2. Diagnosis & History', icon: Stethoscope },
    { id: 'treatments', label: '3. Treatment & Meds', icon: Heart },
    { id: 'investigations', label: '4. Labs & Discharge Meds', icon: FileText },
    { id: 'instructions', label: '5. Instructions & Signatures', icon: Shield }
  ];

  return (
    <div className="nurse-theme">
      <Topbar title="Nurse — Discharge Summary" user={user?.name} />
      
      {/* Inline styles for modern enhancements */}
      <style>{`
        .nurse-theme .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          border: none;
          background: var(--bg);
          border-bottom: 2px solid transparent;
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 8px 8px 0 0;
        }
        .nurse-theme .tab-btn:hover {
          color: var(--primary);
          background: rgba(99, 102, 241, 0.05);
        }
        .nurse-theme .tab-btn.active {
          color: var(--primary);
          border-bottom: 2px solid var(--primary);
          background: rgba(99, 102, 241, 0.08);
        }
        .nurse-theme .field-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        .nurse-theme .field-row-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        .nurse-theme .dynamic-table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }
        .nurse-theme .dynamic-table th {
          background: var(--bg-2);
          color: var(--text);
          font-weight: 700;
          padding: 10px;
          text-align: left;
          border: 1px solid var(--surface-border);
          font-size: 13px;
        }
        .nurse-theme .dynamic-table td {
          border: 1px solid var(--surface-border);
          padding: 8px;
        }
        .nurse-theme .section-subtitle {
          font-size: 13px;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 16px 0 8px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .nurse-theme .medication-card {
          border: 1px solid var(--surface-border);
          border-radius: 8px;
          padding: 12px;
          background: var(--bg);
          margin-bottom: 12px;
        }

        /* Printable Letterhead styling */
        .official-discharge-report {
          font-family: 'Inter', -apple-system, sans-serif;
          color: #1e293b;
          background: #ffffff;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border-radius: 8px;
        }
        .official-header {
          text-align: center;
          border-bottom: 3px double #94a3b8;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .official-header h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 1px;
          margin: 0 0 4px 0;
          text-transform: uppercase;
        }
        .official-header p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }
        .report-section-title {
          background: #f1f5f9;
          border-left: 4px solid #4f46e5;
          padding: 6px 12px;
          font-weight: 700;
          font-size: 13px;
          color: #1e293b;
          text-transform: uppercase;
          margin: 18px 0 10px 0;
        }
        .report-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          font-size: 12px;
          margin-bottom: 12px;
        }
        .report-grid div {
          margin-bottom: 4px;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 12px;
        }
        .report-table th {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 8px;
          text-align: left;
          font-weight: 700;
        }
        .report-table td {
          border: 1px solid #cbd5e1;
          padding: 8px;
        }
        .report-footer {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          text-align: center;
          gap: 20px;
          font-size: 12px;
        }
        .signature-line {
          border-top: 1px solid #94a3b8;
          margin-top: 50px;
          padding-top: 8px;
          font-weight: 600;
          color: #475569;
        }

        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .nurse-theme, .topbar, .sidebar, .modal-header, .modal-footer, .btn, .page-header, .form-group {
            display: none !important;
          }
          .official-discharge-report {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            display: block !important;
          }
        }
      `}</style>

      <div className="page-body">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Discharge Summary Manager</h2>
            <p>Generate and retrieve rich, structured discharge summmaries with full medical logs</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => setShowHistoryModal(true)}
          >
            <History size={16} /> Discharge History Log
          </button>
        </div>

        {saved && (
          <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#34d399', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={18} />
            <span>Discharge summary saved, patient status finalized, and records logged successfully!</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <h4>Loading Records...</h4>
          </div>
        ) : (
          <div className="grid-2" style={{ gridTemplateColumns: '1.8fr 1fr', alignItems: 'start', gap: 24 }}>
            
            {/* Main Interactive Form Wizard */}
            <div className="card" style={{ padding: '24px' }}>
              <div className="section-title" style={{ marginBottom: 16 }}>
                <span></span>Discharge Summary Form
              </div>

              {/* Patient Selection Dropdown */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Select Patient (Only Active Admitted IPDs)</label>
                <select className="form-control" value={patient} onChange={e => handlePatientChange(e.target.value)} style={{ padding: '10px 14px' }}>
                  <option value="">— Select Patient to Generate Summary —</option>
                  {admittedPatientsOnly.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.ioId} — {r.patientName} (Room: {r.room || 'N/A'}, Bed: {r.bed || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              {patient ? (
                <form onSubmit={handleSave}>
                  {/* Step Tabs Navigation */}
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-border)', marginBottom: 20, overflowX: 'auto' }}>
                    {tabsList.map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          <Icon size={14} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* TAB 1: Patient Info & Admission Details */}
                  {activeTab === 'patientInfo' && (
                    <div>
                      <div className="section-subtitle"><User size={14} /> 1. Patient Information</div>
                      <div className="field-row">
                        <div className="form-group">
                          <label className="form-label">Patient ID</label>
                          <input type="text" className="form-control" value={summaryData.patientId} onChange={e => setSummaryData({...summaryData, patientId: e.target.value})} placeholder="P-XXXXXX" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Patient Name</label>
                          <input type="text" className="form-control" value={summaryData.patientName} onChange={e => setSummaryData({...summaryData, patientName: e.target.value})} placeholder="Full Name" />
                        </div>
                      </div>
                      <div className="field-row-3">
                        <div className="form-group">
                          <label className="form-label">Age</label>
                          <input type="text" className="form-control" value={summaryData.age} onChange={e => setSummaryData({...summaryData, age: e.target.value})} placeholder="Age" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Gender</label>
                          <select className="form-control" value={summaryData.gender} onChange={e => setSummaryData({...summaryData, gender: e.target.value})}>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Contact Number</label>
                          <input type="text" className="form-control" value={summaryData.contactNumber} onChange={e => setSummaryData({...summaryData, contactNumber: e.target.value})} placeholder="Phone Number" />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 20 }}>
                        <label className="form-label">Address</label>
                        <textarea className="form-control" rows={2} value={summaryData.address} onChange={e => setSummaryData({...summaryData, address: e.target.value})} placeholder="Current Residential Address" />
                      </div>

                      <div className="section-subtitle"><Clock size={14} /> 2. Admission Details</div>
                      <div className="field-row">
                        <div className="form-group">
                          <label className="form-label">Admission ID</label>
                          <input type="text" className="form-control" value={summaryData.admissionId} onChange={e => setSummaryData({...summaryData, admissionId: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Date & Time of Admission</label>
                          <input type="text" className="form-control" value={summaryData.admissionDateTime} onChange={e => setSummaryData({...summaryData, admissionDateTime: e.target.value})} />
                        </div>
                      </div>
                      <div className="field-row-3">
                        <div className="form-group">
                          <label className="form-label">Date of Discharge *</label>
                          <input type="date" className="form-control" value={summaryData.dischargeDate || ''} onChange={e => setSummaryData({...summaryData, dischargeDate: e.target.value, dischargeDateTime: `${e.target.value}T${summaryData.dischargeTime || '00:00'}`})} required />
                        </div>
                        <div className="form-group">
                          <ClockTimePicker
                            label="Time of Discharge *"
                            value={summaryData.dischargeTime || ''}
                            onChange={val => setSummaryData({...summaryData, dischargeTime: val, dischargeDateTime: `${summaryData.dischargeDate || new Date().toISOString().slice(0,10)}T${val}`})}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Ward/Room/Bed Number</label>
                          <input type="text" className="form-control" value={summaryData.wardRoomBed} onChange={e => setSummaryData({...summaryData, wardRoomBed: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Attending Doctor</label>
                          <input type="text" className="form-control" value={summaryData.attendingDoctor} onChange={e => setSummaryData({...summaryData, attendingDoctor: e.target.value})} />
                        </div>
                      </div>

                      <div className="section-subtitle">13. Billing Information (Optional)</div>
                      <div className="field-row-3">
                        <div className="form-group">
                          <label className="form-label">Total Charges (₹)</label>
                          <input type="number" className="form-control" value={summaryData.totalCharges} onChange={e => setSummaryData({...summaryData, totalCharges: e.target.value})} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Paid Amount (₹)</label>
                          <input type="number" className="form-control" value={summaryData.paidAmount} onChange={e => setSummaryData({...summaryData, paidAmount: e.target.value})} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Due Amount (₹)</label>
                          <input type="number" className="form-control" value={summaryData.dueAmount} disabled style={{ background: 'var(--bg-2)' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                        <button type="button" className="btn btn-primary" onClick={() => setActiveTab('clinicalHistory')}>
                          Next <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Diagnosis, Chief Complaints & Medical History */}
                  {activeTab === 'clinicalHistory' && (
                    <div>
                      <div className="section-subtitle"><Stethoscope size={14} /> 3. Diagnosis</div>
                      <div className="form-group">
                        <label className="form-label">Primary Diagnosis</label>
                        <textarea className="form-control" rows={2} value={summaryData.primaryDiagnosis} onChange={e => setSummaryData({...summaryData, primaryDiagnosis: e.target.value})} placeholder="Initial clinical findings" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Secondary Diagnosis (if any)</label>
                        <textarea className="form-control" rows={2} value={summaryData.secondaryDiagnosis} onChange={e => setSummaryData({...summaryData, secondaryDiagnosis: e.target.value})} placeholder="Comorbidities, supplementary conditions" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Final Diagnosis</label>
                        <textarea className="form-control" rows={2} value={summaryData.finalDiagnosis} onChange={e => setSummaryData({...summaryData, finalDiagnosis: e.target.value})} placeholder="Confirmed diagnosis at discharge" />
                      </div>

                      <div className="section-subtitle"><AlertTriangle size={14} /> 4. Chief Complaints</div>
                      <div className="field-row">
                        <div className="form-group" style={{ flex: 2 }}>
                          <label className="form-label">Symptoms Reported at Admission</label>
                          <textarea className="form-control" rows={2} value={summaryData.symptomsAtAdmission} onChange={e => setSummaryData({...summaryData, symptomsAtAdmission: e.target.value})} placeholder="Complaints logged upon admission" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Duration of Symptoms</label>
                          <input type="text" className="form-control" value={summaryData.durationOfSymptoms} onChange={e => setSummaryData({...summaryData, durationOfSymptoms: e.target.value})} placeholder="e.g. 5 Days, 2 Weeks" />
                        </div>
                      </div>

                      <div className="section-subtitle"><History size={14} /> 5. Medical History</div>
                      <div className="field-row">
                        <div className="form-group">
                          <label className="form-label">Past Illnesses</label>
                          <textarea className="form-control" rows={2} value={summaryData.pastIllnesses} onChange={e => setSummaryData({...summaryData, pastIllnesses: e.target.value})} placeholder="Diabetes, Hypertension, etc." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Previous Surgeries</label>
                          <textarea className="form-control" rows={2} value={summaryData.previousSurgeries} onChange={e => setSummaryData({...summaryData, previousSurgeries: e.target.value})} placeholder="Any surgical history" />
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="form-group">
                          <label className="form-label">Allergies</label>
                          <textarea className="form-control" rows={2} value={summaryData.allergies} onChange={e => setSummaryData({...summaryData, allergies: e.target.value})} placeholder="Drug allergies, food allergies, etc." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Family History (Optional)</label>
                          <textarea className="form-control" rows={2} value={summaryData.familyHistory} onChange={e => setSummaryData({...summaryData, familyHistory: e.target.value})} placeholder="Congenital or hereditary issues" />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('patientInfo')}>
                          <ArrowLeft size={14} /> Back
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => setActiveTab('treatments')}>
                          Next <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Treatment Summary & Stay Medications */}
                  {activeTab === 'treatments' && (
                    <div>
                      <div className="section-subtitle"><Heart size={14} /> 6. Treatment Summary</div>
                      <div className="field-row">
                        <div className="form-group">
                          <label className="form-label">Procedures Performed</label>
                          <textarea className="form-control" rows={2} value={summaryData.proceduresPerformed} onChange={e => setSummaryData({...summaryData, proceduresPerformed: e.target.value})} placeholder="Minor clinical procedures" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Surgeries Conducted</label>
                          <textarea className="form-control" rows={2} value={summaryData.surgeriesConducted} onChange={e => setSummaryData({...summaryData, surgeriesConducted: e.target.value})} placeholder="Major operating room surgeries" />
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="form-group">
                          <label className="form-label">Treatments Given</label>
                          <textarea className="form-control" rows={2} value={summaryData.treatmentsGiven} onChange={e => setSummaryData({...summaryData, treatmentsGiven: e.target.value})} placeholder="Oxygen therapy, IV fluids, physiotherapy, etc." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ICU Stay Details (if applicable)</label>
                          <textarea className="form-control" rows={2} value={summaryData.icuStayDetails} onChange={e => setSummaryData({...summaryData, icuStayDetails: e.target.value})} placeholder="Dates, mechanical ventilation parameters, etc." />
                        </div>
                      </div>

                      <div className="section-subtitle"><Clock size={14} /> 7. Medications Administered During Hospital Stay</div>
                      <table className="dynamic-table">
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                            <th style={{ width: 50 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summaryData.stayMedications.map((med, idx) => (
                            <tr key={idx}>
                              <td>
                                <input type="text" className="form-control" style={{ padding: '6px' }} value={med.medicine} onChange={e => updateStayMed(idx, 'medicine', e.target.value)} placeholder="e.g. Paracetamol" />
                              </td>
                              <td>
                                <input type="text" className="form-control" style={{ padding: '6px' }} value={med.dosage} onChange={e => updateStayMed(idx, 'dosage', e.target.value)} placeholder="e.g. 500mg" />
                              </td>
                              <td>
                                <input type="text" className="form-control" style={{ padding: '6px' }} value={med.frequency} onChange={e => updateStayMed(idx, 'frequency', e.target.value)} placeholder="e.g. TDS (Thrice daily)" />
                              </td>
                              <td>
                                <input type="text" className="form-control" style={{ padding: '6px' }} value={med.duration} onChange={e => updateStayMed(idx, 'duration', e.target.value)} placeholder="e.g. 5 Days" />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button type="button" className="btn btn-ghost" style={{ padding: 4, color: 'var(--danger)' }} onClick={() => removeStayMed(idx)}>
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {summaryData.stayMedications.length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, padding: 12 }}>
                                No medications listed. Click button below to log medications.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={addStayMed}>
                        <Plus size={12} /> Add Row
                      </button>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('clinicalHistory')}>
                          <ArrowLeft size={14} /> Back
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => setActiveTab('investigations')}>
                          Next <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: Investigation Results & Discharge Medications */}
                  {activeTab === 'investigations' && (
                    <div>
                      <div className="section-subtitle"><FileText size={14} /> 8. Investigation Results</div>
                      <div className="grid-2" style={{ gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Blood Tests</label>
                          <textarea className="form-control" rows={2} value={summaryData.bloodTests} onChange={e => setSummaryData({...summaryData, bloodTests: e.target.value})} placeholder="CBC, LFT, KFT, Blood Sugar..." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Urine Tests</label>
                          <textarea className="form-control" rows={2} value={summaryData.urineTests} onChange={e => setSummaryData({...summaryData, urineTests: e.target.value})} placeholder="Routine, Microscopy, Culture..." />
                        </div>
                      </div>
                      <div className="grid-3" style={{ gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">X-Ray</label>
                          <textarea className="form-control" rows={2} value={summaryData.xray} onChange={e => setSummaryData({...summaryData, xray: e.target.value})} placeholder="Chest X-Ray, Bone Scans..." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">CT Scan</label>
                          <textarea className="form-control" rows={2} value={summaryData.ctScan} onChange={e => setSummaryData({...summaryData, ctScan: e.target.value})} placeholder="Brain CT, Abdomen CT..." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">MRI</label>
                          <textarea className="form-control" rows={2} value={summaryData.mri} onChange={e => setSummaryData({...summaryData, mri: e.target.value})} placeholder="Spine MRI, Joint MRI..." />
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="form-group">
                          <label className="form-label">ECG</label>
                          <textarea className="form-control" rows={2} value={summaryData.ecg} onChange={e => setSummaryData({...summaryData, ecg: e.target.value})} placeholder="Cardiac electrical logs" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Other Reports</label>
                          <textarea className="form-control" rows={2} value={summaryData.otherReports} onChange={e => setSummaryData({...summaryData, otherReports: e.target.value})} placeholder="Biopsy, Culture, ultrasound..." />
                        </div>
                      </div>

                      <div className="section-subtitle"><Clock size={14} /> 9. & 10. Discharge Condition & Medications</div>
                      <div className="form-group" style={{ maxWidth: 300, marginBottom: 16 }}>
                        <label className="form-label">Condition at Discharge</label>
                        <select className="form-control" value={summaryData.conditionAtDischarge} onChange={e => setSummaryData({...summaryData, conditionAtDischarge: e.target.value})}>
                          {conditions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>

                      <table className="dynamic-table">
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                            <th>Special Instructions</th>
                            <th style={{ width: 50 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summaryData.dischargeMedications.map((med, idx) => (
                            <tr key={idx}>
                              <td>
                                <input type="text" className="form-control" style={{ padding: '6px' }} value={med.medicine} onChange={e => updateDischargeMed(idx, 'medicine', e.target.value)} placeholder="e.g. Pantocid" />
                              </td>
                              <td>
                                <input type="text" className="form-control" style={{ padding: '6px' }} value={med.dosage} onChange={e => updateDischargeMed(idx, 'dosage', e.target.value)} placeholder="e.g. 40mg" />
                              </td>
                              <td>
                                <input type="text" className="form-control" style={{ padding: '6px' }} value={med.frequency} onChange={e => updateDischargeMed(idx, 'frequency', e.target.value)} placeholder="e.g. OD (Once daily)" />
                              </td>
                              <td>
                                <input type="text" className="form-control" style={{ padding: '6px' }} value={med.duration} onChange={e => updateDischargeMed(idx, 'duration', e.target.value)} placeholder="e.g. 10 Days" />
                              </td>
                              <td>
                                <input type="text" className="form-control" style={{ padding: '6px' }} value={med.instructions} onChange={e => updateDischargeMed(idx, 'instructions', e.target.value)} placeholder="Before breakfast, etc." />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button type="button" className="btn btn-ghost" style={{ padding: 4, color: 'var(--danger)' }} onClick={() => removeDischargeMed(idx)}>
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {summaryData.dischargeMedications.length === 0 && (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, padding: 12 }}>
                                No home medications listed. Click button below to add discharge medications.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={addDischargeMed}>
                        <Plus size={12} /> Add Row
                      </button>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('treatments')}>
                          <ArrowLeft size={14} /> Back
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => setActiveTab('instructions')}>
                          Next <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: Follow-Up, Special Instructions & Signatures */}
                  {activeTab === 'instructions' && (
                    <div>
                      <div className="section-subtitle"><Award size={14} /> 11. Follow-Up Instructions</div>
                      <div className="field-row">
                        <div className="form-group">
                          <label className="form-label">Next Visit Date</label>
                          <input type="date" className="form-control" value={summaryData.nextVisitDate} onChange={e => setSummaryData({...summaryData, nextVisitDate: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Doctor to Consult</label>
                          <input type="text" className="form-control" value={summaryData.doctorToConsult} onChange={e => setSummaryData({...summaryData, doctorToConsult: e.target.value})} placeholder="Doctor Name" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Lifestyle Advice</label>
                        <textarea className="form-control" rows={2} value={summaryData.lifestyleAdvice} onChange={e => setSummaryData({...summaryData, lifestyleAdvice: e.target.value})} placeholder="Stress management, sleep schedule, smoking cessation, etc." />
                      </div>
                      <div className="field-row">
                        <div className="form-group">
                          <label className="form-label">Diet Recommendations</label>
                          <textarea className="form-control" rows={2} value={summaryData.dietRecommendations} onChange={e => setSummaryData({...summaryData, dietRecommendations: e.target.value})} placeholder="Low sodium, high protein, liquid diet, etc." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Activity Restrictions</label>
                          <textarea className="form-control" rows={2} value={summaryData.activityRestrictions} onChange={e => setSummaryData({...summaryData, activityRestrictions: e.target.value})} placeholder="No heavy lifting, bed rest for 3 days, etc." />
                        </div>
                      </div>

                      <div className="section-subtitle"><Shield size={14} /> 12. Special Instructions</div>
                      <div className="grid-3" style={{ gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Wound Care</label>
                          <textarea className="form-control" rows={2} value={summaryData.woundCare} onChange={e => setSummaryData({...summaryData, woundCare: e.target.value})} placeholder="Dressing changes, suture removal date..." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Physiotherapy Advice</label>
                          <textarea className="form-control" rows={2} value={summaryData.physiotherapyAdvice} onChange={e => setSummaryData({...summaryData, physiotherapyAdvice: e.target.value})} placeholder="Specific exercises, rehab session bookings..." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Warning Signs (Immediate ER Visit)</label>
                          <textarea className="form-control" rows={2} value={summaryData.warningSigns} onChange={e => setSummaryData({...summaryData, warningSigns: e.target.value})} placeholder="Fever, bleeding, severe pain, breathing difficulty..." />
                        </div>
                      </div>

                      <div className="section-subtitle"><FileText size={14} /> 14. Authentication & Signatures</div>
                      <div className="grid-3" style={{ gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Doctor Signature Name</label>
                          <input type="text" className="form-control" value={summaryData.doctorSignatureName} onChange={e => setSummaryData({...summaryData, doctorSignatureName: e.target.value})} placeholder="Dr. Full Name" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Nurse Signature Name</label>
                          <input type="text" className="form-control" value={summaryData.nurseSignatureName} onChange={e => setSummaryData({...summaryData, nurseSignatureName: e.target.value})} placeholder="Nurse Full Name" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Patient/Attendant Signature Name</label>
                          <input type="text" className="form-control" value={summaryData.patientAttendantSignatureName} onChange={e => setSummaryData({...summaryData, patientAttendantSignatureName: e.target.value})} placeholder="Signee Name" />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginTop: 12 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                          <input type="checkbox" checked={summaryData.hasHospitalSeal} onChange={e => setSummaryData({...summaryData, hasHospitalSeal: e.target.checked})} />
                          Affix Hospital Digital Seal on Report
                        </label>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('investigations')}>
                          <ArrowLeft size={14} /> Back
                        </button>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Save size={16} /> Save & Finalize Discharge
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--surface-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <User size={40} style={{ color: 'var(--text-muted)' }} />
                  <h4>No Patient Selected</h4>
                  <p style={{ maxWidth: 360, margin: 0, fontSize: 13 }}>Please select an admitted patient from the dropdown list above to begin compiling their comprehensive 14-section discharge summary.</p>
                </div>
              )}
            </div>

            {/* Daily Summary Signoffs Sidebar */}
            <div className="card" style={{ padding: '24px' }}>
              <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span></span>Today's Signoffs ({todayDischarges.length})
                </div>
              </div>

              <div style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                {todayDischarges.map((d, i) => {
                  const patientObj = ipdList.find(item => String(item.id) === String(d.patient) || String(item.ioId) === String(d.patient) || String(item.patientNo) === String(d.patient));
                  const patientName = patientObj ? patientObj.patientName : d.patient;
                  
                  return (
                    <div key={i} style={{ background: 'var(--bg)', borderRadius: 8, padding: 16, marginBottom: 12, border: '1px solid var(--surface-border)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{patientName}</span>
                        <span className="badge badge-purple" style={{ fontSize: 10 }}>{d.conditionAtDischarge || d.condition}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                        <Clock size={11} />
                        Discharge: {d.dischargeDate}
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, justifyContent: 'center', padding: '6px', fontSize: 11 }}
                          onClick={() => printRecord(d)}
                        >
                          <Printer size={12} /> View & Print
                        </button>
                      </div>
                    </div>
                  );
                })}

                {todayDischarges.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', border: '1px dashed var(--surface-border)', borderRadius: '8px', background: 'var(--bg)' }}>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 12px 0', fontSize: 13 }}>No discharges processed today.</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}
                      onClick={() => setShowHistoryModal(true)}
                    >
                      <History size={13} /> Open All Records Log
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* History & Advanced Filters Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal" style={{ maxWidth: '900px', width: '90%', display: 'flex', flexDirection: 'column', height: '80vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={18} style={{ color: 'var(--primary)' }} />
                <h3>Advanced Discharge Summary Archives</h3>
              </div>
              <button className="btn-ghost" onClick={() => setShowHistoryModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            {/* Filters Toolbar */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-2)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: 4 }}>Filter Timeframe:</span>
                {[
                  { id: 'all', label: 'All History' },
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'week', label: 'This Week' },
                  { id: 'month', label: 'This Month' },
                  { id: 'custom', label: 'Custom Date' }
                ].map(btn => (
                  <button
                    key={btn.id}
                    type="button"
                    className={`btn btn-sm ${historyFilter === btn.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', borderRadius: '20px' }}
                    onClick={() => {
                      setHistoryFilter(btn.id);
                      if (btn.id !== 'custom') setCustomDate('');
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Date picker and Search input */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  {historyFilter === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label className="form-label" style={{ margin: 0, fontSize: 12 }}>Select Date:</label>
                      <input
                        type="date"
                        className="form-control"
                        style={{ width: 'auto', padding: '6px 10px', height: '34px' }}
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '320px' }}>
                  <div className="search-bar" style={{ maxWidth: '100%', width: '100%', padding: '6px 10px' }}>
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search name, doctor, diagnosis..."
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body - Scrollable list */}
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: 'var(--bg)' }}>
              {filteredDischarges.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredDischarges.map((d, i) => {
                    const patientObj = ipdList.find(item => String(item.id) === String(d.patient) || String(item.ioId) === String(d.patient) || String(item.patientNo) === String(d.patient));
                    const patientName = patientObj ? patientObj.patientName : d.patient;
                    
                    return (
                      <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{patientName}</div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                            <span className="badge badge-purple" style={{ fontSize: 10 }}>{d.conditionAtDischarge || d.condition}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              Discharge: {d.dischargeDate} · Filed By: {d.by}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                          onClick={() => {
                            setShowHistoryModal(false);
                            printRecord(d);
                          }}
                        >
                          <Printer size={12} /> View Details & Print
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 12, padding: '40px 0' }}>
                  <Calendar size={32} />
                  <h4 style={{ margin: 0 }}>No records found</h4>
                  <p style={{ fontSize: '13px', margin: 0 }}>Try adjusting your filters or search terms.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Showing <strong>{filteredDischarges.length}</strong> of <strong>{history.length}</strong> discharges
              </span>
              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Letterhead / Detailed Report Preview Modal */}
      {showPrintModal && selectedRecord && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowPrintModal(false)}>
          <div className="modal" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--surface-border)' }}>
              <h3>Print Discharge Summary Report</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={14} /> Print Document
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPrintModal(false)}>Close</button>
              </div>
            </div>

            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc' }}>
              {/* Official Hospital Document Container */}
              <div className="official-discharge-report">
                <div className="official-header">
                  <h1>CITY CARE GENERAL HOSPITAL</h1>
                  <p>Wing C, Infrastructure Layout, Medical Roster City · Contact: +91 98765 43210</p>
                  <p style={{ fontWeight: 700, color: '#4f46e5', marginTop: 10, fontSize: 14 }}>CLINICAL DISCHARGE SUMMARY</p>
                </div>

                {/* 1 & 2: Patient & Admission Grid */}
                <div className="report-section-title">1. Patient Information & 2. Admission Details</div>
                <div className="report-grid">
                  <div>
                    <strong>Patient ID:</strong> {selectedRecord.summaryData?.patientId || selectedRecord.patient} <br />
                    <strong>Patient Name:</strong> {selectedRecord.summaryData?.patientName || 'N/A'} <br />
                    <strong>Age / Gender:</strong> {selectedRecord.summaryData?.age || 'N/A'} yrs / {selectedRecord.summaryData?.gender || 'N/A'} <br />
                    <strong>Contact No:</strong> {selectedRecord.summaryData?.contactNumber || 'N/A'} <br />
                    <strong>Address:</strong> {selectedRecord.summaryData?.address || 'N/A'}
                  </div>
                  <div>
                    <strong>Admission ID:</strong> {selectedRecord.summaryData?.admissionId || 'N/A'} <br />
                    <strong>Admitted Date/Time:</strong> {selectedRecord.summaryData?.admissionDateTime || 'N/A'} <br />
                    <strong>Discharged Date/Time:</strong> {selectedRecord.summaryData?.dischargeDateTime ? new Date(selectedRecord.summaryData.dischargeDateTime).toLocaleString() : selectedRecord.dischargeDate} <br />
                    <strong>Ward/Room/Bed:</strong> {selectedRecord.summaryData?.wardRoomBed || 'N/A'} <br />
                    <strong>Attending Doctor:</strong> {selectedRecord.summaryData?.attendingDoctor || 'N/A'}
                  </div>
                </div>

                {/* 3: Diagnosis */}
                <div className="report-section-title">3. Diagnosis</div>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                  <strong>Primary Diagnosis:</strong> {selectedRecord.summaryData?.primaryDiagnosis || 'None recorded'} <br />
                  {selectedRecord.summaryData?.secondaryDiagnosis && (
                    <><strong>Secondary Diagnosis:</strong> {selectedRecord.summaryData.secondaryDiagnosis} <br /></>
                  )}
                  <strong>Final Diagnosis:</strong> {selectedRecord.summaryData?.finalDiagnosis || selectedRecord.conditionAtDischarge || 'None recorded'}
                </div>

                {/* 4 & 5: Complaints & Medical History */}
                <div className="report-section-title">4. Complaints & 5. Medical History</div>
                <div className="report-grid">
                  <div>
                    <strong>Chief Complaints:</strong> {selectedRecord.summaryData?.symptomsAtAdmission || 'N/A'} <br />
                    <strong>Duration:</strong> {selectedRecord.summaryData?.durationOfSymptoms || 'N/A'}
                  </div>
                  <div>
                    <strong>Past Illnesses:</strong> {selectedRecord.summaryData?.pastIllnesses || 'None'} <br />
                    <strong>Surgeries:</strong> {selectedRecord.summaryData?.previousSurgeries || 'None'} <br />
                    <strong>Allergies:</strong> <span style={{ color: '#dc2626', fontWeight: 600 }}>{selectedRecord.summaryData?.allergies || 'NKA (No Known Allergies)'}</span>
                  </div>
                </div>

                {/* 6: Treatment Summary */}
                <div className="report-section-title">6. Treatment Summary</div>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                  {selectedRecord.summaryData?.proceduresPerformed && <><strong>Procedures:</strong> {selectedRecord.summaryData.proceduresPerformed} <br /></>}
                  {selectedRecord.summaryData?.surgeriesConducted && <><strong>Surgeries:</strong> {selectedRecord.summaryData.surgeriesConducted} <br /></>}
                  {selectedRecord.summaryData?.treatmentsGiven && <><strong>Treatments:</strong> {selectedRecord.summaryData.treatmentsGiven} <br /></>}
                  {selectedRecord.summaryData?.icuStayDetails && <><strong>ICU Details:</strong> {selectedRecord.summaryData.icuStayDetails} <br /></>}
                  {!selectedRecord.summaryData?.proceduresPerformed && !selectedRecord.summaryData?.surgeriesConducted && !selectedRecord.summaryData?.treatmentsGiven && (
                    <span style={{ color: '#64748b' }}>Standard supportive care and medications administered.</span>
                  )}
                </div>

                {/* 7: Medications Administered */}
                {selectedRecord.summaryData?.stayMedications && selectedRecord.summaryData.stayMedications.length > 0 && (
                  <>
                    <div className="report-section-title">7. Medications During Hospital Stay</div>
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Medicine Name</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.summaryData.stayMedications.map((m, idx) => (
                          <tr key={idx}>
                            <td><strong>{m.medicine}</strong></td>
                            <td>{m.dosage}</td>
                            <td>{m.frequency}</td>
                            <td>{m.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* 8: Investigations */}
                <div className="report-section-title">8. Investigation & Lab Results</div>
                <div className="report-grid">
                  <div>
                    <strong>Blood Tests:</strong> <pre style={{ fontFamily: 'inherit', margin: 0, fontSize: 11, color: '#334155' }}>{selectedRecord.summaryData?.bloodTests || 'N/A'}</pre>
                    <strong>Urine Tests:</strong> <pre style={{ fontFamily: 'inherit', margin: 0, fontSize: 11, color: '#334155' }}>{selectedRecord.summaryData?.urineTests || 'N/A'}</pre>
                    <strong>ECG Logs:</strong> <pre style={{ fontFamily: 'inherit', margin: 0, fontSize: 11, color: '#334155' }}>{selectedRecord.summaryData?.ecg || 'N/A'}</pre>
                  </div>
                  <div>
                    <strong>X-Ray:</strong> <pre style={{ fontFamily: 'inherit', margin: 0, fontSize: 11, color: '#334155' }}>{selectedRecord.summaryData?.xray || 'N/A'}</pre>
                    <strong>CT Scan:</strong> <pre style={{ fontFamily: 'inherit', margin: 0, fontSize: 11, color: '#334155' }}>{selectedRecord.summaryData?.ctScan || 'N/A'}</pre>
                    <strong>MRI:</strong> <pre style={{ fontFamily: 'inherit', margin: 0, fontSize: 11, color: '#334155' }}>{selectedRecord.summaryData?.mri || 'N/A'}</pre>
                  </div>
                </div>

                {/* 9: Condition at Discharge */}
                <div className="report-section-title">9. Patient Condition at Discharge</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  Current Status: <span style={{ color: '#4f46e5' }}>{selectedRecord.summaryData?.conditionAtDischarge || selectedRecord.conditionAtDischarge || 'Stable'}</span>
                </div>

                {/* 10: Discharge Medications */}
                {selectedRecord.summaryData?.dischargeMedications && selectedRecord.summaryData.dischargeMedications.length > 0 ? (
                  <>
                    <div className="report-section-title">10. Discharge Medications (Take-Home Prescription)</div>
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                          <th>Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.summaryData.dischargeMedications.map((m, idx) => (
                          <tr key={idx}>
                            <td><strong>{m.medicine}</strong></td>
                            <td>{m.dosage}</td>
                            <td>{m.frequency}</td>
                            <td>{m.duration}</td>
                            <td>{m.instructions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <>
                    <div className="report-section-title">10. Discharge Medications</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Medications advised: {selectedRecord.medicationAdvised || 'No home medications prescribed.'}</div>
                  </>
                )}

                {/* 11 & 12: Follow-up & Special Instructions */}
                <div className="report-section-title">11. Follow-Up & 12. Special Instructions</div>
                <div className="report-grid">
                  <div>
                    <strong>Follow-up Consultation:</strong> {selectedRecord.summaryData?.doctorToConsult || 'As advised'} <br />
                    <strong>Next Appointment:</strong> {selectedRecord.summaryData?.nextVisitDate || 'As needed'} <br />
                    <strong>Diet:</strong> {selectedRecord.summaryData?.dietRecommendations || 'General healthy diet'} <br />
                    <strong>Lifestyle:</strong> {selectedRecord.summaryData?.lifestyleAdvice || 'None'}
                  </div>
                  <div>
                    <strong>Wound Care:</strong> {selectedRecord.summaryData?.woundCare || 'N/A'} <br />
                    <strong>Physiotherapy:</strong> {selectedRecord.summaryData?.physiotherapyAdvice || 'N/A'} <br />
                    <strong>Warning Signs (Immediate ER):</strong> <span style={{ color: '#dc2626' }}>{selectedRecord.summaryData?.warningSigns || 'Fever, breathing issues, severe surgical site pain'}</span>
                  </div>
                </div>

                {/* 13: Billing Summary */}
                {selectedRecord.summaryData?.totalCharges && (
                  <>
                    <div className="report-section-title">13. Billing Summary</div>
                    <div style={{ fontSize: 12, display: 'flex', gap: 40 }}>
                      <span><strong>Total Bill Amount:</strong> ₹{selectedRecord.summaryData.totalCharges}</span>
                      <span><strong>Total Amount Paid:</strong> ₹{selectedRecord.summaryData.paidAmount || '0'}</span>
                      <span><strong>Outstanding Due:</strong> ₹{selectedRecord.summaryData.dueAmount || '0'}</span>
                    </div>
                  </>
                )}

                {/* 14: Signatures */}
                <div className="report-footer">
                  <div>
                    <div className="signature-line">Attending Doctor</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{selectedRecord.summaryData?.doctorSignatureName || selectedRecord.by || 'Consultant Signature'}</div>
                  </div>
                  <div>
                    <div className="signature-line">Attending Nurse</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{selectedRecord.summaryData?.nurseSignatureName || selectedRecord.by || 'Duty Nurse Signature'}</div>
                  </div>
                  <div>
                    <div className="signature-line">Patient / Attendant</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{selectedRecord.summaryData?.patientAttendantSignatureName || 'Signature / Thumb print'}</div>
                  </div>
                </div>

                {/* Seal container */}
                {selectedRecord.summaryData?.hasHospitalSeal && (
                  <div style={{ textAlign: 'right', marginTop: 30 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '2px solid #10b981', padding: '4px 10px', borderRadius: '4px', color: '#10b981', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                      <CheckCircle size={10} />
                      Digitally Verified Seal
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPrintModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
