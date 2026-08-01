import React, { useState, useRef, useEffect } from 'react';
import { X, Send, AlertCircle, Loader2, Calendar, Clock, ChevronDown, Check, Search } from 'lucide-react';
import { superAdminBilling, superAdminHospitals } from '../../utils/api';
import { useQuery } from '@tanstack/react-query';

export default function ManualReminderModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [selectedHospitalIds, setSelectedHospitalIds] = useState([]);
  const [messageType, setMessageType] = useState('Payment Reminder');
  const [channels, setChannels] = useState({ email: true, whatsapp: false });
  const [message, setMessage] = useState('Friendly reminder: Your invoice for {amount_due} is due on {due_date}.');
  
  // Multi-select UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const dropdownRef = useRef(null);

  // Scheduling State
  const [sendTiming, setSendTiming] = useState('now'); // 'now', 'later_today', 'schedule_later'
  const [sendTime, setSendTime] = useState('');
  const [sendDate, setSendDate] = useState('');

  // Fetch Hospitals
  const { data: hospitalsData, isLoading: isLoadingHospitals } = useQuery({
    queryKey: ['hospitals-list-all'],
    queryFn: async () => {
      const res = await superAdminHospitals.getAll({ limit: 1000 });
      return res.data;
    },
    enabled: isOpen
  });

  // Fetch Invoices to determine Overdue / Pending status
  const { data: invoicesData } = useQuery({
    queryKey: ['invoices-list-all'],
    queryFn: async () => {
      const res = await superAdminBilling.getInvoices({ limit: 1000 });
      return res.data;
    },
    enabled: isOpen
  });

  const hospitals = hospitalsData?.data || [];
  const invoices = invoicesData?.data || [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMessageTypeChange = (e) => {
    const val = e.target.value;
    setMessageType(val);
    if (val === 'Payment Reminder') {
      setMessage('Friendly reminder: Your invoice for {amount_due} is due on {due_date}.');
    } else if (val === 'General Notice') {
      setMessage('Dear {hospital_name}, this is an important notice regarding your HMS subscription. Please contact support.');
    } else {
      setMessage('');
    }
  };

  const handleToggleHospital = (id) => {
    if (selectedHospitalIds.includes(id)) {
      setSelectedHospitalIds(selectedHospitalIds.filter(hId => hId !== id));
    } else {
      setSelectedHospitalIds([...selectedHospitalIds, id]);
    }
  };

  const applyQuickFilter = (type) => {
    let ids = [];
    if (type === 'all') {
      ids = hospitals.map(h => h.id);
    } else if (type === 'active') {
      ids = hospitals.filter(h => h.status === 'Active').map(h => h.id);
    } else if (type === 'overdue') {
      const overdueHospitalIds = invoices.filter(inv => inv.status === 'Overdue').map(inv => inv.hospital_id);
      ids = hospitals.filter(h => overdueHospitalIds.includes(h.id)).map(h => h.id);
    } else if (type === 'pending') {
      const pendingHospitalIds = invoices.filter(inv => inv.status === 'Pending').map(inv => inv.hospital_id);
      ids = hospitals.filter(h => pendingHospitalIds.includes(h.id)).map(h => h.id);
    } else if (type === 'clear') {
      ids = [];
    }
    setSelectedHospitalIds(ids);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const selectedChannels = [];
      if (channels.email) selectedChannels.push('email');
      if (channels.whatsapp) selectedChannels.push('whatsapp');

      if (selectedChannels.length === 0) {
        throw new Error('Please select at least one channel.');
      }

      if (selectedHospitalIds.length === 0) {
        throw new Error('Please select at least one hospital.');
      }

      let scheduledAt = null;
      if (sendTiming === 'later_today') {
        if (!sendTime) throw new Error('Please select a time for later today.');
        const today = new Date();
        const [hours, minutes] = sendTime.split(':');
        today.setHours(hours, minutes, 0, 0);
        if (today <= new Date()) throw new Error('Selected time must be in the future.');
        scheduledAt = today.toISOString();
      } else if (sendTiming === 'schedule_later') {
        if (!sendDate || !sendTime) throw new Error('Please select both date and time.');
        const scheduled = new Date(`${sendDate}T${sendTime}`);
        if (scheduled <= new Date()) throw new Error('Scheduled date/time must be in the future.');
        scheduledAt = scheduled.toISOString();
      }

      await superAdminBilling.sendReminder({
        hospitalIds: selectedHospitalIds,
        type: messageType,
        channels: selectedChannels,
        message,
        scheduledAt
      });

      setSuccess(`Successfully ${scheduledAt ? 'scheduled' : 'sent'} ${messageType} to ${selectedHospitalIds.length} hospital(s).`);
      setTimeout(() => {
        onClose();
        setSuccess('');
        setSelectedHospitalIds([]);
        setSendTiming('now');
        setSendDate('');
        setSendTime('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to send notification.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredHospitals = hospitals.filter(h => h.hospital_name.toLowerCase().includes(hospitalSearch.toLowerCase()));

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="cf-modal-card animate-slide-up" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div className="modal-header-bar">
          <div className="modal-title-group">
            <Send size={20} className="text-primary" />
            <div>
              <h2 className="modal-title">Send Broadcast / Reminder</h2>
              <p className="modal-subtitle">Notify hospitals via Email or WhatsApp</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="glass-error-badge" style={{ margin: '12px 24px 0 24px' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={{ margin: '12px 24px 0 24px', padding: '12px', background: '#ecfdf5', color: '#10b981', borderRadius: '8px', border: '1px solid #10b981' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form-body" style={{ padding: '24px' }}>
          
          <div className="form-group-item">
            <label className="form-field-label">Recipient(s) *</label>
            
            {/* Quick Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => applyQuickFilter('all')} style={quickFilterStyle}>All Hospitals</button>
              <button type="button" onClick={() => applyQuickFilter('active')} style={quickFilterStyle}>All Active</button>
              <button type="button" onClick={() => applyQuickFilter('overdue')} style={quickFilterStyle}>All Overdue</button>
              <button type="button" onClick={() => applyQuickFilter('pending')} style={quickFilterStyle}>All Pending Payment</button>
              <button type="button" onClick={() => applyQuickFilter('clear')} style={{...quickFilterStyle, color: '#ef4444', borderColor: '#ef4444', background: '#fef2f2'}}>Clear</button>
            </div>

            {/* Custom Multi-Select Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <div 
                className="form-input-field" 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fff' }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span style={{ color: selectedHospitalIds.length > 0 ? '#0f172a' : '#94a3b8' }}>
                  {selectedHospitalIds.length > 0 ? `${selectedHospitalIds.length} hospital(s) selected` : 'Select hospitals...'}
                </span>
                <ChevronDown size={16} color="#64748b" />
              </div>
              
              {isDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', zIndex: 10, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxHeight: '250px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                    <div className="input-with-icon">
                      <Search size={14} className="input-left-icon" />
                      <input 
                        type="text" 
                        placeholder="Search hospitals..." 
                        className="form-input-field icon-padded"
                        style={{ height: '32px', fontSize: '13px' }}
                        value={hospitalSearch}
                        onChange={(e) => setHospitalSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div style={{ overflowY: 'auto', padding: '8px' }}>
                    {isLoadingHospitals ? (
                      <div style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}><Loader2 className="animate-spin" size={16} /></div>
                    ) : filteredHospitals.length > 0 ? (
                      filteredHospitals.map(h => (
                        <div 
                          key={h.id} 
                          style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', background: selectedHospitalIds.includes(h.id) ? '#f1f5f9' : 'transparent' }}
                          onClick={() => handleToggleHospital(h.id)}
                        >
                          <div style={{ width: '16px', height: '16px', border: '1px solid #cbd5e1', borderRadius: '4px', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedHospitalIds.includes(h.id) ? '#0f172a' : '#fff', borderColor: selectedHospitalIds.includes(h.id) ? '#0f172a' : '#cbd5e1' }}>
                            {selectedHospitalIds.includes(h.id) && <Check size={12} color="#fff" />}
                          </div>
                          <span style={{ fontSize: '13px', color: '#334155', fontWeight: selectedHospitalIds.includes(h.id) ? 500 : 400 }}>{h.hospital_name}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No hospitals found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chips Display */}
            {selectedHospitalIds.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {selectedHospitalIds.map(id => {
                  const h = hospitals.find(h => h.id === id);
                  if (!h) return null;
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', color: '#334155' }}>
                      {h.hospital_name}
                      <X size={12} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => handleToggleHospital(id)} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div className="form-group-item" style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-field-label">Message Type</label>
              <div style={{ position: 'relative' }}>
                <select 
                  className="form-input-field select-field" 
                  value={messageType} 
                  onChange={handleMessageTypeChange}
                  style={{ appearance: 'none', background: '#fff' }}
                >
                  <option value="Payment Reminder">Payment Reminder</option>
                  <option value="General Notice">General Notice</option>
                  <option value="Custom Message">Custom Message</option>
                </select>
                <ChevronDown size={16} color="#64748b" style={{ position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none' }} />
              </div>
            </div>

            <div className="form-group-item" style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-field-label">Channels</label>
              <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={channels.email} 
                    onChange={(e) => setChannels({...channels, email: e.target.checked})} 
                  />
                  Email
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={channels.whatsapp} 
                    onChange={(e) => setChannels({...channels, whatsapp: e.target.checked})} 
                  />
                  WhatsApp
                </label>
              </div>
            </div>
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Message Content *</label>
            <textarea
              className="form-input-field"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Supported placeholders: {'{hospital_name}'}, {'{amount_due}'}, {'{due_date}'}
            </p>
          </div>

          <div className="form-group-item" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label className="form-field-label" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} /> When to send
            </label>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="radio" name="timing" checked={sendTiming === 'now'} onChange={() => setSendTiming('now')} />
                Send Now
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="radio" name="timing" checked={sendTiming === 'later_today'} onChange={() => setSendTiming('later_today')} />
                Later Today
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="radio" name="timing" checked={sendTiming === 'schedule_later'} onChange={() => setSendTiming('schedule_later')} />
                Schedule for Later
              </label>
            </div>

            {sendTiming === 'later_today' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px' }}>
                  <Clock size={16} color="#64748b" />
                  <input type="time" value={sendTime} onChange={e => setSendTime(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '14px' }} required />
                </div>
              </div>
            )}

            {sendTiming === 'schedule_later' && (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px' }}>
                  <Calendar size={16} color="#64748b" />
                  <input type="date" value={sendDate} onChange={e => setSendDate(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '14px' }} required min={new Date().toISOString().split('T')[0]} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px' }}>
                  <Clock size={16} color="#64748b" />
                  <input type="time" value={sendTime} onChange={e => setSendTime(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '14px' }} required />
                </div>
              </div>
            )}
          </div>

          <div className="form-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ borderRadius: '99px', padding: '8px 20px', fontSize: '14px' }}>Cancel</button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ 
                borderRadius: '99px', 
                padding: '8px 24px', 
                fontSize: '14px', 
                fontWeight: 600, 
                background: '#0f172a', 
                color: '#fff', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><Send size={16} /> Schedule Message</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

const quickFilterStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  padding: '4px 10px',
  borderRadius: '16px',
  fontSize: '12px',
  color: '#475569',
  cursor: 'pointer',
  fontWeight: 500
};
