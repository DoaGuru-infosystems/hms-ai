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
      if (data.fieldType === 'select' && data.optionsText) {
        parsedOptions = data.optionsText.split(',').map(s => s.trim()).filter(Boolean);
      }

      let fileConfig = null;
      if (data.fieldType === 'file') {
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
                <option value="text">Single Line Text</option>
                <option value="number">Number</option>
                <option value="date">Date Picker</option>
                <option value="select">Dropdown Select</option>
                <option value="checkbox">Checkbox (Yes/No)</option>
                <option value="file">File Upload</option>
                <option value="textarea">Textarea (Long Text)</option>
                <option value="email">Email</option>
                <option value="tel">Phone / Contact Number</option>
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
          {selectedType === 'select' && (
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
          {selectedType === 'file' && (
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
