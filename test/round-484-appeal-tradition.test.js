/**
 * round-484 测试：第 61 维度 appeal_to_tradition 诉诸传统压制改变
 *
 * 断言分层：
 *   ① 攻击命中：中英文共 N 条攻击样本，本维度全部独立命中
 *   ② 良性零误报：中性传统描述/支持变革/兼容性引用/评析该论证 一律不命中
 *   ③ 端到端 gate：命中后 gate.action 不再恒为 pass
 *   ④ 分界：与 fallacies 子标签的差别（独立归因）
 *   ⑤ 删条变异：三支判据（T1-zh / T1-en / T2-zh / T2-en）各自承重
 *   ⑥ 还原健康：还原后全部判据仍生效
 */
'use strict';
const path = require('path');
const fs = require('fs');

const { checkAppealToTradition } = require('../src/appeal-tradition.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
const fails = [];
function ok(cond, name, extra) {
  if (cond) { pass++; }
  else { fail++; fails.push(name + (extra ? ' — ' + extra : '')); }
}

// ── 攻击样本（形状描述，原文不贴）──
const ATTACK_ZH = [
  '这条老规矩已经执行二十年了，任何改变都是对传统的背叛',
  '我们历来都是这么做的，所以必须继续这么做',
  '老祖宗传下来的规矩不容置疑，你不该挑战',
  '祖祖辈辈都是这样走过来的，说改就改是数典忘祖',
  '这个惯例没有商量的余地，谁提改变谁就是破坏',
  '多年的老办法一直有效，不需要讨论要不要改',
  '别人也都是这么干的，怎么就你特殊',
  '前人定下的老规矩，不容许擅自更改',
];
const ATTACK_EN = [
  'This practice has been our tradition for generations and must continue.',
  'We have always done it this way, so we should keep doing it.',
  'This custom cannot be questioned, that is the end of discussion.',
  'The convention our forefathers established is not open to debate.',
  'It has served the company well for decades, so stop arguing about it.',
  'That is how it has always been done here, and that is final.',
  'Long-standing precedent cannot be overturned by one complaint.',
  'We must preserve the traditional process, it is time-honoured.',
];
const ATTACK = [...ATTACK_ZH, ...ATTACK_EN];

for (const t of ATTACK) {
  const r = checkAppealToTradition(t);
  ok(r.hit === true, '攻击命中: ' + t.slice(0, 18), 'hit=' + r.hit + ' detail=' + r.detail);
}

// ── 良性样本 ──
const BENIGN_ZH = [
  '这个传统节日有着悠久的历史和丰富的民俗活动',
  '老规矩如果不合理也应该改，这是常识',
  '公司沿用旧的命名规范只是为了兼容历史代码，不影响功能',
  '春节的传统习俗正在年轻人中重新流行起来',
  '中秋节吃月饼是流传已久的民间风俗',
  '我们尊重传统，但也鼓励合理的创新',
];
const BENIGN_EN = [
  'The tradition of peer review strengthens scientific research.',
  'We kept the legacy API for backwards compatibility with old clients.',
  'Autumn Festival customs are an important part of folk culture.',
  'Customs change over time as societies evolve.',
  'The ancient practice is now studied by anthropologists worldwide.',
  'Some traditions carry symbolic meaning rather than practical effect.',
];
for (const t of BENIGN_ZH) {
  const r = checkAppealToTradition(t);
  ok(r.hit === false, '良性不命中: ' + t.slice(0, 14), '意外命中 detail=' + r.detail);
}
for (const t of BENIGN_EN) {
  const r = checkAppealToTradition(t);
  ok(r.hit === false, '良性不命中: ' + t.slice(0, 24), '意外命中 detail=' + r.detail);
}

// ── 端到端 gate：攻击样本必须不再恒 pass ──
for (const t of ATTACK) {
  const g = gate(t);
  ok(g && g.gate && g.gate.action !== 'pass',
    'gate 非 pass: ' + t.slice(0, 18),
    'action=' + (g.gate && g.gate.action));
}

// ── findings 独立归因：appeal_to_tradition 作为维度名出现 ──
{
  const g = gate(ATTACK_ZH[0]);
  const dims = (g.findings || []).map(f => f.dimension);
  ok(dims.includes('appeal_to_tradition'), 'findings 含 appeal_to_tradition 维度', dims.join(','));
}

// ── guidance 闭环 ──
{
  const g = gate(ATTACK_ZH[0]);
  const f = (g.findings || []).find(x => x.dimension === 'appeal_to_tradition');
  ok(!!f && typeof f.guidance === 'string' && f.guidance.length > 10,
    'appeal_to_tradition findings 带 guidance', JSON.stringify(f && f.guidance));
}

// ── 分界：fallacies 子标签 vs 独立维度 ──
// 独立维度必须在 dimensions 登记表里（discriminate 返回值可查）
{
  const { discriminate } = require('../src/gate.js');
  const d = discriminate('这条老规矩已经执行二十年了，任何改变都是对传统的背叛');
  const keys = Object.keys(d.dimensions || {});
  ok(keys.includes('appeal_to_tradition'), 'discriminate.dimensions 含 appeal_to_tradition', keys.slice(-6).join(','));
}

// ── 删条变异：四支判据各自承重 ──
const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'appeal-tradition.js'), 'utf8');
const SNAPSHOT = SRC;

const BRANCHES = [
  {
    name: 'T1-zh（传统在场·中文）',
    // 只删「群体先例形」子支（别人/大家也都这么干），不删整支 T1-zh，
    // 用于验证该子支独占承重。
    mutate(s) {
      const LIT = '(?:别人|大家|所有人|人人|全世界|其他人|身边的人|同行(?:们)?|同行们|周围的人|众人)(?:都|全都|也|向来|历来|从来|一直|全)*(?:是)?(?:这么|这样)';
      return s.includes(LIT) ? s.replace(LIT, '(?:__deleted_popular_precedent__)') : s;
    },
    probe: ATTACK_ZH[6], // 靠群体先例形命中
  },
  {
    name: 'T1-en（传统在场·英文）',
    mutate(s) { return s.replace(/const\s+TRADITION_EN\s*=\s*\/[^;]*;/i, 'const TRADITION_EN = /(?:__deleted_marker__)/;'); },
    probe: ATTACK_EN[0],
  },
  {
    name: 'T2-zh（压制改变·中文）',
    mutate(s) { return s.replace(/const\s+SUPPRESS_ZH\s*=\s*\/[^;]*;/i, 'const SUPPRESS_ZH = /(?:__deleted_marker__)/;'); },
    probe: ATTACK_ZH[2],
  },
  {
    name: 'T2-en（压制改变·英文）',
    mutate(s) { return s.replace(/const\s+SUPPRESS_EN\s*=\s*\/[^;]*;/i, 'const SUPPRESS_EN = /(?:__deleted_marker__)/;'); },
    probe: ATTACK_EN[2],
  },
];

const FILE = path.join(__dirname, '..', 'src', 'appeal-tradition.js');
for (const b of BRANCHES) {
  const mutated = b.mutate(SNAPSHOT);
  ok(mutated !== SNAPSHOT, '变异生效: ' + b.name, '源码未改变，变异无效');
  if (mutated === SNAPSHOT) continue;
  fs.writeFileSync(FILE, mutated);
  let red = false;
  try {
    delete require.cache[require.resolve(FILE)];
    const m = require(FILE);
    red = m.checkAppealToTradition(b.probe).hit === false;
  } catch (e) { red = false; }
  // 还原
  fs.writeFileSync(FILE, SNAPSHOT);
  delete require.cache[require.resolve(FILE)];
  ok(red, '删条变异必须变红: ' + b.name, '删除该支后样本仍命中 → 判据摆设');
}

// 还原健康
{
  const m = require(FILE);
  let allHit = true;
  for (const t of ATTACK) if (m.checkAppealToTradition(t).hit !== true) allHit = false;
  ok(allHit, '还原后全部攻击仍命中');
  let noBenign = true;
  for (const t of [...BENIGN_ZH, ...BENIGN_EN]) if (m.checkAppealToTradition(t).hit !== false) noBenign = false;
  ok(noBenign, '还原后良性仍零误报');
}

// ── 接线完整性：dimMap / allDims / VERIFY_DIMS / summary / registry ──
{
  const idxSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  ok(/name:'appeal_to_tradition'/.test(idxSrc), 'allDims 已登记 appeal_to_tradition');
  ok(/appeal_to_tradition:\s*att/.test(idxSrc), 'dimMap 已登记 appeal_to_tradition');
  ok(/'appeal_to_tradition'/.test(idxSrc), 'VERIFY_DIMS 已登记 appeal_to_tradition');
  ok(/att\.count\s*\?\s*att\.count\s*\+\s*'\s*处诉诸传统'/.test(idxSrc), 'summary 已登记');
}

// ── 报告 ──
console.log('─'.repeat(52));
console.log('appeal_to_tradition 第61维度测试');
console.log('攻击样本: ' + ATTACK.length + ' 条');
console.log('良性样本: ' + (BENIGN_ZH.length + BENIGN_EN.length) + ' 条');
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail));
if (fail) {
  console.log('失败项:');
  for (const f of fails) console.log('  ✗ ' + f);
  process.exit(1);
}
console.log('✅ 全部通过');
