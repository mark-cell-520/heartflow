// r604 self-model.js 结构探针：判定「已挂 consciousness.self 壳」是否等于
// 「dispatch 可达」。测三件事：
//   ① SelfModel 的公开方法与零抛情况（真实能力清单）
//   ② this.consciousness 壳是否进了 _modules（若是，壳内 .self 是不是同一实例）
//   ③ 关键：ALLOWED_ROUTES 有 consciousness.* 几条、其中有没有覆盖 SelfModel 的方法
// 只输出布尔与方法名，不贴样本原文。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const sm = hf.consciousnessSelf;
  console.log('instance_alive=' + !!sm);
  console.log('ctor=' + (sm && sm.constructor && sm.constructor.name));
  const proto = Object.getPrototypeOf(sm || {});
  const methods = proto && proto !== Object.prototype
    ? Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof sm[m] === 'function' && !m.startsWith('_'))
    : [];
  const own = Object.keys(sm || {}).filter(m => typeof sm[m] === 'function' && !m.startsWith('_'));
  const all = [...new Set([...methods, ...own])];
  console.log('method_count=' + all.length);
  console.log('methods=' + all.join(','));

  const zt = [], th = [];
  for (const m of all) {
    try {
      const r = sm[m]();
      if (r && typeof r.then === 'function') { r.then(() => {}, () => {}); zt.push(m + ':ASYNC'); }
      else zt.push(m + (r !== undefined ? ':OK' : ':UNDEF'));
    } catch (e) { th.push(m + ':' + String(e.message).slice(0, 50)); }
  }
  console.log('zeroThrow=' + zt.length + '/' + all.length);
  console.log('  ' + zt.join('\n  '));
  console.log('throw=' + th.length);
  console.log('  ' + th.join('\n  '));

  console.log('--- shell check ---');
  console.log('consciousness_in_modules=' + Object.keys(hf._modules).includes('consciousness'));
  console.log('consciousness_self_is_same=' + (hf.consciousness && hf.consciousness.self === sm));

  const AR = [...HeartFlow.ALLOWED_ROUTES];
  const cRoutes = AR.filter(r => r.startsWith('consciousness.'));
  console.log('consciousness_routes=' + cRoutes.length + ' -> ' + cRoutes.join(','));
  const csRoutes = AR.filter(r => r.startsWith('consciousnessSelf.'));
  console.log('consciousnessSelf_routes=' + csRoutes.length);
  // 壳内 .self 上的方法是否在 consciousness.* 路由里
  const shellHas = all.filter(m => AR.includes('consciousness.' + m));
  console.log('shell_covers_methods=' + shellHas.length + '/' + all.length + ' -> ' + shellHas.join(','));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
