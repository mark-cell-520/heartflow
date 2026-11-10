'use strict';
/**
 * test/round-267-crossdim-falsepositive.test.js
 * [r267] 跨维代拦误伤修复回归（真升级②，live 生效）。
 *
 * r267 池化探针实测（/tmp/probe-r267-*.js，v6.8.160）：
 * 红队中性探针 24 样本，目标维直调全部零命中，但 **2 个英文误伤**：
 *   ① "Residents stocked up on masks after the health advisory, and supply
 *      remained steady." → gate verify（误伤）
 *      根因：src/index.js FALLACY_PATTERNS false_cause 条目
 *      `[/after[^.]*?[, ]+[^.]*?(so|therefore|because of)/i, 'false_cause']`
 *      —— `(so|...)` 无 `\b`，把 "and **so**upply" 的前缀 "so" 吃掉，
 *      中性防疫叙述被判事后归因。
 *   ② "The shortlist is made up entirely by finalists from the regional
 *      heats." → gate verify（误伤）
 *      根因：src/perfect-error.js S5 ABSOLUTE_CLAIMS 英文条目
 *      `/(?:nothing|…|entirely|totally)\s+\w+/gi` —— 把 "entirely of" 这类
 *      「绝对词 + 结构介词」判为绝对断言，中性名单陈述被误伤。
 *
 * 本测试锁定两处修复 + 存量攻击零翻转：
 *   - 根因①：false_cause 正则加 `\b`（so/therefore/because of 词边界）
 *   - 根因②：S5 英文绝对词后加「非介词/冠词/指示词」负向前查
 *   - 存量攻击 4 条 false_cause + 3 条 S5 全部保留命中
 *   - 根因③（post-hoc R2 EN installed×improved → gate rewrite）作为**已知
 *     遗留误伤**登记在案，不作为本测试断言（待独立修复轮次）
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const idx = require(path.join(ROOT, 'src', 'index.js'));
const pe = require(path.join(ROOT, 'src', 'perfect-error.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 误伤样本必须转为 pass（两处修复的直接证据）─────────────────
const REPAIRED_BENIGN = [
  // 根因①：after…and supply（旧误伤）
  'Residents stocked up on masks after the health advisory, and supply remained steady.',
  'Residents panic bought supplies after the advisory, and store shelves stayed stocked.',
  // 根因②：entirely of / entirely by / Nothing in（旧误伤）
  'The shortlist is made up entirely of finalists from the regional heats.',
  'The shortlist is made up entirely by finalists from the regional heats.',
  'Nothing in the report suggests otherwise.',
];
REPAIRED_BENIGN.forEach((s, i) => t('修复-良性-' + (i + 1), () => {
  const r = gate(s);
  assert.strictEqual(r.gate.action, 'pass', '误伤未修复: ' + s);
}));

// ─── 2. 存量攻击零翻转（false_cause 4 条 / S5 3 条）────────────────
const FC_ATTACKS = [
  'It rained after the parade started, so the parade must have caused the rain.',
  'The market crashed after the CEO resigned, so his departure must have triggered it.',
  'Sales fell after the new pricing launched, so the pricing change is to blame.',
  'After the vaccine rollout, cases dropped, so the vaccine ended the outbreak.',
];
FC_ATTACKS.forEach((s, i) => t('存量-false_cause-' + (i + 1), () => {
  const f = idx.checkFallacies(s).fallacies.map(x => x.type);
  assert.ok(f.includes('false_cause'), 'false_cause 丢失: ' + s + ' got ' + JSON.stringify(f));
}));

const S5_ATTACKS = [
  'All research proves that long-term AI use absolutely degrades human thinking.',
  'The data shows this will certainly cause widespread cognitive crisis.',
  'This policy entirely ignores local conditions.',
];
S5_ATTACKS.forEach((s, i) => t('存量-S5-' + (i + 1), () => {
  const ids = pe.checkPerfectError(s).signals.map(x => x.id);
  assert.ok(ids.includes('S5_absolute_claim'), 'S5 丢失: ' + s + ' got ' + JSON.stringify(ids));
}));

// ─── 3. gate 层：存量攻击仍非 pass（修复没把判定全关掉）────────────
FC_ATTACKS.concat(S5_ATTACKS).forEach((s, i) => t('存量-gate-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', '存量攻击被修复误放行: ' + s);
}));

// ─── 4. 修复模式精确锁定：源码含 r267 修复标记 ─────────────────────
t('修复标记-index.js', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(src.includes('[r267 修复]'), 'src/index.js 缺 r267 修复注释');
  // 源码实际为 /\\bafter\\b[^.]*?[, ]+[^.]*?\\b(so|therefore|because of)\\b/i
  // （正则字面量在 JS 源码里是单层反斜杠；此处用字符串包含检查避免转义层级误判）
  assert.ok(src.includes("\\bafter\\b[^.]*?[, ]+[^.]*?\\b(so|therefore|because of)\\b"),
    'false_cause 词边界正则未落地');
});
t('修复标记-perfect-error.js', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'perfect-error.js'), 'utf8');
  assert.ok(src.includes('[r267 修复]'), 'src/perfect-error.js 缺 r267 修复注释');
  assert.ok(/\?!/.test(src) && src.includes('those'), 'S5 负向前查未落地');
});

// ─── 5. 根因③已修复（r267 post_hoc R2 EN 机构主语分流）─────────────
//    旧式 R2 EN 仅 `干预词 × 变化词` 两腿粗匹配，把
//    "Many families installed water purifiers, and water quality improved
//    measurably." 判 route 2 score 68 → gate rewrite（中性公共趋势误伤）。
//    修复：机构/复数主语 + 无归因断言 → 不触发 R2 EN；个人叙事原样保留。
const REPAIRED_PUBLIC_TREND = [
  'Many families installed water purifiers, and water quality improved measurably.',
  'Many households installed air purifiers, and indoor air quality improved measurably.',
  'The city installed bike lanes, and traffic congestion dropped citywide.',
  'The company updated its software, and crash reports decreased.',
];
REPAIRED_PUBLIC_TREND.forEach((s, i) => t('修复-公共趋势-' + (i + 1), () => {
  const r = gate(s);
  assert.strictEqual(r.gate.action, 'pass', '公共趋势叙述仍被误伤: ' + s);
}));

// 存量 R2 EN 攻击（个人叙事）必须仍命中
const R2_ATTACKS = [
  'She installed the new app and her productivity improved.',
  'I installed an air purifier and my headaches stopped.',
  'He downloaded a focus app and his concentration got better.',
  'We installed solar panels and our bills went down.',
  'I tried the new supplement and my energy increased.',
];
R2_ATTACKS.forEach((s, i) => t('存量-R2EN-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'R2 EN 存量攻击丢失: ' + s);
}));

// 机构主语 + 明示归因断言仍须拦（防止分流规则被滥用为放行口）
t('机构-归因断言仍触发', () => {
  const s = 'Many families installed water purifiers, and water quality improved, which proves the purifiers work.';
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', '机构主语+归因断言被放行');
});

console.log('✓ 修复-良性 ' + REPAIRED_BENIGN.length + '/' + REPAIRED_BENIGN.length + ' 全转 pass');
console.log('✓ 存量攻击 ' + (FC_ATTACKS.length + S5_ATTACKS.length) + ' 条零翻转 + gate 层仍非 pass');
if (fails.length) { console.error('FAIL:'); fails.forEach(f => console.error(' - ' + f)); process.exit(1); }
console.log('✓ round-267-crossdim-falsepositive 全部通过 (' + pass + ' 断言)');
console.log('round-267-crossdim-falsepositive: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
