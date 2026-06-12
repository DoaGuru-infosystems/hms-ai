import { Bell, ChevronRight, Menu } from 'lucide-react';

export default function Topbar({ title, user }) {
  const handleToggle = () => {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const initials = user ? user.trim().slice(0, 1).toUpperCase() : 'A';

  return (
    <div className="topbar">
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="btn-ghost sidebar-toggle"
          onClick={handleToggle}
          style={{
            display: 'none', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
            border: '1px solid var(--surface-border)', background: 'transparent'
          }}
        >
          <Menu size={17} color="var(--text-secondary)" />
        </button>
        <span
          style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}
          className="topbar-breadcrumb-brand"
        >
          MediCare
        </span>
        <ChevronRight size={12} color="var(--text-light)" className="topbar-breadcrumb-arrow" />
        <h2 className="topbar-title">{title}</h2>
      </div>

      {/* Right */}
      <div className="topbar-right">
        {/* Date / Time */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 7,
          background: 'var(--bg)',
          border: '1px solid var(--surface-border)',
          fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
          letterSpacing: 0.1
        }}>
          <span>{dateStr}</span>
          <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>·</span>
          <span style={{ color: 'var(--primary)' }}>{timeStr}</span>
        </div>

        {/* Bell */}
        <div className="topbar-badge">
          <Bell size={15} color="var(--text-secondary)" />
          <span className="badge-dot" />
        </div>

        {/* Avatar */}
        <div className="avatar-sm">
          {initials}
        </div>
      </div>
    </div>
  );
}
