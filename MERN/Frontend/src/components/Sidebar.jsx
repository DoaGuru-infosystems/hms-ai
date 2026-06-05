import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, CalendarCheck, Users, Bed, Building2,
  HeartPulse, BookOpen, UserCog, Settings2, User,
  ChevronDown, Pill, ClipboardList, FileText,
  Activity, Thermometer, ArrowLeftRight, History, LogOut,
  Stethoscope, UserCheck, FlaskConical, Scissors, Receipt,
  BarChart3, UserPlus, Shield, Package, Building, AlertCircle,
  Database, FileSearch, Sparkles, UserRound, Truck, MapPin
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
    
    if (hasActiveChild) {
      setOpen(true);
    }
  }, [location, children]);

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        className={`nav-item ${open ? 'nav-group-open' : ''}`}
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          background: open ? 'rgba(92, 84, 243, 0.03)' : 'transparent',
          color: open ? 'var(--primary)' : 'var(--text-secondary)',
          border: '1px solid',
          borderColor: open ? 'rgba(92, 84, 243, 0.08)' : 'transparent'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26,
          height: 26,
          borderRadius: 8,
          background: open ? 'var(--primary-soft)' : 'transparent',
          color: open ? 'var(--primary)' : 'inherit',
          transition: 'all 0.2s'
        }}>
          <Icon size={16} />
        </div>
        <span style={{ flex: 1, textAlign: 'left', fontWeight: open ? '600' : '500' }}>{label}</span>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 20, borderRadius: 6,
          background: open ? 'rgba(92, 84, 243, 0.06)' : 'transparent',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <ChevronDown size={13} />
        </span>
      </button>
      {open && (
        <div style={{
          paddingLeft: 8,
          marginLeft: 23,
          marginTop: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          borderLeft: '1.5px dashed rgba(92, 84, 243, 0.15)'
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
      style={({ isActive }) => ({
        color: isActive ? 'white' : 'var(--text-secondary)',
        paddingLeft: 12,
        height: 36,
        display: 'flex',
        alignItems: 'center'
      })}
    >
      {Icon && <Icon size={14} style={{ marginRight: 2 }} />}
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ onLogout, userRole = 'Administrator' }) {
  const isAdmin = userRole === 'Administrator' || userRole === 'System Administrator';
  const isDoctor = userRole === 'Doctor' || isAdmin;
  const isNurse = userRole === 'Nurse' || isAdmin;
  const isReceptionist = userRole === 'Receptionist' || isAdmin;
  const isCashier = userRole === 'Cashier' || isAdmin;

  return (
    <div className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(92, 84, 243, 0.22)',
            position: 'relative'
          }}>
            <span style={{ fontSize: 20 }}>🏥</span>
            <div style={{
              position: 'absolute',
              inset: -3,
              borderRadius: 15,
              border: '1.5px solid var(--primary-light)',
              opacity: 0.4
            }} />
          </div>
          <div>
            <h1 style={{ letterSpacing: '-0.5px' }}>MediCare</h1>
            <p>Smart HMS Platform</p>
          </div>
        </div>
        
        {/* Dynamic Badge with sparkles */}
        <div style={{
          marginTop: 16,
          padding: '8px 12px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(92, 84, 243, 0.05), rgba(147, 51, 234, 0.05))',
          border: '1px solid rgba(92, 84, 243, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={12} color="var(--primary)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>
              {userRole}
            </span>
          </div>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px #10b981'
          }} />
        </div>
      </div>

      {/* Navigation list */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Core Systems</div>
        
        <NavLink 
          to="/dashboard" 
          onClick={closeSidebarOnMobile}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            color: isActive ? 'white' : 'var(--text-secondary)',
            marginBottom: 6
          })}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: 8,
            background: 'transparent'
          }}>
            <LayoutDashboard size={16} />
          </div>
          <span style={{ fontWeight: '500' }}>Dashboard Overview</span>
        </NavLink>

        {/* Billing / POS */}
        {(isCashier || isAdmin) && (
          <NavGroup icon={CreditCard} label="Billing & POS">
            <NavItem to="/billing/pos" icon={Receipt} label="Terminal POS" />
            <NavItem to="/billing/list" icon={ClipboardList} label="Invoices Master" />
            <NavItem to="/billing/or-history" icon={History} label="Receipt Logs" />
            <NavItem to="/billing/surgical-costing" icon={Scissors} label="Surgical Quoting" />
          </NavGroup>
        )}

        {/* Appointment Scheduler */}
        {(isReceptionist || isAdmin) && (
          <NavGroup icon={CalendarCheck} label="Appointments">
            <NavItem to="/appointment/add" icon={UserPlus} label="Schedule Visit" />
            <NavItem to="/appointment/list" icon={ClipboardList} label="Manage Bookings" />
          </NavGroup>
        )}

        {/* Clinical OPD/IPD Patients */}
        {(isReceptionist || isAdmin) && (
          <NavGroup icon={Users} label="Patient Center">
            <NavItem to="/patient/add" icon={UserPlus} label="Add Patient" />
            <NavItem to="/patient/master" icon={ClipboardList} label="Master Directory" />
            <NavGroup icon={Stethoscope} label="OPD Desk">
              <NavItem to="/opd/registration" icon={UserPlus} label="Consult Registration" />
              <NavItem to="/opd/enquiry" icon={FileSearch} label="Out-Patient Search" />
            </NavGroup>
            <NavGroup icon={Bed} label="IPD Registry">
              <NavItem to="/ipd/admit" icon={UserPlus} label="Admit Patient" />
              <NavItem to="/ipd/enquiry" icon={FileSearch} label="In-Patient Search" />
            </NavGroup>
          </NavGroup>
        )}

        {/* Ward Bed & Rooms */}
        {isAdmin && (
          <NavGroup icon={Building2} label="Ward Management">
            <NavItem to="/rooms/enquiry" icon={FileSearch} label="Ward Enquiry" />
            <NavItem to="/rooms/category" icon={Building} label="Room Profiles" />
            <NavItem to="/rooms/master" icon={Building2} label="Room Registry" />
            <NavItem to="/rooms/beds" icon={Bed} label="Bed Mapping" />
          </NavGroup>
        )}

        {/* Nurse Clinical Actions */}
        {(isNurse || isAdmin) && (
          <NavGroup icon={HeartPulse} label="Nursing Station">
            <NavItem to="/nurse/medication" icon={Pill} label="Medication Chart" />
            <NavItem to="/nurse/intake-output" icon={Activity} label="Intake & Output" />
            <NavItem to="/nurse/progress-note" icon={FileText} label="Progress Sheets" />
            <NavItem to="/nurse/vital-signs" icon={Thermometer} label="Vitals Register" />
            <NavItem to="/nurse/bed-side" icon={Bed} label="Bedside Procedures" />
            <NavItem to="/nurse/room-transfer" icon={ArrowLeftRight} label="Ward Transfer" />
            <NavItem to="/nurse/patient-history" icon={History} label="Clinical History" />
            <NavItem to="/nurse/discharge" icon={LogOut} label="Discharge Summary" />
          </NavGroup>
        )}

        {/* Doctor Clinical Workspace */}
        {isDoctor && (
          <NavGroup icon={Stethoscope} label="Doctor Workspace">
            <NavItem to="/doctor/opd" icon={FileText} label="OPD Consultations" />
            <NavItem to="/doctor/ipd" icon={Bed} label="IPD Ward Rounds" />
          </NavGroup>
        )}

        {/* Electronic Medical Records */}
        {(isDoctor || isAdmin) && (
          <NavGroup icon={BookOpen} label="EMR Archives">
            <NavItem to="/emr/opd" icon={FileText} label="OPD Electronic Record" />
            <NavItem to="/emr/ipd" icon={FileText} label="IPD Electronic Record" />
          </NavGroup>
        )}

        {/* Ambulance Fleet */}
        {(isAdmin || isReceptionist) && (
          <NavGroup icon={Truck} label="Ambulance">
            <NavItem to="/ambulance/fleet" icon={Truck} label="Fleet Status" />
            <NavItem to="/ambulance/dispatch" icon={MapPin} label="Dispatch Logs" />
          </NavGroup>
        )}

        {/* Admin Configuration */}
        {isAdmin && (
          <>
            <div className="nav-section-title">Operations</div>
            <NavGroup icon={UserCog} label="Identity Mgmt">
              <NavItem to="/users/add" icon={UserPlus} label="Register Staff" />
              <NavItem to="/users/list" icon={ClipboardList} label="Staff List" />
              <NavItem to="/users/roles" icon={Shield} label="Access Permissions" />
            </NavGroup>
            <NavGroup icon={Settings2} label="Settings System">
              <NavItem to="/admin/company" icon={Building} label="Hospital Profile" />
              <NavItem to="/admin/departments" icon={Building2} label="Departments" />
              <NavItem to="/admin/designations" icon={UserCheck} label="Designations" />
              <NavItem to="/admin/bill-groups" icon={CreditCard} label="Billing Groups" />
              <NavItem to="/admin/bill-particulars" icon={Receipt} label="Services Rates" />
              <NavItem to="/admin/complaints" icon={AlertCircle} label="Symptoms Master" />
              <NavItem to="/admin/diagnosis" icon={FlaskConical} label="ICD Diagnosis" />
              <NavItem to="/admin/surgical-packages" icon={Scissors} label="Operation Packages" />
              <NavItem to="/admin/insurance" icon={Shield} label="TPA Insurances" />
              <NavGroup icon={Pill} label="Medication Stock">
                <NavItem to="/admin/medicine-categories" icon={Package} label="Category Types" />
                <NavItem to="/admin/drugs" icon={Pill} label="Drug Formularies" />
              </NavGroup>
              <NavItem to="/admin/parameters" icon={Settings2} label="System Configs" />
              <NavItem to="/admin/backup" icon={Database} label="Backup & Recover" />
            </NavGroup>
            <NavGroup icon={BarChart3} label="Intelligence Reports">
              <NavItem to="/reports/patient-list" icon={Users} label="Patient Logs" />
              <NavItem to="/reports/individual-patient" icon={User} label="Patient Case File" />
              <NavItem to="/reports/outpatient" icon={Stethoscope} label="OPD Volume Report" />
              <NavItem to="/reports/inpatient" icon={Bed} label="IPD Census Report" />
              <NavItem to="/reports/discharged" icon={LogOut} label="Discharges Report" />
              <NavItem to="/reports/daily-sales" icon={BarChart3} label="Financial Register" />
              <NavItem to="/reports/doctor-fee" icon={Stethoscope} label="Physician Fees" />
            </NavGroup>
          </>
        )}
      </nav>

      {/* User Session Info Card */}
      <div style={{
        margin: '0 14px 14px',
        padding: '12px 14px',
        borderRadius: 14,
        background: 'var(--bg-2)',
        border: '1px solid var(--surface-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--primary-soft)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserRound size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>Active Account</p>
            <p style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>{userRole}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            border: '1px solid rgba(244, 63, 94, 0.12)',
            borderRadius: 8,
            background: 'var(--rose-soft)',
            color: 'var(--rose)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--rose-soft)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <LogOut size={13} />
          Sign Out Session
        </button>
      </div>
    </div>
  );
}
