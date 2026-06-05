import Topbar from '../components/Topbar';

const packages = [
  { id: 3, name: 'Flexible Cystoscopy', desc: 'Urological procedure package', total: 9100, items: ['Intra Articular Injections — ₹500', 'Debridement Ward — ₹100', 'Muscle Biopsy — ₹2,500', 'Scar Revision >3cm — ₹6,000'] },
  { id: 4, name: 'Appendectomy Package', desc: 'Standard appendix removal package', total: 45000, items: ['Surgical Consultation — ₹2,000', 'Operation Theater — ₹15,000', 'Anesthesia — ₹8,000', 'Post-op Care (3 days) — ₹12,000', 'Medicines — ₹8,000'] },
  { id: 5, name: 'Cardiac Catheterization', desc: 'Coronary angiography package', total: 35000, items: ['Cardiology Consultation — ₹2,000', 'Angiography — ₹20,000', 'ICU Stay (1 day) — ₹8,000', 'Medicines — ₹5,000'] },
];

export default function SurgicalPage({ user }) {
  return (
    <div>
      <Topbar title="Surgical Packages" user={user?.name} />
      <div className="page-body">
        <div className="page-header">
          <div><h2>Surgical Packages</h2><p>Pre-configured procedure packages</p></div>
          <button className="btn btn-primary">+ Add Package</button>
        </div>

        <div className="grid-3">
          {packages.map(p => (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{p.desc}</div>
                </div>
              </div>
              <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                {p.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0', borderBottom: i < p.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    • {item}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TOTAL PACKAGE COST</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-light)' }}>₹{p.total.toLocaleString()}</div>
                </div>
                <button className="btn btn-secondary btn-sm">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
