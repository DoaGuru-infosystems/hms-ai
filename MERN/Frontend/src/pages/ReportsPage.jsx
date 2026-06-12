import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Search, Download, Printer, User, FileText, Calendar, DollarSign, Stethoscope, Bed, LogOut, Check, ChevronRight, Activity, Receipt, Loader2 } from 'lucide-react';
import Topbar from '../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>
        {p.name}: {p.name === 'revenue' ? `₹${p.value.toLocaleString()}` : p.value}
      </p>)}
    </div>
  );
  return null;
};

const STATUS_BADGE = { Active: 'badge-success', Admitted: 'badge-info', Discharged: 'badge-gray' };

export default function ReportsPage({ user }) {
  const location = useLocation();
  const path = location.pathname;

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Dynamic live lists from MySQL API
  const [patients, setPatients] = useState([]);
  const [opdRecords, setOpdRecords] = useState([]);
  const [ipdRecords, setIpdRecords] = useState([]);
  const [bills, setBills] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [patientsRes, opdRes, ipdRes, billsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/patients`),
        fetch(`${API_BASE}/opd`),
        fetch(`${API_BASE}/ipd`),
        fetch(`${API_BASE}/bills`),
        fetch(`${API_BASE}/users`)
      ]);

      if (patientsRes.ok && opdRes.ok && ipdRes.ok && billsRes.ok && usersRes.ok) {
        const [pat, opd, ipd, bil, usr] = await Promise.all([
          patientsRes.json(),
          opdRes.json(),
          ipdRes.json(),
          billsRes.json(),
          usersRes.json()
        ]);
        setPatients(pat);
        setOpdRecords(opd);
        setIpdRecords(ipd);
        setBills(bil);
        setUsers(usr);
        
        if (pat.length > 0) {
          setSelectedPatientId(pat[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching clinical audit reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compile monthly revenue and patient count dynamically
  const monthlyRevenueData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ month: m, revenue: 0, patients: 0 }));

    bills.forEach(b => {
      const date = new Date(b.date);
      const mIdx = date.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        if (b.status === 'Paid') {
          data[mIdx].revenue += Number(b.total) || 0;
        }
        data[mIdx].patients += 1;
      }
    });

    const filtered = data.filter(d => d.patients > 0);
    return filtered.length > 0 ? filtered : [{ month: 'May', revenue: 0, patients: 0 }];
  }, [bills]);

  // 1. Patient Masterlist Report Filters
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchSearch = `${p.firstName || ''} ${p.lastName || ''} ${p.patientNo || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || p.status === filterStatus;
      const gStr = p.gender === 1 ? 'Male' : (p.gender === 2 ? 'Female' : p.gender);
      const matchGender = filterGender === 'All' || gStr === filterGender;
      return matchSearch && matchStatus && matchGender;
    });
  }, [patients, search, filterStatus, filterGender]);

  // 2. Individual Patient Report Details
  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id.toString() === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  const patientOPD = useMemo(() => {
    if (!selectedPatient) return [];
    return opdRecords.filter(r => r.patientNo === selectedPatient.patientNo);
  }, [selectedPatient, opdRecords]);

  const patientIPD = useMemo(() => {
    if (!selectedPatient) return [];
    return ipdRecords.filter(r => r.patientNo === selectedPatient.patientNo);
  }, [selectedPatient, ipdRecords]);

  const patientBills = useMemo(() => {
    if (!selectedPatient) return [];
    return bills.filter(b => b.patientNo === selectedPatient.patientNo);
  }, [selectedPatient, bills]);

  // 3. OPD Report
  const filteredOPD = useMemo(() => {
    return opdRecords.filter(r => {
      const matchSearch = `${r.patientName || ''} ${r.patientNo || ''} ${r.doctor || ''} ${r.ioId || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchPaid = filterStatus === 'All' || (filterStatus === 'Paid' ? r.isPaid : !r.isPaid);
      return matchSearch && matchPaid;
    });
  }, [opdRecords, search, filterStatus]);

  // 4. IPD/Admitted Patient Report
  const filteredIPD = useMemo(() => {
    return ipdRecords.filter(r => {
      const matchSearch = `${r.patientName || ''} ${r.patientNo || ''} ${r.doctor || ''} ${r.diagnosis || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchAdmitted = r.status === 'Admitted';
      return matchSearch && matchAdmitted;
    });
  }, [ipdRecords, search]);

  // 5. Discharged Patient Report
  const filteredDischarged = useMemo(() => {
    return ipdRecords.filter(r => {
      const matchSearch = `${r.patientName || ''} ${r.patientNo || ''} ${r.doctor || ''} ${r.diagnosis || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchDischarged = r.status === 'Discharged';
      return matchSearch && matchDischarged;
    });
  }, [ipdRecords, search]);

  // 6. Daily Sales Report
  const filteredSales = useMemo(() => {
    return bills.filter(b => {
      const matchSearch = `${b.invoiceNo || ''} ${b.patientName || ''} ${b.paymentType || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || b.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [bills, search, filterStatus]);

  // 7. Doctor's Fee Report
  const doctorsList = useMemo(() => {
    const doctors = users.filter(u => u.role === 'Doctor');
    return doctors.map(doc => {
      const docName = `${doc.firstName} ${doc.lastName}`;
      const docOPD = opdRecords.filter(r => r.doctor && r.doctor.includes(doc.lastName)).length;
      const docIPD = ipdRecords.filter(r => r.doctor && r.doctor.includes(doc.lastName)).length;
      const rev = (docOPD * 350) + (docIPD * 1500);
      return {
        id: doc.id,
        name: docName,
        dept: doc.department,
        opdVisits: docOPD,
        ipdVisits: docIPD,
        revenue: rev
      };
    });
  }, [users, opdRecords, ipdRecords]);

  // 8. Acknowledge Receipt Report
  const receiptBills = useMemo(() => {
    return bills.filter(b => b.status === 'Paid');
  }, [bills]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 12, color: 'var(--text-secondary)' }}>
        <Loader2 className="animate-spin" size={32} />
        <h3>Compiling Performance Audits...</h3>
      </div>
    );
  }

  const renderReportContent = () => {
    switch (path) {
      case '/reports/patient-list':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Patient Masterlist Report</h2>
                <p>Comprehensive register of all registered hospital patients</p>
              </div>
              <div className="page-actions">
                <button className="btn btn-secondary" onClick={handlePrint}><Printer size={14}/> Print</button>
                <button className="btn btn-primary" onClick={() => alert('Export triggered')}><Download size={14}/> Export Excel</button>
              </div>
            </div>

            <div className="grid-3" style={{ marginBottom: 24 }}>
              <div className="card">
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Total Registered</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>{patients.length}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Currently Admitted</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>{patients.filter(p=>p.status==='Admitted').length}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Active OPD Patients</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#6366f1', marginTop: 4 }}>{patients.filter(p=>p.status==='Active').length}</div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20, padding: 16 }}>
              <div className="grid-3" style={{ gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Search Patient</label>
                  <div className="search-bar" style={{ width: '100%' }}>
                    <Search />
                    <input placeholder="Search by name or P-Number..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status Filter</label>
                  <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Admitted">Admitted</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Gender Filter</label>
                  <select className="form-control" value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                    <option value="All">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Patient ID</th><th>Name</th><th>Gender</th><th>Age</th><th>Blood Group</th><th>Phone</th><th>Address</th><th>Date Joined</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map(p => (
                      <tr key={p.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-light)' }}>{p.patientNo}</span></td>
                        <td style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</td>
                        <td>{p.gender === 1 ? 'Male' : (p.gender === 2 ? 'Female' : p.gender)}</td>
                        <td>{p.age} yrs</td>
                        <td><span className="badge badge-purple">{p.bloodGroup}</span></td>
                        <td>{p.phone}</td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{p.address}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.dateEntry}</td>
                        <td><span className={`badge ${STATUS_BADGE[p.status] || 'badge-gray'}`}>{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '/reports/individual-patient':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Individual Patient Report</h2>
                <p>Unified 360-degree timeline of a selected patient's visits, medical records, and billing</p>
              </div>
              <div className="page-actions">
                <button className="btn btn-secondary" onClick={handlePrint}><Printer size={14}/> Print Dossier</button>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 24, padding: 16 }}>
              <div className="form-group" style={{ maxWidth: 400, marginBottom: 0 }}>
                <label className="form-label">Select Patient Profile</label>
                <select className="form-control" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}>
                  <option value="">-- Choose a patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id.toString()}>{p.patientNo} - {p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPatient ? (
              <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'flex-start', gap: 24 }}>
                {/* 360 Information Card */}
                <div className="card">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 12 }}>
                      {(selectedPatient.firstName || 'P')[0]}
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                    <span className={`badge ${STATUS_BADGE[selectedPatient.status] || 'badge-gray'}`} style={{ marginTop: 6 }}>{selectedPatient.status}</span>
                  </div>
                  <div style={{ padding: '16px 0 0 0' }}>
                    {[
                      ['Patient Number', selectedPatient.patientNo],
                      ['Age / Gender', `${selectedPatient.age} yrs / ${selectedPatient.gender === 1 ? 'Male' : (selectedPatient.gender === 2 ? 'Female' : selectedPatient.gender)}`],
                      ['Blood Group', selectedPatient.bloodGroup],
                      ['Phone', selectedPatient.phone],
                      ['Email Address', selectedPatient.email],
                      ['Home Address', selectedPatient.address],
                      ['Registered Date', selectedPatient.dateEntry]
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Patient Records Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* 1. OPD Records */}
                  <div className="card">
                    <div className="section-title"><span></span>Outpatient Visits (OPD)</div>
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr><th>OP No.</th><th>Doctor</th><th>Department</th><th>Diagnosis</th><th>Complaints</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                          {patientOPD.length > 0 ? patientOPD.map(op => (
                            <tr key={op.id}>
                              <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{op.ioId}</span></td>
                              <td style={{ fontWeight: 600 }}>{op.doctor}</td>
                              <td>{op.department}</td>
                              <td><span className="badge badge-info">{op.diagnosis}</span></td>
                              <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{op.complaints}</td>
                              <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{op.dateVisit}</td>
                            </tr>
                          )) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No OPD visit history found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 2. IPD Admission History */}
                  <div className="card">
                    <div className="section-title"><span></span>Inpatient Admissions (IPD)</div>
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr><th>IP No.</th><th>Doctor</th><th>Department</th><th>Diagnosis</th><th>Room / Bed</th><th>Admitted</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {patientIPD.length > 0 ? patientIPD.map(ip => (
                            <tr key={ip.id}>
                              <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ip.ioId}</span></td>
                              <td style={{ fontWeight: 600 }}>{ip.doctor}</td>
                              <td>{ip.department}</td>
                              <td><span className="badge badge-purple">{ip.diagnosis}</span></td>
                              <td>Ward {ip.room} · Bed {ip.bed}</td>
                              <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ip.dateAdmit}</td>
                              <td><span className={`badge ${ip.status === 'Admitted' ? 'badge-success' : 'badge-gray'}`}>{ip.status}</span></td>
                            </tr>
                          )) : (
                            <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No IPD hospital admission records found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 3. Bills & Invoices */}
                  <div className="card">
                    <div className="section-title"><span></span>Invoice & Receipt History</div>
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr><th>Invoice No.</th><th>Date</th><th>Payment Type</th><th>Amount (₹)</th><th>Paid (₹)</th><th>Dues (₹)</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {patientBills.length > 0 ? patientBills.map(b => (
                            <tr key={b.id}>
                              <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-light)' }}>{b.invoiceNo}</span></td>
                              <td style={{ fontSize: 12 }}>{b.date}</td>
                              <td>{b.paymentType}</td>
                              <td style={{ fontWeight: 600 }}>₹{b.total.toLocaleString()}</td>
                              <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{b.paid.toLocaleString()}</td>
                              <td style={{ color: b.total - b.paid > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: 600 }}>
                                ₹{(b.total - b.paid).toLocaleString()}
                              </td>
                              <td><span className={`badge ${b.status === 'Paid' ? 'badge-success' : b.status === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>{b.status}</span></td>
                            </tr>
                          )) : (
                            <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No billing invoices found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>Please select a patient from the dropdown list above to generate their complete report dossiers.</p>
              </div>
            )}
          </div>
        );

      case '/reports/outpatient':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Outpatient visit Report (OPD)</h2>
                <p>Register of all patients registered under OPD clinics</p>
              </div>
              <div className="page-actions">
                <button className="btn btn-secondary" onClick={handlePrint}><Printer size={14}/> Print</button>
                <button className="btn btn-primary" onClick={() => alert('Export triggered')}><Download size={14}/> Export PDF</button>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20, padding: 16 }}>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Search OPD Register</label>
                  <div className="search-bar" style={{ width: '100%' }}>
                    <Search />
                    <input placeholder="Search by Doctor, Patient Name, OP No..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Status</label>
                  <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="All">All Visits</option>
                    <option value="Paid">Bill Paid</option>
                    <option value="Unpaid">Pending Invoices</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>OP Number</th><th>Patient Name</th><th>Consulting Doctor</th><th>Clinic Department</th><th>Diagnosis Summary</th><th>Active Complaints</th><th>Visit Date</th><th>Billing Status</th></tr>
                  </thead>
                  <tbody>
                    {filteredOPD.map(r => (
                      <tr key={r.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-light)' }}>{r.ioId}</span></td>
                        <td style={{ fontWeight: 600 }}>{r.patientName}</td>
                        <td>{r.doctor}</td>
                        <td>{r.department}</td>
                        <td><span className="badge badge-info">{r.diagnosis}</span></td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{r.complaints}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.dateVisit}</td>
                        <td>
                          <span className={`badge ${r.isPaid ? 'badge-success' : 'badge-warning'}`}>
                            {r.isPaid ? 'Bill Paid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '/reports/inpatient':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Admitted Patient Report (IPD)</h2>
                <p>Register of all patients currently admitted inside wards and ICUs</p>
              </div>
              <div className="page-actions">
                <button className="btn btn-secondary" onClick={handlePrint}><Printer size={14}/> Print</button>
                <button className="btn btn-primary" onClick={() => alert('Export triggered')}><Download size={14}/> Export PDF</button>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20, padding: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Search Admitted Patients</label>
                <div className="search-bar" style={{ width: '100%' }}>
                  <Search />
                  <input placeholder="Search by Patient Name, Doctor, IP No or Room..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>IP Number</th><th>Patient Name</th><th>Attending Doctor</th><th>Ward Department</th><th>Assigned Room / Bed</th><th>Admitting Diagnosis</th><th>Date Admitted</th><th>Admission Status</th></tr>
                  </thead>
                  <tbody>
                    {filteredIPD.map(r => (
                      <tr key={r.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-light)' }}>{r.ioId}</span></td>
                        <td style={{ fontWeight: 600 }}>{r.patientName}</td>
                        <td>{r.doctor}</td>
                        <td>{r.department}</td>
                        <td style={{ fontWeight: 600 }}>Room {r.room} · Bed {r.bed}</td>
                        <td><span className="badge badge-purple">{r.diagnosis}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.dateAdmit}</td>
                        <td><span className="badge badge-success">{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '/reports/discharged':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Discharged Patient Report</h2>
                <p>Register of all patients discharged from clinical wards</p>
              </div>
              <div className="page-actions">
                <button className="btn btn-secondary" onClick={handlePrint}><Printer size={14}/> Print</button>
                <button className="btn btn-primary" onClick={() => alert('Export triggered')}><Download size={14}/> Export PDF</button>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20, padding: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Search Discharges</label>
                <div className="search-bar" style={{ width: '100%' }}>
                  <Search />
                  <input placeholder="Search by Patient Name, Doctor, IP No or Room..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>IP Number</th><th>Patient Name</th><th>Attending Doctor</th><th>Ward Department</th><th>Diagnosis</th><th>Date Admitted</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {filteredDischarged.map(r => (
                      <tr key={r.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-light)' }}>{r.ioId}</span></td>
                        <td style={{ fontWeight: 600 }}>{r.patientName}</td>
                        <td>{r.doctor}</td>
                        <td>{r.department}</td>
                        <td><span className="badge badge-gray">{r.diagnosis}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.dateAdmit}</td>
                        <td><span className="badge badge-gray">{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '/reports/daily-sales':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Daily Sales & Revenue Report</h2>
                <p>Register of billing transactions and collected invoice revenue</p>
              </div>
              <div className="page-actions">
                <button className="btn btn-secondary" onClick={handlePrint}><Printer size={14}/> Print</button>
                <button className="btn btn-primary" onClick={() => alert('Export triggered')}><Download size={14}/> Export Excel</button>
              </div>
            </div>

            <div className="grid-4" style={{ marginBottom: 24 }}>
              {[
                { label: 'Gross Amount', value: `₹${bills.reduce((s,b)=>s+b.total,0).toLocaleString()}`, color: '#6366f1' },
                { label: 'Revenue Collected', value: `₹${bills.reduce((s,b)=>s+b.paid,0).toLocaleString()}`, color: '#10b981' },
                { label: 'Outstanding Dues', value: `₹${bills.reduce((s,b)=>s+(b.total-b.paid),0).toLocaleString()}`, color: '#f59e0b' },
                { label: 'Insurance Collections', value: `₹${bills.filter(b=>b.paymentType==='Insurance').reduce((s,b)=>s+b.total,0).toLocaleString()}`, color: '#8b5cf6' },
              ].map(k => (
                <div key={k.label} className="card">
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{k.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginBottom: 20, padding: 16 }}>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Search Invoices</label>
                  <div className="search-bar" style={{ width: '100%' }}>
                    <Search />
                    <input placeholder="Search by Patient, Invoice No, Payment Mode..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Invoice Status</label>
                  <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="All">All Invoices</option>
                    <option value="Paid">Fully Paid</option>
                    <option value="Pending">Unpaid / Pending</option>
                    <option value="Partial">Partially Paid</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice No.</th><th>Patient Name</th><th>Date Generated</th><th>Payment Mode</th>
                      <th>Subtotal (₹)</th><th>Discount (₹)</th><th>Grand Total (₹)</th><th>Paid (₹)</th>
                      <th>Outstanding Dues (₹)</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map(b => (
                      <tr key={b.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-light)' }}>{b.invoiceNo}</span></td>
                        <td style={{ fontWeight: 600 }}>{b.patientName}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.date}</td>
                        <td>{b.paymentType}</td>
                        <td>₹{b.subtotal.toLocaleString()}</td>
                        <td style={{ color: 'var(--danger)' }}>-₹{b.discount.toLocaleString()}</td>
                        <td style={{ fontWeight: 700 }}>₹{b.total.toLocaleString()}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{b.paid.toLocaleString()}</td>
                        <td style={{ color: b.total - b.paid > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: 600 }}>
                          ₹{(b.total - b.paid).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${b.status === 'Paid' ? 'badge-success' : b.status === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '/reports/doctor-fee':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Doctor's Fee & Appointment Summary</h2>
                <p>Register of patient consulting fees and active clinician appointments</p>
              </div>
              <div className="page-actions">
                <button className="btn btn-secondary" onClick={handlePrint}><Printer size={14}/> Print</button>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>#</th><th>Consulting Doctor</th><th>Specialist Department</th><th>Total OPD Clinics</th><th>Total IPD Rounds</th><th>Total Appointments</th><th>Estimated Fee Revenue (₹)</th></tr>
                  </thead>
                  <tbody>
                    {doctorsList.map((doc, i) => (
                      <tr key={doc.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i+1}</td>
                        <td style={{ fontWeight: 600 }}>{doc.name}</td>
                        <td>{doc.dept}</td>
                        <td>{doc.opdVisits} visits</td>
                        <td>{doc.ipdVisits} rounds</td>
                        <td style={{ fontWeight: 600 }}>{doc.opdVisits + doc.ipdVisits} booked</td>
                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{doc.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '/reports/acknowledge-receipt':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Acknowledge Receipt Report</h2>
                <p>Audit register of fully paid invoicing receipts</p>
              </div>
              <div className="page-actions">
                <button className="btn btn-secondary" onClick={handlePrint}><Printer size={14}/> Print Audit List</button>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Receipt No.</th><th>Patient Name</th><th>Date Audited</th><th>Payment Mode</th><th>Total Amount Paid (₹)</th><th>Audit Status</th></tr>
                  </thead>
                  <tbody>
                    {receiptBills.map((b, i) => (
                      <tr key={b.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-light)' }}>AR-0000{i+1}</span></td>
                        <td style={{ fontWeight: 600 }}>{b.patientName}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.date}</td>
                        <td>{b.paymentType}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{b.paid.toLocaleString()}</td>
                        <td><span className="badge badge-success">Acknowledged & Audited</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <div className="page-header">
              <div><h2>Reports & Analytics</h2><p>Hospital performance overview</p></div>
              <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={handlePrint}>📥 Export PDF</button>
            </div>

            <div className="grid-4" style={{ marginBottom: 24 }}>
              {[
                { label: 'Total OPD Visits', value: opdRecords.length, color: '#6366f1' },
                { label: 'Total IPD Admissions', value: ipdRecords.length, color: '#8b5cf6' },
                { label: 'Revenue Collected', value: `₹${bills.reduce((s,b)=>s+b.paid,0).toLocaleString()}`, color: '#10b981' },
                { label: 'Pending Dues', value: `₹${bills.reduce((s,b)=>s+(b.total-b.paid),0).toLocaleString()}`, color: '#f59e0b' },
              ].map(k => (
                <div key={k.label} className="card">
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{k.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            <div className="grid-2" style={{ marginBottom: 24 }}>
              <div className="card">
                <div className="section-title"><span></span>Monthly Revenue (₹)</div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenueData} margin={{ left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card">
                <div className="section-title"><span></span>Monthly Patient Count</div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyRevenueData} margin={{ left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="patients" name="patients" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title"><span></span>Monthly Performance Summary</div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Month</th><th>Revenue (₹)</th><th>Patients Admitted / OPD</th><th>Avg Revenue/Patient</th></tr></thead>
                  <tbody>
                    {monthlyRevenueData.map(row => (
                      <tr key={row.month}>
                        <td style={{ fontWeight: 600 }}>{row.month} 2026</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{row.revenue.toLocaleString()}</td>
                        <td>{row.patients.toLocaleString()} visits</td>
                        <td>₹{row.patients > 0 ? Math.round(row.revenue / row.patients).toLocaleString() : '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <Topbar title="Reports & Analytics" user={user?.name} />
      <div className="page-body">
        {renderReportContent()}
      </div>
    </div>
  );
}
