import React,{useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {adminInsights} from '../services/adminApi';
import {fmtDate} from '../config';
import {useAsync,useDebounced} from '../hooks';
import {duration} from '../components/DelayDetails';
import {DataTable,ErrorState,Loading,PageHeader,Panel,SearchBox,StatusBadge} from '../components';
import {DecisionCenter} from '../components/DecisionCenter';
export function AlertsPage(){
  const [params]=useSearchParams();
  const [kind,setKind]=useState(params.get('kind')||'all'),[status,setStatus]=useState(params.get('state')||'active');
  const [q,setQ]=useState(''),[offset,setOffset]=useState(0);
  const search=useDebounced(q);
  const state=useAsync(()=>adminInsights('alerts',{kind,state:status,q:search,offset}),[kind,status,search,offset]);
  function filter(set,value){set(value);setOffset(0)}
  return <><PageHeader title="التنبيهات التشغيلية" description="حالة كل سبب وتاريخه والجهة المرتبطة به." actions={<button className="secondary" disabled={state.loading} onClick={state.reload}>تحديث</button>}/>
    <Panel title="التنبيهات" actions={<div className="filters admin-list-filters">
      <SearchBox value={q} onChange={value=>filter(setQ,value)} placeholder="الطلب أو الصيدلية أو الدواء"/>
      <select aria-label="نوع التنبيه" value={kind} onChange={event=>filter(setKind,event.target.value)}>{[['all','كل الأنواع'],['delay','تأخر الطرفين'],['pharmacy','تأخر الصيدلية'],['pickup','تأخر الاستلام'],['registration','التسجيل'],['offline','توقف الاستقبال'],['stock','نفاد التوفر'],['expiry','قرب انتهاء الصلاحية']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      <select aria-label="حالة التنبيه" value={status} onChange={event=>filter(setStatus,event.target.value)}><option value="active">نشطة</option><option value="resolved">انتهى السبب</option><option value="all">كل التاريخ</option></select>
    </div>}>
      {state.loading?<Loading/>:state.error?<ErrorState error={state.error} retry={state.reload}/>:<>
        <DecisionCenter rows={state.data.recommendations} summary={state.data.decisionSummary}/>
        <DataTable rows={state.data.rows} columns={[
          {key:'title',label:'النوع'},{key:'name',label:'الجهة'},{key:'description',label:'التفاصيل'},
          {key:'active',label:'الحالة',render:row=><StatusBadge tone={row.active?'warning':'info'}>{row.active?'نشط':'انتهى السبب'}</StatusBadge>},
          {key:'startedAt',label:'بداية التجاوز / الحالة',render:row=>fmtDate(row.startedAt)},
          {key:'overdueMs',label:'مدة التجاوز',render:row=>row.overdueMs===undefined?'—':duration(row.overdueMs)},
          {key:'resolvedAt',label:'الموعد / انتهاء السبب',render:row=>row.dueAt?fmtDate(row.dueAt):row.active?'—':fmtDate(row.resolvedAt)},
          {key:'open',label:'المتابعة',render:row=><Link to={row.href}>فتح الجهة</Link>},
        ]}/>
        <div className="request-pagination"><span>الإجمالي {state.data.total} · {fmtDate(state.data.generatedAt)}</span><div className="actions"><button className="secondary" disabled={!offset} onClick={()=>setOffset(value=>Math.max(0,value-50))}>السابق</button><button className="secondary" disabled={!state.data.hasMore} onClick={()=>setOffset(value=>value+50)}>التالي</button></div></div>
      </>}
    </Panel>
  </>;
}
