import React,{useRef,useState} from 'react';
import {useAuth} from '../auth';
import {fmtDate} from '../config';
import {queueBroadcast,retryBroadcast} from '../services/adminApi';
import {useAdminList} from '../useAdminList';
import {ListFilters,AdminListTable} from '../components/AdminList';
import {Modal,PageHeader,Panel,StatusBadge} from '../components';

const labels={queued:'بانتظار الإرسال',processing:'جاري الإرسال',sent:'نجح التسليم',partial:'تعذر جزئي',failed:'تعذر التسليم'};
export function NotificationsPage(){
  const {can}=useAuth();
  const list=useAdminList('notifications');
  const [form,setForm]=useState({title:'',body:'',targetType:'users'});
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [confirmation,setConfirmation]=useState(null);
  const submitting=useRef(false);
  async function submit(){
    if(submitting.current||!can('notifications.send'))return;
    submitting.current=true;setBusy(true);setMessage('');
    try{
      if(confirmation?.id) await retryBroadcast(confirmation.id); else {await queueBroadcast(form);setForm({title:'',body:'',targetType:'users'});}
      setConfirmation(null);setMessage('تم تثبيت الأمر. حدّث سجل النتائج لمتابعة التسليم.');list.reload();
    }catch(failure){setMessage(failure.message)}finally{submitting.current=false;setBusy(false)}
  }
  return <><PageHeader title="الإشعارات الإدارية" description="إرسال الرسائل ومتابعة سجلها بحسب الفئة والحالة والفترة."/>
    <Panel title="إشعار جديد"><form className="stack-form" onSubmit={event=>{event.preventDefault();setMessage('');setConfirmation({title:form.title,targetType:form.targetType})}}>
      <label className="field">الفئة المستهدفة<select disabled={busy} value={form.targetType} onChange={event=>setForm({...form,targetType:event.target.value})}><option value="users">المستخدمون</option><option value="pharmacies">الصيدليات</option><option value="all">الجميع</option></select></label>
      <label className="field">العنوان<input disabled={busy} required maxLength={80} value={form.title} onChange={event=>setForm({...form,title:event.target.value})}/></label>
      <label className="field">النص<textarea disabled={busy} required maxLength={500} rows={4} value={form.body} onChange={event=>setForm({...form,body:event.target.value})}/></label>
      {message&&<p className="notice" role="status">{message}</p>}
      <button className="primary" disabled={busy||!form.title.trim()||!form.body.trim()||!can('notifications.send')}>{busy?'جاري الحفظ…':'إضافة إلى قائمة الإرسال'}</button>
    </form></Panel>
    <Panel title="سجل الإشعارات" actions={<ListFilters list={list} placeholder="بداية عنوان الإشعار" states={Object.entries(labels)}>
      <select aria-label="الفئة" value={list.filters.group} onChange={event=>list.setFilter('group',event.target.value)}><option value="">كل الفئات</option><option value="users">المستخدمون</option><option value="pharmacies">الصيدليات</option><option value="all">الجميع</option></select>
      <button className="secondary" disabled={list.loading} onClick={list.reload}>تحديث</button>
    </ListFilters>}>
      <AdminListTable list={list} columns={[
        {key:'title',label:'العنوان'},
        {key:'targetType',label:'الفئة',render:row=>({users:'المستخدمون',pharmacies:'الصيدليات',all:'الجميع'}[row.targetType]||'فئة قديمة')},
        {key:'status',label:'الحالة',render:row=><StatusBadge>{labels[row.status]||'غير معروفة'}</StatusBadge>},
        {key:'total',label:'المستلمون',render:row=>row.schemaVersion===2?row.total:'سجل قديم'},
        {key:'succeeded',label:'نجح',render:row=>row.schemaVersion===2?row.succeeded:'غير مسجل'},
        {key:'failed',label:'تعذر',render:row=>row.schemaVersion===2?row.failed:'غير مسجل'},
        {key:'pending',label:'بانتظار المعالجة',render:row=>row.schemaVersion===2?row.pending:'غير مسجل'},
        {key:'retry',label:'المتابعة',render:row=>row.schemaVersion===2&&['partial','failed'].includes(row.status)&&<button className="secondary" disabled={busy||!can('notifications.send')} onClick={()=>{setMessage('');setConfirmation(row)}}>إعادة المتعثرين</button>},
        {key:'date',label:'التاريخ',render:row=>fmtDate(row.createdAt)},
      ]}/>
    </Panel>
    {confirmation&&<Modal title={confirmation.id?'تأكيد إعادة المتعثرين':'تأكيد الإشعار'} onClose={()=>{if(!busy)setConfirmation(null)}} footer={<><button className="secondary" disabled={busy} onClick={()=>setConfirmation(null)}>إلغاء</button><button className="primary" disabled={busy} onClick={submit}>{busy?'جاري الحفظ…':'تأكيد'}</button></>}><p>{confirmation.title}</p><p>الفئة: {{users:'المستخدمون',pharmacies:'الصيدليات',all:'الجميع'}[confirmation.targetType]}</p>{!confirmation.id&&<p>{form.body}</p>}{message&&<p className="form-error">{message}</p>}</Modal>}
  </>;
}
