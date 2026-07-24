import React from 'react';
import { Trash2, FileUp } from 'lucide-react';

export default function DynamicCustomFieldRenderer({ field, register, errors, onDeleteField }) {
  const fieldKey = `extraData.${field.field_name}`;
  const isReq = field.is_required;
  const errorMsg = errors?.extraData?.[field.field_name]?.message;
  const type = field.field_type;

  const textTypes = ['text', 'single_line_text', 'aadhaar', 'pan'];
  const numberTypes = ['number', 'age'];
  const emailTypes = ['email'];
  const phoneTypes = ['tel', 'phone'];
  const urlTypes = ['url'];
  const textareaTypes = ['textarea', 'multi_line_text', 'address'];
  const selectTypes = ['select', 'dropdown', 'gender'];
  const multiSelectTypes = ['multi_select'];
  const radioTypes = ['radio', 'yes_no'];
  const fileTypes = ['file', 'single_image', 'multiple_image', 'single_pdf', 'multiple_pdf', 'signature', 'photo'];

  let inputType = 'text';
  if (numberTypes.includes(type)) inputType = 'number';
  if (emailTypes.includes(type)) inputType = 'email';
  if (phoneTypes.includes(type)) inputType = 'tel';
  if (urlTypes.includes(type)) inputType = 'url';
  if (type === 'date') inputType = 'date';
  if (type === 'time') inputType = 'time';

  return (
    <div className="custom-field-item-card">
      <div className="custom-field-header">
        <label className="form-field-label">
          {field.field_label}
          {isReq && <span className="req-star">*</span>}
          <span className="type-badge">{field.field_type.replace(/_/g, ' ')}</span>
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
      {(textTypes.includes(type) || numberTypes.includes(type) || emailTypes.includes(type) || phoneTypes.includes(type) || urlTypes.includes(type) || type === 'date' || type === 'time') && (
        <input
          type={inputType}
          className={`form-input-field ${errorMsg ? 'input-error' : ''}`}
          placeholder={`Enter ${field.field_label}`}
          {...register(fieldKey, {
            required: isReq ? `${field.field_label} is required` : false,
            ...(emailTypes.includes(type) && { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' } })
          })}
        />
      )}

      {textareaTypes.includes(type) && (
        <textarea
          rows={3}
          className={`form-input-field textarea-field ${errorMsg ? 'input-error' : ''}`}
          placeholder={`Enter ${field.field_label}`}
          {...register(fieldKey, { required: isReq ? `${field.field_label} is required` : false })}
        />
      )}

      {selectTypes.includes(type) && (
        <select
          className={`form-input-field select-field ${errorMsg ? 'input-error' : ''}`}
          {...register(fieldKey, { required: isReq ? `Please select ${field.field_label}` : false })}
        >
          <option value="">-- Select {field.field_label} --</option>
          {(field.options || (type === 'gender' ? ['Male', 'Female', 'Other'] : [])).map((opt, idx) => (
            <option key={idx} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {multiSelectTypes.includes(type) && (
        <select
          multiple
          className={`form-input-field select-field ${errorMsg ? 'input-error' : ''}`}
          style={{ height: 'auto', padding: '8px' }}
          {...register(fieldKey, { required: isReq ? `Please select ${field.field_label}` : false })}
        >
          {(field.options || []).map((opt, idx) => (
            <option key={idx} value={opt} style={{ padding: '6px' }}>{opt}</option>
          ))}
        </select>
      )}

      {radioTypes.includes(type) && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
          {(field.options || (type === 'yes_no' ? ['Yes', 'No'] : [])).map((opt, idx) => (
            <label key={idx} className="form-checkbox-label">
              <input
                type="radio"
                value={opt}
                className="form-checkbox-input"
                style={{ borderRadius: '50%' }}
                {...register(fieldKey, { required: isReq ? `Please select ${field.field_label}` : false })}
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {type === 'checkbox' && (
        <label className="form-checkbox-label">
          <input
            type="checkbox"
            className="form-checkbox-input"
            {...register(fieldKey, { required: isReq ? `${field.field_label} must be checked` : false })}
          />
          <span>Enable / Select {field.field_label}</span>
        </label>
      )}

      {fileTypes.includes(type) && (
        <div className="file-upload-box">
          <FileUp size={18} className="upload-icon" />
          <input
            type="file"
            className="file-input-hidden"
            id={`file-${field.field_name}`}
            multiple={['multiple_image', 'multiple_pdf'].includes(type)}
            accept={field.file_config?.allowedTypes || (['single_image', 'multiple_image', 'signature', 'photo'].includes(type) ? 'image/*' : type.includes('pdf') ? 'application/pdf' : '*')}
            capture={type === 'photo' ? 'camera' : undefined}
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
