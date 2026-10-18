import React,{useState}from'react';
import{Eye,RefreshCw}from'lucide-react';
import{
  first,
  fmtDate,
  isPharmacyDelayed,
  isUserDelayed,
  orderPharmacyName,
  orderStatusLabel,
}from'../config';
import {useAdminList} from '../useAdminList';
import {ListFilters,AdminListTable} from '../components/AdminList';
import {ORDER_LABELS} from '../config';
import {DelayDetails} from '../components/DelayDetails';
import{
  Modal,
  PageHeader,
  Panel,
  StatusBadge,
}from'../components';

export function OrdersPage(){
  const list=useAdminList('orders');
  const[selected,setSelected]=useState(null);
  return <>
    <PageHeader
      title="متابعة الطلبات"
      description="ملخص تشغيلي منفصل؛ لا يعرض هوية المستفيد أو الأدوية أو البيانات الصحية أو الموقع."
      actions={<button className="secondary" onClick={list.reload} disabled={list.loading}><RefreshCw/>تحديث</button>}
    />
    <Panel
      title="الطلبات"
      actions={<ListFilters list={list} placeholder="بداية رقم الطلب أو الصيدلية" states={Object.entries(ORDER_LABELS)}>
        <input aria-label="معرف الصيدلية" placeholder="معرف الصيدلية (اختياري)" value={list.filters.group} onChange={event=>list.setFilter('group',event.target.value)}/>
        <select aria-label="نوع التأخر" value={list.filters.delay} onChange={event=>list.setFilter('delay',event.target.value)}><option value="">كل الطلبات</option><option value="any">أي تأخر مسجل</option><option value="pharmacy">تأخر الصيدلية — كل التاريخ</option><option value="pickup">تأخر الاستلام — كل التاريخ</option><option value="pharmacy_active">تأخر الصيدلية النشط</option><option value="pickup_active">تأخر الاستلام النشط</option></select>
      </ListFilters>}
    >
      <AdminListTable list={list} onRowClick={setSelected} columns={[
        {key:'number',label:'رقم الطلب',render:r=><b>{first(r,['orderNumber'],r.id)}</b>},
        {key:'pharmacy',label:'الصيدلية',render:orderPharmacyName},
        {key:'date',label:'تاريخ الطلب',render:r=>fmtDate(r.createdAt)},
        {key:'status',label:'الحالة',render:r=><StatusBadge>{orderStatusLabel(r.status||r.orderStatus)}</StatusBadge>},
        {key:'delay',label:'التأخير',render:r=><DelayFlags order={r}/>},
        {key:'items',label:'عدد الأصناف',render:r=>Number(r.totalItemsCount||0)},
        {key:'open',label:'',render:()=> <Eye size={18}/>},
      ]}/>
    </Panel>
    {selected&&<OrderModal order={selected} close={()=>setSelected(null)}/>} 
  </>;
}

function DelayFlags({order}){
  const pharmacy=isPharmacyDelayed(order),user=isUserDelayed(order);
  if(!pharmacy&&!user)return <span className="muted-text">لا يوجد</span>;
  return <div className="filters">
    {pharmacy&&<StatusBadge>تأخير الصيدلية</StatusBadge>}
    {user&&<StatusBadge>تأخير المستخدم</StatusBadge>}
  </div>;
}

function OrderModal({order:o,close}){
  const history=Array.isArray(o.statusHistory)?o.statusHistory:[];
  return <Modal
    title={`ملخص الطلب ${o.orderNumber||o.id}`}
    onClose={close}
    footer={<button className="secondary" onClick={close}>إغلاق</button>}
  >
    <div className="details-grid">
      <Detail l="الصيدلية" v={orderPharmacyName(o)}/>
      <Detail l="الحالة" v={orderStatusLabel(o.status||o.orderStatus)}/>
      <Detail l="عدد الأصناف" v={Number(o.totalItemsCount||0)}/>
      <Detail l="بداية المراجعة" v={fmtDate(o.reviewStartedAt)}/>
      <Detail l="جاهز منذ" v={fmtDate(o.readyAt)}/>
      <Detail l="موعد انتهاء الاستلام" v={fmtDate(o.pickupDeadline)}/>
    </div>
    <h3 className="section-title">مؤشرات التأخير المنفصلة</h3>
    <DelayDetails order={o}/>
    <h3 className="section-title">سجل الحالة التشغيلي</h3>
    <div className="timeline">{history.length?history.map((h,i)=><article key={i}>
      <span/><div><b>{h.label||orderStatusLabel(h.status)}</b>
      <small>{fmtDate(h.changedAt)} — {h.changedByType==='pharmacy'?'الصيدلية':h.changedByType==='user'?'المستخدم':'النظام'}</small>
      </div>
    </article>):<p className="muted-text">لا يوجد سجل حالات.</p>}</div>
  </Modal>;
}

function Detail({l,v}){return <div><small>{l}</small><b>{v??'—'}</b></div>}
