import { useState, useEffect } from 'react';
import { Search, MapPin, Truck, CheckCircle2, Navigation, Phone, User, Plus, X, AlertCircle } from 'lucide-react';
import Topbar from '../../components/Topbar';
import { api } from '../../utils/api';

export default function AmbulancePage({ user }) {
  const [fleet, setFleet]         = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [patients, setPatients]   = useState([]);
  const [tab, setTab]             = useState('fleet');
  const [showDispatch, setShowDispatch] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [error, setError]         = useState('');

  const [dispatchForm, setDispatchForm] = useState({
    patientName:'', patientNo:'', callerName:'', phone:'', pickup:'', vehicleId:'', severity:'Medium', etaMinutes:''
  });
  const [vehicleForm, setVehicleForm] = useState({
    vehicleId:'', plate:'', registrationNo:'', vehicleType:'Basic Life Support (BLS)',
    driver:'', phone:'', insuranceExpiry:'', fitnessExpiry:'', permitExpiry:''
  });

  const fetchFleet     = () => api.get('/ambulance/fleet').then(setFleet).catch(()=>setFleet([]));
  const fetchDispatches= () => api.get('/ambulance/dispatch').then(setDispatches).catch(()=>setDispatches([]));

  useEffect(() => { fetchFleet(); fetchDispatches(); }, []);

  // Patient search
  const searchPatients = async (q) => {
    if (q.length < 2) return setPatients([]);
    api.get(`/ambulance/patients/search?q=${encodeURIComponent(q)}`)
       .then(setPatients).catch(()=>setPatients([]));
  };

  const statusBadge = s => ({
    'Available':'badge-success','Dispatched':'badge-info','Maintenance':'badge-warning',
    'Out of Service':'badge-danger','Picked Up':'badge-warning','Arrived':'badge-info',
    'Active':'badge-danger','Completed':'badge-success','Cancelled':'badge-gray'
  }[s] || 'badge-gray');

  const severityColor = s => s==='Critical'?'#ef4444':s==='Medium'?'#f59e0b':'#10b981';

  const handleDispatch = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await api.post('/ambulance/dispatch', dispatchForm);
      await fetchFleet(); await fetchDispatches();
      setShowDispatch(false);
      setDispatchForm({patientName:'',patientNo:'',callerName:'',phone:'',pickup:'',vehicleId:'',severity:'Medium',etaMinutes:''});
    } catch(err){ setError(err.message); }
    finally { setLoading(false); }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/ambulance/fleet', vehicleForm);
      await fetchFleet(); setShowAddVehicle(false);
      setVehicleForm({vehicleId:'',plate:'',registrationNo:'',vehicleType:'Basic Life Support (BLS)',driver:'',phone:'',insuranceExpiry:'',fitnessExpiry:'',permitExpiry:''});
    } catch(err){ setError(err.message); }
  };

  const handleWorkflow = async (dispatchId, action) => {
    const label = {pickup:'mark as Picked Up',arrive:'mark as Arrived',complete:'complete',cancel:'cancel'}[action];
    if (!window.confirm(`Are you sure you want to ${label} this dispatch?`)) return;
    try {
      if (action==='pickup')  await api.put(`/ambulance/dispatch/${dispatchId}/pickup`);
      if (action==='arrive')  await api.put(`/ambulance/dispatch/${dispatchId}/arrive`);
      if (action==='complete'||action==='cancel')
        await api.put(`/ambulance/dispatch/${dispatchId}/resolve`, { action });
      await fetchFleet(); await fetchDispatches();
    } catch(err){ alert(err.message); }
  };

  const available   = fleet.filter(v=>v.status==='Available');
  const dispatched  = fleet.filter(v=>v.status==='Dispatched');
  const activeDisps = dispatches.filter(d=>['Active','Picked Up','Arrived'].includes(d.status));

  const filteredFleet = fleet.filter(v=>`${v.vehicle_id}${v.driver}${v.plate}`.toLowerCase().includes(search.toLowerCase()));
  const filteredDisp  = dispatches.filter(d=>`${d.dispatch_id}${d.patient_name}${d.pickup_location}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <Topbar title="Ambulance Fleet Management" user={user?.name} />
      <div className="page-body">

        {error && (
          <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:'10px 16px',marginBottom:16,color:'#dc2626',display:'flex',gap:8,alignItems:'center'}}>
            <AlertCircle size={16}/> {error}
            <button style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'#dc2626'}} onClick={()=>setError('')}><X size={14}/></button>
          </div>
        )}

        {/* Header */}
        <div className="page-header">
          <div><h2>🚑 Ambulance Fleet Control</h2><p>Real-time dispatch, vehicle tracking &amp; lifecycle management</p></div>
          <div className="page-actions">
            <div className="search-bar"><Search size={14}/><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <button className="btn btn-secondary btn-sm" onClick={()=>setShowAddVehicle(true)}><Plus size={14}/> Add Vehicle</button>
            <button className="btn btn-primary" onClick={()=>setShowDispatch(true)} disabled={available.length===0}><Truck size={14}/> 🚨 Dispatch</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{marginBottom:20}}>
          {[['🚑','Total Fleet',fleet.length,'var(--gradient-primary)'],
            ['✅','Available',available.length,'var(--gradient-success)'],
            ['🔴','Dispatched',dispatched.length,'var(--gradient-danger)'],
            ['📡','Active',activeDisps.length,'var(--gradient-warning)']
          ].map(([icon,label,val,bg])=>(
            <div key={label} className="stat-card">
              <div className="stat-icon" style={{background:bg,fontSize:22}}>{icon}</div>
              <div className="stat-info"><h3>{val}</h3><p>{label}</p></div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs" style={{marginBottom:16}}>
          {[['fleet','🚑 Fleet'],['dispatch','📋 Dispatches'],['map','🗺️ Live Map']].map(([k,l])=>(
            <button key={k} className={`tab${tab===k?' active':''}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        {/* Fleet Tab */}
        {tab==='fleet' && (
          <div className="card">
            <div className="table-wrapper">
              <table><thead><tr><th>Vehicle ID</th><th>Plate</th><th>Type</th><th>Driver</th><th>Location</th><th>Insurance Expiry</th><th>Status</th></tr></thead>
                <tbody>
                  {filteredFleet.length===0
                    ? <tr><td colSpan={7} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No vehicles found</td></tr>
                    : filteredFleet.map(v=>(
                      <tr key={v.id}>
                        <td><span style={{fontFamily:'monospace',fontWeight:700,color:'var(--primary)'}}>{v.vehicle_id}</span></td>
                        <td style={{fontWeight:600}}>{v.plate}</td>
                        <td style={{fontSize:12}}>{v.vehicle_type}</td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:6}}><User size={12}/>{v.driver}</div>
                          {v.phone && <div style={{fontSize:11,color:'var(--text-muted)',display:'flex',gap:5}}><Phone size={10}/>{v.phone}</div>}
                        </td>
                        <td style={{fontSize:12}}><span style={{display:'flex',gap:4,alignItems:'center'}}><MapPin size={12} color="var(--primary)"/>{v.location}</span></td>
                        <td style={{fontSize:12}}>{v.insurance_expiry ? v.insurance_expiry.split('T')[0] : <span style={{color:'var(--text-muted)'}}>Not set</span>}</td>
                        <td><span className={`badge ${statusBadge(v.status)}`}>{v.status}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dispatch Tab */}
        {tab==='dispatch' && (
          <div className="card">
            <div className="table-wrapper">
              <table><thead><tr><th>Dispatch ID</th><th>Patient</th><th>Pickup</th><th>Vehicle</th><th>Severity</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredDisp.length===0
                    ? <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No dispatch records</td></tr>
                    : filteredDisp.map(d=>(
                      <tr key={d.id}>
                        <td><span style={{fontFamily:'monospace',color:'var(--primary)',fontWeight:700,fontSize:12}}>{d.dispatch_id}</span></td>
                        <td>
                          <div style={{fontWeight:600}}>{d.patient_full_name || d.patient_name}</div>
                          {d.patient_no && <div style={{fontSize:11,color:'var(--text-muted)'}}>#{d.patient_no}</div>}
                          <div style={{fontSize:11,color:'var(--text-muted)'}}>{d.patient_phone}</div>
                        </td>
                        <td style={{fontSize:12,maxWidth:140}}>{d.pickup_location}</td>
                        <td><span style={{fontFamily:'monospace',fontWeight:600,fontSize:12}}>{d.vehicle_id}</span><div style={{fontSize:11,color:'var(--text-muted)'}}>{d.driver}</div></td>
                        <td><span className="badge" style={{background:`${severityColor(d.severity)}18`,color:severityColor(d.severity),border:`1px solid ${severityColor(d.severity)}30`}}>{d.severity}</span></td>
                        <td><span className={`badge ${statusBadge(d.status)}`}>{d.status}</span></td>
                        <td style={{fontSize:12}}>{d.dispatch_date?.split('T')[0]}</td>
                        <td>
                          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                            {d.status==='Active'    && <button className="btn btn-ghost btn-sm" style={{fontSize:11,color:'var(--primary)'}} onClick={()=>handleWorkflow(d.dispatch_id,'pickup')}>📦 Pickup</button>}
                            {d.status==='Picked Up' && <button className="btn btn-ghost btn-sm" style={{fontSize:11,color:'var(--primary)'}} onClick={()=>handleWorkflow(d.dispatch_id,'arrive')}>🏥 Arrive</button>}
                            {['Active','Picked Up','Arrived'].includes(d.status) && <>
                              <button className="btn btn-ghost btn-sm" style={{fontSize:11,color:'#10b981'}} onClick={()=>handleWorkflow(d.dispatch_id,'complete')}><CheckCircle2 size={12}/> Done</button>
                              <button className="btn btn-ghost btn-sm" style={{fontSize:11,color:'#ef4444'}} onClick={()=>handleWorkflow(d.dispatch_id,'cancel')}><X size={12}/> Cancel</button>
                            </>}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Map Tab */}
        {tab==='map' && (
          <div className="card" style={{padding:0,overflow:'hidden',flex:1}}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid var(--surface-border)',display:'flex',justifyContent:'space-between'}}>
              <span style={{fontWeight:700,display:'flex',gap:8,alignItems:'center'}}><Navigation size={16} color="var(--primary)"/>Live GPS Simulation</span>
              <div style={{display:'flex',gap:8}}>
                <span className="badge badge-success">● Live</span>
                {activeDisps.length>0 && <span className="badge badge-danger">🚨 {activeDisps.length} Active</span>}
              </div>
            </div>
            <div style={{flex:1,background:'#0f172a',position:'relative',overflow:'hidden',minHeight:400}}>
              <svg width="100%" height="100%" style={{position:'absolute',inset:0}}>
                <defs><pattern id="g" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0L0 0 0 50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/></pattern></defs>
                <rect width="100%" height="100%" fill="url(#g)"/>
                <line x1="0" y1="150" x2="900" y2="150" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/>
                <line x1="0" y1="320" x2="900" y2="320" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/>
                <line x1="200" y1="0" x2="200" y2="500" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/>
                <line x1="550" y1="0" x2="550" y2="500" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/>
                <circle cx="200" cy="320" r="20" fill="rgba(2,132,199,0.2)"/>
                <circle cx="200" cy="320" r="9" fill="#0284c7"/>
              </svg>
              <div style={{position:'absolute',top:290,left:225,background:'rgba(2,132,199,0.9)',color:'#fff',fontSize:10,padding:'3px 8px',borderRadius:5,fontWeight:700}}>🏥 Hospital Base</div>
              {fleet.map((v,i)=>{
                const pos=[[175,305],[540,130],[540,305],[175,130]];
                const [left,top]=pos[i%4];
                const color=v.status==='Available'?'#10b981':v.status==='Dispatched'?'#ef4444':'#f59e0b';
                return (
                  <div key={v.id} style={{position:'absolute',top,left,transition:'all 4s ease-in-out',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                    <div style={{background:color,color:'#fff',padding:7,borderRadius:'50%',boxShadow:`0 0 14px ${color}`,display:'flex'}}><Truck size={14}/></div>
                    <span style={{background:'rgba(15,23,42,0.9)',color:'#fff',fontSize:9,padding:'2px 5px',borderRadius:3,fontWeight:700}}>{v.vehicle_id}</span>
                  </div>
                );
              })}
              {activeDisps.map((d,i)=>(
                <div key={d.id} style={{position:'absolute',top:20+(i*44),right:16,background:'rgba(239,68,68,0.92)',color:'#fff',padding:'5px 10px',borderRadius:7,fontSize:11,fontWeight:600,maxWidth:230}}>
                  🚨 {d.dispatch_id} → {d.patient_name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      {showDispatch && (
        <div className="modal-overlay" onClick={()=>setShowDispatch(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>🚨 Emergency Dispatch</h3><button className="btn btn-ghost" onClick={()=>setShowDispatch(false)}><X size={18}/></button></div>
            <div className="modal-body">
              {error && <div style={{color:'#dc2626',marginBottom:12,fontSize:13}}>{error}</div>}
              <form onSubmit={handleDispatch}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Patient Name *</label>
                    <input className="form-control" value={dispatchForm.patientName}
                      onChange={e=>{ setDispatchForm({...dispatchForm,patientName:e.target.value}); searchPatients(e.target.value); }} required/>
                    {patients.length>0 && (
                      <div style={{border:'1px solid var(--surface-border)',borderRadius:8,background:'var(--surface)',marginTop:4,maxHeight:140,overflowY:'auto'}}>
                        {patients.map(p=>(
                          <div key={p.patient_no} style={{padding:'7px 12px',cursor:'pointer',fontSize:13}} onClick={()=>{
                            setDispatchForm({...dispatchForm,patientName:`${p.name}`,patientNo:p.patient_no,phone:p.phone||dispatchForm.phone});
                            setPatients([]);
                          }}>
                            <strong>{p.name}</strong> <span style={{color:'var(--text-muted)',fontSize:11}}>#{p.patient_no} · {p.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input className="form-control" value={dispatchForm.phone} onChange={e=>setDispatchForm({...dispatchForm,phone:e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Caller Name</label>
                    <input className="form-control" value={dispatchForm.callerName} onChange={e=>setDispatchForm({...dispatchForm,callerName:e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ETA (minutes)</label>
                    <input className="form-control" type="number" value={dispatchForm.etaMinutes} onChange={e=>setDispatchForm({...dispatchForm,etaMinutes:e.target.value})}/>
                  </div>
                  <div className="form-group" style={{gridColumn:'1/-1'}}>
                    <label className="form-label">Pickup Location *</label>
                    <input className="form-control" value={dispatchForm.pickup} onChange={e=>setDispatchForm({...dispatchForm,pickup:e.target.value})} required/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select Ambulance *</label>
                    <select className="form-control" value={dispatchForm.vehicleId} onChange={e=>setDispatchForm({...dispatchForm,vehicleId:e.target.value})} required>
                      <option value="">— Available Units —</option>
                      {available.map(v=><option key={v.id} value={v.vehicle_id}>{v.vehicle_id} — {v.driver} ({v.vehicle_type})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Severity</label>
                    <select className="form-control" value={dispatchForm.severity} onChange={e=>setDispatchForm({...dispatchForm,severity:e.target.value})}>
                      <option value="Low">Low — Stable</option><option value="Medium">Medium — Urgent</option><option value="Critical">Critical — Life Threatening</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer" style={{paddingLeft:0,paddingRight:0,paddingBottom:0,marginTop:12}}>
                  <button type="button" className="btn btn-secondary" onClick={()=>setShowDispatch(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Dispatching...':'🚀 Dispatch'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="modal-overlay" onClick={()=>setShowAddVehicle(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>➕ Add New Vehicle</h3><button className="btn btn-ghost" onClick={()=>setShowAddVehicle(false)}><X size={18}/></button></div>
            <div className="modal-body">
              {error && <div style={{color:'#dc2626',marginBottom:12,fontSize:13}}>{error}</div>}
              <form onSubmit={handleAddVehicle}>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Vehicle ID *</label><input className="form-control" placeholder="AMB-05" value={vehicleForm.vehicleId} onChange={e=>setVehicleForm({...vehicleForm,vehicleId:e.target.value})} required/></div>
                  <div className="form-group"><label className="form-label">Plate No. *</label><input className="form-control" placeholder="DL-4C-X-0001" value={vehicleForm.plate} onChange={e=>setVehicleForm({...vehicleForm,plate:e.target.value})} required/></div>
                  <div className="form-group"><label className="form-label">Registration No.</label><input className="form-control" value={vehicleForm.registrationNo} onChange={e=>setVehicleForm({...vehicleForm,registrationNo:e.target.value})}/></div>
                  <div className="form-group"><label className="form-label">Vehicle Type</label>
                    <select className="form-control" value={vehicleForm.vehicleType} onChange={e=>setVehicleForm({...vehicleForm,vehicleType:e.target.value})}>
                      {['Basic Life Support (BLS)','Advanced Life Support (ALS)','Cardiac Care Unit (CCU)','Neonatal Transport','Patient Transport'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Driver Name *</label><input className="form-control" value={vehicleForm.driver} onChange={e=>setVehicleForm({...vehicleForm,driver:e.target.value})} required/></div>
                  <div className="form-group"><label className="form-label">Driver Phone</label><input className="form-control" value={vehicleForm.phone} onChange={e=>setVehicleForm({...vehicleForm,phone:e.target.value})}/></div>
                  <div className="form-group"><label className="form-label">Insurance Expiry</label><input className="form-control" type="date" value={vehicleForm.insuranceExpiry} onChange={e=>setVehicleForm({...vehicleForm,insuranceExpiry:e.target.value})}/></div>
                  <div className="form-group"><label className="form-label">Fitness Expiry</label><input className="form-control" type="date" value={vehicleForm.fitnessExpiry} onChange={e=>setVehicleForm({...vehicleForm,fitnessExpiry:e.target.value})}/></div>
                  <div className="form-group"><label className="form-label">Permit Expiry</label><input className="form-control" type="date" value={vehicleForm.permitExpiry} onChange={e=>setVehicleForm({...vehicleForm,permitExpiry:e.target.value})}/></div>
                </div>
                <div className="modal-footer" style={{paddingLeft:0,paddingRight:0,paddingBottom:0,marginTop:12}}>
                  <button type="button" className="btn btn-secondary" onClick={()=>setShowAddVehicle(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Vehicle</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
