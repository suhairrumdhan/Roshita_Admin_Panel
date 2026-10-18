import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({call: vi.fn(), auth: {currentUser: {uid: 'admin-a'}}}));
vi.mock('firebase/functions', () => ({httpsCallable: (_functions, name) => (...args) => mocks.call(name, ...args)}));
vi.mock('./firebase', () => ({auth: mocks.auth, functions: {}}));

import {adminList, queueBroadcast, setPharmacyVisibility, stableAdminCommand} from './services/adminApi';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.auth.currentUser = {uid: 'admin-a'};
});

describe('admin API security and retry behavior', () => {
  it('blocks listing when there is no authenticated user', async () => {
    mocks.auth.currentUser = null;
    await expect(adminList('orders')).rejects.toThrow('سجّل الدخول أولًا.');
    expect(mocks.call).not.toHaveBeenCalled();
  });

  it('rejects unknown list names before making a callable request', async () => {
    await expect(adminList('secretCollection')).rejects.toThrow('القائمة غير معروفة.');
    expect(mocks.call).not.toHaveBeenCalled();
  });

  it('detects a user switch while a list request is in flight', async () => {
    mocks.call.mockImplementationOnce(async () => {
      mocks.auth.currentUser = {uid: 'admin-b'};
      return {data: {rows: [{id: 'private'}]}};
    });
    await expect(adminList('orders')).rejects.toThrow('تغيرت جلسة الحساب.');
  });

  it('reuses the same operationId after an uncertain server response', async () => {
    mocks.call.mockRejectedValueOnce(Object.assign(new Error('timeout'), {code: 'functions/unavailable'}));
    await expect(stableAdminCommand('adminVisibilityCommand', 'pharmacy-1', {hidden: true})).rejects.toThrow('timeout');
    mocks.call.mockResolvedValueOnce({data: {ok: true}});
    await stableAdminCommand('adminVisibilityCommand', 'pharmacy-1', {hidden: true});
    const firstId = mocks.call.mock.calls[0][1].operationId;
    expect(mocks.call.mock.calls[1][1].operationId).toBe(firstId);
    expect(localStorage.length).toBe(0);
  });

  it('does not reuse an uncertain operationId for changed command data', async () => {
    mocks.call.mockRejectedValueOnce(Object.assign(new Error('timeout'), {code: 'functions/unavailable'}));
    await expect(stableAdminCommand('adminVisibilityCommand', 'pharmacy-1', {hidden: true})).rejects.toThrow();
    mocks.call.mockResolvedValueOnce({data: {ok: true}});
    await stableAdminCommand('adminVisibilityCommand', 'pharmacy-1', {hidden: false});
    expect(mocks.call.mock.calls[1][1].operationId).not.toBe(mocks.call.mock.calls[0][1].operationId);
  });

  it('sends the reviewed revision and trimmed reason for visibility changes', async () => {
    mocks.call.mockResolvedValueOnce({data: {ok: true}});
    await setPharmacyVisibility({id: 'p-1', isBlocked: false, visibilityRevision: 4}, true, '  مراجعة  ');
    expect(mocks.call).toHaveBeenCalledWith('adminVisibilityCommand', expect.objectContaining({
      pharmacyId: 'p-1', hidden: true, expectedHidden: false, expectedRevision: 4, reason: 'مراجعة',
    }));
  });

  it('trims broadcast content before queueing', async () => {
    mocks.call.mockResolvedValueOnce({data: {ok: true}});
    await queueBroadcast({title: ' تنبيه ', body: ' نص ', targetType: 'all'});
    expect(mocks.call).toHaveBeenCalledWith('adminBroadcastCommand', expect.objectContaining({
      action: 'create', title: 'تنبيه', body: 'نص', targetType: 'all',
    }));
  });
});
