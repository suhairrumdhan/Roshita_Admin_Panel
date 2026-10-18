import React from 'react';
import '../adminLists.css';
import {DataTable, ErrorState, Loading, SearchBox} from '../components';

export function ListFilters({list, placeholder = 'بداية الاسم أو الرقم', states = [], children}) {
  return <div className="filters admin-list-filters">
    <SearchBox value={list.filters.q} onChange={value => list.setFilter('q', value)} placeholder={placeholder}/>
    {states.length > 0 && <select aria-label="الحالة" value={list.filters.state} onChange={event => list.setFilter('state', event.target.value)}>
      <option value="all">كل الحالات</option>{states.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>}
    <label>من <input aria-label="بداية الفترة بتوقيت ليبيا" type="date" value={list.filters.from} onChange={event => list.setFilter('from', event.target.value)}/></label>
    <label>إلى <input aria-label="نهاية الفترة بتوقيت ليبيا" type="date" value={list.filters.to} onChange={event => list.setFilter('to', event.target.value)}/></label>
    {children}
  </div>;
}

export function AdminListTable({list, columns, onRowClick}) {
  if (list.error) return <ErrorState error={list.error} retry={list.reload}/>;
  return <>
    {list.loading ? <Loading/> : <DataTable rows={list.data.rows} columns={columns} onRowClick={onRowClick}/>}
    <div className="request-pagination">
      <span aria-live="polite">{list.loading ? 'جاري تحديث النتائج…' : `الإجمالي المطابق: ${list.data.total} · الصفحة ${list.index + 1} · المعروض ${list.data.rows.length}`}</span>
      <div className="actions"><button className="secondary" disabled={list.loading || list.index === 0} onClick={list.previous}>السابق</button>
        <button className="secondary" disabled={list.loading || !list.data.hasMore} onClick={list.next}>التالي</button></div>
    </div>
  </>;
}
