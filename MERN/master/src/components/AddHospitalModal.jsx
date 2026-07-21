import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Building2, X, Plus, Sparkles, AlertCircle, Loader2, CheckCircle2, 
  Calculator, User, Mail, Key, Phone, MapPin, BedDouble 
} from 'lucide-react';
import { superAdminHospitals, superAdminCustomFields } from '../utils/api';
import DynamicCustomFieldRenderer from './DynamicCustomFieldRenderer';
import CustomFieldBuilderModal from './CustomFieldBuilderModal';

export default function AddHospitalModal({ isOpen, onClose, onSuccess }) {
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
      address: '',
      contactNumber: '',
      extraData: {}
    },
    mode: 'onChange'
  });

  // Watch bedsCount for real-time price calculation (Rs 300 / bed)
  const bedsCountValue = watch('bedsCount') || 0;
  const calculatedPriceINR = Number(bedsCountValue) * 300;

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
    if (isOpen) {
      fetchCustomFields();
      setApiError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        address: data.address,
        contactNumber: data.contactNumber,
        extraData: data.extraData || {}
      };

      await superAdminHospitals.onboard(payload);
      reset();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Hospital Onboarding Error:", err);
      setApiError(err.response?.data?.error || err.message || "Failed to onboard hospital.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop animate-fade-in">
        <div className="add-hospital-modal-card animate-slide-up">
          {/* Top Bar Header */}
          <div className="modal-header-bar">
            <div className="modal-title-group">
              <div className="modal-icon-avatar">
                <Building2 size={20} className="header-icon-svg" />
              </div>
              <div>
                <h2 className="modal-title">Onboard New Hospital</h2>
                <p className="modal-subtitle">Configure hospital profile, admin credentials & custom metadata</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="modal-close-btn">
              <X size={18} />
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
          <form onSubmit={handleSubmit(onSubmit)} className="modal-form-body">
            
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

              {/* Bed Count & Auto-Calculated Price Box */}
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

                {/* Price Preview Card (Rs 300 / bed - Display Only) */}
                <div className="price-calc-card">
                  <div className="price-calc-header">
                    <Calculator size={16} className="calc-icon" />
                    <span>Bed-Count Pricing (Display Only)</span>
                  </div>
                  <div className="price-amount-display">
                    ₹ {calculatedPriceINR.toLocaleString('en-IN')} <span className="per-month-text">/ month</span>
                  </div>
                  <span className="price-formula-badge">Rate: ₹300 per bed × {bedsCountValue} beds</span>
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

            {/* Modal Footer Actions */}
            <div className="modal-footer-bar">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary-dark">
                {loading ? <Loader2 size={18} className="spin-loader" /> : <CheckCircle2 size={18} />}
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
