import React from 'react';
import {fmtDate} from '../config';
import {StatusBadge} from '../components';

export const duration = value => typeof value === 'number' && Number.isFinite(value) ? `${(Math.max(0,value)/3600000).toLocaleString('ar-LY',{maximumFractionDigits:2})} ساعة` : 'مدة غير مسجلة';
export function DelayDetails({order}) {
  return <div className="details-grid">{[['pharmacyDelay','تأخر الصيدلية'],['userDelay','تأخر الاستلام']].map(([key,label])=>{
    const delay=order[key];
    return <section key={key}><h3>{label}</h3><StatusBadge tone={delay?.active?'danger':'info'}>{!delay?.occurred?'لا تأخر مسجل':delay.active?'نشط':'انتهى السبب'}</StatusBadge>
      {delay?.occurred&&<><p>بداية التجاوز: {fmtDate(delay.startedAt)}</p><p>مدة التجاوز: {duration(delay.overdueMs)}</p><p>انتهاء السبب: {delay.active?'لم ينتهِ':fmtDate(delay.resolvedAt)}</p></>}
      {key==='pharmacyDelay'&&<p>المعالجة الفعلية: {duration(delay?.processingMs)}</p>}
    </section>;
  })}</div>;
}
