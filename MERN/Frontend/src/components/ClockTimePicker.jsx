/**
 * ClockTimePicker — A visual, separate time selector component.
 * Renders date and time as two distinct inputs styled to feel like
 * a clock selector (hours/minutes dropdowns with AM/PM toggle).
 * 
 * Props:
 *  - value: string  "HH:MM" (24h) or "" 
 *  - onChange: (newVal: string) => void — always returns "HH:MM" 24h
 *  - label: string (optional)
 *  - className: string (optional, applied to wrapper)
 *  - required: bool
 *  - id: string (optional)
 */
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function ClockTimePicker({ value, onChange, label, className, required, id }) {
  const parse = (v) => {
    if (!v) return { h: '', m: '', ampm: 'AM' };
    const [hStr, mStr] = v.split(':');
    const h24 = parseInt(hStr, 10);
    const m = mStr || '00';
    let ampm = 'AM';
    let h12 = h24;
    if (h24 >= 12) { ampm = 'PM'; h12 = h24 === 12 ? 12 : h24 - 12; }
    if (h24 === 0) { h12 = 12; ampm = 'AM'; }
    return { h: String(h12), m: m.padStart(2, '0'), ampm };
  };

  const { h: initH, m: initM, ampm: initAmpm } = parse(value);
  const [hour, setHour] = useState(initH);
  const [minute, setMinute] = useState(initM);
  const [ampm, setAmpm] = useState(initAmpm);

  // Sync outward when any part changes
  useEffect(() => {
    if (!hour && !minute) { onChange && onChange(''); return; }
    let h24 = parseInt(hour || '12', 10);
    if (ampm === 'AM' && h24 === 12) h24 = 0;
    if (ampm === 'PM' && h24 !== 12) h24 += 12;
    const padded = `${String(h24).padStart(2,'0')}:${(minute || '00').padStart(2,'0')}`;
    onChange && onChange(padded);
  }, [hour, minute, ampm]);

  // If parent value changes externally (e.g. reset), re-parse
  useEffect(() => {
    const { h, m, ampm: ap } = parse(value);
    setHour(h);
    setMinute(m);
    setAmpm(ap);
  }, [value]);

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  const pickerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'var(--bg-input, rgba(255,255,255,0.05))',
    border: '1px solid var(--border, rgba(255,255,255,0.1))',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 14,
    height: 40,
  };

  const selectStyle = {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary, inherit)',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
    padding: '0 2px',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    textAlign: 'center',
    width: 'auto',
    fontFamily: 'monospace',
    fontWeight: 700,
  };

  const ampmBtnStyle = (active) => ({
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    background: active ? 'var(--accent, #6366f1)' : 'transparent',
    color: active ? 'white' : 'var(--text-muted, #888)',
    transition: 'all 0.15s',
  });

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label className="form-label" htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} /> {label}</label>}
      <div style={pickerStyle} id={id}>
        {/* Hour */}
        <select
          style={selectStyle}
          value={hour}
          onChange={e => setHour(e.target.value)}
          required={required}
          title="Hour"
        >
          <option value="">HH</option>
          {hours.map(h => <option key={h} value={h}>{h.padStart(2,'0')}</option>)}
        </select>

        <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>:</span>

        {/* Minute */}
        <select
          style={selectStyle}
          value={minute}
          onChange={e => setMinute(e.target.value)}
          title="Minutes (every 5 min)"
        >
          <option value="">MM</option>
          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 2, marginLeft: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: 2 }}>
          <button type="button" style={ampmBtnStyle(ampm === 'AM')} onClick={() => setAmpm('AM')}>AM</button>
          <button type="button" style={ampmBtnStyle(ampm === 'PM')} onClick={() => setAmpm('PM')}>PM</button>
        </div>
      </div>
    </div>
  );
}
