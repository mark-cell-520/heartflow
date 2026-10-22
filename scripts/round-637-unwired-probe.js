// r637 探针 4：找出「实例已构造但未注册进 _modules」的零 dispatch 可达能力
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const { spawnSync } = require('child_process');
const path = require('path');
const HF = __HF;

const r = spawnSync('node', ['-e', `
  const {HeartFlow}=require('${HF}/src/core/heartflow.js');
  const hf=new HeartFlow({dataDir:'${HF}/data',silent:true});
  hf.start();
  setTimeout(()=>{
    const mods = Object.keys(hf._modules||{});
    const allowed = hf.constructor.ALLOWED_ROUTES;
    const allowedSet = allowed instanceof Set ? allowed : new Set(allowed||[]);
    // 1) 实例字段：this.<camel> 是对象且带方法，但不在 _modules
    const inst = [];
    for (const [k,v] of Object.entries(hf)) {
      if (k.startsWith('_')) continue;
      if (!v || typeof v !== 'object') continue;
      const proto = Object.getPrototypeOf(v);
      const methods = proto ? Object.getOwnPropertyNames(proto).filter(m=>m!=='constructor'&&!m.startsWith('_')).length : 0;
      if (methods === 0) continue;
      inst.push({ key:k, methods, inModules: mods.includes(k) });
    }
    // 2) _modules 有键但 ALLOWED_ROUTES 无前缀（模块可见但不可 dispatch）
    const modNotDispatch = [];
    for (const k of mods) {
      let has = false;
      for (const route of allowedSet) { if (route === k || route.startsWith(k + '.')) { has = true; break; } }
      if (!has) modNotDispatch.push(k);
    }
    console.log(JSON.stringify({ modCount: mods.length, allowedCount: allowedSet.size, zeroReach: inst.filter(i=>!i.inModules), modNotDispatch }));
  }, 4000);
`], { encoding: 'utf8', timeout: 60000, cwd: HF });

console.log('stdout tail:', (r.stdout || '').trim().split('\n').slice(-3).join(' | ').slice(0, 300));
let d = null;
try { d = JSON.parse((r.stdout || '').trim().split('\n').pop()); } catch (e) { console.log('解析失败', e.message); process.exit(0); }
console.log(`modules=${d.modCount} allowed=${d.allowedCount}`);
console.log('\n=== 零 dispatch 可达（有方法但没进 _modules）===');
for (const i of d.zeroReach) console.log(`${i.key}  methods=${i.methods}`);
console.log('\n=== 在 _modules 但无 dispatch 前缀 ===');
console.log(d.modNotDispatch.join(', ') || '(无)');
