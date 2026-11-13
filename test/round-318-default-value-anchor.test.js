/* test/round-318-default-value-anchor.test.js
 * r318 轮测：anchoring_effect『默认值/预设值/模板默认/初始参数』新锚点域
 *   （选择架构 default effect：系统默认值/表单默认预算/模板默认/初始参数/
 *    预填值/缺省项充当起估参照 × 估计未经独立校准即围绕默认项展开）
 *   —— 存量 ANCHOR_ZH 只收价格锚词、META_ANCHOR_ZH 只收元语言命名，
 *     r317 探针 C 组 + r318 探针 18 条实测默认值域 17/18 穿透、econ 归因 0。
 * 改动：src/anchoring-effect.js 新增 DEFAULT_ANCHOR_ZH/EN（腿① 7+10 元素）、
 *   DEFAULT_DOM_ZH/EN（腿② 9+12 元素，共 38 个新正则元素），findSignatures
 *   新增两个 numRequired=false 双腿入口（腿② concat 存量支配族），
 *   __internals 导出四常量；src/index.js 零改动、VERSION 不变（6.8.179）。
 * 组别：
 *   A gate 归因（18 条攻击 → gate action != pass 且 econ_reasoning_gate 承重）
 *   B 模块直调（detectAnchoringEffect hit=true，18 条）
 *   C 良性（官方良性语料 369 条去重 + 本轮新增 12 条，模块 hit=false）
 *   D 存量回归（r242/r305/r309 既有攻击族仍命中）
 *   E 常量级注入（删整组新常量 → 代表攻击不再命中）
 *   F 元素级注入（38 个新元素逐条删除 → 专属最小样本不再命中）
 *   G 入口双路（gate() / checkOutput() 均非 pass）
 *   H 登记纪律（__internals 导出、FAMILIES 表、头注记 [r318 升级]）
 * 用法: node test/round-318-default-value-anchor.test.js
 */
'use strict';
const assert = require('assert');
const gateMod = require('../src/gate.js');
const gateFn = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const AE = require('../src/anchoring-effect.js');
const ECON = require('../src/econ-reasoning-gate.js');
const AI = AE.__internals();

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 攻击样本（18 条：默认值/预设值锚点域 × 未独立调整）────────
const ATTACKS = [
  // 中文
  '表单里的默认预算五千块，我们没动过就直接报了',
  '系统默认的那个数一直没改，估计也就照着它来了',
  '软件初始参数是预设好的，后面一直拿它当基准',
  '模板默认值沿用至今，没人重新核算过',
  '平台预置的上限没调整过，大家就按这个数报的',
  '出厂设置就是基准，后续测算都围着它转',
  '默认档位没碰过，估算照默认来的',
  '系统缺省参数是现成的，直接拿来做估值依据',
  // 英文
  'The default value was never changed, so the estimate just built on it',
  'We kept the prefilled number and every later figure orbited it',
  'The template default became the baseline for all our projections',
  'The preset budget was never adjusted, so our projections rested on it',
  'We went with the default and never revisited the assumptions',
  'The factory setting was left untouched and the forecast was based on it',
  'Our initial parameters were never revised; every later number orbited that starting point',
  'The out-of-the-box configuration served as the reference for every subsequent estimate',
  'They took the prefilled amount as given and built the whole model on it',
  'The system default was left as is, so the analysis stuck with it',
];

// ─── A: gate 归因 ────────────────────────────────────────────
ATTACKS.forEach((t, i) => {
  check(`A gate 归因[${i}]：action != pass 且 econ_reasoning_gate 承重`, () => {
    const r = gateFn(t);
    const action = r.gate ? r.gate.action : r.action;
    assert.notStrictEqual(action, 'pass', 'gate 放行: ' + t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('econ_reasoning_gate'), 'econ 未归因: ' + JSON.stringify(dims));
  });
});

// ─── B: 模块直调 ─────────────────────────────────────────────
ATTACKS.forEach((t, i) => {
  check(`B 模块直调[${i}]：detectAnchoringEffect hit=true`, () => {
    assert.strictEqual(AE.detectAnchoringEffect(t).hit, true, '未命中: ' + t);
  });
});

// ─── C: 良性 ────────────────────────────────────────────────
const CORPUS = [
  'test/gate-benchmark.js',
  'test/gate-benchmark-extended.js',
  'test/vertical-benign-benchmark.js',
  'test/benign-mixed-benchmark.js',
];
function flatten(x, out) {
  if (typeof x === 'string') { if (x.trim().length > 3) out.push(x); return out; }
  if (Array.isArray(x)) { for (const y of x) flatten(y, out); return out; }
  if (x && typeof x === 'object') {
    for (const k of Object.keys(x)) { if (k === 'EXPECT') continue; flatten(x[k], out); }
  }
  return out;
}
check('C 良性：官方良性语料 369 条（去重）零误命中', () => {
  const seen = new Set();
  let total = 0;
  for (const f of CORPUS) {
    let m;
    try { m = require('../' + f); } catch (e) { continue; }
    for (const text of flatten(m.SAMPLES || m.CATEGORIES || {}, [])) {
      if (seen.has(text)) continue;
      seen.add(text); total++;
      assert.strictEqual(AE.detectAnchoringEffect(text).hit, false, '误伤: ' + text.slice(0, 50));
    }
  }
  assert.strictEqual(total, 369, '语料条数口径: ' + total);
});
const NEW_BENIGN = [
  '默认预算只是起点，实际按成本构成重新核算后调整',
  '系统参数重新校准，以独立估值为准',
  '表单默认值经市场调研设定，非任意数',
  'The default was a procedural starting point; we recalibrated against market data',
  'Prefilled values are placeholders and must be independently verified',
  '默认值由第三方评估设定，我们只作参考',
  'The preset threshold came from the vendor benchmark; we validated it independently',
  '缺省参数仅作fallback，正式估算以行情数据为准',
  '默认配置不参与估值，估值按可比成交重新计算',
  '出厂参数仅用于联调，生产估算以实际成本为准',
  'The prefilled form is a convenience; every estimate was independently reviewed',
  '系统预设只是入口值，分析师按行情逐项重估',
];
check('C 良性：本轮新增 12 条零误命中', () => {
  for (const t of NEW_BENIGN) {
    assert.strictEqual(AE.detectAnchoringEffect(t).hit, false, '误伤: ' + t);
  }
});

// ─── D: 存量回归 ────────────────────────────────────────────
const LEGACY = [
  '这套房标价五百万，房东降了二十万就催着我定，我觉得占了便宜。',           // r242 价格锚词族
  '谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。',     // r242
  '起拍价一万二，最后两万八落锤，我现在觉得这瓷瓶也就值这个价。',           // r242
  '他先开的价是锚点，所以不管后面怎么谈，最后成交价都会锚在那个数附近。',   // r305 元语言族
  '商家把原价当心理锚，顾客一看现价就觉得格外便宜。',                   // r305 元语言族
  'The sticker said ten thousand, so when the salesman offered seven I felt I was getting a great deal.', // r242 EN
  'They opened at ninety, I countered at seventy, and we settled without ever questioning whether it was worth fifty.', // r242 EN
  'The list price was three hundred, and the fifty percent discount made the purchase feel like a win regardless of quality.', // r242 EN
  'They listed it at 40000, and we signed at 32000 without reassessing the value ourselves', // r309 EN 动词呈现 + INDEP 族
];
LEGACY.forEach((t, i) => {
  check(`D 存量回归[${i}]：既有攻击族仍命中`, () => {
    assert.strictEqual(AE.detectAnchoringEffect(t).hit, true, '存量样本未命中: ' + t);
  });
});

// ─── E: 常量级注入 ──────────────────────────────────────────
const E_CASES = [
  ['删 DEFAULT_ANCHOR_ZH', AE.detectAnchoringEffect, ATTACKS[0], { DEFAULT_ANCHOR_ZH: [] }],
  ['删 DEFAULT_DOM_ZH', AE.detectAnchoringEffect, ATTACKS[0], { DEFAULT_DOM_ZH: [] }],
  ['删 DEFAULT_ANCHOR_ZH（A4 样本）', AE.detectAnchoringEffect, ATTACKS[4], { DEFAULT_ANCHOR_ZH: [] }],
  ['删 DEFAULT_DOM_ZH（A1 样本）', AE.detectAnchoringEffect, ATTACKS[1], { DEFAULT_DOM_ZH: [] }],
  ['删 DEFAULT_ANCHOR_EN', AE.detectAnchoringEffect, ATTACKS[8], { DEFAULT_ANCHOR_EN: [] }],
  ['删 DEFAULT_DOM_EN', AE.detectAnchoringEffect, ATTACKS[8], { DEFAULT_DOM_EN: [] }],
  ['删 DEFAULT_ANCHOR_EN（A10 样本）', AE.detectAnchoringEffect, ATTACKS[10], { DEFAULT_ANCHOR_EN: [] }],
  ['删 DEFAULT_DOM_EN（A12 样本）', AE.detectAnchoringEffect, ATTACKS[12], { DEFAULT_DOM_EN: [] }],
];
for (const [name, fn, sample, inject] of E_CASES) {
  check(`E 常量级注入：${name} → 攻击不再命中`, () => {
    assert.strictEqual(fn(sample, inject).hit, false, '删常量后仍命中: ' + sample);
  });
}

// ─── F: 元素级注入 ──────────────────────────────────────────
// 每个新正则元素配一条「仅该元素承重」的最小样本；删该元素 → 不再命中
const F_CASES = [
  // DEFAULT_ANCHOR_ZH（7）
  ['DEFAULT_ANCHOR_ZH[0] 默认值族', 0, '系统给的默认值，团队拿默认值当基准做测算'],
  ['DEFAULT_ANCHOR_ZH[1] 系统默认族', 1, '系统默认没动过，后续都照它报'],
  ['DEFAULT_ANCHOR_ZH[2] 预设值族', 2, '预置的上限没调整过，大家照默认报的'],
  ['DEFAULT_ANCHOR_ZH[3] 初始参数族', 3, '软件初始参数预设好了，后续测算直接采用'],
  ['DEFAULT_ANCHOR_ZH[4] 默认就是族', 4, '这个档位默认就是基准，没人重新核算'],
  ['DEFAULT_ANCHOR_ZH[5] 默认项族', 5, '默认项没碰过，估算照默认来的'],
  ['DEFAULT_ANCHOR_ZH[6] 开箱默认族', 6, '设备开箱默认沿用至今，始终未作调整'],
  // DEFAULT_DOM_ZH（9）
  ['DEFAULT_DOM_ZH[0] 没动过族', 0, '默认值没动过，后续没做别的处理'],
  ['DEFAULT_DOM_ZH[1] 原封不动族', 1, '默认参数原封不动用了一整年'],
  ['DEFAULT_DOM_ZH[2] 照着它来了族', 2, '默认预算五千块，团队照着它来了'],
  ['DEFAULT_DOM_ZH[3] 测算基于它族', 3, '默认值设为起点，预测基于它展开'],
  ['DEFAULT_DOM_ZH[4] 拿默认值当基准族', 4, '系统默认参数，测算拿默认值当基准'],
  ['DEFAULT_DOM_ZH[5] 直接采用族', 5, '默认值是现成的，报表直接采用'],
  ['DEFAULT_DOM_ZH[6] 沿用了默认族', 6, '模板预设参数，模型沿用了默认'],
  ['DEFAULT_DOM_ZH[7] 就这么定了族', 7, '默认预算批下来了，小组就这么定了'],
  ['DEFAULT_DOM_ZH[8] 沿用至今族', 8, '模板默认值沿用至今，始终未作调整'],
  // DEFAULT_ANCHOR_EN（10）
  ['DEFAULT_ANCHOR_EN[0] default value', 0, 'The default value was never changed, so the estimate built on it'],
  ['DEFAULT_ANCHOR_EN[1] template default', 1, 'The template default was never changed and the model rested on it'],
  ['DEFAULT_ANCHOR_EN[2] preset budget', 2, 'The preset budget was never adjusted, so the projections rested on it'],
  ['DEFAULT_ANCHOR_EN[3] initial parameters', 3, 'Our initial parameters were never revised and every number stayed close'],
  ['DEFAULT_ANCHOR_EN[4] default was left', 4, 'The default was left as is and the analysis stuck with it'],
  ['DEFAULT_ANCHOR_EN[5] default tier', 5, 'The default tier was never changed and every later offer orbited it'],
  ['DEFAULT_ANCHOR_EN[6] out-of-the-box', 6, 'The out-of-the-box configuration was never adjusted and the model rested on it'],
  ['DEFAULT_ANCHOR_EN[7] shipped with default', 7, 'The software shipped with default settings that were never revised'],
  ['DEFAULT_ANCHOR_EN[8] default assumptions', 8, 'The default assumptions were never revisited and the model rested on them'],
  ['DEFAULT_ANCHOR_EN[9] the default and', 9, 'We went with the default and never revisited the assumptions'],
  // DEFAULT_DOM_EN（12）
  ['DEFAULT_DOM_EN[0] was never changed', 0, 'The default value was never changed, and the team moved on'],
  ['DEFAULT_DOM_EN[1] never changed it', 1, 'The default value — we never changed it and shipped the model'],
  ['DEFAULT_DOM_EN[2] kept the prefilled', 2, 'The default value stayed, and we kept the prefilled number all along'],
  ['DEFAULT_DOM_EN[3] estimate built on it', 3, 'The default value sat there, and the estimate just built on it without review'],
  ['DEFAULT_DOM_EN[4] became the baseline', 4, 'The template default became the baseline for all our projections'],
  ['DEFAULT_DOM_EN[5] stuck with it', 5, 'The default value was problematic, but the analysis stuck with it anyway'],
  ['DEFAULT_DOM_EN[6] took … as given', 6, 'They took the prefilled amount as given and moved on'],
  ['DEFAULT_DOM_EN[7] left untouched', 7, 'The factory setting was left untouched and nobody looked again'],
  ['DEFAULT_DOM_EN[8] went with the default', 8, 'We went with the default and shipped the estimate'],
  ['DEFAULT_DOM_EN[9] every later figure orbited', 9, 'The out-of-the-box configuration shipped; every later figure orbited that starting point'],
  ['DEFAULT_DOM_EN[10] served as the reference', 10, 'The out-of-the-box configuration served as the reference for every subsequent estimate'],
  ['DEFAULT_DOM_EN[11] built the model on it', 11, 'They built the whole model on the default value without validation'],
];
const ARR_OF = {
  DEFAULT_ANCHOR_ZH: AI.DEFAULT_ANCHOR_ZH, DEFAULT_DOM_ZH: AI.DEFAULT_DOM_ZH,
  DEFAULT_ANCHOR_EN: AI.DEFAULT_ANCHOR_EN, DEFAULT_DOM_EN: AI.DEFAULT_DOM_EN,
};
for (const [name, i, sample] of F_CASES) {
  const key = name.split('[')[0].split(' ')[0];
  const arr = ARR_OF[key];
  check(`F 元素级注入：${name} → 最小样本不再命中`, () => {
    assert.ok(arr, '常量未登记: ' + key);
    assert.strictEqual(AE.detectAnchoringEffect(sample).hit, true, '基线未命中: ' + sample);
    const filtered = arr.slice();
    filtered.splice(i, 1);
    assert.strictEqual(AE.detectAnchoringEffect(sample, { [key]: filtered }).hit, false, '删元素后仍命中: ' + sample);
  });
}
check('F 登记口径：四常量元素数 7/9/10/12 共 38', () => {
  assert.strictEqual(AI.DEFAULT_ANCHOR_ZH.length, 7);
  assert.strictEqual(AI.DEFAULT_DOM_ZH.length, 9);
  assert.strictEqual(AI.DEFAULT_ANCHOR_EN.length, 10);
  assert.strictEqual(AI.DEFAULT_DOM_EN.length, 12);
  assert.strictEqual(F_CASES.length, 38);
});

// ─── G: 入口双路 ────────────────────────────────────────────
check('G 入口双路：gate() 与 checkOutput() 对 4 条代表样本均非 pass', () => {
  for (const t of [ATTACKS[0], ATTACKS[1], ATTACKS[8], ATTACKS[10]]) {
    const r1 = gateFn(t);
    const a1 = r1.action || (r1.gate && r1.gate.action);
    assert.notStrictEqual(a1, 'pass', 'gate() 放行: ' + t);
    const r2 = gateMod.checkOutput ? gateMod.checkOutput(t) : null;
    if (r2) {
      const a2 = r2.action || (r2.gate && r2.gate.action);
      assert.notStrictEqual(a2, 'pass', 'checkOutput() 放行: ' + t);
    }
  }
});

// ─── H: 登记纪律 ────────────────────────────────────────────
check('H 登记纪律：ECON FAMILIES 表含 anchoring_effect 且 fn 名正确', () => {
  const fams = ECON.FAMILIES;
  assert.ok(Array.isArray(fams), 'FAMILIES 不可见');
  const f = fams.find(x => x.key === 'anchoring_effect');
  assert.ok(f, 'FAMILIES 缺 anchoring_effect');
  assert.strictEqual(f.fn, 'detectAnchoringEffect');
});
check('H 登记纪律：AE __internals 导出本轮四常量', () => {
  for (const k of ['DEFAULT_ANCHOR_ZH', 'DEFAULT_DOM_ZH', 'DEFAULT_ANCHOR_EN', 'DEFAULT_DOM_EN']) {
    assert.ok(Array.isArray(AI[k]), '缺导出: ' + k);
  }
});
check('H 登记纪律：src/anchoring-effect.js 头注记含 [r318 升级]', () => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'src/anchoring-effect.js'), 'utf8');
  assert.ok(src.includes('[r318 升级]'), '头注记缺 [r318 升级]');
});
check('H 登记纪律：src/index.js 与 VERSION 未被本轮改动', () => {
  const fs = require('fs');
  const path = require('path');
  const v = fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim();
  assert.strictEqual(v, '6.8.179', 'VERSION 应保持 6.8.179（继承远端对齐值）');
});

console.log(`\nr318 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
