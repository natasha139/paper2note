import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest, activeModels } from '../functions/api/polish.js';
const call = (body, env = {QWEN_API_KEY:'test-secret'}, origin='https://paper2note.pages.dev') => onRequest({request:new Request('https://paper2note.pages.dev/api/polish',{method:'POST',headers:{Origin:origin},body:JSON.stringify(body)}),env});
test('rejects unconfigured, invalid and cross-origin requests',async()=>{
 assert.equal((await call({paperTitle:'test'},{})).status,503);
 assert.equal((await call({})).status,400);
 assert.equal((await call({paperTitle:'test'},undefined,'https://other.test')).status,403);
 assert.equal((await call({paperTitle:'test',methods:[4]})).status,400);
 assert.equal((await call({paperTitle:'x'.repeat(50000)})).status,413);
});
test('returns only validated output and keeps credentials on the server',async()=>{
 const original=globalThis.fetch;let sent;
 const output={catchyTitle:'学习如何读论文',oneSentenceValue:'理解研究方法',takeaways:['一','二','三'],tags:['论文','学习','科研'],authors:'invented'};
 try {
 globalThis.fetch=async(url,opts)=>{sent={url,opts};return Response.json({status:'completed',output_text:JSON.stringify(output)});};
 const response=await call({paperTitle:'A study',methods:['review']});const data=await response.json();assert.equal(response.status,200);assert.equal(data.authors,undefined);assert.equal(sent.opts.headers.Authorization,'Bearer test-secret');assert.match(sent.opts.body,/review/);assert.equal(JSON.stringify(data).includes('test-secret'),false);
 }finally{globalThis.fetch=original;}
});
test('provider failures and incomplete outputs fail visibly',async()=>{
 const original=globalThis.fetch;
 try {
 globalThis.fetch=async()=>new Response('private provider error',{status:401});let r=await call({paperTitle:'test'});assert.equal(r.status,502);assert.equal((await r.text()).includes('private'),false);
 globalThis.fetch=async()=>Response.json({choices:[{finish_reason:'length',message:{content:'{}'}}]});assert.equal((await call({paperTitle:'test'})).status,502);
 globalThis.fetch=async()=>Response.json({choices:[{finish_reason:'stop',message:{content:'{}'}}]});assert.equal((await call({paperTitle:'test'})).status,502);
 }finally{globalThis.fetch=original;}
});

test('free models follow expiry dates and skip expired quotas',()=>{
 assert.deepEqual(activeModels(Date.parse('2026-10-10')).map(m=>m.id), ['deepseek-v4-flash-0731','deepseek-v4-pro-0813','qwen3.8-27b','kimi-k3','glm-5.3','qwen3.8-flash','qwen3.8-max-0902','deepseek-v4.1-flash']);
 assert.equal(activeModels(Date.parse('2026-11-01T00:00:00+08:00'))[0].id,'deepseek-v4-pro-0813');
 assert.equal(activeModels(Date.parse('2026-12-14')).length,0);
});
test('unavailable model falls back to the next expiry-ordered model',async()=>{
 const original=globalThis.fetch;const models=[];
 try {globalThis.fetch=async(url,opts)=>{models.push(JSON.parse(opts.body).model);return models.length===1 ? new Response('',{status:403}) : Response.json({status:'completed',output_text:JSON.stringify({catchyTitle:'标题',oneSentenceValue:'价值',takeaways:['一','二','三'],tags:['一','二','三']})});};
 const r=await call({paperTitle:'test'});assert.equal(r.status,200);assert.equal((await r.json()).model,models[1]);assert.deepEqual(models,activeModels().slice(0,2).map(m=>m.id));
 }finally{globalThis.fetch=original;}
});
