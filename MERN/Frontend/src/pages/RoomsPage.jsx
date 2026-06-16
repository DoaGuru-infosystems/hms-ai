import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, Bed, ShieldAlert, BadgeInfo, CheckCircle2, XCircle, Building, Building2, Edit, Trash2, Layers } from 'lucide-react';
import Topbar from '../components/Topbar';

export default function RoomsPage({ user }) {
  const location = useLocation();
  const path = location.pathname;

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterFloor, setFilterFloor] = useState('All');
  const [filterBuilding, setFilterBuilding] = useState('All');
  const [roomsList, setRoomsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [ipdList, setIpdList] = useState([]);

  // Modal and Form States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomForm, setRoomForm] = useState({
    roomNo: '',
    roomType: 'General Ward',
    totalBeds: 4,
    pricePerDay: 1200,
    floor: '1',
    building: 'Main Building',
    totalFloors: '5'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    oldCategory: '',
    newCategory: '',
    newRate: 0
  });

  // Building Modal and State
  const [buildings, setBuildings] = useState([]);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [isEditingBuilding, setIsEditingBuilding] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    totalFloors: '5'
  });
  const [selectedBuildingTab, setSelectedBuildingTab] = useState('');

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    rate: 1000
  });

  const resetForm = () => {
    const defaultBuilding = buildings[0] ? buildings[0].name : 'Main Building';
    const defaultTotalFloors = buildings[0] ? buildings[0].totalFloors.toString() : '5';
    setRoomForm({
      roomNo: '',
      roomType: availableCategories[0] || 'General Ward',
      totalBeds: 4,
      pricePerDay: 1200,
      floor: '1',
      building: defaultBuilding,
      totalFloors: defaultTotalFloors
    });
    setErrorMsg('');
    setSuccessMsg('');
    setSelectedRoomId(null);
  };

  const handleEditRoom = (room) => {
    setRoomForm({
      roomNo: room.name || room.roomNo,
      roomType: room.category || room.roomType,
      totalBeds: room.totalBeds,
      pricePerDay: room.rate || room.pricePerDay,
      floor: room.floor !== undefined && room.floor !== null ? room.floor.toString() : '1',
      building: room.building || 'Main Building',
      totalFloors: room.totalFloors !== undefined && room.totalFloors !== null ? room.totalFloors.toString() : '5'
    });
    setSelectedRoomId(room.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
      oldCategory: category.name,
      newCategory: category.name,
      newRate: category.rate
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    fetch('http://localhost:5001/api/rooms/category/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryForm)
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save category');
      }
      return data;
    })
    .then(() => {
      setSuccessMsg('Room category updated successfully!');
      fetchRooms();
      fetchCategories();
      setTimeout(() => {
        setShowCategoryModal(false);
        setSuccessMsg('');
      }, 1000);
    })
    .catch(err => {
      setErrorMsg(err.message || 'Something went wrong.');
    });
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newCategoryForm.name) {
      setErrorMsg('Category name is required.');
      return;
    }

    fetch('http://localhost:5001/api/rooms/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: newCategoryForm.name,
        rate: newCategoryForm.rate
      })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create category');
      }
      return data;
    })
    .then(() => {
      setSuccessMsg('Category created successfully!');
      fetchCategories();
      setTimeout(() => {
        setShowAddCategoryModal(false);
        setNewCategoryForm({ name: '', rate: 1000 });
        setSuccessMsg('');
      }, 1000);
    })
    .catch(err => {
      setErrorMsg(err.message || 'Something went wrong.');
    });
  };

  const handleSaveBuilding = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!buildingForm.name) {
      setErrorMsg('Building name is required.');
      return;
    }

    const url = isEditingBuilding 
      ? `http://localhost:5001/api/rooms/buildings/${selectedBuildingId}`
      : 'http://localhost:5001/api/rooms/buildings';
    const method = isEditingBuilding ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: buildingForm.name,
        totalFloors: parseInt(buildingForm.totalFloors) || 5
      })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save building');
      }
      return data;
    })
    .then(() => {
      setSuccessMsg(isEditingBuilding ? 'Building updated successfully!' : 'Building registered successfully!');
      fetchBuildings();
      fetchRooms(); // refresh in case names updated
      setTimeout(() => {
        setShowBuildingModal(false);
        setBuildingForm({ name: '', totalFloors: '5' });
        setIsEditingBuilding(false);
        setSelectedBuildingId(null);
        setSuccessMsg('');
      }, 1000);
    })
    .catch(err => {
      setErrorMsg(err.message || 'Something went wrong.');
    });
  };

  const handleEditBuildingClick = (b) => {
    setBuildingForm({
      name: b.name,
      totalFloors: b.totalFloors.toString()
    });
    setSelectedBuildingId(b.id);
    setIsEditingBuilding(true);
    setShowBuildingModal(true);
  };

  const handleDeleteBuilding = (id) => {
    if (!window.confirm('Are you sure you want to delete this building?')) return;
    setErrorMsg('');
    setSuccessMsg('');

    fetch(`http://localhost:5001/api/rooms/buildings/${id}`, {
      method: 'DELETE'
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete building');
      }
      return data;
    })
    .then(() => {
      setSuccessMsg('Building deleted successfully!');
      fetchBuildings();
      fetchRooms();
      setTimeout(() => {
        setSuccessMsg('');
      }, 1000);
    })
    .catch(err => {
      setErrorMsg(err.message || 'Something went wrong.');
      alert(err.message);
    });
  };

  const handleDeleteRoom = (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      fetch(`http://localhost:5001/api/rooms/${roomId}`, {
        method: 'DELETE'
      })
      .then(res => res.json())
      .then(() => {
        fetchRooms();
        fetchCategories();
      })
      .catch(err => {
        console.error('Failed to delete room:', err);
      });
    }
  };

  const handleSaveRoom = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!roomForm.roomNo || !roomForm.roomType) {
      setErrorMsg('Room number and category are required.');
      return;
    }

    const floorNum = parseInt(roomForm.floor);
    const totalFloorsNum = parseInt(roomForm.totalFloors);
    if (floorNum > totalFloorsNum) {
      setErrorMsg(`Floor level cannot exceed the total floors (${totalFloorsNum}) of the building.`);
      return;
    }

    const url = isEditing 
      ? `http://localhost:5001/api/rooms/${selectedRoomId}`
      : 'http://localhost:5001/api/rooms';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(roomForm)
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save room');
      }
      return data;
    })
    .then(() => {
      setSuccessMsg(isEditing ? 'Room updated successfully!' : 'Room added successfully!');
      fetchRooms();
      fetchCategories();
      setTimeout(() => {
        resetForm();
        setShowModal(false);
      }, 1000);
    })
    .catch(err => {
      setErrorMsg(err.message || 'Something went wrong.');
    });
  };

  const fetchBuildings = () => {
    fetch('http://localhost:5001/api/rooms/buildings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBuildings(data);
          if (data.length > 0) {
            setSelectedBuildingTab(prev => prev || data[0].name);
          }
        } else {
          setBuildings([]);
        }
      })
      .catch(err => {
        console.log('Failed to fetch buildings list.', err);
        setBuildings([]);
      });
  };

  useEffect(() => {
    fetchRooms();
    fetchCategories();
    fetchIpd();
    fetchBuildings();
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

  const fetchCategories = () => {
    fetch('http://localhost:5001/api/rooms/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategoriesList(data);
        } else {
          setCategoriesList([]);
        }
      })
      .catch(err => {
        console.log('Failed to fetch categories.', err);
        setCategoriesList([]);
      });
  };

  const fetchIpd = () => {
    fetch('http://localhost:5001/api/ipd')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIpdList(data.filter(p => p.status === 'Admitted'));
        } else {
          setIpdList([]);
        }
      })
      .catch(err => {
        console.log('Failed to fetch IPD admissions list.', err);
        setIpdList([]);
      });
  };

  const roomsListCalculated = useMemo(() => {
    return roomsList.map(r => {
      const occupiedCount = ipdList.filter(p => {
        if (!p.room || !r.name) return false;
        const pRoomStr = p.room.toString().toLowerCase().replace('room', '').trim();
        const sRoomStr = r.name.toString().toLowerCase().replace('room', '').trim();
        return pRoomStr === sRoomStr;
      }).length;
      return {
        ...r,
        vacantBeds: Math.max(0, r.totalBeds - occupiedCount)
      };
    });
  }, [roomsList, ipdList]);

  const bedsList = useMemo(() => {
    const beds = [];
    roomsListCalculated.forEach(r => {
      const rate = r.rate;
      for (let i = 1; i <= r.totalBeds; i++) {
        const bedNo = `RM-${r.name}-${i.toString().padStart(2, '0')}`;
        
        const occupyingPatient = ipdList.find(p => {
          if (!p.room || !r.name) return false;
          const pRoomStr = p.room.toString().toLowerCase().replace('room', '').trim();
          const sRoomStr = r.name.toString().toLowerCase().replace('room', '').trim();
          if (pRoomStr !== sRoomStr) return false;

          // Bed check
          if (p.bed === bedNo) return true;
          const altBedName = `Bed ${r.name}-${i}`;
          if (p.bed === altBedName) return true;
          
          let bedIndex = null;
          if (p.bed) {
            const matchIndex = p.bed.match(/-0*(\d+)$/) || p.bed.match(/Bed\s+0*(\d+)$/i) || p.bed.match(/^0*(\d+)$/);
            if (matchIndex) {
              bedIndex = parseInt(matchIndex[1], 10);
            }
          }
          return bedIndex === i;
        });

        beds.push({
          id: `${r.name}-Bed-${i}`,
          bedNo: `RM-${r.name}-${i.toString().padStart(2, '0')}`,
          bedLabel: `Bed ${r.name}-${i}`,
          roomName: r.name,
          category: r.category,
          floor: r.floor,
          building: r.building || 'Main Building',
          totalFloors: r.totalFloors || 5,
          rate: rate,
          status: occupyingPatient ? 'Occupied' : 'Vacant',
          patientName: occupyingPatient ? occupyingPatient.patientName : null,
          patientId: occupyingPatient ? occupyingPatient.patientNo : null
        });
      }
    });
    return beds;
  }, [roomsListCalculated, ipdList]);

  const availableCategories = useMemo(() => {
    return categoriesList.map(c => c.name).filter(Boolean);
  }, [categoriesList]);

  const floorsList = useMemo(() => {
    const floors = new Set();
    roomsListCalculated.forEach(r => {
      if (r.floor !== undefined && r.floor !== null) {
        floors.add(r.floor.toString());
      }
    });
    return Array.from(floors).sort((a, b) => parseInt(a) - parseInt(b));
  }, [roomsListCalculated]);

  const buildingsList = useMemo(() => {
    const list = buildings.map(b => b.name).filter(Boolean);
    if (list.length === 0) {
      const unique = new Set();
      roomsListCalculated.forEach(r => {
        if (r.building) unique.add(r.building);
      });
      return Array.from(unique).sort();
    }
    return list.sort();
  }, [buildings, roomsListCalculated]);

  // Filters for Room Master
  const filteredRooms = useMemo(() => {
    return roomsListCalculated.filter(r => {
      const matchSearch = `Room ${r.name} ${r.category} Floor ${r.floor} ${r.building || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'All' || r.category === filterCategory;
      const matchFloor = filterFloor === 'All' || (r.floor !== undefined && r.floor.toString() === filterFloor.toString());
      const matchBuilding = filterBuilding === 'All' || r.building === filterBuilding;
      return matchSearch && matchCat && matchFloor && matchBuilding;
    });
  }, [roomsListCalculated, search, filterCategory, filterFloor, filterBuilding]);

  // Filters for Beds Master
  const filteredBeds = useMemo(() => {
    return bedsList.filter(b => {
      const matchSearch = `${b.bedLabel} ${b.bedNo} ${b.roomName} ${b.category} ${b.building || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'All' || b.category === filterCategory;
      const matchStatus = filterStatus === 'All' || b.status === filterStatus;
      const matchFloor = filterFloor === 'All' || (b.floor !== undefined && b.floor.toString() === filterFloor.toString());
      const matchBuilding = filterBuilding === 'All' || b.building === filterBuilding;
      return matchSearch && matchCat && matchStatus && matchFloor && matchBuilding;
    });
  }, [search, filterCategory, filterStatus, filterFloor, filterBuilding, bedsList]);

  const buildingStats = useMemo(() => {
    return buildings.map(b => {
      const rooms = roomsListCalculated.filter(r => r.building === b.name);
      const totalBeds = rooms.reduce((sum, r) => sum + r.totalBeds, 0);
      const vacantBeds = rooms.reduce((sum, r) => sum + r.vacantBeds, 0);
      const occupiedBeds = totalBeds - vacantBeds;
      const pct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
      return {
        ...b,
        roomCount: rooms.length,
        totalBeds,
        vacantBeds,
        occupiedBeds,
        pct
      };
    });
  }, [buildings, roomsListCalculated]);

  const selectedBuildingObj = useMemo(() => {
    return buildings.find(b => b.name === selectedBuildingTab) || buildings[0];
  }, [buildings, selectedBuildingTab]);

  const renderContent = () => {
    switch (path) {
      case '/rooms/buildings': {
        const selBuilding = selectedBuildingObj;
        return (
          <div>
            <div className="page-header">
              <div>
                <h2>Infrastructure & Building Master</h2>
                <p>Register hospital wings, specialty towers, and design hierarchical floor maps</p>
              </div>
              <button className="btn btn-primary" onClick={() => {
                setIsEditingBuilding(false);
                setBuildingForm({ name: '', totalFloors: '5' });
                setShowBuildingModal(true);
              }}>
                <Plus size={15} /> Add Building
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
              {/* Left Wing: Buildings List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h4 style={{ fontWeight: 700, margin: '0 0 4px 0', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Registered Wings & Buildings</h4>
                {buildingStats.length === 0 ? (
                  <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No buildings registered yet.</p>
                  </div>
                ) : (
                  buildingStats.map(b => {
                    const isSelected = selectedBuildingTab === b.name;
                    return (
                      <div 
                        key={b.id} 
                        className="card" 
                        style={{ 
                          padding: 16, 
                          cursor: 'pointer', 
                          border: isSelected ? '2px solid var(--accent-light)' : '1px solid rgba(255,255,255,0.08)',
                          boxShadow: isSelected ? '0 0 15px rgba(99,102,241,0.2)' : 'none',
                          transition: 'all 0.2s',
                          background: isSelected ? 'rgba(99,102,241,0.05)' : 'var(--card-bg)'
                        }}
                        onClick={() => setSelectedBuildingTab(b.name)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Building size={16} className="text-accent" />
                            <span style={{ fontWeight: 700, fontSize: 15 }}>{b.name}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-xs" style={{ padding: 4 }} onClick={(e) => { e.stopPropagation(); handleEditBuildingClick(b); }}>
                              <Edit size={12} />
                            </button>
                            <button className="btn btn-ghost btn-xs" style={{ padding: 4, color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); handleDeleteBuilding(b.id); }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                          <span>{b.totalFloors} Floors</span>
                          <span>{b.roomCount} Rooms ({b.totalBeds} Beds)</span>
                        </div>

                        {b.totalBeds > 0 && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                              <span>Bed Occupancy</span>
                              <span>{b.occupiedBeds}/{b.totalBeds} ({b.pct}%)</span>
                            </div>
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${b.pct}%`, background: 'var(--accent-light)', borderRadius: 2 }} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Wing: Interactive Floors Mapping */}
              <div className="card" style={{ padding: 24 }}>
                {selBuilding ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16, marginBottom: 20 }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selBuilding.name}</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Visual floor layout and room configuration</p>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                        <div><strong>Total Floors:</strong> {selBuilding.totalFloors}</div>
                        <div><strong>Active Rooms:</strong> {roomsListCalculated.filter(r => r.building === selBuilding.name).length}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {Array.from({ length: selBuilding.totalFloors }, (_, i) => {
                        const floorNum = selBuilding.totalFloors - i; // list from top floor to bottom
                        const floorRooms = roomsListCalculated.filter(r => r.building === selBuilding.name && r.floor.toString() === floorNum.toString());
                        
                        return (
                          <div 
                            key={floorNum} 
                            style={{ 
                              display: 'flex', 
                              gap: 16, 
                              alignItems: 'center', 
                              padding: 16, 
                              borderRadius: 8, 
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}
                          >
                            {/* Floor Tag */}
                            <div style={{ width: 80, flexShrink: 0, textAlign: 'center' }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-light)' }}>F-{floorNum}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Floor {floorNum}</div>
                            </div>

                            {/* Rooms list on this floor */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, flexGrow: 1 }}>
                              {floorRooms.length === 0 ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: 12.5, fontStyle: 'italic' }}>
                                  No rooms mapped on Floor {floorNum}.
                                </span>
                              ) : (
                                floorRooms.map(r => {
                                  const occ = r.totalBeds - r.vacantBeds;
                                  const isIcu = r.category.toLowerCase().includes('icu');
                                  const isGeneral = r.category.toLowerCase().includes('general');
                                  const isOt = r.category.toLowerCase().includes('operation') || r.category.toLowerCase().includes('ot');
                                  
                                  let typeColor = 'rgba(99,102,241,0.15)';
                                  let textColor = 'var(--accent-light)';
                                  if (isIcu) {
                                    typeColor = 'rgba(239,68,68,0.15)';
                                    textColor = '#f87171';
                                  } else if (isGeneral) {
                                    typeColor = 'rgba(16,185,129,0.15)';
                                    textColor = '#34d399';
                                  } else if (isOt) {
                                    typeColor = 'rgba(245,158,11,0.15)';
                                    textColor = '#fbbf24';
                                  }

                                  return (
                                    <div 
                                      key={r.id} 
                                      className="room-badge-interactive"
                                      style={{ 
                                        padding: '8px 12px', 
                                        borderRadius: 6, 
                                        background: typeColor, 
                                        border: `1px solid ${textColor}33`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        minWidth: 110
                                      }}
                                      onClick={() => handleEditRoom(r)}
                                      title="Click to edit room details"
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, color: textColor }}>Room {r.name}</span>
                                      </div>
                                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{r.category}</div>
                                      <div style={{ fontSize: 10, fontWeight: 600, color: occ === r.totalBeds ? '#f87171' : 'var(--text-muted)', marginTop: 4 }}>
                                        🛌 {occ}/{r.totalBeds} Occupied
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Add room directly on this floor */}
                            <button 
                              className="btn btn-outline" 
                              style={{ height: 32, fontSize: 11, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                              onClick={() => {
                                setIsEditing(false);
                                setRoomForm({
                                  roomNo: '',
                                  roomType: availableCategories[0] || 'General Ward',
                                  totalBeds: 4,
                                  pricePerDay: 1200,
                                  floor: floorNum.toString(),
                                  building: selBuilding.name,
                                  totalFloors: selBuilding.totalFloors.toString()
                                });
                                setShowModal(true);
                              }}
                            >
                              <Plus size={12} /> Add Room
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <Building size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <p>Select a building to view and map its floor structure.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

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
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{roomsListCalculated.reduce((s, r) => s + r.totalBeds, 0)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Hospital Beds</div>
                </div>
              </div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 style={{ color: 'var(--success)' }} size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{roomsListCalculated.reduce((s, r) => s + r.vacantBeds, 0)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Currently Vacant Beds</div>
                </div>
              </div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert style={{ color: 'var(--warning)' }} size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>
                    {roomsListCalculated.reduce((s, r) => s + (r.totalBeds - r.vacantBeds), 0)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Occupied Beds</div>
                </div>
              </div>
            </div>

            {/* Quick Enquiry Selector */}
            <div className="card" style={{ padding: 20 }}>
              <div className="section-title"><span></span>Bed Availability Scanner</div>
              <div className="grid-4" style={{ gap: 16, marginBottom: 20 }}>
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
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Filter Floor</label>
                  <select className="form-control" value={filterFloor} onChange={e => setFilterFloor(e.target.value)}>
                    <option value="All">All Floors</option>
                    {floorsList.map(f => (
                      <option key={f} value={f}>Floor {f}</option>
                    ))}
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
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{b.bedLabel}</span>
                      <span className={`badge ${b.status === 'Vacant' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                        {b.status}
                      </span>
                    </div>
                    {b.status === 'Occupied' && b.patientName && (
                      <div style={{ margin: '8px 0 2px 0', padding: '4px 6px', background: 'rgba(239,68,68,0.06)', border: '1px dashed rgba(239,68,68,0.2)', borderRadius: 4, fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>
                        👤 {b.patientName}
                      </div>
                    )}
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: b.status === 'Occupied' ? 4 : 8 }}>
                      Floor {b.floor} · Room {b.roomName} · <span style={{ fontFamily: 'monospace' }}>{b.bedNo}</span>
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
              <button className="btn btn-primary" onClick={() => setShowAddCategoryModal(true)}>
                <Plus size={14} /> Add Category
              </button>
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
                      <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriesList.map(c => (
                      <tr key={c.name}>
                        <td style={{ fontWeight: 700, fontSize: 14.5 }}>{c.name}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{c.rate.toLocaleString()} / day</td>
                        <td>{c.activeRooms} rooms</td>
                        <td>{c.totalBeds} beds</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{c.vacantBeds} beds</td>
                        <td>{c.bedsOccupied} beds</td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn btn-ghost btn-xs" style={{ fontSize: 10, padding: '2px 6px', height: 'auto', minHeight: 0 }} onClick={() => handleEditCategory(c)}>Edit</button>
                        </td>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
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
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Building Filter</label>
                  <select className="form-control" value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)}>
                    <option value="All">All Buildings</option>
                    {buildingsList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Floor Filter</label>
                  <select className="form-control" value={filterFloor} onChange={e => setFilterFloor(e.target.value)}>
                    <option value="All">All Floors</option>
                    {floorsList.map(f => (
                      <option key={f} value={f}>Floor {f}</option>
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
                      <th>Building / Block</th>
                      <th>Floor Level</th>
                      <th>Daily Rate Charges (₹)</th>
                      <th>Availability Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBeds.map(b => (
                      <tr key={b.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-light)' }}>{b.bedNo}</span>
                          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{b.bedLabel}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>Room {b.roomName}</td>
                        <td>{b.category}</td>
                        <td>{b.building}</td>
                        <td>Floor {b.floor} of {b.totalFloors}</td>
                        <td style={{ fontWeight: 600 }}>₹{b.rate.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${b.status === 'Vacant' ? 'badge-success' : 'badge-danger'}`}>
                            {b.status}
                          </span>
                          {b.status === 'Occupied' && b.patientName && (
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger)', marginTop: 4 }}>
                              👤 {b.patientName} ({b.patientId})
                            </div>
                          )}
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
              <button className="btn btn-primary" onClick={() => { setIsEditing(false); resetForm(); setShowModal(true); }}><Plus size={15} /> Add Room</button>
            </div>

            {/* Quick Stats */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#6366f1' }}>{roomsListCalculated.reduce((s, r) => s + r.totalBeds, 0)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Total Beds</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>{roomsListCalculated.reduce((s, r) => s + r.vacantBeds, 0)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Vacant Beds</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>{roomsListCalculated.reduce((s, r) => s + (r.totalBeds - r.vacantBeds), 0)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Occupied Beds</div>
              </div>
            </div>

            {/* Search room master list */}
            <div className="card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Search Rooms Register</label>
                  <div className="search-bar" style={{ width: '100%' }}>
                    <Search />
                    <input placeholder="Search room by number, floor, building..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="All">All Room Types</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Building</label>
                  <select className="form-control" value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)}>
                    <option value="All">All Buildings</option>
                    {buildingsList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Floor</label>
                  <select className="form-control" value={filterFloor} onChange={e => setFilterFloor(e.target.value)}>
                    <option value="All">All Floors</option>
                    {floorsList.map(f => (
                      <option key={f} value={f}>Floor {f}</option>
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
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {r.category} · {r.building} (Floor {r.floor} of {r.totalFloors || r.total_floors || 5})
                        </div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct}% occupied</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-xs" style={{ fontSize: 10, padding: '2px 6px', height: 'auto', minHeight: 0 }} onClick={() => handleEditRoom(r)}>Edit</button>
                        <button className="btn btn-ghost btn-xs text-danger" style={{ fontSize: 10, padding: '2px 6px', height: 'auto', minHeight: 0 }} onClick={() => handleDeleteRoom(r.id)}>Delete</button>
                      </div>
                    </div>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => { resetForm(); setShowModal(false); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Room' : 'Add New Room'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { resetForm(); setShowModal(false); }}>✕</button>
            </div>
            <form onSubmit={handleSaveRoom}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{errorMsg}</div>}
                {successMsg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{successMsg}</div>}

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Room Number / Name</label>
                    <input className="form-control" placeholder="e.g. 101, ICU-A" value={roomForm.roomNo} onChange={e => setRoomForm({ ...roomForm, roomNo: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-control" value={roomForm.roomType} onChange={e => {
                      const selectedCat = e.target.value;
                      const catObj = categoriesList.find(c => c.name === selectedCat);
                      setRoomForm({
                        ...roomForm,
                        roomType: selectedCat,
                        pricePerDay: catObj ? catObj.rate : roomForm.pricePerDay
                      });
                    }}>
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Beds</label>
                    <input className="form-control" type="number" min="1" value={roomForm.totalBeds} onChange={e => setRoomForm({ ...roomForm, totalBeds: parseInt(e.target.value) || 0 })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price Per Day (₹)</label>
                    <input className="form-control" type="number" min="0" step="any" value={roomForm.pricePerDay} onChange={e => setRoomForm({ ...roomForm, pricePerDay: parseFloat(e.target.value) || 0 })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Building / Block</label>
                    {buildings.length > 0 ? (
                      <select className="form-control" value={roomForm.building} onChange={e => {
                        const selectedBName = e.target.value;
                        const bObj = buildings.find(b => b.name === selectedBName);
                        setRoomForm({ 
                          ...roomForm, 
                          building: selectedBName,
                          totalFloors: bObj ? bObj.totalFloors.toString() : roomForm.totalFloors,
                          floor: '1' // reset floor to 1
                        });
                      }} required>
                        <option value="">Select Building</option>
                        {buildings.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input className="form-control" placeholder="e.g. Specialty Wing" value={roomForm.building} onChange={e => setRoomForm({ ...roomForm, building: e.target.value })} required />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Floor Level</label>
                    {buildings.length > 0 && roomForm.building ? (
                      <select className="form-control" value={roomForm.floor} onChange={e => setRoomForm({ ...roomForm, floor: e.target.value })} required>
                        {Array.from({ length: parseInt(roomForm.totalFloors) || 1 }, (_, i) => {
                          const floorVal = (i + 1).toString();
                          return (
                            <option key={floorVal} value={floorVal}>Floor {floorVal}</option>
                          );
                        })}
                      </select>
                    ) : (
                      <input className="form-control" type="number" min="0" value={roomForm.floor} onChange={e => setRoomForm({ ...roomForm, floor: e.target.value })} required />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Floors in Building</label>
                    <input className="form-control" type="number" min="1" value={roomForm.totalFloors} onChange={e => setRoomForm({ ...roomForm, totalFloors: e.target.value })} disabled={buildings.length > 0} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { resetForm(); setShowModal(false); }}>Close</button>
                <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Save Room'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Edit Room Category</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCategoryModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{errorMsg}</div>}
                {successMsg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{successMsg}</div>}

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Current Category Name</label>
                    <input className="form-control" value={categoryForm.oldCategory} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Category Name</label>
                    <input className="form-control" placeholder="e.g. Deluxe Suite" value={categoryForm.newCategory} onChange={e => setCategoryForm({ ...categoryForm, newCategory: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Price Per Day (₹)</label>
                    <input className="form-control" type="number" min="0" step="any" value={categoryForm.newRate} onChange={e => setCategoryForm({ ...categoryForm, newRate: parseFloat(e.target.value) || 0 })} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>Close</button>
                <button type="submit" className="btn btn-primary">Bulk Update Rooms</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCategoryModal && (
        <div className="modal-overlay" onClick={() => { setShowAddCategoryModal(false); setErrorMsg(''); setSuccessMsg(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Room Category</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddCategoryModal(false); setErrorMsg(''); setSuccessMsg(''); }}>✕</button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{errorMsg}</div>}
                {successMsg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{successMsg}</div>}

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Category Name</label>
                    <input className="form-control" placeholder="e.g. Super Deluxe" value={newCategoryForm.name} onChange={e => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Starting Price Per Day (₹)</label>
                    <input className="form-control" type="number" min="0" step="any" value={newCategoryForm.rate} onChange={e => setNewCategoryForm({ ...newCategoryForm, rate: parseFloat(e.target.value) || 0 })} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddCategoryModal(false); setErrorMsg(''); setSuccessMsg(''); }}>Close</button>
                <button type="submit" className="btn btn-primary">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBuildingModal && (
        <div className="modal-overlay" onClick={() => { setShowBuildingModal(false); setErrorMsg(''); setSuccessMsg(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditingBuilding ? 'Edit Building Wings' : 'Register New Wing/Building'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowBuildingModal(false); setErrorMsg(''); setSuccessMsg(''); }}>✕</button>
            </div>
            <form onSubmit={handleSaveBuilding}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{errorMsg}</div>}
                {successMsg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{successMsg}</div>}

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Building / Wing Name</label>
                    <input className="form-control" placeholder="e.g. Specialty Wing" value={buildingForm.name} onChange={e => setBuildingForm({ ...buildingForm, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Floor Levels</label>
                    <input className="form-control" type="number" min="1" max="50" value={buildingForm.totalFloors} onChange={e => setBuildingForm({ ...buildingForm, totalFloors: e.target.value })} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowBuildingModal(false); setErrorMsg(''); setSuccessMsg(''); }}>Close</button>
                <button type="submit" className="btn btn-primary">{isEditingBuilding ? 'Save Changes' : 'Register Building'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

