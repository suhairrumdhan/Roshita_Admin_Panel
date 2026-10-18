import React,{useEffect,useState} from 'react';
import {RefreshCw,CheckCircle2,XCircle,FileWarning,MapPin,ExternalLink,History,FolderOpen} from 'lucide-react';
import './RequestsPage.css';
import {collection,doc,onSnapshot,orderBy,query} from 'firebase/firestore';
import {db} from '../firebase';
import {useAuth} from '../auth';
import {COLLECTIONS,fmtDate} from '../config';
import {processPharmacyRequest} from '../services/data';
import {useAdminList} from '../useAdminList';
import {ListFilters,AdminListTable} from '../components/AdminList';
import {RegistrationDocuments} from '../components/RegistrationDocuments';
import {Modal,PageHeader,Panel,StatusBadge} from '../components';

export const requestStatus=s=>({submitted:'pending',new:'pending',under_review:'pending',reviewing:'pending',needs_info:'requires_changes',accepted:'approved',declined:'rejected'}[s]||s);
const label=s=>({draft:'مسودة',pending:'قيد المراجعة',requires_changes:'يحتاج استكمال',approved:'معتمد',rejected:'مرفوض'}[requestStatus(s)]||'حالة غير معروفة');
const Documents=RegistrationDocuments;
export function RequestsPage(){
  const {admin,can}=useAuth();
  const list=useAdminList('requests');
  const [selected,setSelected]=useState(null),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[decisionError,setDecisionError]=useState(''),[confirmation,setConfirmation]=useState(null);
  const [history,setHistory]=useState([]),[versions,setVersions]=useState([]),[detailError,setDetailError]=useState(''),[latest,setLatest]=useState(null);
  useEffect(()=>{
    if(!selected)return;
    setHistory([]);setVersions([]);setLatest(null);setDetailError('');
    const root=doc(db,COLLECTIONS.requests,selected.id);
    const fail=e=>setDetailError(e.message);
    const stops=[onSnapshot(root,s=>setLatest(s.exists()?{...s.data(),id:s.id}:null),fail),
      onSnapshot(query(collection(root,'history'),orderBy('createdAt','desc')),s=>setHistory(s.docs.map(d=>({...d.data(),id:d.id}))),fail),
      onSnapshot(query(collection(root,'versions'),orderBy('version','desc')),s=>setVersions(s.docs.map(d=>({...d.data(),id:d.id}))),fail)];
    return()=>stops.forEach(stop=>stop());
  },[selected?.id]);
  const stale=!!selected&&!!latest&&(latest.revision??0)!==(selected.revision??0);
  const actionable=selected&&latest&&!stale&&!detailError&&requestStatus(selected.status)==='pending';
  async function decide(decision){
    if(busy||!actionable||((decision==='reject'||decision==='changes')&&!reason.trim()))return;
    setBusy(true);setDecisionError('');
    try {await processPharmacyRequest({request:selected,decision,reason,admin});setConfirmation(null);setSelected(null);setReason('');list.reload()}
    catch(e){setDecisionError(e.code==='functions/aborted'?'تغيرت نسخة الطلب. حمّل النسخة الحالية وراجعها قبل القرار.':e.message)}
    finally{setBusy(false)}
  }
  return <><PageHeader title="طلبات تسجيل الصيدليات" description="مراجعة النسخة المقدمة، توثيق سبب القرار، ومتابعة إعادة الإرسال." actions={<button className="secondary" onClick={list.reload} disabled={list.loading}><RefreshCw/>تحديث</button>}/>
    <Panel title="طلبات التسجيل" actions={<ListFilters list={list} placeholder="بداية اسم الصيدلية أو المالك أو الترخيص" states={['draft','pending','requires_changes','approved','rejected'].map(s=>[s,label(s)])}/>}>
      <AdminListTable list={list} onRowClick={r=>{setSelected(r);setReason('');setDecisionError('');setConfirmation(null)}} columns={[
        {key:'pharmacyName',label:'الصيدلية',render:r=>r.pharmacyName||r.draft?.pharmacyName||'مسودة'},
        {key:'ownerName',label:'المالك'},{key:'licenseNumber',label:'رقم الترخيص'},
        {key:'version',label:'النسخة',render:r=>r.version??1},
        {key:'date',label:'تاريخ التقديم',render:r=>fmtDate(r.requestDate||r.createdAt)},
        {key:'status',label:'الحالة',render:r=><StatusBadge>{label(r.status)}</StatusBadge>} ]}/>
    </Panel>
    {selected&&<Modal title={`مراجعة طلب — النسخة ${selected.version??1}`} onClose={()=>{if(!busy)setSelected(null)}} footer={<>
      <button className="secondary" onClick={()=>setSelected(null)} disabled={busy}>إغلاق</button>
      {can('requests.reject')&&<button className="danger-btn" disabled={busy||!actionable||!reason.trim()} onClick={()=>setConfirmation('reject')}><XCircle/>رفض</button>}
      {can('requests.review')&&<button className="warning-btn" disabled={busy||!actionable||!reason.trim()} onClick={()=>setConfirmation('changes')}><FileWarning/>طلب استكمال</button>}
      {can('requests.approve')&&<button className="primary" disabled={busy||!actionable} onClick={()=>setConfirmation('approve')}><CheckCircle2/>اعتماد</button>}
    </>}>
      {(decisionError||detailError)&&<p className="form-error" role="alert">{decisionError||detailError}</p>}
      {stale&&<p className="notice request-update" role="alert"><span>وصل تحديث جديد على الطلب.</span> <button className="secondary" onClick={()=>{setSelected(latest);setReason('');setDecisionError('')}} disabled={busy}>عرض النسخة الحالية</button></p>}
      <div className="request-summary"><div><small>طلب تسجيل الصيدلية</small><h3>{selected.pharmacyName||selected.draft?.pharmacyName||'مسودة طلب'}</h3></div><StatusBadge>{label(selected.status)}</StatusBadge></div>
      <div className="details-grid">{[['pharmacyName','اسم الصيدلية'],['ownerName','المالك'],['email','البريد'],['phoneNumber','الهاتف'],['licenseNumber','الترخيص'],['ownerIdNumber','هوية المالك']].map(([key,title])=><div className="detail" key={key}><small>{title}</small><b>{selected[key]||'—'}</b></div>)}</div>
      <h3 className="section-title request-section-title"><MapPin/>موقع الصيدلية</h3><div className="location-box request-location"><MapPin/><div><b>{selected.location?.address||'لم يُحدد العنوان'}</b><small>{Number.isFinite(selected.location?.latitude)&&Number.isFinite(selected.location?.longitude)?`${selected.location.latitude}, ${selected.location.longitude}`:'لا توجد إحداثيات'}</small></div>{Number.isFinite(selected.location?.latitude)&&Number.isFinite(selected.location?.longitude)&&<a className="secondary" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${selected.location.latitude},${selected.location.longitude}`}><ExternalLink/>عرض الموقع</a>}</div>
      <h3 className="section-title request-section-title"><FolderOpen/>المستندات</h3><Documents record={selected}/>{selected.decisionReason&&<div className="request-decision"><b>ملاحظات القرار السابق</b><p>{selected.decisionReason}</p></div>}
      <label className="field request-reason">سبب الرفض أو ملاحظات الاستكمال<textarea rows={4} value={reason} maxLength={500} disabled={busy||!actionable} onChange={e=>setReason(e.target.value)} placeholder="اكتب الملاحظات التي سيقرأها صاحب الصيدلية…"/><small>إلزامي للرفض والاستكمال · {reason.length}/500 حرف</small></label>
      <h3 className="section-title request-section-title"><History/>سجل القرارات والمتابعة</h3><div className="request-history">{!history.length&&<p className="request-empty">لا توجد أحداث مسجلة حتى الآن.</p>}{history.map(event=><article key={event.id}><span className="request-event-icon"><History/></span><div><div className="request-event-heading"><StatusBadge>{label(event.status)}</StatusBadge><small>النسخة {event.version}</small></div>{event.reason&&<p>{event.reason}</p>}<small>{event.actorName} · {fmtDate(event.createdAt)}</small></div></article>)}</div>
      <h3 className="section-title request-section-title"><FolderOpen/>النسخ المقدمة</h3>{!versions.length&&<p className="request-empty">لا توجد نسخ مؤرشفة لهذا الطلب بعد.</p>}{versions.map(version=><details className="request-version" key={version.id}><summary><span>النسخة {version.version}</span><small>{fmtDate(version.submittedAt)}</small></summary><div className="request-version-body"><div className="details-grid"><div className="detail"><small>الصيدلية</small><b>{version.pharmacyName}</b></div><div className="detail"><small>المالك</small><b>{version.ownerName}</b></div><div className="detail"><small>رقم الترخيص</small><b>{version.licenseNumber}</b></div><div className="detail"><small>العنوان</small><b>{version.location?.address||'—'}</b></div></div><Documents record={version}/></div></details>)}
    </Modal>}
    {selected&&confirmation&&<Modal title="تأكيد قرار التسجيل" onClose={()=>{if(!busy)setConfirmation(null)}} footer={<>
      <button className="secondary" disabled={busy} onClick={()=>setConfirmation(null)}>إلغاء</button>
      <button className="primary" disabled={busy||!actionable} onClick={()=>decide(confirmation)}>{busy?'جاري تثبيت القرار…':'تأكيد القرار'}</button>
    </>}><p>الصيدلية: <b>{selected.pharmacyName}</b> · النسخة {selected.version??1}</p>
      <p>القرار: <b>{{approve:'اعتماد',reject:'رفض',changes:'طلب استكمال'}[confirmation]}</b></p>
      <p>السبب: {reason.trim()||'اعتماد الطلب بعد المراجعة'}</p>
      {stale&&<p className="form-error">تغيرت النسخة. أغلق التأكيد وراجع النسخة الحالية.</p>}
      {decisionError&&<p className="form-error" role="alert">{decisionError}</p>}
    </Modal>}
  </>;
}
