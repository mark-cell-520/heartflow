// r298 候选验证探针：memoryIndex / agentCard / associativeEngine 三个 unwired 实例
// 1) 实例是否存在、有哪些方法
// 2) dispatch 是否真的 not allowed（核实 r639 快照）
// 3) 方法调用是否抛错（判断接线后是否首次可达）
const path = require('path');
const HF = path.join(__dirname, '..');
const { spawnSync } = require('child_process');

const targets = ['memoryIndex', 'agentCard', 'associativeEngine', 'globalWorkspace'];

const r = spawnSync('/root/.local/bin/node', ['-e', `
const {HeartFlow}=require('${HF}/src/core/heartflow.js');
(async()=>{
  const hf=new HeartFlow({autoStart:false});
  await hf.start();
  const out={};
  for(const name of ${JSON.stringify(targets)}){
    const inst=hf[name];
    if(!inst){out[name]={inst:false};continue}
    const methods=Object.getOwnPropertyNames(Object.getPrototypeOf(inst)).filter(m=>m!=='constructor'&&typeof inst[m]==='function');
    const dispatchProbe={};
    for(const m of methods){
      try{const res=await hf.dispatch(name+'.'+m,{});dispatchProbe[m]='ok:'+(res&&res.ok);}
      catch(e){dispatchProbe[m]=e.message.includes('not allowed')?'not_allowed':e.message.slice(0,60);}
    }
    out[name]={inst:true,methods,dispatchProbe};
  }
  console.log('__JSON_START__');
  console.log(JSON.stringify(out,null,1));
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
`], { encoding: 'utf8', timeout: 60000, cwd: HF });

if (r.status !== 0) { console.error('probe failed:', r.stderr?.slice(0, 500)); process.exit(1); }
const stdout = String(r.stdout || '');
const marker = stdout.indexOf('__JSON_START__');
if (marker < 0) { console.error('no JSON marker in stdout:', stdout.slice(0, 400)); process.exit(1); }
const jsonText = stdout.slice(stdout.indexOf('\n', marker) + 1);
const out = JSON.parse(jsonText);
for (const [name, info] of Object.entries(out)) {
  console.log(`\n### ${name}: inst=${!!info.inst} methods=${info.methods?.length || 0}`);
  if (!info.inst) continue;
  console.log('  methods:', (info.methods || []).join(', '));
  const dp = info.dispatchProbe || {};
  const na = Object.entries(dp).filter(([, v]) => v === 'not_allowed').length;
  const ok = Object.entries(dp).filter(([, v]) => String(v).startsWith('ok')).length;
  const other = Object.entries(dp).filter(([, v]) => !String(v).startsWith('ok') && v !== 'not_allowed');
  console.log(`  dispatch: not_allowed=${na} ok=${ok} other=${other.length}`);
  if (other.length) console.log('  other:', JSON.stringify(other.slice(0, 8)));
}
