import React,{lazy,Suspense,useState} from 'react';
import { Navigate,NavLink,Route,Routes } from 'react-router-dom';
import { Activity,BarChart3,Bell,Building2,ClipboardCheck,FileClock,LayoutDashboard,LogOut,MapPinned,Menu,TriangleAlert,Users,X } from 'lucide-react';
import { AuthProvider,useAuth } from './auth';
import { LoginPage } from './pages/LoginPage';
import { Loading } from './components';

const DashboardPage=lazy(()=>import('./pages/DashboardPage').then(m=>({default:m.DashboardPage})));
const RequestsPage=lazy(()=>import('./pages/RequestsPage').then(m=>({default:m.RequestsPage})));
const OrdersPage=lazy(()=>import('./pages/OrdersPage').then(m=>({default:m.OrdersPage})));
const PharmaciesPage=lazy(()=>import('./pages/PharmaciesPage').then(m=>({default:m.PharmaciesPage})));
const UsersPage=lazy(()=>import('./pages/UsersPage').then(m=>({default:m.UsersPage})));
const AlertsPage=lazy(()=>import('./pages/AlertsPage').then(m=>({default:m.AlertsPage})));
const ReportsPage=lazy(()=>import('./pages/ReportsPage').then(m=>({default:m.ReportsPage})));
const NotificationsPage=lazy(()=>import('./pages/NotificationsPage').then(m=>({default:m.NotificationsPage})));
const AuditPage=lazy(()=>import('./pages/AuditPage').then(m=>({default:m.AuditPage})));
const CoveragePage=lazy(()=>import('./pages/CoveragePage').then(m=>({default:m.CoveragePage})));

const nav=[['/','dashboard.view','الرئيسية',LayoutDashboard],['/requests','requests.view','طلبات التسجيل',ClipboardCheck],['/orders','orders.view','متابعة الطلبات',Activity],['/pharmacies','pharmacies.view','الصيدليات',Building2],['/coverage','coverage.view','التغطية الجغرافية',MapPinned],['/users','users.view','المستخدمون',Users],['/alerts','alerts.view','مركز التنبيهات',TriangleAlert],['/reports','reports.view','التقارير والتحليلات',BarChart3],['/notifications','notifications.view','الإشعارات',Bell],['/audit','audit.view','سجل العمليات',FileClock]];
function Shell(){const{user,admin,loading,error,can,logout}=useAuth();const[open,setOpen]=useState(false);if(loading)return <Loading/>;if(!user)return <LoginPage externalError={error}/>;return <div className="app-shell"><div className={`overlay ${open?'show':''}`} onClick={()=>setOpen(false)}/><aside className={open?'open':''}><div className="brand"><div className="brand-mark">ر</div><div><strong>روشيتة</strong><small>لوحة الإدارة المركزية</small></div><button className="mobile-close" onClick={()=>setOpen(false)}><X/></button></div><nav>{nav.filter(([,p])=>can(p)).map(([to,,label,Icon])=><NavLink key={to} to={to} end={to==='/'} onClick={()=>setOpen(false)}><Icon/><span>{label}</span></NavLink>)}</nav><div className="admin-card"><span className="avatar">{(admin.name||admin.email||'م')[0]}</span><div><b>{admin.name||'مشرف النظام'}</b><small>{admin.email}</small></div></div><button className="logout" onClick={logout}><LogOut/>تسجيل الخروج</button></aside><main><div className="mobile-top"><button onClick={()=>setOpen(true)}><Menu/></button><b>روشيتة</b></div><Suspense key={user.uid} fallback={<Loading/>}><Routes><Route path="/" element={<Guard p="dashboard.view"><DashboardPage/></Guard>}/><Route path="/requests" element={<Guard p="requests.view"><RequestsPage/></Guard>}/><Route path="/orders" element={<Guard p="orders.view"><OrdersPage/></Guard>}/><Route path="/pharmacies" element={<Guard p="pharmacies.view"><PharmaciesPage/></Guard>}/><Route path="/coverage" element={<Guard p="coverage.view"><CoveragePage/></Guard>}/><Route path="/users" element={<Guard p="users.view"><UsersPage/></Guard>}/><Route path="/alerts" element={<Guard p="alerts.view"><AlertsPage/></Guard>}/><Route path="/reports" element={<Guard p="reports.view"><ReportsPage/></Guard>}/><Route path="/notifications" element={<Guard p="notifications.view"><NotificationsPage/></Guard>}/><Route path="/audit" element={<Guard p="audit.view"><AuditPage/></Guard>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></Suspense></main></div>}
function Guard({p,children}){const{can}=useAuth();return can(p)?children:<div className="state danger">ليس لديك صلاحية لفتح هذه الصفحة.</div>}
export function App(){return <AuthProvider><Shell/></AuthProvider>}
