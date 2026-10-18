import React, {useState} from 'react';
import {fmtDate} from '../config';
import {useAdminList} from '../useAdminList';
import {ListFilters, AdminListTable} from '../components/AdminList';
import {Modal, PageHeader, Panel, StatusBadge} from '../components';

const actions = {request_approved:'اعتماد طلب التسجيل',request_rejected:'رفض طلب التسجيل',request_requires_changes:'طلب استكمال التسجيل',hide_pharmacy:'إخفاء الصيدلية',show_pharmacy:'إعادة ظهور الصيدلية',notification_queued:'جدولة إشعار',notification_retry:'إعادة إرسال الإشعار للمتعثرين'};
const modules = {requests:'التسجيل',pharmacies:'الصيدليات',notifications:'الإشعارات'};
const fields = {status:'الحالة',revision:'مراجعة السجل',version:'نسخة الطلب',isBlocked:'مخفية للمستخدمين',visibilityRevision:'نسخة الظهور',targetType:'الفئة',title:'العنوان'};
function StateDetails({value}) { return value && Object.keys(value).length ? <dl>{Object.entries(value).map(([key,item])=><React.Fragment key={key}><dt>{fields[key]||key}</dt><dd>{typeof item==='boolean'?(item?'نعم':'لا'):String(item)}</dd></React.Fragment>)}</dl> : <p>غير مسجل في المصدر</p>; }
export function AuditPage() {
  const list = useAdminList('audit');
  const [selected,setSelected] = useState(null);
  return <><PageHeader title="سجل العمليات" description="القرار الإداري ومن نفذه ووقته وسببه ونتيجته."/>
    <Panel title="العمليات الإدارية" actions={<ListFilters list={list} placeholder="بداية اسم المشرف أو الجهة أو العملية" states={[['success','ناجح'],['failed','فشل']]}>
      <select aria-label="الوحدة" value={list.filters.group} onChange={event=>list.setFilter('group',event.target.value)}><option value="">كل الوحدات</option>{Object.entries(modules).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
    </ListFilters>}>
      <AdminListTable list={list} onRowClick={setSelected} columns={[
        {key:'action',label:'العملية',render:row=>actions[row.action]||row.action||'غير محددة'},
        {key:'module',label:'الوحدة',render:row=>modules[row.module]||row.module},
        {key:'target',label:'الجهة',render:row=>row.targetName||row.targetId},
        {key:'performedByName',label:'المشرف'}, {key:'reason',label:'السبب'},
        {key:'status',label:'النتيجة',render:row=><StatusBadge>{row.status==='success'?'ناجح':row.status==='failed'?'فشل':'غير مسجلة'}</StatusBadge>},
        {key:'createdAt',label:'التاريخ',render:row=>fmtDate(row.createdAt)},
      ]}/>
    </Panel>
    {selected&&<Modal title={actions[selected.action]||selected.action} onClose={()=>setSelected(null)}>
      <p>المشرف: {selected.performedByName||selected.performedByUid||'غير مسجل'} · {fmtDate(selected.createdAt)}</p>
      <p>السبب: {selected.reason||'غير مسجل'}</p><div className="details-grid"><section><h3>قبل القرار</h3><StateDetails value={selected.before}/></section><section><h3>بعد القرار</h3><StateDetails value={selected.after}/></section></div>
      <p>معرف العملية: {selected.operationId||'غير مسجل في السجل القديم'}</p>
    </Modal>}
  </>;
}
