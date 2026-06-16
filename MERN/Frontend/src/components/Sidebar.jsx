import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, CalendarCheck, Users, Bed, Building2,
  HeartPulse, BookOpen, UserCog, Settings2,
  ChevronDown, Pill, ClipboardList, FileText,
  Activity, Thermometer, ArrowLeftRight, History, LogOut,
  Stethoscope, UserCheck, FlaskConical, Scissors, Receipt,
  BarChart3, UserPlus, Shield, Package, Building, AlertCircle,
  Database, FileSearch, UserRound, Truck, MapPin, Sparkles,
  Search, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

const closeSidebarOnMobile = () => {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
};

function NavGroup({ icon: Icon, label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const location = useLocation();

  useEffect(() => {
    const hasActiveChild = Array.isArray(children)
      ? children.some(child => child?.props?.to && location.pathname.startsWith(child.props.to))
      : children?.props?.to && location.pathname.startsWith(children.props.to);
    if (hasActiveChild) setOpen(true);
  }, [location, children]);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        className={`nav-item ${open ? 'nav-group-open' : ''}`}
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center' }}
      >
        <Icon size={15} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 13 }}>{label}</span>
        <ChevronDown
          size={12}
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            color: 'var(--text-muted)'
          }}
        />
      </button>
      {open && (
        <div style={{
          paddingLeft: 8,
          marginLeft: 22,
          marginTop: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          borderLeft: '1.5px solid var(--surface-border)'
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      onClick={closeSidebarOnMobile}
      className={({ isActive }) => `nav-item nav-sub ${isActive ? 'active' : ''}`}
      style={{ paddingLeft: 10, height: 34 }}
    >
      {Icon && <Icon size={13} style={{ marginRight: 1, flexShrink: 0 }} />}
      <span style={{ fontSize: 12.5 }}>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ onLogout, userRole = 'Administrator' }) {
  const isAdmin = userRole === 'Administrator' || userRole === 'System Administrator';
  const isDoctor = userRole === 'Doctor' || isAdmin;
  const isNurse = userRole === 'Nurse' || isAdmin;
  const isReceptionist = userRole === 'Receptionist' || isAdmin;
  const isCashier = userRole === 'Cashier' || isAdmin;

  const initials = userRole ? userRole.slice(0, 1).toUpperCase() : 'A';
  const [searchQuery, setSearchQuery] = useState('');

  const navSchema = [
    {
      type: 'section',
      title: 'Core Systems',
      items: [
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, visible: true },
        {
          label: 'Billing & POS',
          icon: CreditCard,
          visible: isCashier,
          children: [
            { label: 'Terminal POS', to: '/billing/pos', icon: Receipt },
            { label: 'Invoices', to: '/billing/list', icon: ClipboardList },
            { label: 'Receipt Logs', to: '/billing/or-history', icon: History },
            { label: 'Surgical Quotes', to: '/billing/surgical-costing', icon: Scissors }
          ]
        },
        {
          label: 'Appointments',
          icon: CalendarCheck,
          visible: isReceptionist,
          children: [
            { label: 'Schedule Visit', to: '/appointment/add', icon: UserPlus },
            { label: 'Manage Bookings', to: '/appointment/list', icon: ClipboardList }
          ]
        },
        {
          label: 'Patient Management',
          icon: Users,
          visible: isReceptionist,
          children: [
            { label: 'Add Patient', to: '/patient/add', icon: UserPlus },
            { label: 'Patient Directory', to: '/patient/master', icon: ClipboardList },
            {
              label: 'OPD Desk',
              icon: Stethoscope,
              children: [
                { label: 'Consult Registration', to: '/opd/registration', icon: UserPlus },
                { label: 'OPD Search', to: '/opd/enquiry', icon: FileSearch }
              ]
            },
            {
              label: 'IPD Registry',
              icon: Bed,
              children: [
                { label: 'Admit Patient', to: '/ipd/admit', icon: UserPlus },
                { label: 'IPD Search', to: '/ipd/enquiry', icon: FileSearch }
              ]
            }
          ]
        },
        {
          label: 'Ward Management',
          icon: Building2,
          visible: isAdmin,
          children: [
            { label: 'Ward Enquiry', to: '/rooms/enquiry', icon: FileSearch },
            { label: 'Building & Floors', to: '/rooms/buildings', icon: Building },
            { label: 'Room Profiles', to: '/rooms/category', icon: Building },
            { label: 'Room Registry', to: '/rooms/master', icon: Building2 },
            { label: 'Bed Mapping', to: '/rooms/beds', icon: Bed }
          ]
        },
        {
          label: 'Nursing Station',
          icon: HeartPulse,
          visible: isNurse,
          children: [
            { label: 'Medication Chart', to: '/nurse/medication', icon: Pill },
            { label: 'Intake & Output', to: '/nurse/intake-output', icon: Activity },
            { label: 'Progress Sheets', to: '/nurse/progress-note', icon: FileText },
            { label: 'Vitals Register', to: '/nurse/vital-signs', icon: Thermometer },
            { label: 'Bedside Procedures', to: '/nurse/bed-side', icon: Bed },
            { label: 'Ward Transfer', to: '/nurse/room-transfer', icon: ArrowLeftRight },
            { label: 'Clinical History', to: '/nurse/patient-history', icon: History },
            { label: 'Discharge Summary', to: '/nurse/discharge', icon: LogOut }
          ]
        },
        {
          label: 'Doctor Workspace',
          icon: Stethoscope,
          visible: isDoctor,
          children: [
            { label: 'OPD Consultations', to: '/doctor/opd', icon: FileText },
            { label: 'IPD Ward Rounds', to: '/doctor/ipd', icon: Bed }
          ]
        },
        {
          label: 'EMR Archives',
          icon: BookOpen,
          visible: isDoctor || isAdmin,
          children: [
            { label: 'OPD Record', to: '/emr/opd', icon: FileText },
            { label: 'IPD Record', to: '/emr/ipd', icon: FileText }
          ]
        },
        {
          label: 'Ambulance',
          icon: Truck,
          visible: isAdmin || isReceptionist,
          children: [
            { label: 'Fleet Status', to: '/ambulance/fleet', icon: Truck },
            { label: 'Dispatch Logs', to: '/ambulance/dispatch', icon: MapPin }
          ]
        }
      ]
    },
    {
      type: 'section',
      title: 'Operations',
      visible: isAdmin,
      items: [
        {
          label: 'Identity Mgmt',
          icon: UserCog,
          visible: isAdmin,
          children: [
            { label: 'Register Staff', to: '/users/add', icon: UserPlus },
            { label: 'Staff List', to: '/users/list', icon: ClipboardList },
            { label: 'Access Permissions', to: '/users/roles', icon: Shield }
          ]
        },
        {
          label: 'Settings',
          icon: Settings2,
          visible: isAdmin,
          children: [
            { label: 'Hospital Profile', to: '/admin/company', icon: Building },
            { label: 'Departments', to: '/admin/departments', icon: Building2 },
            { label: 'Designations', to: '/admin/designations', icon: UserCheck },
            { label: 'Billing Groups', to: '/admin/bill-groups', icon: CreditCard },
            { label: 'Services Rates', to: '/admin/bill-particulars', icon: Receipt },
            { label: 'Symptoms Master', to: '/admin/complaints', icon: AlertCircle },
            { label: 'ICD Diagnosis', to: '/admin/diagnosis', icon: FlaskConical },
            { label: 'Operation Packages', to: '/admin/surgical-packages', icon: Scissors },
            { label: 'TPA Insurances', to: '/admin/insurance', icon: Shield },
            {
              label: 'Medication Stock',
              icon: Pill,
              children: [
                { label: 'Category Types', to: '/admin/medicine-categories', icon: Package },
                { label: 'Drug Formularies', to: '/admin/drugs', icon: Pill }
              ]
            },
            { label: 'System Configs', to: '/admin/parameters', icon: Settings2 },
            { label: 'Backup & Recover', to: '/admin/backup', icon: Database }
          ]
        },
        {
          label: 'Reports',
          icon: BarChart3,
          visible: isAdmin,
          children: [
            { label: 'Patient Logs', to: '/reports/patient-list', icon: Users },
            { label: 'Patient Case File', to: '/reports/individual-patient', icon: UserRound },
            { label: 'OPD Volume', to: '/reports/outpatient', icon: Stethoscope },
            { label: 'IPD Census', to: '/reports/inpatient', icon: Bed },
            { label: 'Discharges', to: '/reports/discharged', icon: LogOut },
            { label: 'Financial Register', to: '/reports/daily-sales', icon: BarChart3 },
            { label: 'Physician Fees', to: '/reports/doctor-fee', icon: Stethoscope }
          ]
        }
      ]
    }
  ];

  const getVisibleAndFilteredSchema = (schema, query) => {
    const q = query.toLowerCase();
    return schema
      .filter(section => section.visible !== false)
      .map(section => {
        const visibleItems = section.items
          .filter(item => item.visible !== false)
          .map(item => {
            const labelMatch = item.label.toLowerCase().includes(q);
            const routeMatch = item.to ? item.to.toLowerCase().includes(q) : false;
            const itemMatches = labelMatch || routeMatch;
            
            if (item.children) {
              const filteredChildren = item.children
                .filter(child => child.visible !== false)
                .map(child => {
                  const childLabelMatch = child.label.toLowerCase().includes(q);
                  const childRouteMatch = child.to ? child.to.toLowerCase().includes(q) : false;
                  const childMatches = childLabelMatch || childRouteMatch;
                  
                  if (child.children) {
                    const nestedChildren = child.children
                      .filter(nested => nested.visible !== false)
                      .filter(nested => {
                        const nestedLabelMatch = nested.label.toLowerCase().includes(q);
                        const nestedRouteMatch = nested.to ? nested.to.toLowerCase().includes(q) : false;
                        return q === '' || nestedLabelMatch || nestedRouteMatch;
                      });
                    
                    if (nestedChildren.length > 0 || childMatches || q === '') {
                      return { 
                        ...child, 
                        children: nestedChildren, 
                        defaultOpen: q !== '' 
                      };
                    }
                    return null;
                  }
                  
                  return q === '' || childMatches ? child : null;
                })
                .filter(Boolean);

              if (filteredChildren.length > 0 || itemMatches) {
                return { 
                  ...item, 
                  children: filteredChildren, 
                  defaultOpen: q !== '' 
                };
              }
              return null;
            }
            
            return q === '' || itemMatches ? item : null;
          })
          .filter(Boolean);

        return { ...section, items: visibleItems };
      })
      .filter(section => section.items.length > 0);
  };

  const visibleSchema = getVisibleAndFilteredSchema(navSchema, searchQuery);

  return (
    <div className="sidebar">
      {/* Blue Header */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>🏥</div>
          <div>
            <h1>MediCare HMS</h1>
            <p>Hospital Management System</p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      {/* <div style={{
        margin: '10px 10px 0',
        padding: '8px 12px',
        borderRadius: 8,
        background: 'var(--primary-soft)',
        border: '1px solid rgba(59,91,219,0.12)',
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--gradient-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: 'white'
        }}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userRole}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#12b886', display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Online</span>
          </div>
        </div>
      </div> */}

      {/* Nav */}
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Search Input */}
        <div style={{ padding: '8px 10px 12px 10px', borderBottom: '1px solid var(--surface-border)', marginBottom: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              placeholder="Search tabs/sub-tabs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 20px 6px 28px',
                fontSize: '12px',
                background: 'var(--bg)',
                border: '1px solid var(--surface-border)',
                borderRadius: '6px',
                color: 'var(--text)',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {visibleSchema.map((section, sIdx) => (
          <div key={section.title || sIdx}>
            {section.title && <div className="nav-section-title">{section.title}</div>}
            {section.items.map((item) => {
              if (item.children) {
                return (
                  <NavGroup 
                    key={item.label} 
                    icon={item.icon} 
                    label={item.label} 
                    defaultOpen={item.defaultOpen}
                  >
                    {item.children.map(child => {
                      if (child.children) {
                        return (
                          <NavGroup 
                            key={child.label} 
                            icon={child.icon} 
                            label={child.label} 
                            defaultOpen={child.defaultOpen}
                          >
                            {child.children.map(nested => (
                              <NavItem key={nested.to} to={nested.to} icon={nested.icon} label={nested.label} />
                            ))}
                          </NavGroup>
                        );
                      }
                      return (
                        <NavItem key={child.to} to={child.to} icon={child.icon} label={child.label} />
                      );
                    })}
                  </NavGroup>
                );
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeSidebarOnMobile}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Card */}
      <div style={{
        margin: '0 10px 12px',
        padding: '10px 12px',
        borderRadius: 10,
        background: 'var(--bg)',
        border: '1px solid var(--surface-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Active Account
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userRole}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Sign Out"
          style={{
            width: 30, height: 30, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(250,82,82,0.18)',
            borderRadius: 7,
            background: 'rgba(250,82,82,0.05)',
            color: '#e03131',
            cursor: 'pointer', transition: 'all 0.18s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,82,82,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,82,82,0.05)'; }}
        >
          <LogOut size={13} />
        </button>
      </div>
    </div>
  );
}
