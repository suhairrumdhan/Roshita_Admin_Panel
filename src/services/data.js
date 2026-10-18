import {stableAdminCommand} from './adminApi';
export async function processPharmacyRequest({request,decision,reason}){
  if(!request?.id)throw new Error('طلب التسجيل غير صالح.');
  return stableAdminCommand('registrationCommand',request.id,{
    action:'decision',requestId:request.id,decision,reason:reason.trim(),expectedRevision:request.revision??0,
  });
}
