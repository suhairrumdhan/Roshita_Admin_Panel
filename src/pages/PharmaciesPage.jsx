import React, {useRef, useState} from 'react';
import {useAuth} from '../auth';
import {first, fmtDate} from '../config';
import {validCoordinates} from '../adminContract';
import {setPharmacyVisibility} from '../services/adminApi';
import {useAdminList} from '../useAdminList';
import {ListFilters, AdminListTable} from '../components/AdminList';
import {Modal, PageHeader, Panel, StatusBadge} from '../components';

export function PharmaciesPage() {
  const {can} = useAuth();
  const list = useAdminList('pharmacies');
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  async function save() {
    if (submitting.current || !selected || !reason.trim()) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const result = await setPharmacyVisibility(selected, !selected.isBlocked, reason);
      setSelected(current => ({...current, isBlocked: result.isBlocked, visibilityRevision: result.visibilityRevision, visibilityReason: reason.trim()}));
      setConfirm(false); setReason(''); list.reload();
    } catch (failure) { setError(failure.message); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <>
    <PageHeader title="الصيدليات" description="متابعة الاعتماد والظهور للمستخدمين وحالة استقبال الطلبات." actions={<button className="secondary" onClick={list.reload} disabled={list.loading}>تحديث</button>}/>
    <Panel title="الصيدليات المسجلة" actions={<ListFilters list={list} placeholder="بداية الاسم أو الترخيص أو الهاتف" states={[["visible", "ظاهرة للمستخدمين"], ["hidden", "مخفية عن المستخدمين"]]}>
      <select aria-label="حالة الاستقبال" value={list.filters.group} onChange={event => list.setFilter('group', event.target.value)}><option value="">كل حالات الاستقبال</option><option value="online">الاستقبال مفعّل</option><option value="offline">الاستقبال متوقف</option></select>
    </ListFilters>}>
      <AdminListTable list={list} onRowClick={row => {setSelected(row); setReason(''); setConfirm(false); setError('');}} columns={[
        {key: 'pharmacyName', label: 'الصيدلية', render: row => first(row, ['pharmacyName', 'name'])},
        {key: 'licenseNumber', label: 'الترخيص'}, {key: 'phoneNumber', label: 'الهاتف'},
        {key: 'status', label: 'الاعتماد', render: row => <StatusBadge>{row.status === 'approved' ? 'معتمدة' : 'غير معتمدة'}</StatusBadge>},
        {key: 'isOnline', label: 'الاستقبال', render: row => row.isOnline ? 'مفعّل' : 'متوقف'},
        {key: 'isBlocked', label: 'الظهور', render: row => <StatusBadge tone={row.isBlocked ? 'warning' : 'success'}>{row.isBlocked ? 'مخفية' : 'ظاهرة'}</StatusBadge>},
        {key: 'approvedDate', label: 'تاريخ الاعتماد', render: row => fmtDate(row.approvedDate)},
      ]}/>
    </Panel>
    {selected && <Modal title={first(selected, ['pharmacyName', 'name'])} onClose={() => {if (!busy) setSelected(null);}} footer={<>
      <button className="secondary" disabled={busy} onClick={() => setSelected(null)}>إغلاق</button>
      {can('pharmacies.manage') && <button className="primary" disabled={busy || !reason.trim() || selected.status !== 'approved'} onClick={() => setConfirm(true)}>{selected.isBlocked ? 'إعادة الظهور' : 'إخفاء الصيدلية'}</button>}
    </>}>
      <div className="details-grid">{[['المالك', selected.ownerName], ['الترخيص', selected.licenseNumber], ['الهاتف', selected.phoneNumber], ['البريد', selected.email], ['الظهور', selected.isBlocked ? 'مخفية' : 'ظاهرة'], ['الاستقبال', selected.isOnline ? 'مفعّل' : 'متوقف']].map(([label, value]) => <div className="detail" key={label}><small>{label}</small><b>{value || '—'}</b></div>)}</div>
      <h3>الموقع</h3><p>{selected.location?.address || 'لا يوجد عنوان'}</p>
      {validCoordinates(selected.location?.latitude, selected.location?.longitude) && <a target="_blank" rel="noreferrer" href={'https://www.google.com/maps?q=' + selected.location.latitude + ',' + selected.location.longitude}>عرض الموقع</a>}
      {selected.visibilityReason && <p>سبب آخر قرار: {selected.visibilityReason}</p>}
      <label className="field">سبب تغيير الظهور<textarea value={reason} maxLength={500} disabled={busy} onChange={event => setReason(event.target.value)} rows={3}/><small>{reason.length}/500 حرف · السبب مطلوب</small></label>
      {error && <p className="form-error" role="alert">{error}</p>}
    </Modal>}
    {selected && confirm && <Modal title="تأكيد تغيير الظهور" onClose={() => {if (!busy) setConfirm(false);}} footer={<>
      <button className="secondary" disabled={busy} onClick={() => setConfirm(false)}>إلغاء</button><button className="primary" disabled={busy} onClick={save}>{busy ? 'جاري تثبيت القرار…' : 'تأكيد'}</button>
    </>}><p>{selected.isBlocked ? 'ستظهر الصيدلية للمستخدمين مجددًا وفق حالة استقبالها.' : 'ستختفي الصيدلية من بحث المستخدمين ولن تقبل طلبات جديدة منهم.'}</p>
      <p>يبقى اعتماد الصيدلية وحالة استقبالها وعملياتها الداخلية وطلباتها السابقة كما هي.</p><p>السبب: {reason}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
    </Modal>}
  </>;
}
