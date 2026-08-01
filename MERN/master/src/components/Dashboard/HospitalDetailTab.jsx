import React, { useState, useEffect } from 'react';
import { 
  Building2, X, AlertCircle, Loader2, Server, Database, Edit,
  ShieldAlert, RefreshCcw, Info, PowerOff, CheckCircle2, BedDouble, ArrowLeft,
  User, Mail, Phone, MapPin, CalendarDays, DollarSign, List, Activity, Calculator
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminHospitals, superAdminCustomFields } from '../../utils/api';

export default function HospitalDetailTab({ onClose, hospitalId }) {
  const [customFields, setCustomFields] = useState([]);
  const [isCustomFieldsLoaded, setIsCustomFieldsLoaded] = useState(false);
  const queryClient = useQueryClient();

  const { data: hospital, isLoading, isError, error } = useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: async () => {
      const response = await superAdminHospitals.getById(hospitalId);
      return response.data;
    },
    enabled: !!hospitalId,
  });

  useEffect(() => {
    if (hospitalId) {
      setIsCustomFieldsLoaded(false);
      superAdminCustomFields.getByForm('add_hospital')
        .then(res => {
          setCustomFields(res.data);
          setIsCustomFieldsLoaded(true);
        })
        .catch(err => {
          console.error("Could not load custom fields:", err);
          setIsCustomFieldsLoaded(true); // Proceed even on error
        });
    }
  }, [hospitalId]);

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

  if (!hospitalId) return null;

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
    <div className="animate-fade-in" style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Bar Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <div style={{ height: '32px', width: '1px', background: '#e2e8f0' }}></div>
            <div className="modal-title-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="modal-icon-avatar">
                <Building2 size={20} className="header-icon-svg" />
              </div>
              <div>
                <h2 className="modal-title" style={{ margin: 0, lineHeight: 1.2 }}>{hospital?.hospital_name || 'Loading...'}</h2>
                <div style={{ marginTop: '4px' }}>
                  {hospital && getStatusBadge(hospital.status)}
                </div>
              </div>
            </div>
          </div>
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
        <div style={{ paddingBottom: '30px' }}>
          
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
                  {isCustomFieldsLoaded && hasExtraData && Object.entries(extraData).map(([key, value]) => {
                    const fieldDef = customFields.find(f => f.field_name === key);
                    
                    // Do not display if the custom field was deleted from the configuration
                    if (!fieldDef) return null;

                    // Do not display if the value is empty, null, or undefined
                    if (value === null || value === undefined || value === '') return null;
                    
                    return (
                      <div className="detail-item" key={key}>
                        <span className="detail-label" style={{ textTransform: 'capitalize', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><List size={14} /> {fieldDef.field_label}</span>
                        <div className="detail-value" style={{ fontSize: '14px', color: '#334155', marginTop: '4px', fontWeight: 500 }}>{value.toString()}</div>
                      </div>
                    );
                  })}
                </div>

                {(() => {
                  const basePrice = Number(hospital.bed_count || 0) * Number(hospital.price_per_bed || 300);
                  let discountAmount = 0;
                  if (hospital.discount_type === 'percentage') {
                    discountAmount = basePrice * (Number(hospital.discount_value || 0) / 100);
                  } else if (hospital.discount_type === 'fixed') {
                    discountAmount = Number(hospital.discount_value || 0);
                  }

                  return (
                    <div className="price-calc-card" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
                      <div className="price-calc-header" style={{ marginBottom: '8px' }}>
                        <Calculator size={16} className="calc-icon" />
                        <span>Monthly Subscription Pricing Breakdown</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                        <span>Base Price ({hospital.bed_count || 0} beds × ₹{hospital.price_per_bed || 300})</span>
                        <span>₹ {basePrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                      {hospital.discount_type && hospital.discount_type !== 'none' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#ef4444' }}>
                          <span>Discount Applied ({hospital.discount_type === 'percentage' ? `${hospital.discount_value}%` : 'Fixed'} - {hospital.discount_duration === 'one_time' ? 'One-Time Setup' : 'Lifetime'})</span>
                          <span>- ₹ {discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#1e293b', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '6px' }}>
                        <span>Final Monthly Price</span>
                        <span>₹ {Number(hospital.total_monthly_price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                })()}
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
