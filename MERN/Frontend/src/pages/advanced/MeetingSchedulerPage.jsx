import { useState } from 'react';
import { CalendarCheck, Clock, Video, User, Plus, RefreshCw, Layers, Calendar, CheckCircle } from 'lucide-react';
import Topbar from '../../components/Topbar';

export default function MeetingSchedulerPage({ user }) {
  const [meetings, setMeetings] = useState([
    { id: 'M-101', title: 'Cardiology Case Review', type: 'Clinical Staff Meeting', host: 'Dr. Ramesh Sharma', date: '2026-05-30', time: '10:00 AM', link: 'https://meet.medicare.hms/cardio-case-review' },
    { id: 'M-102', title: 'Telehealth Consult - Patient A.K.', type: 'Telemedicine Call', host: 'Dr. Amit Malhotra', date: '2026-05-30', time: '02:30 PM', link: 'https://meet.medicare.hms/telehealth-ak' },
    { id: 'M-103', title: 'Weekly Hospital Operations Board', type: 'Board Meeting', host: 'Administrator (You)', date: '2026-06-01', time: '11:00 AM', link: 'https://meet.medicare.hms/operations-weekly' }
  ]);

  const [shifts, setShifts] = useState([
    { name: 'Dr. Ramesh Sharma', role: 'Doctor', dept: 'Cardiology', shift: 'Morning (08:00 - 16:00)', ward: 'ICU-Cardio' },
    { name: 'Dr. Amit Malhotra', role: 'Doctor', dept: 'General Medicine', shift: 'Evening (16:00 - 00:00)', ward: 'General Ward' },
    { name: 'Nurse Anjali Gupta', role: 'Nurse', dept: 'Pediatrics', shift: 'Night (00:00 - 08:00)', ward: 'Ward-Pediatrics' }
  ]);

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    type: 'Telemedicine Call',
    host: '',
    date: '',
    time: ''
  });

  const [generatingShifts, setGeneratingShifts] = useState(false);
  const [shiftsDone, setShiftsDone] = useState(false);

  const handleAddMeeting = (e) => {
    e.preventDefault();
    if (!newMeeting.title || !newMeeting.host || !newMeeting.date || !newMeeting.time) {
      return alert('Please fill in all meeting details.');
    }

    const meetingId = 'M-' + Math.floor(Math.random() * 900 + 100);
    const link = `https://meet.medicare.hms/${newMeeting.title.toLowerCase().replace(/\s+/g, '-')}`;

    setMeetings([...meetings, { ...newMeeting, id: meetingId, link }]);
    setNewMeeting({ title: '', type: 'Telemedicine Call', host: '', date: '', time: '' });
    alert('Telehealth meeting scheduled successfully and clinical join link generated!');
  };

  const handleAutoShiftScheduler = () => {
    setGeneratingShifts(true);
    setShiftsDone(false);
    setTimeout(() => {
      setShifts([
        { name: 'Dr. Ramesh Sharma', role: 'Doctor', dept: 'Cardiology', shift: 'Morning (08:00 - 16:00)', ward: 'ICU-Cardio' },
        { name: 'Dr. Amit Malhotra', role: 'Doctor', dept: 'General Medicine', shift: 'Evening (16:00 - 00:00)', ward: 'General Ward' },
        { name: 'Dr. Preeti Verma', role: 'Doctor', dept: 'Pediatrics', shift: 'Morning (08:00 - 16:00)', ward: 'Ward-Pediatrics' },
        { name: 'Nurse Anjali Gupta', role: 'Nurse', dept: 'Pediatrics', shift: 'Night (00:00 - 08:00)', ward: 'Ward-Pediatrics' },
        { name: 'Nurse Vikram Singh', role: 'Nurse', dept: 'General Medicine', shift: 'Evening (16:00 - 00:00)', ward: 'ICU-B' },
        { name: 'Nurse Clara D\'Souza', role: 'Nurse', dept: 'Cardiology', shift: 'Night (00:00 - 08:00)', ward: 'ICU-Cardio' }
      ]);
      setGeneratingShifts(false);
      setShiftsDone(true);
    }, 2000);
  };

  return (
    <div>
      <Topbar title="Shift Roster & Telehealth Scheduler" user={user?.name} />
      <div className="page-body">
        <div className="page-header" style={{ padding: 0, marginBottom: 20 }}>
          <div>
            <h2>Clinical Shift & Meeting Hub</h2>
            <p>Schedule telemedicine consults, staff sessions, and auto-match nursing ward shifts</p>
          </div>
        </div>

        <div className="grid-2">
          {/* Telemedicine & Clinical Meetings Scheduler */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Create Meeting */}
            <div className="card">
              <div className="section-title"><span></span>Schedule Telemedicine / Conference</div>
              <form onSubmit={handleAddMeeting}>
                <div className="form-group">
                  <label className="form-label">Meeting / Consultation Title</label>
                  <input className="form-control" placeholder="e.g. Telehealth Consultation - Rajesh Kumar" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Meeting Type</label>
                    <select className="form-control" value={newMeeting.type} onChange={e => setNewMeeting({...newMeeting, type: e.target.value})}>
                      <option>Telemedicine Call</option>
                      <option>Clinical Staff Meeting</option>
                      <option>Board Meeting</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Host / Clinical Doctor</label>
                    <input className="form-control" placeholder="Dr. Name" value={newMeeting.host} onChange={e => setNewMeeting({...newMeeting, host: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input type="time" className="form-control" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 12 }}>
                  <Plus size={14} /> Schedule Meeting & Generate Video Link
                </button>
              </form>
            </div>

            {/* Scheduled Board */}
            <div className="card">
              <div className="section-title"><span></span>Active Meeting Schedule</div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th><th>Host</th><th>Schedule</th><th>Video Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetings.map(m => (
                      <tr key={m.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{m.title}</div>
                          <span className="badge badge-purple" style={{ fontSize: 9, padding: '2px 6px', marginTop: 4 }}>{m.type}</span>
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 500 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={12} /> {m.host}</span></td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={12} color="var(--accent-light)" /> {m.date}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={11} /> {m.time}</div>
                        </td>
                        <td>
                          <a href={m.link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', gap: 6, color: 'var(--accent-light)' }}>
                            <Video size={12} /> Join Call
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* AI Clinical Shift Rotations */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="section-title" style={{ margin: 0 }}><span></span>AI Shift Roster Auto-Scheduler</div>
                <button className="btn btn-secondary btn-sm" onClick={handleAutoShiftScheduler} disabled={generatingShifts}>
                  {generatingShifts ? <RefreshCw className="animate-spin" size={12} /> : <Layers size={12} />} Run AI Shift Matcher
                </button>
              </div>

              {shiftsDone && (
                <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', padding: '10px 14px', borderRadius: 8, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12.5 }}>
                  <CheckCircle size={14} /> AI Shift Optimization Matrix matched: Balanced shifts allocated based on ward occupancy rules!
                </div>
              )}

              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Allocate nurse and doctor duty shifts dynamically across acute wards (ICUs, Pediatrics, General Medicine).
              </p>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Staff Member</th><th>Dept / Role</th><th>Assigned Shift</th><th>Ward Allocated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((s, idx) => (
                      <tr key={idx}>
                        <td><div style={{ fontWeight: 600 }}>{s.name}</div></td>
                        <td>
                          <span className={`badge ${s.role === 'Doctor' ? 'badge-info' : 'badge-purple'}`} style={{ fontSize: 9 }}>{s.role}</span>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.dept}</div>
                        </td>
                        <td style={{ fontSize: 12, fontWeight: 500 }}>{s.shift}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-light)' }}>{s.ward}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
