const assert=require('assert');global.window={};require('./sample.js');const {analyze}=require('./checker.js');
const s=analyze(window.TB_SAMPLE);console.log('sample:',JSON.stringify({score:s.score,calls:s.toolCalls,share:s.wastedShare.toFixed(2),off:s.offenders.map(o=>o.type+':'+o.count)}));
assert(s.score>=40);assert(s.offenders.some(o=>o.type==='repeat-read'&&o.target==='src/utils/date.ts'&&o.count===5));
assert(s.offenders.some(o=>o.type==='repeat-fail'&&o.count===5));assert(s.offenders.some(o=>o.type==='ping-pong'));
const clean=['⏺ Read(a.ts)','⏺ Edit(a.ts)','⏺ Bash(npm test)','  ⎿  PASS','⏺ Read(b.ts)'].join('\n');
const c=analyze(clean);assert.strictEqual(c.score,0);assert.strictEqual(c.offenders.length,0);console.log('clean: score',c.score);
const L=[];const tu=(id,name,input)=>L.push(JSON.stringify({type:'assistant',message:{content:[{type:'tool_use',id,name,input}]}}));
const tr=(id,t,e)=>L.push(JSON.stringify({type:'user',message:{content:[{type:'tool_result',tool_use_id:id,content:t,is_error:e}]}}));
for(let i=0;i<3;i++){tu('r'+i,'Read',{file_path:'/x/a.py'});tr('r'+i,'x'.repeat(400));tu('b'+i,'Bash',{command:'pytest'});tr('b'+i,'FAILED',true);}
tu('e1','Edit',{file_path:'/x/a.py',old_string:'foo',new_string:'bar'});tu('e2','Edit',{file_path:'/x/a.py',old_string:'bar',new_string:'foo'});
const j=analyze(L.join('\n'));console.log('jsonl:',j.offenders.map(o=>o.type+':'+o.count).join(', '));
['repeat-read','repeat-fail','ping-pong','edit-revert'].forEach(t=>assert(j.offenders.some(o=>o.type===t),t));
assert.strictEqual(analyze(L.slice(0,4).join('\n')).score,0);console.log('ALL TESTS PASSED');
