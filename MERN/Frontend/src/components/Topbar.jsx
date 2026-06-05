import { Bell, ChevronRight, Menu } from 'lucide-react';

export default function Topbar({ title, user }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  const handleToggle = () => {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  };

  return (
    <div className="topbar">
      {/* Left — breadcrumb & menu toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button 
          className="btn-ghost sidebar-toggle" 
          onClick={handleToggle}
          style={{ 
            display: 'none', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 36, 
            height: 36, 
            borderRadius: 10,
            cursor: 'pointer',
            border: 'none',
            background: 'var(--primary-soft)'
          }}
        >
          <Menu size={18} color="var(--primary)" />
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }} className="topbar-breadcrumb-brand">MediCare</span>
        <ChevronRight size={12} color="var(--text-light)" className="topbar-breadcrumb-arrow" />
        <h2 className="topbar-title">{title}</h2>
      </div>

      {/* Right */}
      <div className="topbar-right">
        {/* Date / Time chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 8,
          background: 'var(--primary-soft)',
          border: '1px solid var(--surface-border)',
          fontSize: 12, fontWeight: 700, color: 'var(--primary)',
          letterSpacing: 0.2
        }}>
          <span>{dateStr}</span>
          <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>·</span>
          <span>{timeStr}</span>
        </div>

        {/* Bell */}
        <div className="topbar-badge">
          <Bell size={16} color="var(--text-secondary)" />
          <span className="badge-dot" />
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
          <div className="avatar-sm">
            {user ? user[0].toUpperCase() : 'A'}
          </div>
        </div>
      </div>
    </div>
  );
}
