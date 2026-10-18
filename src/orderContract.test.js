import{describe,expect,it,vi}from'vitest';
import{
  COLLECTIONS,
  isPharmacyDelayed,
  isUserDelayed,
  orderStatusKey,
  orderStatusLabel,
}from'./config';

describe('F03 admin order summary contract',()=>{
  it('reads the privacy-safe summary collection',()=>{
    expect(COLLECTIONS.orders).toBe('adminOrderSummaries');
  });

  it('maps only explicit legacy aliases and keeps unknown visible',()=>{
    expect(orderStatusKey('pending')).toBe('received');
    expect(orderStatusKey('partiallyConfirmed')).toBe('partialOfferPending');
    expect(orderStatusKey('mystery')).toBe('unknown');
    expect(orderStatusLabel('mystery')).toBe('حالة غير معروفة');
  });

  it('separates pharmacy delay from user delay',()=>{
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
    expect(isPharmacyDelayed({
      status:'underReview',pharmacyDelayAt:'2026-01-16T09:00:00Z',
    })).toBe(true);
    expect(isUserDelayed({
      status:'partialOfferPending',userDecisionDeadline:'2026-01-16T09:00:00Z',
    })).toBe(false);
    expect(isUserDelayed({status:'ready',pickupDeadline:'2026-01-16T12:00:00Z'})).toBe(true);
    expect(isUserDelayed({status:'completed',userDelay:{occurred:true,active:false}})).toBe(true);
    expect(isPharmacyDelayed({
      status:'partialOfferPending',pharmacyDelayAt:'2026-01-16T09:00:00Z',
    })).toBe(false);
    vi.useRealTimers();
  });
});
