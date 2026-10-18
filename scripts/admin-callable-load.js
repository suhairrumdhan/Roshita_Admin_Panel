// Operator-run k6 script against the existing system; creates no environment.
import http from 'k6/http';
import {Rate} from 'k6/metrics';
import {sleep} from 'k6';
const failures = new Rate('unexpected_errors');
const payload = JSON.parse(open(__ENV.ADMIN_PAYLOAD_FILE));
if(!__ENV.ADMIN_CALLABLE_URL||!__ENV.ADMIN_ID_TOKEN)throw new Error('Set ADMIN_CALLABLE_URL, ADMIN_ID_TOKEN and ADMIN_PAYLOAD_FILE.');
export const options = {
  stages: [{duration:'30s',target:10},{duration:'60s',target:10},{duration:'30s',target:25},{duration:'180s',target:25}],
  thresholds:{http_req_duration:['p(95)<=3000'],unexpected_errors:['rate<=0.01']},
  discardResponseBodies:false,
};
export default function(){
  const response=http.post(__ENV.ADMIN_CALLABLE_URL,JSON.stringify({data:payload}),{
    headers:{'Content-Type':'application/json',Authorization:'Bearer '+__ENV.ADMIN_ID_TOKEN},
    tags:{command:__ENV.ADMIN_COMMAND_NAME||'adminList'},
  });
  let unexpected=response.status!==200;
  try{const body=response.json();unexpected=unexpected||!!body.error||(!('result'in body)&&!('data'in body));}catch{unexpected=true;}
  failures.add(unexpected);
  sleep(1);
}
