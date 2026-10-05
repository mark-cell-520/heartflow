/**
 * round-486 测试：第 62 维度 appeal_to_ignorance 诉诸无知 / 举证责任倒置
 *
 * 接手上轮（round-485）遗留：src/appeal-to-ignorance.js 当时是未接线的孤岛模块，
 * 本轮补齐 index.js 七处接线 + 收口最后一条穿透（"没有证据表明他撒了谎"形）。
 *
 * 断言分层：
 *   ① 攻击命中：中英文共 14 条攻击样本，本维度全部独立命中
 *   ② 良性零误报：正当举证责任陈述/研究待证状态/评析该论证 一律不命中
 *   ③ 端到端 gate：命中后 gate.action 不再恒为 pass
 *   ④ findings 独立归因：appeal_to_ignorance 作为维度名出现（不与 fallacies 混）
 *   ⑤ guidance 闭环：findings 带可执行指引
 *   ⑥ 删条变异：BURDEN_ZH / CONCLUDE_ZH / BURDEN_EN / CONCLUDE_EN 四支各自承重
 *   ⑦ 还原健康：还原后判据全部仍生效
 *   ⑧ 接线完整性：require / allDims / dimMap / VERIFY_DIMS / summary / dimensions
 */
'use strict';
const path = require('path');
const fs = require('fs');

const { checkAppealToIgnorance } = require('../src/appeal-to-ignorance.js');
const { gate, discriminate } = require('../src/gate.js');

let pass = 0, fail = 0;
const fails = [];
function ok(cond, name, extra) {
  if (cond) { pass++; }
  else { fail++; fails.push(name + (extra ? ' — ' + extra : '')); }
}

// ── ① 攻击样本（形状描述，源自 round-485-check.js 的 14 条族样本）──
const ATTACK_ZH = [
  '你证明不了它是假的，那就是真的',
  '没人能证明这个方案有问题，所以可以放心上',
  '既然你找不到反驳的理由，就说明我说得对',
  '除非你拿出证据，否则这就是事实',
  '你又拿不出证据说他有问题，那就说明他是清白的',
  '没有证据表明他撒了谎，所以他说的是实话',
  '找不出反对的理由，就按我说的办',
  '没人能拿出反例，这就可以推广了',
  '这么多年没出过事，说明它是安全的',
  '至今没人投诉，证明我们做对了',
  '至今没有反证，那就是成立的',
];
const ATTACK_EN = [
  'You cannot prove this is wrong, therefore it is right.',
  'Nobody has shown this to be false, so we treat it as true.',
  'No one has ever complained, so it must be fine.',
];
const ATTACK = [...ATTACK_ZH, ...ATTACK_EN];

for (const t of ATTACK) {
  const r = checkAppealToIgnorance(t);
  ok(r.hit === true, '攻击命中: ' + t.slice(0, 18), 'hit=' + r.hit + ' detail=' + r.detail);
}

// ── ② 良性样本：不得命中 ──
const BENIGN_ZH = [
  '谁主张谁举证是基本原则',
  '目前没有证据表明两者相关',
  '诉诸无知是一种逻辑谬误',
  '这个理论目前缺乏实验证据，需要进一步研究',
  '法院判决要求被告自证清白是程序倒置',
  '我们还没有找到病因，不能下结论',
  '该药物的副作用尚无大规模临床数据支持',
  '谁质疑谁举证，但前提是双方都在同一证据标准上',
];
const BENIGN_EN = [
  'The burden of proof lies with the claimant.',
  'Appeal to ignorance is a logical fallacy.',
  'No evidence has been found yet, so we need more research.',
  'Researchers have not yet replicated this result.',
];
for (const t of BENIGN_ZH) {
  const r = checkAppealToIgnorance(t);
  ok(r.hit === false, '良性不命中: ' + t.slice(0, 14), '意外命中 detail=' + r.detail);
}
for (const t of BENIGN_EN) {
  const r = checkAppealToIgnorance(t);
  ok(r.hit === false, '良性不命中: ' + t.slice(0, 24), '意外命中 detail=' + r.detail);
}

// ── ③ 端到端 gate：命中后不得恒 pass ──
for (const t of ATTACK) {
  const g = gate(t);
  ok(g && g.gate && g.gate.action !== 'pass',
    'gate 非 pass: ' + t.slice(0, 18),
    'action=' + (g.gate && g.gate.action));
}

// ── ④ findings 独立归因 ──
{
  const g = gate(ATTACK_ZH[0]);
  const dims = (g.findings || []).map(f => f.dimension);
  ok(dims.includes('appeal_to_ignorance'), 'findings 含 appeal_to_ignorance 维度', dims.join(','));
}

// ── ⑤ guidance 闭环 ──
{
  const g = gate(ATTACK_ZH[0]);
  const f = (g.findings || []).find(x => x.dimension === 'appeal_to_ignorance');
  ok(!!f && typeof f.guidance === 'string' && f.guidance.length > 10,
    'appeal_to_ignorance findings 带 guidance', JSON.stringify(f && f.guidance));
}

// ── 分界：独立维度必须在 dimensions 登记表里可查 ──
{
  const d = discriminate(ATTACK_ZH[0]);
  const keys = Object.keys(d.dimensions || {});
  ok(keys.includes('appeal_to_ignorance'), 'discriminate.dimensions 含 appeal_to_ignorance', keys.slice(-6).join(','));
}

// ── ⑥ 删条变异：四支判据各自承重 ──
const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'appeal-to-ignorance.js'), 'utf8');
const SNAPSHOT = SRC;
const FILE = path.join(__dirname, '..', 'src', 'appeal-to-ignorance.js');

const BRANCHES = [
  {
    name: 'BURDEN_ZH（举证责任在场·中文）',
    mutate(s) { return s.replace(/const\s+BURDEN_ZH\s*=\s*\/[^;]*;/i, 'const BURDEN_ZH = /(?:__deleted_marker__)/;'); },
    probe: ATTACK_ZH[0],
  },
  {
    name: 'CONCLUDE_ZH（推定成立·中文）',
    mutate(s) { return s.replace(/const\s+CONCLUDE_ZH\s*=\s*\/[^;]*;/i, 'const CONCLUDE_ZH = /(?:__deleted_marker__)/;'); },
    probe: ATTACK_ZH[0],
  },
  {
    name: 'BURDEN_EN（举证责任在场·英文）',
    mutate(s) { return s.replace(/const\s+BURDEN_EN\s*=\s*\/[^;]*;/i, 'const BURDEN_EN = /(?:__deleted_marker__)/i;'); },
    probe: ATTACK_EN[0],
  },
  {
    name: 'CONCLUDE_EN（推定成立·英文）',
    mutate(s) { return s.replace(/const\s+CONCLUDE_EN\s*=\s*\/[^;]*;/i, 'const CONCLUDE_EN = /(?:__deleted_marker__)/i;'); },
    probe: ATTACK_EN[0],
  },
];

for (const b of BRANCHES) {
  const mutated = b.mutate(SNAPSHOT);
  ok(mutated !== SNAPSHOT, '变异生效: ' + b.name, '源码未改变，变异无效');
  if (mutated === SNAPSHOT) continue;
  fs.writeFileSync(FILE, mutated);
  let red = false;
  try {
    delete require.cache[require.resolve(FILE)];
    const m = require(FILE);
    red = m.checkAppealToIgnorance(b.probe).hit === false;
  } catch (e) { red = false; }
  fs.writeFileSync(FILE, SNAPSHOT);
  delete require.cache[require.resolve(FILE)];
  ok(red, '删条变异必须变红: ' + b.name, '删除该支后样本仍命中 → 判据摆设');
}

// ── ⑦ 还原健康 ──
{
  const m = require(FILE);
  let allHit = true;
  for (const t of ATTACK) if (m.checkAppealToIgnorance(t).hit !== true) allHit = false;
  ok(allHit, '还原后全部攻击仍命中');
  let noBenign = true;
  for (const t of [...BENIGN_ZH, ...BENIGN_EN]) if (m.checkAppealToIgnorance(t).hit !== false) noBenign = false;
  ok(noBenign, '还原后良性仍零误报');
}

// ── ⑧ 接线完整性 ──
{
  const idxSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  ok(/require\('\.\/appeal-to-ignorance\.js'\)/.test(idxSrc), 'index.js 已 require appeal-to-ignorance.js');
  ok(/name:'appeal_to_ignorance'/.test(idxSrc), 'allDims 已登记 appeal_to_ignorance');
  ok(/appeal_to_ignorance:\s*aig/.test(idxSrc), 'dimMap 已登记 appeal_to_ignorance');
  ok(/'appeal_to_ignorance'/.test(idxSrc), 'VERIFY_DIMS 已登记 appeal_to_ignorance');
  ok(/aig\.count\s*\?\s*aig\.count\s*\+\s*'\s*处诉诸无知\/举证倒置'/.test(idxSrc), 'summary 已登记');
  ok(/checkAppealToIgnorance\(_normText\)/.test(idxSrc), 'pipeline 调用行已接线');
}

// ── 报告 ──
console.log('─'.repeat(52));
console.log('appeal_to_ignorance 第62维度测试');
console.log('攻击样本: ' + ATTACK.length + ' 条');
console.log('良性样本: ' + (BENIGN_ZH.length + BENIGN_EN.length) + ' 条');
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail));
if (fail) {
  console.log('失败项:');
  for (const f of fails) console.log('  x ' + f);
  process.exit(1);
}
console.log('全部通过');
