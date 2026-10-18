import React,{useState} from 'react';
import {first, fmtDate} from '../config';
import {useAdminList} from '../useAdminList';
import {ListFilters, AdminListTable} from '../components/AdminList';
import {Modal,PageHeader, Panel, StatusBadge} from '../components';

export function UsersPage() {
  const list = useAdminList('users');
  const [selected,setSelected]=useState(null);
  return <><PageHeader title="المستخدمون" description="بيانات الحساب والنشاط اللازمة للمتابعة."/>
    <Panel title="حسابات المستخدمين" actions={<ListFilters list={list} placeholder="بداية الاسم أو البريد أو الهاتف" states={[["active", "نشط"], ["disabled", "غير نشط"]]}/>}>
      <AdminListTable list={list} onRowClick={setSelected} columns={[
        {key: 'name', label: 'المستخدم', render: row => first(row, ['fullName', 'name'])},
        {key: 'contact', label: 'التواصل', render: row => first(row, ['phoneNumber', 'phone', 'email'])},
        {key: 'status', label: 'الحساب', render: row => <StatusBadge>{row.accountStatus === 'active' ? 'نشط' : 'غير نشط'}</StatusBadge>},
        {key: 'totalOrders', label: 'الطلبات'},
        {key: 'last', label: 'آخر نشاط', render: row => fmtDate(row.lastActivityAt)},
        {key: 'created', label: 'تاريخ التسجيل', render: row => fmtDate(row.createdAt)},
      ]}/>
    </Panel>{selected&&<Modal title={first(selected,['fullName','name'])} onClose={()=>setSelected(null)}><div className="details-grid">{[['البريد',selected.email],['الهاتف',selected.phoneNumber||selected.phone],['حالة الحساب',selected.accountStatus==='active'?'نشط':'غير نشط'],['الطلبات المسجلة',selected.totalOrders??'غير مسجل'],['تاريخ التسجيل',fmtDate(selected.createdAt)],['آخر نشاط مسجل',fmtDate(selected.lastActivityAt)]].map(([label,value])=><div className="detail" key={label}><small>{label}</small><b>{value||'—'}</b></div>)}</div></Modal>}</>;
}
