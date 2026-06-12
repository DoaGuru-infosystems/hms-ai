import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, Loader2 } from 'lucide-react';
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

const mapItemToRow = (page, item) => {
  switch (page) {
    case 'departments':
      return [item.name || '', item.description || '', item.headDoctor || 'Dr. Rajesh Kumar', item.status || 'Active'];
    case 'designations':
      return [item.name || '', item.department || '', item.level || '', item.status || 'Active'];
    case 'bill-groups':
      return [item.name || '', item.description || '', item.status || 'Active'];
    case 'bill-particulars':
      return [item.name || '', item.group || '', Number(item.amount) || 0, item.status || 'Active'];
    case 'complaints':
      return [item.complaint || '', item.category || '', item.status || 'Active'];
    case 'diagnosis':
      return [item.diagnosis || '', item.category || '', item.status || 'Active'];
    case 'surgical-packages':
      return [item.name || '', item.procedure || '', Number(item.price) || 0, item.status || 'Active'];
    case 'insurance':
      return [item.name || '', item.contact || '', item.phone || '', item.email || '', item.status || 'Active'];
    case 'medicine-categories':
      return [item.name || '', item.description || '', item.status || 'Active'];
    case 'drugs':
      return [item.name || '', item.category || '', item.unit || '', Number(item.reorder) || 0, item.status || 'Active'];
    case 'acknowledge-receipt':
      return [item.receiptNo || '', item.patient || '', Number(item.amount) || 0, item.date || '', item.by || '', item.status || 'Pending'];
    case 'pages':
      return [item.name || '', item.url || '', item.description || '', item.roleAccess || 'All'];
    default:
      return [];
  }
};

const mapColsToItem = (page, colValues) => {
  switch (page) {
    case 'departments':
      return { name: colValues[0], description: colValues[1], headDoctor: colValues[2], status: colValues[3] };
    case 'designations':
      return { name: colValues[0], department: colValues[1], level: colValues[2], status: colValues[3] };
    case 'bill-groups':
      return { name: colValues[0], description: colValues[1], status: colValues[2] };
    case 'bill-particulars':
      return { name: colValues[0], group: colValues[1], amount: Number(colValues[2]), status: colValues[3] };
    case 'complaints':
      return { complaint: colValues[0], category: colValues[1], status: colValues[2] };
    case 'diagnosis':
      return { diagnosis: colValues[0], category: colValues[1], status: colValues[2] };
    case 'surgical-packages':
      return { name: colValues[0], procedure: colValues[1], price: Number(colValues[2]), status: colValues[3] };
    case 'insurance':
      return { name: colValues[0], contact: colValues[1], phone: colValues[2], email: colValues[3], status: colValues[4] };
    case 'medicine-categories':
      return { name: colValues[0], description: colValues[1], status: colValues[2] };
    case 'drugs':
      return { name: colValues[0], category: colValues[1], unit: colValues[2], reorder: Number(colValues[3]), status: colValues[4] };
    case 'acknowledge-receipt':
      return { receiptNo: colValues[0], patient: colValues[1], amount: Number(colValues[2]), date: colValues[3], by: colValues[4], status: colValues[5] };
    case 'pages':
      return { name: colValues[0], url: colValues[1], description: colValues[2], roleAccess: colValues[3] };
    default:
      return {};
  }
};

export default function AdminPage({ page = 'departments', user }) {
  const config = pageMap[page] || pageMap.departments;
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [formData, setFormData] = useState({});
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5001/api/settings/${page}`);
      if (res.ok) {
        const data = await res.json();
        if (config.fields) {
          setFormData(data || {});
        } else {
          setRawItems(data || []);
        }
      }
    } catch (e) {
      console.error('Error fetching admin page data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setShowForm(false);
    setEditingItem(null);
    setFormValues({});
    fetchData();
  }, [page]);

  const handleDownloadBackup = () => {
    const envApiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api';
    window.open(`${envApiBase}/settings/backup/download`, '_blank');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (config.fields) {
        // Save key-value config
        const res = await fetch(`http://localhost:5001/api/settings/${page}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        }
      } else {
        // Save tabular config
        const payload = mapColsToItem(page, config.cols.map(c => formValues[c] || ''));
        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem 
          ? `http://localhost:5001/api/settings/${page}/${editingItem.id}`
          : `http://localhost:5001/api/settings/${page}`;
        
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setSaved(true);
          setShowForm(false);
          setEditingItem(null);
          setFormValues({});
          fetchData();
          setTimeout(() => setSaved(false), 2500);
        }
      }
    } catch (e) {
      console.error('Error saving data:', e);
      alert('Failed to save data. Please check connection.');
    }
  };

  const handleEditClick = (item) => {
    const rowVals = mapItemToRow(page, item);
    const initialVals = {};
    config.cols.forEach((col, idx) => {
      initialVals[col] = rowVals[idx];
    });
    setFormValues(initialVals);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteClick = async (item) => {
    if (!window.confirm(`Are you sure you want to delete this item?`)) return;
    try {
      const res = await fetch(`http://localhost:5001/api/settings/${page}/${item.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error('Error deleting data:', e);
      alert('Failed to delete item.');
    }
  };

  if (config.backup) return (
    <div>
      <Topbar title="Backup Database" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Backup Database</h2>
            <p>Download database backup</p>
          </div>
        </div>
        <div className="card" style={{ maxWidth: 480 }}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗄️</div>
            <h3 style={{ marginBottom: 8 }}>Database Backup</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
              Download a full backup of the HMS database. The backup includes all patient records, billing data, and system configurations.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleDownloadBackup}>Download SQL Backup</button>
            </div>
            <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
              Last backup: Live Generated · Format: SQL Dump (MySQL) / JSON Package (Local Mode)
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (config.fields) return (
    <div>
      <Topbar title={config.title} user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div><h2>{config.title}</h2></div>
        </div>
        {saved && (
          <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#34d399' }}>
            ✓ Saved successfully!
          </div>
        )}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10, color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} />
            <span>Fetching configurations...</span>
          </div>
        ) : (
          <div className="card" style={{ maxWidth: 600 }}>
            <form onSubmit={handleFormSubmit}>
              {config.fields.map(([key, label]) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <input 
                    className="form-control" 
                    value={formData[key] || ''} 
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })} 
                  />
                </div>
              ))}
              <button type="submit" className="btn btn-primary"><Save size={14} /> Save Changes</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <Topbar title={config.title} user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>{config.title}</h2>
            <p>Manage {config.title.toLowerCase()}</p>
          </div>
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormValues({}); setShowForm(true); }}>
              <Plus size={14} /> Add New
            </button>
          </div>
        </div>
        {saved && (
          <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#34d399' }}>
            ✓ Saved!
          </div>
        )}

        {showForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{editingItem ? 'Edit' : 'Add New'} {config.title.split(' ')[0]}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditingItem(null); }}>✕</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="grid-2">
                {config.cols.map(col => (
                  <div key={col} className="form-group">
                    <label className="form-label">{col}</label>
                    {col === 'Status' ? (
                      <select 
                        className="form-control" 
                        value={formValues[col] || 'Active'} 
                        onChange={e => setFormValues({ ...formValues, [col]: e.target.value })}
                      >
                        <option>Active</option>
                        <option>Inactive</option>
                        {page === 'acknowledge-receipt' && <option>Acknowledged</option>}
                        {page === 'acknowledge-receipt' && <option>Pending</option>}
                      </select>
                    ) : col.includes('Amount') || col.includes('Price') ? (
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="0" 
                        value={formValues[col] || ''} 
                        onChange={e => setFormValues({ ...formValues, [col]: e.target.value })}
                        required
                      />
                    ) : (
                      <input 
                        className="form-control" 
                        placeholder={`Enter ${col.toLowerCase()}`} 
                        value={formValues[col] || ''} 
                        onChange={e => setFormValues({ ...formValues, [col]: e.target.value })}
                        required
                      />
                    )}
                  </div>
                ))}
              </div>
              <button type="submit" className="btn btn-primary"><Save size={14} /> Save</button>
            </form>
          </div>
        )}

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {config.cols.map(c => <th key={c}>{c}</th>)}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={config.cols.length + 2} style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-secondary)' }}>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Loading records from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rawItems.map((item, i) => {
                    const row = mapItemToRow(page, item);
                    return (
                      <tr key={item.id || i}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                        {row.map((cell, j) => (
                          <td key={j}>
                            {typeof cell === 'string' && (cell === 'Active' || cell === 'Acknowledged') ? (
                              <span className="badge badge-success">{cell}</span>
                            ) : typeof cell === 'string' && (cell === 'Inactive' || cell === 'Pending') ? (
                              <span className="badge badge-warning">{cell}</span>
                            ) : typeof cell === 'number' ? (
                              `₹${cell.toLocaleString()}`
                            ) : (
                              cell
                            )}
                          </td>
                        ))}
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleEditClick(item)}>
                              <Edit2 size={13} />
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteClick(item)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                {!loading && rawItems.length === 0 && (
                  <tr>
                    <td colSpan={config.cols.length + 2} className="empty-state">
                      No records found. Click "Add New" to insert a record.
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
