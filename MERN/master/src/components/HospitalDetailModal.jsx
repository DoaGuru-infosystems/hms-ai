import React, { useState, useEffect } from 'react';
import { 
  Building2, X, AlertCircle, Loader2, Server, Database, Edit,
  ShieldAlert, RefreshCcw, Info, PowerOff, CheckCircle2, BedDouble,
  User, Mail, Phone, MapPin, CalendarDays, DollarSign, List, Activity
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminHospitals, superAdminCustomFields } from '../utils/api';

export default function HospitalDetailModal({ isOpen, onClose, hospitalId }) {
  const [customFields, setCustomFields] = useState([]);
  const queryClient = useQueryClient();

  const { data: hospital, isLoading, isError, error } = useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: async () => {
      const response = await superAdminHospitals.getById(hospitalId);
      return response.data;
    },
    enabled: !!hospitalId && isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      superAdminCustomFields.getByForm('add_hospital')
        .then(res => setCustomFields(res.data))
        .catch(err => console.error("Could not load custom fields:", err));
    }
  }, [isOpen]);

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus) => superAdminHospitals.updateStatus(hospitalId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital', hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    }
  });

  const retryProvisioningMutation = useMutation({
    mutationFn: () => superAdminHospitals.retryProvisioning(hospitalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital', hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    }
  });

  if (!isOpen) return null;

  const handleToggleStatus = () => {
    if (!hospital) return;
    const newStatus = hospital.status === 'Active' ? 'Suspended' : 'Active';
    updateStatusMutation.mutate(newStatus);
  };

  const handleRetry = () => {
    retryProvisioningMutation.mutate();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <span className="status-badge success"><CheckCircle2 size={12} /> Active</span>;
      case 'Provisioning': return <span className="status-badge warning"><Loader2 size={12} className="animate-spin" /> Provisioning</span>;
      case 'Provisioning Failed': return <span className="status-badge error"><X size={12} /> Failed</span>;
      case 'Suspended': return <span className="status-badge error"><ShieldAlert size={12} /> Suspended</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

  let extraData = {};
  if (hospital?.extra_data) {
    try {
      extraData = typeof hospital.extra_data === 'string' ? JSON.parse(hospital.extra_data) : hospital.extra_data;
    } catch (e) {
      console.error('Failed to parse extra_data', e);
    }
  }
  const hasExtraData = Object.keys(extraData).length > 0;

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="add-hospital-modal-card animate-slide-up" style={{ maxWidth: '800px' }}>
        {/* Top Bar Header */}
        <div className="modal-header-bar">
          <div className="modal-title-group">
            <div className="modal-icon-avatar">
              <Building2 size={20} className="header-icon-svg" />
            </div>
            <div>
              <h2 className="modal-title">{hospital?.hospital_name || 'Loading...'}</h2>
              <div style={{ marginTop: '4px' }}>
                {hospital && getStatusBadge(hospital.status)}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* API Error Alert */}
        {(isError || updateStatusMutation.isError || retryProvisioningMutation.isError) && (
          <div className="glass-error-badge" style={{ margin: '16px 28px 0 28px' }}>
            <AlertCircle size={16} />
            <span>
              {error?.response?.data?.error || updateStatusMutation.error?.response?.data?.error || retryProvisioningMutation.error?.response?.data?.error || 'Failed to perform operation'}
            </span>
          </div>
        )}

        {/* Main Content Body */}
        <div className="modal-form-body" style={{ paddingBottom: '30px' }}>
          
          {isLoading ? (
            <div className="flex-center" style={{ padding: '40px', color: '#6366f1' }}>
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : hospital ? (
            <>
              {/* SECTION 1: DEFAULT & CUSTOM INFORMATION */}
              <div className="form-section-card">
                <h3 className="section-title">
                  <Info size={15} className="title-sparkle" /> Default Information
                </h3>
                <div className="form-grid-2col" style={{ gap: '20px', marginBottom: '16px' }}>
                  <div className="detail-item">
                    <span className="detail-label" style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> Admin Details</span>
                    <div className="detail-value" style={{ fontSize: '14px', color: '#334155', marginTop: '4px', fontWeight: 500 }}>{hospital.admin_email}</div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label" style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarDays size={14} /> Onboarded On</span>
                    <div className="detail-value" style={{ fontSize: '14px', color: '#334155', marginTop: '4px', fontWeight: 500 }}>
                      {(() => {
                        const d = new Date(hospital.created_at);
                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                      })()}
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label" style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> Address</span>
                    <div className="detail-value" style={{ fontSize: '14px', color: '#334155', marginTop: '4px', fontWeight: 500 }}>{hospital.address || 'N/A'}</div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label" style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> Contact Number</span>
                    <div className="detail-value" style={{ fontSize: '14px', color: '#334155', marginTop: '4px', fontWeight: 500 }}>{hospital.contact_number || 'N/A'}</div>
                  </div>
                  {hasExtraData && Object.entries(extraData).map(([key, value]) => {
                    const fieldDef = customFields.find(f => f.field_name === key);
                    const displayLabel = fieldDef ? fieldDef.field_label : key.replace(/_/g, ' ');
                    
                    return (
                      <div className="detail-item" key={key}>
                        <span className="detail-label" style={{ textTransform: 'capitalize', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><List size={14} /> {displayLabel}</span>
                        <div className="detail-value" style={{ fontSize: '14px', color: '#334155', marginTop: '4px', fontWeight: 500 }}>{value?.toString() || 'N/A'}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="form-grid-2col" style={{ gap: '20px', marginTop: '24px' }}>
                  <div className="price-calc-card">
                    <div className="price-calc-header">
                      <BedDouble size={16} className="calc-icon" />
                      <span>Managed Bed Count</span>
                    </div>
                    <div className="price-amount-display">
                      {hospital.bed_count || 0} Beds
                    </div>
                  </div>
                  
                  <div className="price-calc-card">
                    <div className="price-calc-header">
                      <DollarSign size={16} className="calc-icon" />
                      <span>Monthly Subscription Price</span>
                    </div>
                    <div className="price-amount-display">
                      ₹ {Number(hospital.total_monthly_price || 0).toLocaleString('en-IN')} <span className="per-month-text">/ month</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PROVISIONING STATUS */}
              <div className="form-section-card">
                <h3 className="section-title">
                  <Database size={15} className="title-sparkle" /> Database Provisioning
                </h3>
                <div className="detail-item" style={{ marginBottom: '12px' }}>
                  <span className="detail-label" style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Server size={14} /> Tenant Database Name</span>
                  <div className="detail-value" style={{ fontFamily: 'monospace', background: '#1e293b', padding: '6px 12px', borderRadius: '6px', display: 'inline-block', marginTop: '6px', color: '#94a3b8' }}>
                    {hospital.db_name}
                  </div>
                </div>

                {hospital.status === 'Provisioning Failed' && (
                  <div className="warning-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ color: '#ef4444', margin: '0 0 4px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldAlert size={16} /> Provisioning Failed
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>The automated database setup failed for this tenant. You can retry the process.</p>
                    </div>
                    <button 
                      onClick={handleRetry} 
                      disabled={retryProvisioningMutation.isPending}
                      className="modal-action-btn primary" 
                      style={{ background: '#ef4444', borderColor: '#ef4444' }}
                    >
                      {retryProvisioningMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                      Retry Provisioning
                    </button>
                  </div>
                )}
              </div>



              {/* SECTION 4: ACTIONS */}
              <div className="modal-footer-bar" style={{ marginTop: '24px', padding: '16px 0 0 0', borderTop: '1px solid #e2e8f0', background: 'transparent' }}>
                <button 
                  onClick={() => alert("Edit Hospital functionality is under development.")}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Edit size={16} />
                  Edit Details
                </button>

                {hospital.status !== 'Provisioning' && hospital.status !== 'Provisioning Failed' && (
                  <button 
                    onClick={handleToggleStatus}
                    disabled={updateStatusMutation.isPending}
                    className="btn-primary-dark"
                    style={{ 
                      background: hospital.status === 'Active' ? '#ef4444' : '#22c55e',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    {updateStatusMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <PowerOff size={16} />}
                    {hospital.status === 'Active' ? 'Suspend Hospital' : 'Activate Hospital'}
                  </button>
                )}
              </div>

            </>
          ) : (
            <div className="flex-center" style={{ padding: '40px', color: '#94a3b8' }}>
              Hospital data not found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
