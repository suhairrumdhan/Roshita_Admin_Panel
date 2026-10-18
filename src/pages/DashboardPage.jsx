import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Activity,ArrowLeft,Clock3,PackageSearch,Radio,RefreshCw,ShieldCheck} from 'lucide-react';
import {Area,AreaChart,CartesianGrid,Cell,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {adminInsights} from '../services/adminApi';
import {fmtDate} from '../config';
import {useAsync} from '../hooks';
import {ErrorState,Loading} from '../components';
import {DecisionCenter} from '../components/DecisionCenter';

const STATUS_GROUPS=[{key:'completed',label:'مكتملة',color:'#10b981'},{key:'active',label:'قيد التنفيذ',color:'#2563eb'},{key:'attention',label:'تحتاج متابعة',color:'#f59e0b'}];
const activeStates=['received','reviewing','preparing','ready','partially_available','awaiting_user_decision'];
const attentionStates=['cancelled','rejected','notCollected'];
const arDay=value=>new Intl.DateTimeFormat('ar-LY',{weekday:'short',timeZone:'Africa/Tripoli'}).format(new Date(`${value}T12:00:00Z`));
const percent=value=>`${Number(value||0).toFixed(1)}%`;

function Metric({title,value,note,Icon,tone='teal',onClick}){
  return <button className={`overview-metric ${tone}`} onClick={onClick}><span className="overview-metric-icon"><Icon/></span><span><small>{title}</small><strong>{value}</strong><em>{note}</em></span><ArrowLeft className="metric-arrow"/></button>;
}

export function DashboardPage(){
  const navigate=useNavigate();
  const state=useAsync(()=>adminInsights('dashboard'),[]);
  if(state.loading)return <Loading/>;
  if(state.error)return <ErrorState error={state.error} retry={state.reload}/>;
  const data=state.data;
  const statusCount=keys=>keys.reduce((sum,key)=>sum+(data.statuses[key]||0),0);
  const statusData=STATUS_GROUPS.map(item=>({...item,value:item.key==='completed'?(data.statuses.completed||0):item.key==='active'?statusCount(activeStates):statusCount(attentionStates)}));
  const statusTotal=statusData.reduce((sum,item)=>sum+item.value,0);
  return <div className="overview-page">
    <header className="overview-header"><div><span className="overview-kicker">نظرة تشغيلية</span><h1>الرئيسية</h1><p>أهم القراءات والقرارات المطلوبة الآن · آخر تحديث {fmtDate(data.generatedAt)}</p></div><button className="secondary" onClick={state.reload}><RefreshCw/>تحديث البيانات</button></header>
    <div className="overview-metrics">
      <Metric title="طلبات اليوم" value={data.todayOrders} note={`${data.orders} طلبًا مسجلًا`} Icon={Activity} onClick={()=>navigate(`/orders?from=${data.today}&to=${data.today}`)}/>
      <Metric title="إنجاز آخر 30 يومًا" value={percent(data.completionRate30)} note={`تعثر ${percent(data.unsuccessfulRate30)}`} Icon={ShieldCheck} tone="blue" onClick={()=>navigate('/reports')}/>
      <Metric title="تأخيرات نشطة" value={data.delays} note={`${data.pharmacyDelays} صيدلية · ${data.pickupDelays} استلام`} Icon={Clock3} tone="amber" onClick={()=>navigate('/alerts?kind=delay&state=active')}/>
      <Metric title="مخاطر المخزون" value={data.outOfStock+data.nearExpiry} note={`${data.outOfStock} نافد · ${data.nearExpiry} قرب انتهاء`} Icon={PackageSearch} tone="red" onClick={()=>navigate('/alerts?state=active')}/>
    </div>
    <div className="overview-grid">
      <section className="overview-card trend-card"><header><div><h2>حركة الطلبات</h2><p>الطلبات والمكتملة خلال آخر 7 أيام</p></div><button onClick={()=>navigate('/reports')}>التقرير الكامل <ArrowLeft/></button></header><div className="overview-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend} margin={{top:10,right:4,left:-18,bottom:0}}><defs><linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f766e" stopOpacity={.3}/><stop offset="95%" stopColor="#0f766e" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eeef"/><XAxis dataKey="day" tickFormatter={arDay} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} axisLine={false} tickLine={false}/><Tooltip labelFormatter={arDay}/><Area type="monotone" dataKey="orders" name="الطلبات" stroke="#0f766e" strokeWidth={3} fill="url(#ordersFill)"/><Area type="monotone" dataKey="completed" name="المكتملة" stroke="#22c55e" strokeWidth={2} fill="transparent"/></AreaChart></ResponsiveContainer></div></section>
      <section className="overview-card status-card"><header><div><h2>حالة الطلبات</h2><p>توزيع تشغيلي مختصر</p></div></header><div className="status-visual"><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" innerRadius={58} outerRadius={78} paddingAngle={3}>{statusData.map(item=><Cell key={item.key} fill={item.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-total"><strong>{statusTotal}</strong><small>طلب</small></div></div><div className="status-legend">{statusData.map(item=><button key={item.key} onClick={()=>navigate(item.key==='completed'?'/orders?state=completed':'/orders')}><i style={{background:item.color}}/><span>{item.label}</span><b>{item.value}</b></button>)}</div></div></section>
      <section className="overview-card network-card"><header><div><h2>صحة شبكة الصيدليات</h2><p>الجاهزية الحالية لاستقبال الطلبات</p></div></header><div className="network-score"><div><Radio/><strong>{data.onlineApproved}</strong><small>جاهزة وتستقبل</small></div><span>من أصل {data.approvedPharmacies} صيدلية معتمدة</span></div><div className="network-list"><button onClick={()=>navigate('/pharmacies?group=offline')}><span>الاستقبال متوقف</span><b>{data.offlineApproved}</b></button><button onClick={()=>navigate('/requests?state=pending')}><span>اعتمادات معلقة</span><b>{data.pending}</b></button><button onClick={()=>navigate('/alerts?kind=expiry&state=active')}><span>أدوية قرب انتهاء الصلاحية</span><b>{data.nearExpiry}</b></button></div></section>
    </div>
    <DecisionCenter rows={data.recommendations} summary={data.decisionSummary} limit={3}/>
  </div>;
}
