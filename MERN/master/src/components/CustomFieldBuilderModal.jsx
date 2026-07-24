import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { superAdminCustomFields } from '../utils/api';

export default function CustomFieldBuilderModal({ isOpen, onClose, formName, onFieldCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      fieldLabel: '',
      fieldType: 'text',
      isRequired: false,
      optionsText: '',
      allowedTypes: '.pdf,.png,.jpg,.doc',
      maxSizeMB: 10
    }
  });

  const selectedType = watch('fieldType');

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      let parsedOptions = [];
      if (['dropdown', 'radio', 'multi_select'].includes(data.fieldType) && data.optionsText) {
        parsedOptions = data.optionsText.split(',').map(s => s.trim()).filter(Boolean);
      }

      let fileConfig = null;
      if (['file', 'single_image', 'multiple_image', 'single_pdf', 'multiple_pdf', 'signature', 'photo'].includes(data.fieldType)) {
        fileConfig = {
          allowedTypes: data.allowedTypes,
          maxSizeMB: Number(data.maxSizeMB) || 10
        };
      }

      const payload = {
        formName: formName,
        fieldLabel: data.fieldLabel,
        fieldType: data.fieldType,
        isRequired: data.isRequired,
        options: parsedOptions,
        fileConfig: fileConfig
      };

      const res = await superAdminCustomFields.create(payload);
      reset();
      if (onFieldCreated) onFieldCreated(res.data);
      onClose();
    } catch (err) {
      console.error("Failed to create custom field:", err);
      setError(err.response?.data?.error || err.message || "Failed to create custom field.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="cf-modal-card animate-slide-up">
        {/* Header */}
        <div className="modal-header-bar">
          <div className="modal-title-group">
            <Sparkles size={20} className="modal-sparkle-icon" />
            <div>
              <h2 className="modal-title">Add Custom Field</h2>
              <p className="modal-subtitle">Add a dynamic custom input field to <b>{formName}</b></p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="glass-error-badge" style={{ margin: '12px 24px 0 24px' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="modal-form-body">
          {/* Field Label */}
          <div className="form-group-item">
            <label className="form-field-label">Field Label *</label>
            <input
              type="text"
              placeholder="e.g. Tax Registration Number, Accreditation Code"
              className="form-input-field"
              {...register('fieldLabel', { required: 'Field label is required' })}
            />
            {errors.fieldLabel && <span className="field-error-subtext">{errors.fieldLabel.message}</span>}
          </div>

          {/* Field Type & Required Toggle in 2 cols */}
          <div className="form-grid-2col">
            <div className="form-group-item">
              <label className="form-field-label">Field Type *</label>
              <select className="form-input-field select-field" {...register('fieldType')}>
                <option value="single_line_text">Single Line Text</option>
                <option value="multi_line_text">Multi Line Text</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="phone">Phone Number</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="dropdown">Dropdown</option>
                <option value="radio">Radio Button</option>
                <option value="checkbox">Checkbox</option>
                <option value="single_image">Single Image Upload</option>
                <option value="multiple_image">Multiple Image Upload</option>
                <option value="single_pdf">Single PDF Upload</option>
                <option value="multiple_pdf">Multiple PDF Upload</option>
                <option value="signature">Signature Upload</option>
                <option value="address">Address</option>
                <option value="aadhaar">Aadhaar Number</option>
                <option value="pan">PAN Number</option>
                <option value="file">File Upload</option>
                <option value="photo">Click Photo</option>
                <option value="url">URL</option>
                <option value="age">Age</option>
                <option value="gender">Gender</option>
                <option value="multi_select">Multi Select</option>
                <option value="yes_no">Yes/No Field</option>
              </select>
            </div>

            <div className="form-group-item" style={{ justifyContent: 'center' }}>
              <label className="form-field-label">Field Requirement</label>
              <label className="toggle-switch-wrapper">
                <input type="checkbox" {...register('isRequired')} />
                <span className="toggle-slider" />
                <span className="toggle-text">Mandatory / Required Field</span>
              </label>
            </div>
          </div>

          {/* Conditional: Dropdown Options */}
          {['dropdown', 'radio', 'multi_select'].includes(selectedType) && (
            <div className="form-group-item conditional-box animate-fade-in">
              <label className="form-field-label">Dropdown Options (Comma-separated) *</label>
              <input
                type="text"
                placeholder="e.g. Tier 1, Tier 2, Tier 3, Super Specialty"
                className="form-input-field"
                {...register('optionsText', { required: 'Please enter at least 1 dropdown option' })}
              />
              <span className="field-hint-subtext">Enter options separated by commas (,)</span>
              {errors.optionsText && <span className="field-error-subtext">{errors.optionsText.message}</span>}
            </div>
          )}

          {/* Conditional: File Upload Settings */}
          {['file', 'single_image', 'multiple_image', 'single_pdf', 'multiple_pdf', 'signature', 'photo'].includes(selectedType) && (
            <div className="form-grid-2col conditional-box animate-fade-in">
              <div className="form-group-item">
                <label className="form-field-label">Allowed File Types</label>
                <input
                  type="text"
                  placeholder=".pdf, .png, .jpg, .doc"
                  className="form-input-field"
                  {...register('allowedTypes')}
                />
              </div>

              <div className="form-group-item">
                <label className="form-field-label">Max File Size (MB)</label>
                <input
                  type="number"
                  placeholder="10"
                  className="form-input-field"
                  {...register('maxSizeMB')}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="modal-footer-bar">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary-dark">
              {loading ? <Loader2 size={16} className="spin-loader" /> : <Plus size={16} />}
              <span>Save Custom Field</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
