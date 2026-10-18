import React, {useEffect, useRef, useState} from 'react';
import {getBlob, ref} from 'firebase/storage';
import {auth, storage, firebaseConfig} from '../firebase';
import {Modal} from '../components';

function documentPath(record, kind) {
  const path = record[`${kind}FilePath`];
  if (typeof path === 'string' && path && !path.includes('..')) return path;
  try {
    const url = new URL(record[`${kind}FileUrl`]);
    const prefix = `/v0/b/${firebaseConfig.storageBucket}/o/`;
    if (url.protocol === 'https:' && url.hostname === 'firebasestorage.googleapis.com' && url.pathname.startsWith(prefix)) {
      return decodeURIComponent(url.pathname.slice(prefix.length));
    }
  } catch { /* Invalid legacy references are shown as unavailable. */ }
  return null;
}

export function RegistrationDocuments({record}) {
  const [viewer, setViewer] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const active = useRef(true);
  const objectUrl = useRef(null);
  const request = useRef(0);
  function close() {
    ++request.current;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    setViewer(null);
    setBusy('');
  }
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      ++request.current;
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);
  async function open(kind, title) {
    const sequence = ++request.current;
    const uid = auth.currentUser?.uid;
    if (!uid || busy) return;
    setBusy(kind); setError('');
    try {
      const blob = await getBlob(ref(storage, documentPath(record, kind)), 10 * 1024 * 1024);
      if (!active.current || sequence !== request.current || auth.currentUser?.uid !== uid) return;
      if (!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(blob.type)) throw new Error('صيغة المستند غير مدعومة للعرض.');
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(blob);
      setViewer({title, url: objectUrl.current, type: blob.type});
    } catch (failure) { if (active.current && sequence === request.current) setError(failure.message); }
    finally { if (active.current && sequence === request.current) setBusy(''); }
  }
  return <>
    <div className="documents registration-documents">{[['license', 'ترخيص الصيدلية'], ['ownerId', 'هوية المالك']].map(([kind, title]) =>
      <article className={`document-card ${documentPath(record, kind) ? '' : 'missing'}`} key={kind}>
        <div><b>{title}</b><small>{documentPath(record, kind) ? 'مستند مرفق بالطلب' : 'مرجع المستند غير متاح'}</small></div>
        {documentPath(record, kind) && <button className="secondary" disabled={!!busy} onClick={() => open(kind, title)}>{busy === kind ? 'جاري التحميل…' : 'عرض'}</button>}
      </article>)}</div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {viewer && <Modal title={viewer.title} onClose={close} footer={<button className="secondary" onClick={close}>إغلاق المستند</button>}>
      {viewer.type === 'application/pdf' ? <iframe className="registration-document-preview" src={viewer.url} title={viewer.title}/> :
        <img className="registration-document-preview" src={viewer.url} alt={viewer.title}/>}
    </Modal>}
  </>;
}
