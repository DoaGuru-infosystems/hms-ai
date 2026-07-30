import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Building2, X, Plus, Sparkles, AlertCircle, Loader2, CheckCircle2, 
  Calculator, User, Mail, Key, Phone, MapPin, BedDouble 
} from 'lucide-react';
import { superAdminHospitals, superAdminCustomFields } from '../../utils/api';
import DynamicCustomFieldRenderer from '../DynamicCustomFieldRenderer';
import CustomFieldBuilderModal from '../CustomFieldBuilderModal';

export default function AddHospitalTab({ setCurrentTab, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [customFields, setCustomFields] = useState([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const { 
    register, 
    handleSubmit, 
    watch, 
    reset, 
    formState: { errors } 
  } = useForm({
    defaultValues: {
      hospitalName: '',
      adminEmail: '',
      adminUsername: '',
      adminPassword: '',
      bedsCount: 100,
      ratePerBed: 300,
      discountType: 'none',
      discountValue: 0,
      discountDuration: 'lifetime',
      address: '',
      contactNumber: '',
      extraData: {}
    },
    mode: 'onChange'
  });

  // Watch fields for real-time pricing calculation
  const bedsCountValue = watch('bedsCount') || 0;
  const ratePerBedValue = watch('ratePerBed') || 0;
  const discountType = watch('discountType') || 'none';
  const discountValue = watch('discountValue') || 0;
  const discountDuration = watch('discountDuration') || 'lifetime';

  const basePrice = Number(bedsCountValue) * Number(ratePerBedValue);
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = basePrice * (Number(discountValue) / 100);
  } else if (discountType === 'fixed') {
    discountAmount = Number(discountValue);
  }
  const calculatedFinalPrice = Math.max(0, basePrice - discountAmount);

  // Load custom fields for 'add_hospital' form
  const fetchCustomFields = async () => {
    try {
      const res = await superAdminCustomFields.getByForm('add_hospital');
      setCustomFields(res.data);
    } catch (err) {
      console.log("Could not load custom fields:", err);
    }
  };

  useEffect(() => {
    fetchCustomFields();
    setApiError('');
  }, []);

  const handleDeleteCustomField = async (fieldId) => {
    if (!window.confirm("Are you sure you want to delete this custom field configuration?")) return;
    try {
      await superAdminCustomFields.delete(fieldId);
      setCustomFields(prev => prev.filter(f => f.id !== fieldId));
    } catch (err) {
      alert("Failed to delete custom field.");
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');

    try {
      const payload = {
        hospitalName: data.hospitalName,
        adminEmail: data.adminEmail,
        adminUsername: data.adminUsername,
        adminPassword: data.adminPassword,
        bedsCount: Number(data.bedsCount),
        ratePerBed: Number(data.ratePerBed),
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        discountDuration: data.discountDuration,
        address: data.address,
        contactNumber: data.contactNumber,
        extraData: data.extraData || {}
      };

      await superAdminHospitals.onboard(payload);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Hospital Onboarding Error:", err);
      setApiError(err.response?.data?.error || err.message || "Failed to onboard hospital.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Bar Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px' }}>
          <div className="modal-title-group" style={{ display: 'flex', gap: '16px' }}>
            <div className="modal-icon-avatar">
              <Building2 size={24} className="header-icon-svg" />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>Onboard New Hospital</h2>
              <p className="modal-subtitle" style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Configure hospital profile, admin credentials & custom metadata</p>
            </div>
          </div>
          <button type="button" onClick={() => setCurrentTab('hospitals')} className="modal-close-btn" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

          {/* API Error Alert */}
          {apiError && (
            <div className="glass-error-badge" style={{ margin: '16px 28px 0 28px' }}>
              <AlertCircle size={16} />
              <span>{apiError}</span>
            </div>
          )}

          {/* Main Form Body */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
              
              {/* LEFT COLUMN */}
              <div style={{ flex: '1 1 700px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* SECTION 1: DEFAULT MANDATORY FIELDS */}
            <div className="form-section-card">
              <h3 className="section-title">
                <Sparkles size={15} className="title-sparkle" /> Default Information
              </h3>

              {/* Hospital Name & Email in 2 cols */}
              <div className="form-grid-2col">
                <div className="form-group-item">
                  <label className="form-field-label">Hospital Name *</label>
                  <div className="input-with-icon">
                    <Building2 size={16} className="input-left-icon" />
                    <input
                      type="text"
                      placeholder="e.g. Apollo Super Specialty Hospital"
                      className={`form-input-field icon-padded ${errors.hospitalName ? 'input-error' : ''}`}
                      {...register('hospitalName', { required: 'Hospital name is required' })}
                    />
                  </div>
                  {errors.hospitalName && <span className="field-error-subtext">{errors.hospitalName.message}</span>}
                </div>

                <div className="form-group-item">
                  <label className="form-field-label">Admin Email Address *</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-left-icon" />
                    <input
                      type="email"
                      placeholder="admin@apollo.com"
                      className={`form-input-field icon-padded ${errors.adminEmail ? 'input-error' : ''}`}
                      {...register('adminEmail', { 
                        required: 'Admin email is required',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
                      })}
                    />
                  </div>
                  {errors.adminEmail && <span className="field-error-subtext">{errors.adminEmail.message}</span>}
                </div>
              </div>

              {/* Admin Username & Password in 2 cols */}
              <div className="form-grid-2col">
                <div className="form-group-item">
                  <label className="form-field-label">Default Admin Username *</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-left-icon" />
                    <input
                      type="text"
                      placeholder="e.g. admin_apollo"
                      className={`form-input-field icon-padded ${errors.adminUsername ? 'input-error' : ''}`}
                      {...register('adminUsername', { required: 'Admin username is required' })}
                    />
                  </div>
                  {errors.adminUsername && <span className="field-error-subtext">{errors.adminUsername.message}</span>}
                </div>

                <div className="form-group-item">
                  <label className="form-field-label">Default Admin Password *</label>
                  <div className="input-with-icon">
                    <Key size={16} className="input-left-icon" />
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      className={`form-input-field icon-padded ${errors.adminPassword ? 'input-error' : ''}`}
                      {...register('adminPassword', { required: 'Admin password is required' })}
                    />
                  </div>
                  {errors.adminPassword && <span className="field-error-subtext">{errors.adminPassword.message}</span>}
                </div>
              </div>

              {/* SECTION 1.5: SUBSCRIPTION & PRICING */}
              <div className="form-section-card" style={{ marginTop: '24px' }}>
                <h3 className="section-title">
                  <Calculator size={15} className="title-sparkle" /> Subscription & Pricing
                </h3>

                <div className="form-grid-2col">
                  <div className="form-group-item">
                    <label className="form-field-label">Managed Bed Count *</label>
                    <div className="input-with-icon">
                      <BedDouble size={16} className="input-left-icon" />
                      <input
                        type="number"
                        placeholder="100"
                        min="1"
                        className={`form-input-field icon-padded ${errors.bedsCount ? 'input-error' : ''}`}
                        {...register('bedsCount', { required: 'Bed count is required', min: { value: 1, message: 'Minimum 1 bed' } })}
                      />
                    </div>
                    {errors.bedsCount && <span className="field-error-subtext">{errors.bedsCount.message}</span>}
                  </div>

                  <div className="form-group-item">
                    <label className="form-field-label">Rate Per Bed (₹) *</label>
                    <div className="input-with-icon">
                      <Calculator size={16} className="input-left-icon" />
                      <input
                        type="number"
                        placeholder="300"
                        min="0"
                        className={`form-input-field icon-padded ${errors.ratePerBed ? 'input-error' : ''}`}
                        {...register('ratePerBed', { required: 'Rate per bed is required', min: { value: 0, message: 'Minimum rate is 0' } })}
                      />
                    </div>
                    {errors.ratePerBed && <span className="field-error-subtext">{errors.ratePerBed.message}</span>}
                  </div>
                </div>

                <div className="form-grid-2col" style={{ marginTop: '16px' }}>
                  <div className="form-group-item">
                    <label className="form-field-label">Special Discount Type</label>
                    <select className="form-input-field" style={{ paddingLeft: '12px' }} {...register('discountType')}>
                      <option value="none">No Discount</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  {discountType !== 'none' && (
                    <div className="form-group-item animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label className="form-field-label">Discount Value *</label>
                        <input
                          type="number"
                          placeholder={discountType === 'percentage' ? "e.g. 10" : "e.g. 2000"}
                          min="0"
                          className={`form-input-field ${errors.discountValue ? 'input-error' : ''}`}
                          style={{ paddingLeft: '12px' }}
                          {...register('discountValue', { required: 'Discount value is required', min: { value: 0, message: 'Minimum 0' } })}
                        />
                        {errors.discountValue && <span className="field-error-subtext">{errors.discountValue.message}</span>}
                      </div>

                      <div>
                        <label className="form-field-label" style={{ marginBottom: '8px', display: 'block' }}>Discount Duration</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <label style={{ 
                            flex: 1, 
                            border: discountDuration === 'lifetime' ? '2px solid #0f172a' : '1px solid #e2e8f0', 
                            background: discountDuration === 'lifetime' ? '#f8fafc' : '#fff', 
                            borderRadius: '8px', 
                            padding: '10px 12px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="radio" value="lifetime" {...register('discountDuration')} style={{ margin: 0, accentColor: '#0f172a', width: '14px', height: '14px' }} />
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Lifetime</span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', paddingLeft: '22px', lineHeight: 1.2 }}>Applies every month</span>
                          </label>

                          <label style={{ 
                            flex: 1, 
                            border: discountDuration === 'one_time' ? '2px solid #0f172a' : '1px solid #e2e8f0', 
                            background: discountDuration === 'one_time' ? '#f8fafc' : '#fff', 
                            borderRadius: '8px', 
                            padding: '10px 12px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="radio" value="one_time" {...register('discountDuration')} style={{ margin: 0, accentColor: '#0f172a', width: '14px', height: '14px' }} />
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>One-Time</span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', paddingLeft: '22px', lineHeight: 1.2 }}>Setup / first month only</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                </div>

              {/* Address & Contact Number */}
              <div className="form-grid-2col">
                <div className="form-group-item">
                  <label className="form-field-label">Hospital Address</label>
                  <div className="input-with-icon">
                    <MapPin size={16} className="input-left-icon" />
                    <input
                      type="text"
                      placeholder="City, State, Country"
                      className="form-input-field icon-padded"
                      {...register('address')}
                    />
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="form-field-label">Contact Number</label>
                  <div className="input-with-icon">
                    <Phone size={16} className="input-left-icon" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="form-input-field icon-padded"
                      {...register('contactNumber')}
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>
              {/* END LEFT COLUMN */}

              {/* RIGHT COLUMN */}
              <div style={{ flex: '0 1 450px', minWidth: '350px', position: 'sticky', top: '0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Pricing Summary Card (Moved from Left Column) */}
                <div className="form-section-card">
                  <h3 className="section-title">
                    <Calculator size={15} className="title-sparkle" /> Monthly Subscription Breakdown
                  </h3>
                  <div className="price-calc-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                      <span>Base Price ({bedsCountValue} beds × ₹{ratePerBedValue})</span>
                      <span>₹ {basePrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    {discountType !== 'none' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#ef4444' }}>
                        <span>Discount Applied ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'})</span>
                        <span>- ₹ {discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#1e293b', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '6px' }}>
                      <span>Final Monthly Price</span>
                      <span>₹ {calculatedFinalPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

            {/* SECTION 2: DYNAMIC CUSTOM FIELDS */}
            <div className="form-section-card">
              <div className="custom-fields-section-header">
                <div>
                  <h3 className="section-title">
                    Dynamic Custom Fields ({customFields.length})
                  </h3>
                  <p className="section-subtitle">Extra metadata fields registered for Hospital Onboarding form</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(true)}
                  className="btn-add-custom-field"
                  title="Add new dynamic field definition"
                >
                  <Plus size={15} />
                  <span>Add Custom Field</span>
                </button>
              </div>

              {/* Custom Fields List */}
              {customFields.length === 0 ? (
                <div className="no-cf-placeholder">
                  <p>No custom fields added yet. Click <b>"+ Add Custom Field"</b> above to define custom metadata inputs.</p>
                </div>
              ) : (
                <div className="custom-fields-grid">
                  {customFields.map((field) => (
                    <DynamicCustomFieldRenderer
                      key={field.id}
                      field={field}
                      register={register}
                      errors={errors}
                      onDeleteField={handleDeleteCustomField}
                    />
                  ))}
                </div>
              )}
            </div>

              </div>
              {/* END RIGHT COLUMN */}
            </div>

            {/* Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" onClick={() => setCurrentTab('hospitals')} className="btn-secondary" style={{ padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#475569', fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary-dark" style={{ padding: '8px 16px', background: '#0f172a', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                {loading ? <Loader2 size={16} className="spin-loader" /> : <CheckCircle2 size={16} />}
                <span>{loading ? 'Provisioning Hospital DB...' : 'Onboard Hospital & Provision DB'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Builder Modal */}
      <CustomFieldBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        formName="add_hospital"
        onFieldCreated={() => fetchCustomFields()}
      />
    </>
  );
}
