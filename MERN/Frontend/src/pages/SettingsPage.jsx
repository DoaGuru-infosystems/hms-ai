import Topbar from '../components/Topbar';

export default function SettingsPage({ user }) {
  return (
    <div>
      <Topbar title="System Settings" user={user?.name} />
      <div className="page-body">
        <div className="page-header"><div><h2>System Settings</h2><p>Hospital configuration and preferences</p></div></div>

        <div className="grid-2">
          <div className="card">
            <div className="section-title"><span></span>Hospital Information</div>
            {[
              ['Hospital Name', 'MediCare Hospital Center'],
              ['Address', '42 Healthcare Avenue, Medical District'],
              ['Phone', '+91 331 9233'],
              ['Email', 'info@medicare.com'],
              ['TIN', '123-456-789'],
            ].map(([label, val]) => (
              <div key={label} className="form-group">
                <label className="form-label">{label}</label>
                <input className="form-control" defaultValue={val} />
              </div>
            ))}
            <button className="btn btn-primary">Save Changes</button>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title"><span></span>System Options</div>
              {[
                ['Employee No. Counter', '13'],
                ['Patient No. Counter', '39'],
                ['In-Patient No. Counter', '24'],
                ['Out-Patient No. Counter', '18'],
                ['Invoice No. Counter', '40'],
                ['Receipt No. Counter', '19'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: 'var(--accent-light)' }}>{val}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="section-title"><span></span>Database</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>MySQL database — MERN backend ready for connection.</p>
              <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-light)' }}>
                <div>DB: mysql</div>
                <div>Host: localhost:3306</div>
                <div>Database: hms</div>
                <div>Status: <span style={{ color: 'var(--success)' }}>Connected</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
