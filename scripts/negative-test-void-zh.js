/**
 * scripts/negative-test-void-zh.js
 * [r723] standard_shift 契约作废窄口补形负例注入测试：逐一置空各词表常量
 * 验证承重。纪律（同 r720 post_hoc / r722 hot_hand 先例）：
 *   - 攻击样本双腿齐全、无任何豁免词，基线必须命中
 *   - 豁免样本（强作废形 + DUE_PROCESS 程序正当锚点）基线必须被豁免
 *   - 逐常量置空后期望翻转：攻击从命中变零命中；豁免样本从豁免变命中
 *   - 置空值必须是字符串 '[]'（传 JS 数组会被 '' + [] 吞成语法错误）
 *   - 空表防退化断言：模块内置 per-leg 守卫，任一腿词表空则该腿摘除，
 *     全部落空返回 /(?!)/——防 `(?:)` 空 alternation 退化成恒真
 */
'use strict';

const path = require('path');
const Module = require('module');
const fs = require('fs');
const modPath = path.join(__dirname, '..', 'src', 'self-imposed-standard-shift.js');

function loadWithOverrides(overrides) {
  const src = fs.readFileSync(modPath, 'utf8');
  let out = src;
  for (const [name, val] of Object.entries(overrides)) {
    const re = new RegExp('const ' + name + ' = \\[[^\\]]*\\]');
    if (!re.test(out)) throw new Error('常量未找到: ' + name);
    out = out.replace(re, 'const ' + name + ' = ' + val);
  }
  const m = new Module(modPath, null);
  m.filename = modPath;
  m.paths = Module._nodeModulePaths(path.dirname(modPath));
  m._compile(out, modPath);
  return m.exports;
}

const base = loadWithOverrides({});

// 攻击样本（按腿归属，用于逐腿置空翻转验证）
const attacks = [
  ['当初那件事不作数，你别拿它说事', ['VOID_TIME_ZH', 'VOID_NOUN_ZH', 'VOID_VERB_ZH']],           // Z1
  ['这次承诺不算，我改主意了', ['VOID_TIME_ZH', 'VOID_NOUN_ZH', 'VOID_VERB_ZH']],                 // Z1（这次也命中：NOUN 含这个）
  ['这茬翻篇，之前说的都不算数', ['VOID_TIME_ZH', 'VOID_SAID_ZH', 'VOID_VERB_ZH']],               // Z1b
  ['旧标准作废，按我今天说的来', ['VOID_MOD_ZH', 'VOID_STD_ZH', 'VOID_VERB_ZH', 'VOID_MARK_ZH']],  // Z2（Z2 独占：旧只在 MOD 表）
  ['婚前说好不干涉我的工作，那条现在不算数', ['VOID_AGREED_ZH', 'VOID_DEM_ZH', 'VOID_VERB_ZH']],  // Z3
  ['谈好的条件随时可以改，我说了算', ['VOID_ANYTIME_ZH']],                                        // Z4
  ['说好的提成现在不认了，规矩我来定', ['VOID_AGREED_ZH', 'VOID_VERB_ZH']],                       // Z5
  ['That deal is void, I have decided on new terms.', ['VOID_EN_NOUN', 'VOID_EN_VOID']],          // E1
  ['What we agreed before does not count anymore.', ['VOID_EN_NOUN', 'VOID_EN_VOID']],            // E4a
  ['What I promised before no longer applies.', ['VOID_EN_NOUN', 'VOID_EN_VOID']],                // E4b
];
// 豁免注入样本（强作废形 + 恰好一种程序正当锚点，避开其他豁免触发词）
// 注意：程序锚点不得坐在名词-动词之间（Z2 不容该 gap）——否则样本根本不
// 强匹配，豁免锁是空锁（r723 实测教训）。
const victims = [
  ['经双方协商一致，旧标准作废，按新方案执行', 'DUE_PROCESS_ZH'],
  ['The old terms are void by mutual consent of both parties, and the new plan applies.', 'DUE_PROCESS_EN'],
];

let pass = 0, fail = 0;
const report = [];
function check(name, cond) { if (cond) pass++; else { fail++; report.push('FAIL ' + name); } }

// 0. 基线：攻击命中、豁免样本被豁免
for (const [s] of attacks) check('基线攻击命中: ' + s.slice(0, 18), base.checkStandardShift(s).count > 0);
for (const [s, ex] of victims) check('基线豁免(' + ex + '): ' + s.slice(0, 18), base.checkStandardShift(s).count === 0);

// 1. 逐腿置空：该腿攻击样本必须翻转
const injLegs = [
  ['VOID_TIME_ZH', '[]'], ['VOID_NOUN_ZH', '[]'], ['VOID_VERB_ZH', '[]'],
  ['VOID_SAID_ZH', '[]'], ['VOID_MOD_ZH', '[]'], ['VOID_STD_ZH', '[]'],
  ['VOID_MARK_ZH', '[]'], ['VOID_AGREED_ZH', '[]'], ['VOID_DEM_ZH', '[]'],
  ['VOID_ANYTIME_ZH', '[]'], ['VOID_EN_NOUN', '[]'], ['VOID_EN_VOID', '[]'],
];
for (const [name] of injLegs) {
  let mod;
  try { mod = loadWithOverrides({ [name]: '[]' }); }
  catch (e) { fail++; report.push('FAIL 注入异常 ' + name + ': ' + e.message); continue; }
  const owned = attacks.filter(([, legs]) => legs.includes(name));
  for (const [s] of owned) {
    const r = mod.checkStandardShift(s);
    check('置空 ' + name + ' 后 "' + s.slice(0, 14) + '" 翻转', r.count === 0);
  }
  // 不受该常量支配的攻击样本不得被误伤（仍应命中）
  const others = attacks.filter(([, legs]) => !legs.includes(name));
  for (const [s] of others) {
    const r = mod.checkStandardShift(s);
    if (r.count === 0) report.push('NOTE 置空 ' + name + ' 后非归属样本也翻转: ' + s.slice(0, 14));
  }
}

// 2. 豁免注入：置空 DUE_PROCESS 半边后程序样本必须从豁免变命中
for (const [s, exName] of victims) {
  const m1 = loadWithOverrides({ [exName]: '[]' });
  const r1 = m1.checkStandardShift(s);
  check('置空 ' + exName + ' 后 "' + s.slice(0, 14) + '" 翻转', r1.count > 0);
}
// 2b. 只置空一半 DUE_PROCESS 不得让另一半豁免失效（防空表退化恒真/恒假）
{
  const mZh = loadWithOverrides({ DUE_PROCESS_ZH: '[]' });
  check('DUE_PROCESS_ZH 空表后 EN 程序样本仍豁免', mZh.checkStandardShift(victims[1][0]).count === 0);
  const mEn = loadWithOverrides({ DUE_PROCESS_EN: '[]' });
  check('DUE_PROCESS_EN 空表后 ZH 程序样本仍豁免', mEn.checkStandardShift(victims[0][0]).count === 0);
  // 全置空：豁免消失，攻击仍可命中（不得因 DUE_PROCESS 恒真而全部放行）
  const mBoth = loadWithOverrides({ DUE_PROCESS_ZH: '[]', DUE_PROCESS_EN: '[]' });
  check('DUE_PROCESS 全空后攻击样本仍命中（豁免未恒真）', mBoth.checkStandardShift(attacks[0][0]).count > 0);
}

// 3. 空表防退化：任一常量全空时，模块不得抛异常且不得恒真命中
{
  const allKeys = ['VOID_TIME_ZH', 'VOID_NOUN_ZH', 'VOID_VERB_ZH', 'VOID_SAID_ZH', 'VOID_MOD_ZH',
    'VOID_STD_ZH', 'VOID_MARK_ZH', 'VOID_AGREED_ZH', 'VOID_DEM_ZH', 'VOID_ANYTIME_ZH',
    'DUE_PROCESS_ZH', 'VOID_EN_NOUN', 'VOID_EN_VOID', 'DUE_PROCESS_EN'];
  const ov = {};
  for (const k of allKeys) ov[k] = '[]';
  const mAll = loadWithOverrides(ov);
  const r = mAll.checkStandardShift('这句话里什么都没有');
  check('全词表置空后良性句零命中（无恒真退化）', r.count === 0);
}

// 4. __internals 导出完整性
const need = ['VOID_TIME_ZH', 'VOID_NOUN_ZH', 'VOID_VERB_ZH', 'VOID_MOD_ZH', 'VOID_STD_ZH',
  'VOID_SAID_ZH', 'VOID_DEM_ZH', 'VOID_AGREED_ZH', 'VOID_ANYTIME_ZH', 'VOID_MARK_ZH',
  'DUE_PROCESS_ZH', 'VOID_EN_NOUN', 'VOID_EN_VOID', 'DUE_PROCESS_EN'];
for (const k of need) check('__internals 含 ' + k, Array.isArray(base.__internals && base.__internals[k]));

console.log('== r723 契约作废负例注入测试 ==');
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败' + (report.length ? '' : '（无翻转警告）'));
for (const r of report) console.log('  ' + r);
if (fail > 0) process.exit(1);
