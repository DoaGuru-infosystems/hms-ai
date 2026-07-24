import React from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function HospitalsTab({ 
  searchInput, 
  setSearchInput, 
  handleScroll, 
  status, 
  isLoadingHospitals, 
  hospitalsList, 
  isFetchingNextPage 
}) {
  return (
    <div style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3>All Onboarded Hospitals</h3>
          <div className="input-with-icon" style={{ width: '250px' }}>
            <Search size={16} className="input-left-icon" />
            <input 
              type="text" 
              placeholder="Search hospitals or plan..." 
              className="form-input-field icon-padded"
              style={{ height: '36px', fontSize: '13px' }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <div className="hospitals-table-wrapper" onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto' }}>
          <table className="hospitals-table">
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>Hospital Name</th>
                <th style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>Status</th>
                <th style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>Beds</th>
                <th style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>Plan</th>
                <th style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>Renewal Date</th>
              </tr>
            </thead>
            <tbody>
              {status === 'pending' || isLoadingHospitals ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: '#94a3b8' }} size={24} />
                  </td>
                </tr>
              ) : hospitalsList.length > 0 ? (
                hospitalsList.map((h, idx) => (
                  <tr key={h.id || idx}>
                    <td>{h.hospital_name}</td>
                    <td><span className={`status-pill ${h.status === 'Active' ? 'active' : h.status === 'Provisioning' ? 'pending' : 'failed'}`}>{h.status}</span></td>
                    <td>{h.bed_count || 100} Beds</td>
                    <td>{h.plan_name || 'Standard'}</td>
                    <td>{h.created_at ? new Date(h.created_at).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                    No hospitals found.
                  </td>
                </tr>
              )}
              {isFetchingNextPage && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: '#94a3b8' }} size={20} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
