import { useState, useEffect } from 'react';
import { Search, Plus, AlertTriangle, FileText, CheckCircle2, TrendingDown, RefreshCw } from 'lucide-react';
import Topbar from '../components/Topbar';

const API_BASE = 'http://localhost:5001/api';

export default function PharmacyPage({ user }) {
  const [activeTab, setActiveTab] = useState('inventory');
  const [search, setSearch] = useState('');
  const [medicinesList, setMedicinesList] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New drug state
  const [newMed, setNewMed] = useState({
    name: '',
    category: 'Antibiotics',
    type: 'Tablet',
    uom: 'Box',
    price: '',
    stock: '',
    reorder: ''
  });

  // Quotation Comparison state
  const [quotes, setQuotes] = useState([
    {
      id: 'Q-101',
      date: '2026-06-04',
      drug: 'Paracetamol 650mg',
      qty: 5000,
      vendors: [
        { name: 'Astra Pharma Co.', unitPrice: 0.85, deliveryDays: 3, reliability: '98%' },
        { name: 'Apex Medi-Supplies', unitPrice: 0.72, deliveryDays: 5, reliability: '92%' },
        { name: 'Standard Drugs Ltd', unitPrice: 0.90, deliveryDays: 1, reliability: '99%' }
      ]
    },
    {
      id: 'Q-102',
      date: '2026-06-04',
      drug: 'Amoxicillin 500mg',
      qty: 2000,
      vendors: [
        { name: 'Astra Pharma Co.', unitPrice: 4.20, deliveryDays: 4, reliability: '98%' },
        { name: 'Apex Medi-Supplies', unitPrice: 4.50, deliveryDays: 2, reliability: '92%' },
        { name: 'Standard Drugs Ltd', unitPrice: 3.95, deliveryDays: 6, reliability: '99%' }
      ]
    },
    {
      id: 'Q-103',
      date: '2026-06-04',
      drug: 'Atorvastatin 10mg',
      qty: 3500,
      vendors: [
        { name: 'Astra Pharma Co.', unitPrice: 2.10, deliveryDays: 2, reliability: '98%' },
        { name: 'Apex Medi-Supplies', unitPrice: 1.85, deliveryDays: 5, reliability: '92%' },
        { name: 'Standard Drugs Ltd', unitPrice: 1.95, deliveryDays: 3, reliability: '99%' }
      ]
    }
  ]);

  const [selectedQuote, setSelectedQuote] = useState(quotes[0]);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = () => {
    fetch(`${API_BASE}/medicines`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMedicinesList(data);
        } else {
          setMedicinesList([]);
        }
      })
      .catch(err => {
        console.log('Failed to fetch pharmacy inventory.', err);
        setMedicinesList([]);
      });
  };

  const handleAddMed = async (e) => {
    e.preventDefault();
    if (!newMed.name || !newMed.price || !newMed.stock || !newMed.reorder) {
      return alert('Please fill in all required fields.');
    }

    try {
      setSaving(true);
      const payload = {
        ...newMed,
        price: parseFloat(newMed.price),
        stock: parseInt(newMed.stock),
        reorder: parseInt(newMed.reorder),
        status: parseInt(newMed.stock) <= parseInt(newMed.reorder) ? 'Low Stock' : 'In Stock'
      };

      const res = await fetch(`${API_BASE}/medicines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save medicine');
      
      fetchMedicines();
      setShowAddModal(false);
      setNewMed({
        name: '',
        category: 'Antibiotics',
        type: 'Tablet',
        uom: 'Box',
        price: '',
        stock: '',
        reorder: ''
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = medicinesList.filter(m =>
    `${m.name} ${m.category} ${m.type}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Topbar title="Pharmacy & Procurement" user={user?.name} />
      <div className="page-body has-tabs">
        
        {/* Navigation Tabs */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          <button 
            className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} 
            onClick={() => setActiveTab('inventory')}
          >
            📦 Pharmacy Stock List
          </button>
          <button 
            className={`tab ${activeTab === 'procurement' ? 'active' : ''}`} 
            onClick={() => setActiveTab('procurement')}
          >
            📊 Auto Comparison & Tenders
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div>
            <div className="page-header">
              <div>
                <h2>Pharmacy Stock</h2>
                <p>Manage medicines and dynamic drug levels</p>
              </div>
              <div className="page-actions">
                <div className="search-bar">
                  <Search />
                  <input placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                  <Plus size={15} /> Add Medicine
                </button>
              </div>
            </div>

            {/* Low stock alert */}
            {medicinesList.some(m => m.stock <= m.reorder) && (
              <div style={{ 
                background: 'var(--rose-soft)', 
                border: '1px solid rgba(244, 63, 94, 0.2)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '12px 16px', 
                marginBottom: 20, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10 
              }}>
                <AlertTriangle size={16} color="var(--rose)" />
                <span style={{ fontSize: 13, color: 'var(--rose)', fontWeight: 600 }}>
                  {medicinesList.filter(m => m.stock <= m.reorder).length} medicine(s) are below safety reorder level. Please initiate quotation request!
                </span>
              </div>
            )}

            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Medicine Name</th><th>Category</th><th>Type</th>
                      <th>Unit</th><th>Price (₹)</th><th>Stock</th><th>Reorder Level</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m, idx) => (
                      <tr key={m.id || idx}>
                        <td style={{ color: 'var(--text-light)', fontFamily: 'monospace' }}>{m.id}</td>
                        <td><span style={{ fontWeight: 600 }}>{m.name}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{m.category}</td>
                        <td><span className="badge badge-purple">{m.type}</span></td>
                        <td>{m.uom}</td>
                        <td style={{ fontWeight: 600 }}>₹{m.price}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: m.stock <= m.reorder ? 'var(--rose)' : 'var(--text-secondary)' }}>
                            {m.stock}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{m.reorder}</td>
                        <td>
                          <span className={`badge ${m.stock <= m.reorder ? 'badge-danger' : 'badge-success'}`}>
                            {m.stock <= m.reorder ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                          No medicines found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'procurement' && (
          <div>
            <div className="page-header" style={{ marginBottom: 20 }}>
              <div>
                <h2>Procurement Tenders & Auto Comparison</h2>
                <p>Compare vendor quotations and secure best hospital drug pricing automatically</p>
              </div>
            </div>

            <div className="grid-3" style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {quotes.map(q => (
                <div 
                  key={q.id} 
                  className={`card`}
                  onClick={() => setSelectedQuote(q)}
                  style={{ 
                    cursor: 'pointer', 
                    border: selectedQuote.id === q.id ? '2px solid var(--primary)' : '1px solid var(--surface-border)',
                    background: selectedQuote.id === q.id ? 'var(--primary-soft)' : 'var(--surface)',
                    padding: 20,
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>{q.id}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.date}</span>
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: 'var(--text)' }}>{q.drug}</h4>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Target Quantity: <strong>{q.qty.toLocaleString()} units</strong></p>
                </div>
              ))}
            </div>

            {selectedQuote && (
              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
                <div className="card">
                  <div className="section-title"><span></span>Quotations Side-by-Side Comparison</div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Vendor</th>
                          <th>Unit Cost</th>
                          <th>Delivery</th>
                          <th>Reliability</th>
                          <th>Total Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuote.vendors.map((v, idx) => {
                          const isCheapest = v.unitPrice === Math.min(...selectedQuote.vendors.map(x => x.unitPrice));
                          return (
                            <tr key={idx} style={{ background: isCheapest ? 'rgba(16, 185, 129, 0.04)' : '' }}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{v.name}</div>
                                {isCheapest && <span className="badge badge-success" style={{ fontSize: 9, padding: '2px 6px', marginTop: 4 }}>★ Best Price</span>}
                              </td>
                              <td style={{ fontWeight: 700, color: isCheapest ? '#047857' : 'var(--text-secondary)' }}>₹{v.unitPrice}</td>
                              <td>{v.deliveryDays} Days</td>
                              <td><span className="badge badge-purple">{v.reliability}</span></td>
                              <td style={{ fontWeight: 800 }}>₹{(v.unitPrice * selectedQuote.qty).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="section-title"><span></span>Auto Tender Procurement Decision</div>
                    <div style={{ 
                      padding: '16px 20px', 
                      borderRadius: 12, 
                      background: 'var(--primary-soft)', 
                      border: '1px dashed rgba(92, 84, 243, 0.2)', 
                      marginBottom: 20 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <TrendingDown size={20} color="var(--primary)" />
                        <h4 style={{ color: 'var(--primary)', fontWeight: 700 }}>AI Procurement Recommendation</h4>
                      </div>
                      
                      {(() => {
                        const prices = selectedQuote.vendors.map(x => x.unitPrice);
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        const cheapest = selectedQuote.vendors.find(x => x.unitPrice === minPrice);
                        const expensive = selectedQuote.vendors.find(x => x.unitPrice === maxPrice);
                        const savings = (maxPrice - minPrice) * selectedQuote.qty;
                        
                        return (
                          <div>
                            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                              Award the tender contract to <strong>{cheapest.name}</strong> as they deliver at the lowest unit rate of <strong>₹{cheapest.unitPrice}</strong>.
                            </p>
                            <div style={{ marginTop: 14, display: 'flex', gap: 20 }}>
                              <div>
                                <span style={{ fontSize: 10, color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>PROJECTED SAVINGS</span><br />
                                <strong style={{ color: '#047857', fontSize: 18 }}>₹{savings.toLocaleString(undefined, {maximumFractionDigits:0})}</strong>
                              </div>
                              <div>
                                <span style={{ fontSize: 10, color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>DELIVERY LEADTIME</span><br />
                                <strong style={{ fontSize: 16 }}>{cheapest.deliveryDays} Days</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => alert('Procurement PO successfully generated and dispatched!')}>
                      Approve Best Tender
                    </button>
                    <button className="btn btn-secondary" onClick={() => alert('Re-negotiation prompt sent to high-rate vendors.')}>
                      <RefreshCw size={14} /> Re-negotiate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Medicine Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div className="modal-header">
                <h3>Add New Medicine to Stock</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
              <form onSubmit={handleAddMed}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Medicine Name *</label>
                    <input className="form-control" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} required placeholder="e.g. Paracetamol 650mg" />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-control" value={newMed.category} onChange={e => setNewMed({...newMed, category: e.target.value})}>
                        <option>Antibiotics</option>
                        <option>Analgesics</option>
                        <option>Antacids</option>
                        <option>Cardiovascular</option>
                        <option>Diuretics</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select className="form-control" value={newMed.type} onChange={e => setNewMed({...newMed, type: e.target.value})}>
                        <option>Tablet</option>
                        <option>Syrup</option>
                        <option>Injection</option>
                        <option>Capsule</option>
                        <option>Ointment</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid-3">
                    <div className="form-group">
                      <label className="form-label">UOM (Unit) *</label>
                      <input className="form-control" value={newMed.uom} onChange={e => setNewMed({...newMed, uom: e.target.value})} required placeholder="e.g. Box" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price (₹) *</label>
                      <input type="number" className="form-control" value={newMed.price} onChange={e => setNewMed({...newMed, price: e.target.value})} required placeholder="150" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Initial Qty *</label>
                      <input type="number" className="form-control" value={newMed.stock} onChange={e => setNewMed({...newMed, stock: e.target.value})} required placeholder="1000" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reorder Safety Level *</label>
                    <input type="number" className="form-control" value={newMed.reorder} onChange={e => setNewMed({...newMed, reorder: e.target.value})} required placeholder="200" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Adding...' : 'Add Medicine'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
