import React,{useMemo,useState} from 'react';
import L from 'leaflet';
import {MapContainer,Marker,Popup,TileLayer} from 'react-leaflet';
import {adminInsights} from '../services/adminApi';
import {validCoordinates} from '../adminContract';
import {first,fmtDate,normalize} from '../config';
import {useAsync} from '../hooks';
import {ErrorState,Loading,PageHeader,Panel,SearchBox,StatCard,StatusBadge} from '../components';
const pin=t=>L.divIcon({className:'map-pin-wrap',html:'<span class="map-pin '+t+'"></span>',iconSize:[22,22],iconAnchor:[11,11]});
export function CoveragePage(){
  const state=useAsync(()=>adminInsights('coverage'),[]);
  const [q,setQ]=useState(''),[visibility,setVisibility]=useState('all'),[online,setOnline]=useState('all'),[stock,setStock]=useState('all'),[mapError,setMapError]=useState(false);
  const rows=useMemo(()=>(state.data?.rows||[]).filter(row=>validCoordinates(row.location?.latitude,row.location?.longitude)&&
    (visibility==='all'||row.isBlocked===(visibility==='hidden'))&&(online==='all'||row.isOnline===(online==='online'))&&
    (stock==='all'||row.hasAvailableStock===(stock==='available'))&&normalize([row.pharmacyName,row.name,row.location?.address].join(' ')).includes(normalize(q))),[state.data,q,visibility,online,stock]);
  if(state.loading)return <Loading/>;
  if(state.error)return <ErrorState error={state.error} retry={state.reload}/>;
  return <><PageHeader title="التغطية الجغرافية" description={'مواقع الصيدليات · آخر تحديث '+fmtDate(state.data.generatedAt)} actions={<button className="secondary" onClick={()=>{setMapError(false);state.reload()}}>تحديث</button>}/>
    <div className="stats-grid four"><StatCard title="الصيدليات" value={state.data.total}/><StatCard title="معروضة" value={rows.length}/><StatCard title="إحداثيات غير صالحة" value={state.data.invalidCoordinates}/><StatCard title="بأصناف متاحة" value={state.data.rows.filter(row=>row.hasAvailableStock).length}/></div>
    <Panel title="خريطة الصيدليات" subtitle="الظهور والاستقبال وتوفر الأصناف حالات مستقلة." actions={<div className="filters admin-list-filters">
      <SearchBox value={q} onChange={setQ} placeholder="الصيدلية أو العنوان"/>
      <select aria-label="الظهور" value={visibility} onChange={event=>setVisibility(event.target.value)}><option value="all">كل حالات الظهور</option><option value="visible">ظاهرة</option><option value="hidden">مخفية</option></select>
      <select aria-label="الاستقبال" value={online} onChange={event=>setOnline(event.target.value)}><option value="all">كل حالات الاستقبال</option><option value="online">مفعّل</option><option value="offline">متوقف</option></select>
      <select aria-label="التوفر" value={stock} onChange={event=>setStock(event.target.value)}><option value="all">كل حالات التوفر</option><option value="available">أصناف متاحة</option><option value="unavailable">لا أصناف متاحة</option></select>
    </div>}>
      {mapError&&<p className="form-error" role="alert">تعذر تحميل بعض صور الخريطة. تبقى قائمة الصيدليات متاحة أدناه؛ حدّث بعد استعادة الاتصال.</p>}
      {!rows.length&&<p className="state">لا توجد صيدليات ذات موقع صالح تطابق المرشحات.</p>}
      <div className="coverage-layout"><MapContainer center={[32.3,13.2]} zoom={6} className="coverage-map">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{tileerror:()=>setMapError(true)}}/>
        {rows.map(row=><Marker key={row.id} position={[row.location.latitude,row.location.longitude]} icon={pin(row.isBlocked?'blocked':row.isOnline?'online':'offline')}><Popup><div dir="rtl"><b>{first(row,['pharmacyName','name'])}</b><p>{row.location.address}</p><p>{row.isBlocked?'مخفية':'ظاهرة'} · الاستقبال {row.isOnline?'مفعّل':'متوقف'}</p><StatusBadge>{row.hasAvailableStock?'أصناف متاحة':'لا أصناف متاحة'}</StatusBadge></div></Popup></Marker>)}
      </MapContainer><div className="coverage-list">{rows.map(row=><article key={row.id}><span className={'dot '+(row.isBlocked?'blocked':row.isOnline?'online':'offline')}/><div><b>{first(row,['pharmacyName','name'])}</b><small>{row.location.address||'عنوان غير مسجل'}</small><small>{row.isBlocked?'مخفية':'ظاهرة'} · الاستقبال {row.isOnline?'مفعّل':'متوقف'}</small></div><StatusBadge>{row.hasAvailableStock?'أصناف متاحة':'لا أصناف متاحة'}</StatusBadge></article>)}</div></div>
    </Panel>
  </>;
}
