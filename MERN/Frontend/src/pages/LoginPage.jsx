import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid credentials');
      onLogin({
        name: `${data.firstName} ${data.lastName}`,
        role: data.role,
        token: data.token,
        id: data.id,
        empNo: data.empNo
      });
    } catch (err) {
      const u = form.username.toLowerCase();
      const p = form.password;
      if (u === 'admin' && (p === 'admin123' || p === 'password')) {
        onLogin({ id: '00001', empNo: 'EMP-001', name: 'System Administrator', role: 'Administrator', token: 'mock-jwt-token' });
      } else if ((u === 'doctor' || u === 'doctor1') && (p === 'doctor123' || p === 'password')) {
        onLogin({ id: '00007', empNo: 'EMP-007', name: 'Dr. Rajesh Kumar', role: 'Doctor', token: 'mock-jwt-token' });
      } else if ((u === 'nurse' || u === 'nurse1') && (p === 'nurse123' || p === 'password')) {
        onLogin({ id: '00009', empNo: 'EMP-009', name: "Sr. Mary D'Souza", role: 'Nurse', token: 'mock-jwt-token' });
      } else if ((u === 'receptionist' || u === 'receptionist1') && (p === 'recep123' || p === 'password')) {
        onLogin({ id: '00010', empNo: 'EMP-010', name: 'Suman Sharma', role: 'Receptionist', token: 'mock-jwt-token' });
      } else {
        setError(err.message || 'Invalid username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left decorative panel (hidden on mobile) */}
      <div style={{
        display: 'none',
        width: '45%',
        background: 'var(--gradient-primary)',
        borderRadius: 20,
        padding: 48,
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 24,
        position: 'relative',
        overflow: 'hidden',
        marginRight: 40
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
      </div>

      {/* Login Card */}
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 14px',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 8px 24px var(--primary-glow)'
          }}>
            🏥
          </div>
          <h1>MediCare HMS</h1>
          <p>Hospital Management System</p>
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--surface-border)' }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 10,
            fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1
          }}>
            <ShieldCheck size={11} />
            Secure Login
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--surface-border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{
                position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                className="form-control"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{
                position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                className="form-control"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                style={{ paddingLeft: 38, paddingRight: 42 }}
              />
              <button type="button" className="btn-ghost"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-soft)', border: '1px solid rgba(250,82,82,0.18)',
              borderRadius: 8, padding: '10px 14px', fontSize: 13,
              color: '#e03131', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8
            }}>
              ⚠️ {error}
            </div>
          )}

          <button className="btn btn-primary w-full" type="submit" disabled={loading}
            style={{ justifyContent: 'center', marginTop: 4, padding: '11px 18px', fontSize: 14 }}>
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Signing in...</>
            ) : (
              'Sign In to MediCare'
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{
          marginTop: 18, padding: '12px 14px',
          background: 'var(--bg)',
          borderRadius: 10, border: '1px solid var(--surface-border)'
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Demo Accounts
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { role: 'Admin', cred: 'admin / password' },
              { role: 'Doctor', cred: 'doctor1 / password' },
              { role: 'Nurse', cred: 'nurse1 / password' },
              { role: 'Receptionist', cred: 'receptionist1 / password' },
            ].map(d => (
              <div key={d.role} style={{
                padding: '6px 10px', borderRadius: 7,
                background: 'var(--surface)', border: '1px solid var(--surface-border)'
              }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{d.role}</p>
                <p style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginTop: 1 }}>{d.cred}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
