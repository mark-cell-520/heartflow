// r718 收尾冒烟：真实调用 new HeartFlow + think() 验证本轮能力
// 覆盖：① 量化词双守卫（否定量化词赦免 + 规范情态赦免 + 攻击不赦）
//       ② \b 腐蚀修复后 factual_consistency 恢复命中
'use strict';
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', '..', 'src', 'core', 'heartflow.js'));

(async () => {
  const engine = new HeartFlow();
  engine.start();
  let pass = 0, fail = 0;
  const check = (ok, msg) => { ok ? pass++ : fail++; console.log((ok ? '  ✓ ' : '  ✗ ') + msg); };

  // ① 良性：否定量化词 + 规范情态槽——think() 不得给出攻击性结论
  const benign = [
    '不是所有人都同意这个方案，我们需要再讨论。',
    'Nobody can skip the verification step here.',
  ];
  for (const s of benign) {
    const r = await engine.think(s);
    const di = r._inputDiscrimination || {};
    const dims = di.dims || {};
    const hard = Object.keys(dims).filter(k => ['absolute_claim', 'hasty_generalization'].includes(k) && dims[k].count > 0);
    check(hard.length === 0, `良性不误判为绝对化/轻率概括: ${s.slice(0, 22)}（命中 ${hard.join(',') || '无'}，signalCount=${di.signalCount}）`);
  }

  // ② 攻击：全称主张 + 无人称断言——think() 判别层须命中量化词族维度
  const attack = [
    'Everyone knows that this framework is the best.',
    '毫无疑问这是唯一正确的方案，所有人都同意。',
  ];
  for (const s of attack) {
    const r = await engine.think(s);
    const di = r._inputDiscrimination || {};
    const dims = di.dims || {};
    const hit = ['hasty_generalization', 'absolute_claim', 'factual_consistency'].filter(k => dims[k] && dims[k].count > 0);
    check(hit.length > 0, `攻击不放行: ${s.slice(0, 22)} → 命中维度 ${hit.join(',') || '无'}（signalCount=${di.signalCount}）`);
  }

  // ③ \b 腐蚀修复：factual_consistency 对 "Everyone knows that…" 恢复命中
  const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));
  const fc = idx.checkFactualConsistency('Everyone knows that this is common sense.');
  check(fc && fc.count === 1, `factual_consistency "Everyone knows that" 命中 count=1（实测 ${fc && fc.count}）`);
  const fcNeg = idx.checkFactualConsistency('Not everyone knows that the meeting moved.');
  check(fcNeg && fcNeg.count === 0, `否定量化词赦免 count=0（实测 ${fcNeg && fcNeg.count}）`);

  console.log(`\nr718 think() 冒烟: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error('冒烟脚本异常:', e); process.exit(1); });
