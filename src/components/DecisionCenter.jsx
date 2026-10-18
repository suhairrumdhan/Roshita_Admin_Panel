import React from 'react';
import {Link} from 'react-router-dom';
import {AlertTriangle,ArrowLeft,CheckCircle2,ShieldAlert} from 'lucide-react';

const priority={critical:{label:'عاجل',icon:ShieldAlert},high:{label:'أولوية عالية',icon:AlertTriangle},medium:{label:'متابعة',icon:CheckCircle2}};

export function DecisionCenter({rows=[],summary={},limit}){
  const visible=typeof limit==='number'?rows.slice(0,limit):rows;
  return <section className="decision-center" aria-labelledby="decision-center-title"><header>
    <div><h2 id="decision-center-title">مركز القرارات اليومية</h2><p>اقتراحات مبنية على مؤشرات التشغيل. راجع الدليل قبل تنفيذ أي قرار.</p></div>
    <div className="decision-summary"><span className="critical">{summary.critical||0} عاجل</span><span className="high">{summary.high||0} مرتفع</span><span>{summary.medium||0} متابعة</span></div>
  </header>{!visible.length?<div className="decision-empty"><CheckCircle2/><div><b>لا توجد قرارات تشغيلية ملحّة الآن</b><small>ستظهر هنا الحالات التي تتجاوز حدود المتابعة.</small></div></div>:<div className="decision-grid">{visible.map(row=>{const meta=priority[row.priority]||priority.medium;const Icon=meta.icon;return <article className={`decision-card ${row.priority}`} key={row.id}>
    <div className="decision-card-head"><span className="decision-icon"><Icon/></span><span className="decision-priority">{meta.label}</span></div><h3>{row.title}</h3><b className="decision-entity">{row.entity}</b><p>{row.reason}</p>
    <div className="decision-advice"><small>الإجراء المقترح</small><span>{row.recommendation}</span></div><Link to={row.href}>{row.actionLabel}<ArrowLeft/></Link>
  </article>})}</div>}</section>;
}
