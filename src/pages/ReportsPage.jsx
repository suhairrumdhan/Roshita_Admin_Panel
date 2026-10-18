import React,{useState} from 'react';
import {CartesianGrid,Legend,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {adminInsights} from '../services/adminApi';
import {fmtDate} from '../config';
import {useAsync} from '../hooks';
import {duration} from '../components/DelayDetails';
import {DataTable,ErrorState,Loading,PageHeader,Panel,StatCard} from '../components';
export function ReportsPage(){
  const [days,setDays]=useState(30);
  const state=useAsync(()=>adminInsights('reports',{days}),[days]);
  const data=state.data;
  return <><PageHeader title="التقارير" description="فترة التقارير حسب تاريخ إنشاء الطلب بتوقيت ليبيا. النسب لحالته الحالية." actions={<select value={days} onChange={event=>setDays(Number(event.target.value))}>{[7,30,90,365].map(value=><option key={value} value={value}>آخر {value} يومًا</option>)}</select>}/>
    {state.loading?<Loading label="جاري تجميع التقرير الكامل…"/>:state.error?<ErrorState error={state.error} retry={state.reload}/>:<>
      <p className="notice">آخر تحديث {fmtDate(data.generatedAt)} · سجلات بلا تاريخ مستبعدة من الفترة: {data.missingOrderDates} طلب و{data.missingUserDates} حساب.</p>
      <div className="stats-grid four"><StatCard title="الطلبات" value={data.total}/><StatCard title="الإكمال" value={data.completionRate.toFixed(1)+'%'} caption={data.completed+' طلبًا'}/><StatCard title="الإلغاء" value={data.cancellationRate.toFixed(1)+'%'} caption={data.cancelled+' طلبًا'}/><StatCard title="مستخدمون جدد" value={data.newUsers}/></div>
      <Panel title="الحركة اليومية ونمو المستخدمين" subtitle={'الفترة كاملة: '+days+' يومًا'}><div className="chart"><ResponsiveContainer width="100%" height={300}><LineChart data={data.trend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Line dataKey="orders" name="طلبات جديدة" stroke="#2563eb" dot={false}/><Line dataKey="completed" name="مكتملة" stroke="#16a34a" dot={false}/><Line dataKey="newUsers" name="مستخدمون جدد" stroke="#8b5cf6" dot={false}/></LineChart></ResponsiveContainer></div></Panel>
      <Panel title="تأخر الطرفين"><DataTable rows={[{id:'pharmacy',name:'الصيدلية',...data.delays.pharmacy},{id:'user',name:'الاستلام',...data.delays.user}]} columns={[{key:'name',label:'الطرف'},{key:'count',label:'الطلبات المتأخرة'},{key:'overdueMs',label:'مجموع التجاوز',render:row=>duration(row.overdueMs)},{key:'unknownDuration',label:'مدد غير مسجلة'}]}/></Panel>
      <Panel title="نشاط الصيدليات"><DataTable rows={data.activity} columns={[{key:'name',label:'الصيدلية'},{key:'total',label:'الطلبات'},{key:'completed',label:'مكتملة'},{key:'cancelled',label:'ملغاة'},{key:'rate',label:'معدل الإكمال',render:row=>(100*row.completed/row.total).toFixed(1)+'%'}]}/></Panel>
      <div className="dashboard-grid"><Panel title="الأدوية الأكثر طلبًا" subtitle="أعلى 20؛ العدد هو عدد الطلبات المختلفة التي طلبت الصنف، وليس عدد العبوات."><DataTable rows={data.medicines.slice(0,20)} columns={[{key:'name',label:'الصنف'},{key:'orders',label:'عدد الطلبات'}]}/></Panel><Panel title="التوزيع الجغرافي للصيدليات" subtitle="حسب المدينة المسجلة؛ العنوان الحر لا يُحوّل إلى مدينة بالافتراض."><DataTable rows={data.regions} columns={[{key:'name',label:'المدينة'},{key:'count',label:'الصيدليات'}]}/></Panel></div>
    </>}
  </>;
}
