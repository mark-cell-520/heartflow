/**
 * r606 复测探针：实测候选引擎的接线现状
 * 正确构造：new HeartFlow() + hf.start()（r605 同款）；路由读 HeartFlow.ALLOWED_ROUTES 静态集合
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const allowed = new Set(Array.from(HeartFlow.ALLOWED_ROUTES || []));
  console.log('allowed_routes_total=' + allowed.size);
  console.log('modules_total=' + Object.keys(hf._modules).length);
  console.log('');

  const CANDIDATES = [
    { name: 'sageGuardian', label: 'sageGuardian' },
    { name: 'valueInternalizer', label: 'valueInternalizer' },
    { name: 'forgettingEngine', label: 'forgettingEngine' },
    { name: 'consciousnessSelf', label: 'consciousnessSelf（r605 对照组）' },
  ];

  for (const c of CANDIDATES) {
    const inst = hf[c.name];
    const inModules = Object.prototype.hasOwnProperty.call(hf._modules || {}, c.name);
    if (!inst) {
      console.log(`【${c.label}】实例不存在（start() 未构造或键名不同）`);
      // 找相似键
      const similar = Object.keys(hf).filter(k => k.toLowerCase().includes(c.name.toLowerCase().replace('engine', '')));
      console.log(`  相似实例键: ${similar.join(', ') || '无'}`);
      console.log('');
      continue;
    }
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(inst)).filter(m => m !== 'constructor' && typeof inst[m] === 'function');
    const ownMethods = Object.getOwnPropertyNames(inst).filter(m => typeof inst[m] === 'function');
    const allMethods = Array.from(new Set([...methods, ...ownMethods]));

    const prefixed = Array.from(allowed).filter(r => r.startsWith(c.name + '.'));
    // 逐方法 dispatch 实测（只带空参，看路由层是否放行）
    let ok = 0, notAllowed = 0, otherErr = 0;
    const errs = [];
    for (const m of allMethods) {
      try {
        hf.dispatch(c.name + '.' + m, {});
        ok++;
      } catch (e) {
        if (/route not allowed/i.test(e.message)) notAllowed++;
        else { otherErr++; if (errs.length < 5) errs.push(m + ':' + e.message.slice(0, 60)); }
      }
    }

    console.log(`【${c.label}】`);
    console.log(`  实例存在: true | 原型方法 ${methods.length} | 实例自有 ${ownMethods.length} | 合计去重 ${allMethods.length}`);
    console.log(`  _modules 有键: ${inModules} | ALLOWED_ROUTES 命中: ${prefixed.length}`);
    console.log(`  dispatch 逐条(${allMethods.length}): 成功 ${ok} / not-allowed ${notAllowed} / 其它抛错 ${otherErr}`);
    if (errs.length) console.log(`  抛错样例: ${errs.join(' | ')}`);
    console.log(`  方法: ${allMethods.join(', ').slice(0, 500)}`);
    console.log('');
  }
})().catch(e => { console.error('PROBE FAIL:', e.message); process.exit(1); });
