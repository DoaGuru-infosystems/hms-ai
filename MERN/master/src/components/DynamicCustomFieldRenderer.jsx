import React from 'react';
import { Trash2, FileUp } from 'lucide-react';

export default function DynamicCustomFieldRenderer({ field, register, errors, onDeleteField }) {
  const fieldKey = `extraData.${field.field_name}`;
  const isReq = field.is_required;
  const errorMsg = errors?.extraData?.[field.field_name]?.message;

  return (
    <div className="custom-field-item-card">
      <div className="custom-field-header">
        <label className="form-field-label">
          {field.field_label}
          {isReq && <span className="req-star">*</span>}
          <span className="type-badge">{field.field_type}</span>
        </label>
        {onDeleteField && (
          <button 
            type="button" 
            className="delete-cf-btn" 
            onClick={() => onDeleteField(field.id)}
            title="Delete custom field definition"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* RENDER BASED ON FIELD TYPE */}
      {field.field_type === 'text' && (
        <input
          type="text"
          className={`form-input-field ${errorMsg ? 'input-error' : ''}`}
          placeholder={`Enter ${field.field_label}`}
          {...register(fieldKey, { required: isReq ? `${field.field_label} is required` : false })}
        />
      )}

      {field.field_type === 'number' && (
        <input
          type="number"
          className={`form-input-field ${errorMsg ? 'input-error' : ''}`}
          placeholder={`Enter ${field.field_label}`}
          {...register(fieldKey, { required: isReq ? `${field.field_label} is required` : false })}
        />
      )}

      {field.field_type === 'email' && (
        <input
          type="email"
          className={`form-input-field ${errorMsg ? 'input-error' : ''}`}
          placeholder={`Enter ${field.field_label}`}
          {...register(fieldKey, {
            required: isReq ? `${field.field_label} is required` : false,
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
          })}
        />
      )}

      {field.field_type === 'tel' && (
        <input
          type="tel"
          className={`form-input-field ${errorMsg ? 'input-error' : ''}`}
          placeholder={`Enter ${field.field_label}`}
          {...register(fieldKey, { required: isReq ? `${field.field_label} is required` : false })}
        />
      )}

      {field.field_type === 'date' && (
        <input
          type="date"
          className={`form-input-field ${errorMsg ? 'input-error' : ''}`}
          {...register(fieldKey, { required: isReq ? `${field.field_label} is required` : false })}
        />
      )}

      {field.field_type === 'textarea' && (
        <textarea
          rows={3}
          className={`form-input-field textarea-field ${errorMsg ? 'input-error' : ''}`}
          placeholder={`Enter ${field.field_label}`}
          {...register(fieldKey, { required: isReq ? `${field.field_label} is required` : false })}
        />
      )}

      {field.field_type === 'select' && (
        <select
          className={`form-input-field select-field ${errorMsg ? 'input-error' : ''}`}
          {...register(fieldKey, { required: isReq ? `${field.field_label} is required` : false })}
        >
          <option value="">-- Select {field.field_label} --</option>
          {field.options && field.options.map((opt, idx) => (
            <option key={idx} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.field_type === 'checkbox' && (
        <label className="form-checkbox-label">
          <input
            type="checkbox"
            className="form-checkbox-input"
            {...register(fieldKey, { required: isReq ? `${field.field_label} must be checked` : false })}
          />
          <span>Enable {field.field_label}</span>
        </label>
      )}

      {field.field_type === 'file' && (
        <div className="file-upload-box">
          <FileUp size={18} className="upload-icon" />
          <input
            type="file"
            className="file-input-hidden"
            id={`file-${field.field_name}`}
            accept={field.file_config?.allowedTypes || '*'}
            {...register(fieldKey, { required: isReq ? `Please upload ${field.field_label}` : false })}
          />
          <label htmlFor={`file-${field.field_name}`} className="file-label-btn">
            Choose File ({field.file_config?.allowedTypes || 'All Types'}, Max: {field.file_config?.maxSizeMB || 10}MB)
          </label>
        </div>
      )}

      {errorMsg && <span className="field-error-subtext">{errorMsg}</span>}
    </div>
  );
}
