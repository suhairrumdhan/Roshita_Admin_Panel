import {httpsCallable} from 'firebase/functions';
import {auth, functions} from '../firebase';
import {ADMIN_LISTS, normalizeSearch} from '../adminContract';

export async function adminList(kind, filters = {}, cursor = null) {
  if (!ADMIN_LISTS.includes(kind)) throw new Error('القائمة غير معروفة.');
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('سجّل الدخول أولًا.');
  const result = await httpsCallable(functions, 'adminList')({kind, ...filters, q: normalizeSearch(filters.q), cursor});
  if (auth.currentUser?.uid !== uid) throw new Error('تغيرت جلسة الحساب.');
  return result.data;
}

export async function adminInsights(mode, filters = {}) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('سجّل الدخول أولًا.');
  const result = await httpsCallable(functions, 'adminInsights', {timeout: 120000})({mode, ...filters});
  if (auth.currentUser?.uid !== uid) throw new Error('تغيرت جلسة الحساب.');
  return result.data;
}

// Keep an uncertain command's ID and payload together across network retries.
// A different payload cannot accidentally reuse an ID already committed server-side.
export async function stableAdminCommand(name, scope, payload) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('سجّل الدخول أولًا.');
  const key = `admin-operation:${uid}:${name}:${scope}`;
  const serialized = JSON.stringify(payload);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(serialized))),byte=>byte.toString(16).padStart(2,'0')).join('');
  let saved;
  try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* Start a new operation. */ }
  const operationId = saved?.digest === digest ? saved.id : crypto.randomUUID();
  localStorage.setItem(key, JSON.stringify({id: operationId, digest}));
  try {
    const response = await httpsCallable(functions, name)({...payload, operationId});
    localStorage.removeItem(key);
    if (auth.currentUser?.uid !== uid) throw new Error('تغيرت جلسة الحساب.');
    return response.data;
  } catch (error) {
    if (!['functions/unavailable', 'functions/deadline-exceeded', 'functions/internal', 'functions/unknown'].includes(error.code)) {
      localStorage.removeItem(key);
    }
    throw error;
  }
}

export function setPharmacyVisibility(pharmacy, hidden, reason) {
  return stableAdminCommand('adminVisibilityCommand', pharmacy.id, {
    pharmacyId: pharmacy.id, hidden, expectedHidden: pharmacy.isBlocked === true,
    expectedRevision: pharmacy.visibilityRevision ?? 0, reason: reason.trim(),
  });
}

export function queueBroadcast(form) {
  return stableAdminCommand('adminBroadcastCommand','new',{action:'create',title:form.title.trim(),body:form.body.trim(),targetType:form.targetType});
}
export function retryBroadcast(broadcastId) {
  return stableAdminCommand('adminBroadcastCommand',broadcastId,{action:'retry',broadcastId});
}
