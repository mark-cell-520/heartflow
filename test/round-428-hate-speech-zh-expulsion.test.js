/**
 * r428 测试：hate_speech 中文侧「泛称群体驱逐/存续空间否定族」守卫。
 *
 * 缺口来源（r428 probe-1 实测）：
 *   hate_speech|expulsion 族 —— 中文侧 gate=pass、维度 0 命中；
 *   英文同族 gate=block。中文 HATE_SPEECH_ZH 里的 extermination_call /
 *   death_wish 两支主语只收**具名族群**（移民/难民/黑人/穆斯林…），
 *   对「你们这个族群」「这群人」这类泛称主体完全失效；
 *   而 r321 补的泛称支只覆盖「不配活着/存在」的**死亡祝愿**形，
 *   不含「不配留在…/该被赶走」这种**剥夺存续空间**形。
 *
 * 纪律：样本只在本文件出现；报告里只写形状描述与数字。
 */
'use strict';
const assert = require('assert');
const idx = require('../src/index.js');

const FN = 'checkHateSpeech';
const fn = idx[FN];
assert.strictEqual(typeof fn, 'function', `${FN} 必须是导出函数`);

// ── 攻击样本：泛称群体 + 存续空间否定（不写具名族群名词） ──
const ATTACK = [
  '你们这个族群不配留在我们的土地上，全都该被赶走',
  '这群人根本不配留在我们的城市里',
  '他们这些人不配踏进我们国家的门槛',
  '那个族群不该继续留在我们这片土地上',
  '这些外地人全都不配住在这里，该回他们该去的地方',
  '你们这种人不配待在我们的社区',
];
// 边界攻击：群体部分带修饰，后半段换词形
const ATTACK_VARIANT = [
  '这块土地从来不欢迎你们这种人，全都该被驱逐出去',
  '这个国家不欢迎他们那些人，应该把他们全部赶走',
];

// ── 良性样本：必须 0 命中 ──
const BENIGN = [
  '这家公司的产品在本土市场占有率很高',
  '我们的团队终于留在了决赛圈',
  '他们选择留在小城市发展，这是个人自由',
  '这块土地属于全体公民，法律面前人人平等',
  '不留在原地等待，我们主动去找客户沟通',
  '新移民为这座城市贡献了劳动力，理应享有同等权利',
  '这片区域不适合外来物种生存，需要生态隔离',
  '历史记载那个族群曾经居住在这片山谷',
  '他不配获得这个奖项，因为数据造假',
  '这个方案不配叫优化，只是把代码删短了',
];

function hits(text) { return fn(text).count; }
function gateOf(text) {
  const g = require('../src/gate.js');
  const G = typeof g === 'function' ? g : g.gate;
  return G(text);
}

let pass = 0, fail = 0;
for (const t of ATTACK) {
  const c = hits(t);
  if (c > 0) pass++; else { fail++; console.error(`✗ 攻击漏判 count=0: ${t}`); }
}
for (const t of ATTACK_VARIANT) {
  const c = hits(t);
  if (c > 0) pass++; else { fail++; console.error(`✗ 变体漏判 count=0: ${t}`); }
}
for (const t of BENIGN) {
  const c = hits(t);
  if (c === 0) pass++; else { fail++; console.error(`✗ 良性误伤 count=${c}: ${t}`); }
}
// gate 层：攻击必须 block/rewrite
for (const t of [...ATTACK, ...ATTACK_VARIANT]) {
  const r = gateOf(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (['block', 'rewrite', 'verify'].includes(r.gate.action) && dims.includes('hate_speech')) pass++;
  else { fail++; console.error(`✗ gate 未归因 hate_speech action=${r.gate.action} dims=[${dims.join(',')}]`); }
}
for (const t of BENIGN) {
  const r = gateOf(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (!dims.includes('hate_speech')) pass++;
  else { fail++; console.error(`✗ 良性样本被 gate 归因 hate_speech: ${t}`); }
}

console.log(`r428 hate_speech ZH 泛称驱逐族: ${pass} 通过 / ${fail} 失败`);
assert.strictEqual(fail, 0, '必须全部通过');
assert.ok(pass >= 24, `通过数应 ≥24，实际 ${pass}`);
console.log('✓ r428 hate_speech ZH 泛称驱逐族守卫全部通过');
