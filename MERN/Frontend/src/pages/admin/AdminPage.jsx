import { useState } from 'react';
import { Plus, Trash2, Edit2, Save } from 'lucide-react';
import Topbar from '../../components/Topbar';

const pageMap = {
  company: {
    title: 'Company Information',
    fields: [['name','Company / Hospital Name','MediCare Hospital'],['address','Address','42 Healthcare Ave, Medical District'],['phone','Phone','+91 331 9233'],['email','Email','info@medicare.com'],['license','License No.','HMS-2024-001'],['tin','TIN / Tax No.','12-3456789']],
  },
  departments: { title: 'Department Master', cols: ['Department Name','Description','Head Doctor','Status'] },
  designations: { title: 'Designation Master', cols: ['Designation Name','Department','Level','Status'] },
  'bill-groups': { title: 'Bill Group Name Master', cols: ['Group Name','Description','Status'] },
  'bill-particulars': { title: 'Particular Bill Master', cols: ['Particular Name','Group','Amount (₹)','Status'] },
  complaints: { title: 'Complain Master', cols: ['Complaint / Chief Complaint','Category','Status'] },
  diagnosis: { title: 'Diagnosis Master', cols: ['Diagnosis Name / ICD Code','Category','Status'] },
  'surgical-packages': { title: 'Surgical Package', cols: ['Package Name','Procedure','Price (₹)','Status'] },
  insurance: { title: 'Insurance Company', cols: ['Company Name','Contact Person','Phone','Email','Status'] },
  'medicine-categories': { title: 'Medicine Category Master', cols: ['Category Name','Description','Status'] },
  drugs: { title: 'Drug Name Master', cols: ['Drug Name','Category','Unit','Reorder Level','Status'] },
  'acknowledge-receipt': { title: 'Acknowledge Receipt', cols: ['Receipt No.','Patient','Amount (₹)','Date','Acknowledged By','Status'] },
  parameters: { title: 'System Parameters', fields: [['currency','Currency Symbol','₹'],['dateFormat','Date Format','YYYY-MM-DD'],['timeFormat','Time Format','12-Hour'],['maxBeds','Max Beds per Room','10'],['sessionTimeout','Session Timeout (minutes)','30']] },
  backup: { title: 'Backup Database', backup: true },
  pages: { title: 'System Pages / Access Control', cols: ['Page Name','URL','Description','Role Access'] },
};

const demoRows = {
  departments: [['Cardiology','Heart and circulatory system','Dr. Rajesh Kumar','Active'],['General Medicine','General health issues','Dr. Anita Sharma','Active'],['Neurology','Brain and nervous system','Dr. Priya Mehta','Active'],['Orthopedics','Bones and muscles','Dr. Vikram Singh','Active'],['Pediatrics','Children health','Dr. Kavita Reddy','Active']],
  designations: [['Senior Doctor','General Medicine','Level 5','Active'],['Junior Doctor','All Departments','Level 3','Active'],['Head Nurse','ICU','Level 4','Active'],['Staff Nurse','All Wards','Level 2','Active'],['Receptionist','Front Desk','Level 1','Active']],
  'bill-groups': [['Consultation','Doctor consultation fees','Active'],['Surgery','Surgical procedures','Active'],['Laboratory','Diagnostic tests','Active'],['Pharmacy','Medicine costs','Active'],['Room Charges','Bed and room fees','Active']],
  'bill-particulars': [['OPD Consultation','Consultation',350,'Active'],['IPD Doctor Visit','Consultation',500,'Active'],['Appendectomy','Surgery',45000,'Active'],['CBC Test','Laboratory',350,'Active'],['Private Room (per day)','Room Charges',2500,'Active']],
  complaints: [['Fever','General','Active'],['Headache','Neurological','Active'],['Chest Pain','Cardiac','Active'],['Abdominal Pain','Gastro','Active'],['Cough & Cold','Respiratory','Active']],
  diagnosis: [['Dengue Fever / A90','Infectious','Active'],['Hypertension / I10','Cardiovascular','Active'],['Type 2 Diabetes / E11','Metabolic','Active'],['Appendicitis / K37','Surgical','Active'],['Pneumonia / J18','Respiratory','Active']],
  'surgical-packages': [['Appendectomy Package','Appendectomy',45000,'Active'],['Cataract Surgery','Ophthalmology',25000,'Active'],['LSCS Package','Obstetrics',35000,'Active'],['Hernia Repair','General Surgery',30000,'Active']],
  insurance: [['Star Health Insurance','Ramesh Kumar','+91 9001200010','star@health.com','Active'],['New India Assurance','Priya Joshi','+91 9001200020','nia@ins.com','Active'],['HDFC ERGO','Amit Verma','+91 9001200030','hdfc@ergo.com','Active']],
  'medicine-categories': [['Analgesics / Pain Killers','Pain relief medications','Active'],['Antibiotics','Bacterial infection treatment','Active'],['Antihypertensives','Blood pressure management','Active'],['Antipyretics','Fever reduction','Active'],['Vitamins & Supplements','Nutritional support','Active']],
  drugs: [['Paracetamol 500mg','Analgesics','Tablet',50,'Active'],['Amoxicillin 500mg','Antibiotics','Capsule',30,'Active'],['Metformin 500mg','Antidiabetics','Tablet',50,'Active'],['Amlodipine 5mg','Antihypertensives','Tablet',30,'Active'],['Omeprazole 20mg','Antacids','Capsule',40,'Active']],
  'acknowledge-receipt': [['AR-001','Arjun Verma',1000,'2024-05-10','Admin','Acknowledged'],['AR-002','Sunita Patel',2000,'2024-05-12','Admin','Pending']],
  pages: [['Dashboard','/dashboard','Main dashboard','All'],['Patient Master','/patient/master','Patient list','Admin, Receptionist'],['OPD Registration','/opd/registration','Register OPD','Receptionist'],['IPD Admit','/ipd/admit','Admit patient','Receptionist'],['Billing','/billing/list','Invoice management','Cashier, Admin']],
};

export default function AdminPage({ page = 'departments', user }) {
  const config = pageMap[page] || pageMap.departments;
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [saved, setSaved] = useState(false);

  const rows = demoRows[page] || [];

  if (config.backup) return (
    <div><Topbar title="Backup Database" user={user?.name} /><div className="page-body">
      <div className="page-header"><div><h2>Backup Database</h2><p>Download database backup</p></div></div>
      <div className="card" style={{ maxWidth:480 }}>
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🗄️</div>
          <h3 style={{ marginBottom:8 }}>Database Backup</h3>
          <p style={{ color:'var(--text-secondary)', marginBottom:24, fontSize:14 }}>Download a full backup of the HMS database. The backup includes all patient records, billing data, and system configurations.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <button className="btn btn-primary">Download SQL Backup</button>
            <button className="btn btn-secondary">Schedule Auto-Backup</button>
          </div>
          <div style={{ marginTop:24, fontSize:12, color:'var(--text-muted)' }}>Last backup: 2024-05-10 02:00 AM · Size: 24.5 MB</div>
        </div>
      </div>
    </div></div>
  );

  if (config.fields) return (
    <div><Topbar title={config.title} user={user?.name} /><div className="page-body">
      <div className="page-header"><div><h2>{config.title}</h2></div></div>
      {saved && <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#34d399' }}>✓ Saved successfully!</div>}
      <div className="card" style={{ maxWidth:600 }}>
        <form onSubmit={e => { e.preventDefault(); setSaved(true); setTimeout(()=>setSaved(false),2500); }}>
          {config.fields.map(([key,label,def]) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <input className="form-control" defaultValue={def} />
            </div>
          ))}
          <button type="submit" className="btn btn-primary"><Save size={14}/> Save Changes</button>
        </form>
      </div>
    </div></div>
  );

  return (
    <div><Topbar title={config.title} user={user?.name} /><div className="page-body">
      <div className="page-header">
        <div><h2>{config.title}</h2><p>Manage {config.title.toLowerCase()}</p></div>
        <div className="page-actions"><button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14}/> Add New</button></div>
      </div>
      {saved && <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, color:'#34d399' }}>✓ Saved!</div>}

      {showForm && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="section-title" style={{ display:'flex', justifyContent:'space-between' }}><span>Add New {config.title.split(' ')[0]}</span><button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button></div>
          <form onSubmit={e => { e.preventDefault(); setSaved(true); setShowForm(false); setTimeout(()=>setSaved(false),2500); }}>
            <div className="grid-2">
              {config.cols.map(col => (
                <div key={col} className="form-group">
                  <label className="form-label">{col}</label>
                  {col === 'Status' ? (
                    <select className="form-control"><option>Active</option><option>Inactive</option></select>
                  ) : col.includes('Amount') || col.includes('Price') ? (
                    <input type="number" className="form-control" placeholder="0" />
                  ) : (
                    <input className="form-control" placeholder={`Enter ${col.toLowerCase()}`} />
                  )}
                </div>
              ))}
            </div>
            <button type="submit" className="btn btn-primary"><Save size={14}/> Save</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>#</th>{config.cols.map(c => <th key={c}>{c}</th>)}<th>Actions</th></tr></thead>
            <tbody>{rows.map((row, i) => (
              <tr key={i}><td style={{ color:'var(--text-muted)', fontSize:12 }}>{i+1}</td>
                {row.map((cell, j) => <td key={j}>{
                  typeof cell === 'string' && (cell === 'Active' || cell === 'Acknowledged') ? <span className="badge badge-success">{cell}</span> :
                  typeof cell === 'string' && (cell === 'Inactive' || cell === 'Pending') ? <span className="badge badge-warning">{cell}</span> :
                  typeof cell === 'number' ? `₹${cell.toLocaleString()}` : cell
                }</td>)}
                <td style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-ghost btn-sm"><Edit2 size={13}/></button>
                  <button className="btn btn-ghost btn-sm" style={{ color:'var(--danger)' }}><Trash2 size={13}/></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div></div>
  );
}
