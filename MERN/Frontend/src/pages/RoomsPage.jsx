import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, Bed, ShieldAlert, BadgeInfo, CheckCircle2, XCircle } from 'lucide-react';
import Topbar from '../components/Topbar';

export default function RoomsPage({ user }) {
  const location = useLocation();
  const path = location.pathname;

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [roomsList, setRoomsList] = useState([]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = () => {
    fetch('http://localhost:5001/api/rooms')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRoomsList(data);
        } else {
          setRoomsList([]);
        }
      })
      .catch(err => {
        console.log('Failed to fetch rooms register.', err);
        setRoomsList([]);
      });
  };

  const bedsList = useMemo(() => {
    const beds = [];
    roomsList.forEach(r => {
      const rate = r.rate;
      for (let i = 1; i <= r.totalBeds; i++) {
        const isOccupied = i > r.vacantBeds;
        beds.push({
          id: `${r.name}-Bed-${i}`,
          bedNo: `Bed ${r.name}-${i}`,
          roomName: r.name,
          category: r.category,
          floor: r.floor,
          rate: rate,
          status: isOccupied ? 'Occupied' : 'Vacant'
        });
      }
    });
    return beds;
  }, [roomsList]);

  // Room Categories summary
  const categoriesList = useMemo(() => {
    const categoriesMap = {};
    roomsList.forEach(r => {
      if (!categoriesMap[r.category]) {
        categoriesMap[r.category] = {
          name: r.category,
          rate: r.rate,
          totalBeds: 0,
          vacantBeds: 0,
          roomsCount: 0
        };
      }
      categoriesMap[r.category].totalBeds += r.totalBeds;
      categoriesMap[r.category].vacantBeds += r.vacantBeds;
      categoriesMap[r.category].roomsCount += 1;
    });
    return Object.values(categoriesMap);
  }, [roomsList]);

  // Filters for Room Master
  const filteredRooms = useMemo(() => {
    return roomsList.filter(r => {
      const matchSearch = `Room ${r.name} ${r.category} Floor ${r.floor}`.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'All' || r.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [roomsList, search, filterCategory]);

  // Filters for Beds Master
  const filteredBeds = useMemo(() => {
    return bedsList.filter(b => {
      const matchSearch = `${b.bedNo} ${b.roomName} ${b.category}`.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'All' || b.category === filterCategory;
      const matchStatus = filterStatus === 'All' || b.status === filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [search, filterCategory, filterStatus, bedsList]);

  const renderContent = () => {
    switch (path) {
      case '/rooms/enquiry':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Room & Bed Availability Enquiry</h2>
                <p>Real-time check console for vacant ward beds and executive suites</p>
              </div>
            </div>

            {/* Quick availability metrics */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bed className="text-accent" size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{roomsList.reduce((s, r) => s + r.totalBeds, 0)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Hospital Beds</div>
                </div>
              </div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 style={{ color: 'var(--success)' }} size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{roomsList.reduce((s, r) => s + r.vacantBeds, 0)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Currently Vacant Beds</div>
                </div>
              </div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert style={{ color: 'var(--warning)' }} size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>
                    {roomsList.reduce((s, r) => s + (r.totalBeds - r.vacantBeds), 0)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Occupied Beds</div>
                </div>
              </div>
            </div>

            {/* Quick Enquiry Selector */}
            <div className="card" style={{ padding: 20 }}>
              <div className="section-title"><span></span>Bed Availability Scanner</div>
              <div className="grid-3" style={{ gap: 16, marginBottom: 20 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Search Room/Category</label>
                  <div className="search-bar" style={{ width: '100%' }}>
                    <Search />
                    <input placeholder="Search bed or ward..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Filter Category</label>
                  <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="All">All Categories</option>
                    <option value="General Ward">General Ward</option>
                    <option value="Executive Deluxe">Executive Deluxe</option>
                    <option value="ICU">ICU</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Filter Status</label>
                  <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="All">All Beds</option>
                    <option value="Vacant">Vacant Only</option>
                    <option value="Occupied">Occupied Only</option>
                  </select>
                </div>
              </div>

              {/* Grid of Beds for Visual Scanning */}
              <div className="grid-4" style={{ gap: 12 }}>
                {filteredBeds.map(b => (
                  <div key={b.id} style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: b.status === 'Vacant' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.03)',
                    borderColor: b.status === 'Vacant' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{b.bedNo}</span>
                      <span className={`badge ${b.status === 'Vacant' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 8 }}>
                      Floor {b.floor} · Room {b.roomName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {b.category}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case '/rooms/category':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Room Categories</h2>
                <p>Overview of room classes, standard ward pricing, and bed capacity indices</p>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Room Category Name</th>
                      <th>Daily Rate (₹)</th>
                      <th>Active Rooms</th>
                      <th>Total Beds Registered</th>
                      <th>Vacant Beds</th>
                      <th>Beds Occupied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriesList.map(c => (
                      <tr key={c.name}>
                        <td style={{ fontWeight: 700, fontSize: 14.5 }}>{c.name}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{c.rate.toLocaleString()} / day</td>
                        <td>{c.roomsCount} rooms</td>
                        <td>{c.totalBeds} beds</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{c.vacantBeds} beds</td>
                        <td>{c.totalBeds - c.vacantBeds} beds</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '/rooms/beds':
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Beds Master Register</h2>
                <p>Exhaustive register of physical hospital beds and ward configurations</p>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20, padding: 16 }}>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Search Beds Register</label>
                  <div className="search-bar" style={{ width: '100%' }}>
                    <Search />
                    <input placeholder="Search bed ID or room name..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category Filter</label>
                  <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="All">All Categories</option>
                    {categoriesList.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Bed Code</th>
                      <th>Room Name</th>
                      <th>Category</th>
                      <th>Floor Level</th>
                      <th>Daily Rate Charges (₹)</th>
                      <th>Availability Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBeds.map(b => (
                      <tr key={b.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-light)' }}>{b.bedNo}</span></td>
                        <td style={{ fontWeight: 600 }}>Room {b.roomName}</td>
                        <td>{b.category}</td>
                        <td>Floor {b.floor}</td>
                        <td style={{ fontWeight: 600 }}>₹{b.rate.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${b.status === 'Vacant' ? 'badge-success' : 'badge-danger'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '/rooms/master':
      default:
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Room Master Register</h2>
                <p>Register of all physical rooms, clinical theatres and special ICU suites</p>
              </div>
              <button className="btn btn-primary"><Plus size={15} /> Add Room</button>
            </div>

            {/* Quick Stats */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#6366f1' }}>{roomsList.reduce((s, r) => s + r.totalBeds, 0)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Total Beds</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>{roomsList.reduce((s, r) => s + r.vacantBeds, 0)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Vacant Beds</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>{roomsList.reduce((s, r) => s + (r.totalBeds - r.vacantBeds), 0)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Occupied Beds</div>
              </div>
            </div>

            {/* Search room master list */}
            <div className="card" style={{ padding: 16, marginBottom: 20 }}>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Search Rooms Register</label>
                  <div className="search-bar" style={{ width: '100%' }}>
                    <Search />
                    <input placeholder="Search room by number or floor..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="All">All Room Types</option>
                    {categoriesList.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Visual Room Cards */}
            <div className="grid-3">
              {filteredRooms.map(r => {
                const occ = r.totalBeds - r.vacantBeds;
                const pct = Math.round((occ / r.totalBeds) * 100);
                return (
                  <div key={r.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>Room {r.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.category} · Floor {r.floor}</div>
                      </div>
                      <span className="badge badge-info">₹{r.rate}/day</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Occupancy</span>
                      <span style={{ fontWeight: 600 }}>{occ} / {r.totalBeds} beds</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--success)', borderRadius: 3, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textRight: 'right' }}>{pct}% occupied</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <Topbar title="Room Management" user={user?.name} />
      <div className="page-body">
        {renderContent()}
      </div>
    </div>
  );
}

