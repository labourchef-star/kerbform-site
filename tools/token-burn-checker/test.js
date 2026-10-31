const assert=require('assert');global.window={};require('./sample.js');const {analyze}=require('./checker.js');
const s=analyze(window.TB_SAMPLE);console.log('sample:',JSON.stringify({score:s.score,calls:s.toolCalls,share:s.wastedShare.toFixed(2),wasted:s.wastedTokens,off:s.offenders.map(o=>o.type+':'+o.count+':'+o.wastedTokens)}));
assert(s.score>=20&&s.score<=70,'sample score believable');assert(s.wastedShare>0.1&&s.wastedShare<0.6,'sample share believable');
assert(s.offenders.some(o=>o.type==='repeat-read'&&o.target==='src/utils/date.ts'&&o.count===3));
assert(s.offenders.some(o=>o.type==='repeat-fail'&&o.count===3));assert(s.offenders.some(o=>o.type==='ping-pong'));
// dedupe: total wasted never exceeds sum of distinct events, and <= sum of offenders
const sumOff=s.offenders.reduce((a,o)=>a+o.wastedTokens,0);assert(s.wastedTokens<sumOff,'overlap between ping-pong and repeat-read is counted once');
// one action in several loop types counts once
const dup=['⏺ Read(a.ts)','x'.repeat(400),'⏺ Read(b.ts)','y'.repeat(400),'⏺ Read(a.ts)','x'.repeat(400),'⏺ Read(b.ts)','y'.repeat(400),'⏺ Read(a.ts)','x'.repeat(400),'⏺ Read(b.ts)','y'.repeat(400)].join('\n');
const d=analyze(dup);const ds=d.offenders.reduce((a,o)=>a+o.wastedTokens,0);console.log('dup:',d.wastedTokens,'vs offenders sum',ds,'score',d.score);
assert(d.wastedTokens<ds);assert(d.wastedTokens<=d.totalTokens*0.7);assert(d.score<=95);
// re-read after an edit is not waste
const ed=analyze(['⏺ Read(a.ts)','⏺ Edit(a.ts)','⏺ Read(a.ts)','⏺ Edit(a.ts)','⏺ Read(a.ts)'].join('\n'));assert(!ed.offenders.some(o=>o.type==='repeat-read'));
const clean=['⏺ Read(a.ts)','⏺ Edit(a.ts)','⏺ Bash(npm test)','  ⎿  PASS','⏺ Read(b.ts)'].join('\n');
const c=analyze(clean);assert.strictEqual(c.score,0);assert.strictEqual(c.offenders.length,0);console.log('clean: score',c.score);
const L=[];const tu=(id,name,input)=>L.push(JSON.stringify({type:'assistant',message:{content:[{type:'tool_use',id,name,input}]}}));
const tr=(id,t,e)=>L.push(JSON.stringify({type:'user',message:{content:[{type:'tool_result',tool_use_id:id,content:t,is_error:e}]}}));
for(let i=0;i<3;i++){tu('r'+i,'Read',{file_path:'/x/a.py'});tr('r'+i,'x'.repeat(400));tu('b'+i,'Bash',{command:'pytest'});tr('b'+i,'FAILED',true);}
tu('e1','Edit',{file_path:'/x/a.py',old_string:'foo',new_string:'bar'});tu('e2','Edit',{file_path:'/x/a.py',old_string:'bar',new_string:'foo'});
const j=analyze(L.join('\n'));console.log('jsonl:',j.offenders.map(o=>o.type+':'+o.count).join(', '),'score',j.score);
['repeat-read','repeat-fail','ping-pong','edit-revert'].forEach(t=>assert(j.offenders.some(o=>o.type===t),t));
assert(j.wastedShare<=1);
assert.strictEqual(analyze(L.slice(0,4).join('\n')).score,0);console.log('ALL TESTS PASSED');
