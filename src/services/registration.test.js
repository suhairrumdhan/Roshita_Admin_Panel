import {beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({call:vi.fn()}));
vi.mock('firebase/functions',()=>({httpsCallable:()=>mocks.call}));
vi.mock('../firebase',()=>({auth:{currentUser:{uid:'admin'}},functions:{}}));
import {processPharmacyRequest} from './data';
import {adminList} from './adminApi';
beforeEach(()=>{vi.clearAllMocks();localStorage.clear()});
it('the query passes all filters and the opaque cursor to the server without filtering the page',async()=>{
  const cursor={id:'last',time:42,signature:'query'};
  const response={rows:[{id:'beyond-1200'}],total:1201,hasMore:true,next:cursor};
  mocks.call.mockResolvedValue({data:response});
  expect(await adminList('requests',{q:'  اسم  ',state:'pending',from:'2026-09-01',to:'2026-09-17'},cursor)).toEqual(response);
  expect(mocks.call).toHaveBeenCalledWith({kind:'requests',q:'اسم',state:'pending',from:'2026-09-01',to:'2026-09-17',cursor});
});
it('retry after a lost response keeps operation ID and the reviewed revision without storing the reason',async()=>{
  const args={request:{id:'owner',revision:7},decision:'changes',reason:'  المستند  '};
  mocks.call.mockRejectedValueOnce(Object.assign(new Error('lost'),{code:'functions/unavailable'}));
  await expect(processPharmacyRequest(args)).rejects.toThrow('lost');
  expect(localStorage.getItem(localStorage.key(0))).not.toContain('المستند');
  mocks.call.mockResolvedValueOnce({data:{status:'requires_changes'}});
  await processPharmacyRequest(args);
  expect(mocks.call.mock.calls[0][0]).toEqual(mocks.call.mock.calls[1][0]);
  expect(mocks.call.mock.calls[0][0]).toMatchObject({expectedRevision:7,reason:'المستند'});
  expect(localStorage.length).toBe(0);
});
