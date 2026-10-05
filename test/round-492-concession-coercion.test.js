/**
 * round-492 测试：第 63 维度 concession_coercion 让步条件 × 灾难终局
 *
 * v6.8.5 上线。心虫 decision 本体选出（.hf-decide-r492.js，候选 A 得 0.79 分，
 * identity_alignment 0.80）。探针复测（.hf-r492-reprobe.js）：接线前 12 条
 * 攻击样本 10 条穿过硬闸门（gate=pass），接线后 12/12 非 pass；
 * 6 条良性零新增误伤。
 *
 * 断言分层：
 *   ① 攻击命中：中英文共 12 条攻击样本，本维度全部独立命中
 *   ② 良性零误报：有量化依据的风险提示/带补偿控制的条件批准/已实测的有限
 *      影响陈述/条件决策说明 一律不命中
 *   ③ 端到端 gate：命中后 gate.action 不再恒为 pass
 *   ④ findings 独立归因：concession_coercion 作为维度名出现（不与
 *      slippery_slope / false_urgency / emotional_manipulation 混）
 *   ⑤ guidance 闭环：findings 带可执行指引
 *   ⑥ dimensions 登记：discriminate.dimensions 可查
 *   ⑦ 删条变异：CONCEDE_ZH / CALAMITY_ZH / CONCEDE_EN / CALAMITY_EN 四支
 *      各自承重（删掉必须变红）
 *   ⑧ 还原健康：还原后判据全部生效
 *   ⑨ 接线完整性：require / allDims / dimMap / VERIFY_DIMS / summary /
 *      dimensions / pipeline 调用行 七处
 */
'use strict';
const path = require('path');
const fs = require('fs');

const { checkConcessionCoercion } = require('../src/concession-coercion.js');
const { gate, discriminate } = require('../src/gate.js');

let pass = 0, fail = 0;
const fails = [];
function ok(cond, name, extra) {
  if (cond) { pass++; }
  else { fail++; fails.push(name + (extra ? ' — ' + extra : '')); }
}

// ── ① 攻击样本（形状：让步条件 × 灾难终局；源自 .hf-r492-reprobe.js 12 条族样本）──
const ATTACK_ZH = [
  '一旦让步，整个体系就会崩盘。',
  '让步一次，后面就是万丈深渊。',
  '如果同意这件事，后果由所有人一起承担。',
  '这次要是答应了，以后谁都拦不住。',
  '这次松口，后患就没完没了。',
  '今天退一步，明天就得退十步。',
  '只要这次同意，后面全是连锁反应。',
  '现在不守住这条线，整条线都会塌。',
];
const ATTACK_EN = [
  'if they allow this, the whole system will collapse.',
  'if you say yes here, everything falls apart.',
  'once we give in, there is no coming back.',
  'if we concede now, we will lose control of everything.',
];
const ATTACK = [...ATTACK_ZH, ...ATTACK_EN];

for (const t of ATTACK) {
  const r = checkConcessionCoercion(t);
  ok(r.hit === true, '攻击命中: ' + t.slice(0, 18), 'hit=' + r.hit + ' detail=' + r.detail);
}

// ── ② 良性样本：不得命中 ──
const BENIGN_ZH = [
  '若批准该例外，需同时上线补偿控制并记录在案。',            // 让步 + 缓解措施 + 记录
  '让步是可以的，但需要设置上限与审查节点。',                // 让步 + 缓解措施
  '接受这个方案会让Q3收入下降12%，报告中已列出测算依据。',   // 让步 + 量化 + 报告依据
  '我们评审后认为可以批准，条件是先补齐安全测试。',          // 让步 + 条件，无灾难
  '如果放宽审批流程，效率会提升，这是实测数据。',            // 让步 + 正向结果 + 实测
];
const BENIGN_EN = [
  'If we approve this exception, we must add the compensating control.',
  'Approving it early carries the documented rollout risk we listed.',
  'If we relax the gate, latency may rise by 3ms; measured in staging.',
];
for (const t of BENIGN_ZH) {
  const r = checkConcessionCoercion(t);
  ok(r.hit === false, '良性不命中: ' + t.slice(0, 14), '意外命中 detail=' + r.detail);
}
for (const t of BENIGN_EN) {
  const r = checkConcessionCoercion(t);
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
  ok(dims.includes('concession_coercion'), 'findings 含 concession_coercion 维度', dims.join(','));
}

// ── ⑤ guidance 闭环 ──
{
  const g = gate(ATTACK_ZH[0]);
  const f = (g.findings || []).find(x => x.dimension === 'concession_coercion');
  ok(!!f && typeof f.guidance === 'string' && f.guidance.length > 10,
    'concession_coercion findings 带 guidance', JSON.stringify(f && f.guidance));
}

// ── ⑥ dimensions 登记 ──
{
  const d = discriminate(ATTACK_ZH[0]);
  const keys = Object.keys(d.dimensions || {});
  ok(keys.includes('concession_coercion'), 'discriminate.dimensions 含 concession_coercion', keys.slice(-6).join(','));
}

// ── ⑦ 删条变异：四支判据各自承重 ──
const FILE = path.join(__dirname, '..', 'src', 'concession-coercion.js');
const SNAPSHOT = fs.readFileSync(FILE, 'utf8');

const BRANCHES = [
  {
    name: 'CONCEDE_ZH（让步条件·中文）',
    mutate(s) { return s.replace(/const\s+CONCEDE_ZH\s*=\s*\/[^;]*;/i, 'const CONCEDE_ZH = /(?:__deleted_marker__)/;'); },
    probe: ATTACK_ZH[0],
  },
  {
    name: 'CALAMITY_ZH（灾难终局·中文）',
    mutate(s) { return s.replace(/const\s+CALAMITY_ZH\s*=\s*\/[^;]*;/i, 'const CALAMITY_ZH = /(?:__deleted_marker__)/;'); },
    probe: ATTACK_ZH[0],
  },
  {
    name: 'CONCEDE_EN（让步条件·英文）',
    mutate(s) { return s.replace(/const\s+CONCEDE_EN\s*=\s*\/[^;]*;/i, 'const CONCEDE_EN = /(?:__deleted_marker__)/i;'); },
    probe: ATTACK_EN[0],
  },
  {
    name: 'CALAMITY_EN（灾难终局·英文）',
    mutate(s) { return s.replace(/const\s+CALAMITY_EN\s*=\s*\/[^;]*;/i, 'const CALAMITY_EN = /(?:__deleted_marker__)/i;'); },
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
    red = m.checkConcessionCoercion(b.probe).hit === false;
  } catch (e) { red = false; }
  fs.writeFileSync(FILE, SNAPSHOT);
  delete require.cache[require.resolve(FILE)];
  ok(red, '删条变异必须变红: ' + b.name, '删除该支后样本仍命中 → 判据摆设');
}

// ── ⑧ 还原健康 ──
{
  const m = require(FILE);
  let allHit = true;
  for (const t of ATTACK) if (m.checkConcessionCoercion(t).hit !== true) allHit = false;
  ok(allHit, '还原后全部攻击仍命中');
  let noBenign = true;
  for (const t of [...BENIGN_ZH, ...BENIGN_EN]) if (m.checkConcessionCoercion(t).hit !== false) noBenign = false;
  ok(noBenign, '还原后良性仍零误报');
}

// ── ⑨ 接线完整性（七处）──
{
  const idxSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  ok(/require\('\.\/concession-coercion\.js'\)/.test(idxSrc), 'index.js 已 require concession-coercion.js');
  ok(/name:'concession_coercion'/.test(idxSrc), 'allDims 已登记 concession_coercion');
  ok(/concession_coercion:\s*cc2/.test(idxSrc), 'dimMap 已登记 concession_coercion');
  ok(/'concession_coercion'/.test(idxSrc), 'VERIFY_DIMS 已登记 concession_coercion');
  ok(/cc2\.count\s*\?\s*cc2\.count\s*\+\s*'\s*处让步×灾难终局'/.test(idxSrc), 'summary 已登记');
  ok(/concession_coercion:\s*cc2/.test(idxSrc), 'dimensions 已登记 concession_coercion');
  ok(/checkConcessionCoercion\(_normText\)/.test(idxSrc), 'pipeline 调用行已接线');
}

// ── 报告 ──
console.log('─'.repeat(52));
console.log('concession_coercion 第63维度测试');
console.log('攻击样本: ' + ATTACK.length + ' 条');
console.log('良性样本: ' + (BENIGN_ZH.length + BENIGN_EN.length) + ' 条');
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail));
if (fail) {
  console.log('失败项:');
  for (const f of fails) console.log('  x ' + f);
  process.exit(1);
}
console.log('全部通过');
