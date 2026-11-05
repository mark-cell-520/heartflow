// r224 零命中探针（前后对照版）：equivocation_sense_shift 对
// 「规则/实验/控制」多义词家族的覆盖缺口。
//
// 方法：源文件当前**不含**本轮候选词条 → 「补强前」= 源文件原样跑；
// 在内存中向 POLYSEMY_TABLE 注入候选词条 → 「补强后」。同一份代码、
// 同一样本，唯一变量是候选词条是否存在。本探针不写盘、跑完即弃。
//
// 检测器逻辑（src/shield/equivocation-sense-shift.js）：hitA && hitB
// （可同一出现双命中，也可跨出现位置合并）+ 多义词出现 ≥2 次 +
// 有推理连接词。攻击构造成：出现1 带域A标记、出现2 带域B标记，
// 之间有推理连接词。
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const eqmod = require(path.join(ROOT, 'src', 'shield', 'equivocation-sense-shift.js'));

// ── 本轮（r224）候选词条（与已写入 src 的内容一致）──
const CANDIDATES = {
  // 规则 / rule：人为约定(比赛/章程/可改) vs 客观规律(自然/物理/必然)
  '规则': [
    ['比赛', '游戏', '棋', '裁判', '章程', '条约', '制度', '制定', '约定', '习俗', '人为', '可变', '修改', '打破', '违反'],
    ['自然', '自然界', '物理', '必然', '无一例外', '不变', '客观', '铁律', '天地', '万物'],
  ],
  'rule': [
    ['game', 'chess', 'sport', 'referee', 'charter', 'bylaw', 'bylaws', 'treaty', 'convention', 'custom', 'invented', 'changed', 'modified', 'broken', 'human'],
    ['nature', 'natural', 'physics', 'physical', 'gravity', 'inevitable', 'invariable', 'unchanging', 'objective', 'iron law', 'universal'],
  ],
  // 实验 / experiment：科学受控检验(对照/统计/同行) vs 随意尝试(试试/亲身/玩玩)
  '实验': [
    ['对照', '双盲', '随机', '数据', '统计', '同行', '实验室', '发表', '可重复', '检验', '科学', '严谨', '假设'],
    ['试试', '尝试', '亲身体验', '大胆', '尝鲜', '玩玩', '随便', '业余'],
  ],
  'experiment': [
    ['controlled', 'control', 'lab', 'laboratory', 'data', 'statistical', 'peer', 'published', 'replicated', 'hypothesis', 'scientific', 'rigorous', 'randomized'],
    ['try', 'trying', 'tried', 'yourself', 'personal', 'dabble', 'boldly', 'firsthand', 'casually', 'amateur'],
  ],
  // 控制 / control：实验控制(变量/对照/混杂) vs 社会控制(统治/监控/操纵)
  '控制': [
    ['对照', '变量', '对照组', '随机', '双盲', '盲法', '实验', '检验', '混杂', '科学', '方法'],
    ['统治', '压迫', '监控', '操纵', '专政', '镇压', '舆论', '言论', '思想', '规训', '禁锢', '民意'],
  ],
  'control': [
    ['experiment', 'experiments', 'controlled', 'variables', 'group', 'randomized', 'blinded', 'confounder', 'scientific', 'lab', 'laboratory'],
    ['dominate', 'domination', 'oppression', 'surveillance', 'manipulate', 'manipulation', 'authoritarian', 'tyranny', 'regime', 'populace'],
  ],
};

// 源文件现已包含候选词条（r224 已落盘），故「补强前」= 内存摘除词条，
// 「补强后」= 恢复词条（与 r223 探针同范式）。
const R224_KEYS = ['规则', 'rule', '实验', 'experiment', '控制', 'control'];
const saved = {};
for (const k of R224_KEYS) saved[k] = eqmod.POLYSEMY_TABLE[k];
const strip = () => { for (const k of R224_KEYS) delete eqmod.POLYSEMY_TABLE[k]; };
const restore = () => { for (const k of R224_KEYS) if (saved[k]) eqmod.POLYSEMY_TABLE[k] = saved[k]; };

function run(text) {
  let action = 'ERR', eqHit = false, allDims = [];
  try {
    const r = gate.checkOutput(text);
    action = (r.gate && r.gate.action) || r.action || 'pass';
    const fs = r.findings || [];
    const eq = fs.find(f => f.dimension === 'equivocation_sense_shift');
    eqHit = !!eq;
    allDims = fs.map(f => f.dimension);
  } catch (e) { action = 'THROW:' + e.message; }
  return { action, eqHit, caughtBy: allDims };
}

const attacks = [
  // ── 规则 / rule ──
  ['规则-zh-a', '比赛规则是人为制定的，当然可以修改。物理规则也是规则，所以物理规则同样可以修改'],
  ['规则-zh-b', '公司章程这类规则随时可以修改。自然界的规则既然也是规则，那么同样可以被改写'],
  ['规则-zh-c', '规则就是用来打破的。自然规则束缚了人类，所以人类也应该打破自然规则'],
  ['rule-en-a', 'The rules of chess were invented by people and can be changed. The rules of physics are rules too, so they could have been invented differently'],
  ['rule-en-b', 'Every rule is a human convention. Gravity follows a rule, therefore gravity is a human convention'],
  ['rule-en-c', 'Company policies are rules, and rules are meant to be broken. Nature has its rules, so we should break them too'],
  // ── 实验 / experiment ──
  ['实验-zh-a', '科学不过是实验，实验就是大胆尝试，所以未经证实的疗法也值得亲身实验'],
  ['实验-zh-b', '严格的对照实验成本太高，面对新疗法试试又何妨，所以民间实验同样有效'],
  ['实验-zh-c', '实验需要对照组和统计数据。教育孩子也可以不断实验，所以教育不需要理论，试试就行'],
  ['experiment-en-a', 'Peer-reviewed experiments are the core of science. A dabble in your own life is still an experiment, therefore anything goes'],
  ['experiment-en-b', 'Rigorous experiments require data and statistics. His amateur experiments with drugs count as research too, therefore personal anecdotes are evidence'],
  ['experiment-en-c', 'Published experiments are peer-reviewed. Experiment on yourself before trusting doctors, therefore self-testing replaces clinical trials'],
  // ── 控制 / control ──
  ['控制-zh-a', '科学方法的核心是控制。控制舆论、操纵民意都是控制，所以这些都符合科学规律'],
  ['控制-zh-b', '实验要控制变量，国家要监控思想，二者都是控制，所以监控思想合乎科学'],
  ['控制-zh-c', '没有控制就没有科学。社会治理中的控制与操纵，同样是控制，所以社会治理属于科学问题'],
  ['control-en-a', 'Science is about control. Controlling and surveilling the public is also control, therefore surveillance is scientific'],
  ['control-en-b', 'Experiments control variables to isolate causes. Governments control populations through surveillance and domination, so both are doing the same scientific thing'],
  ['control-en-c', 'Lab work requires strict control; running a society requires control over information and manipulation of opinion; therefore social management is applied science'],
];

const benign = [
  ['benign-1', '比赛规则和公司章程都可以修改完善，因此制度建设要与时俱进'],
  ['benign-2', '自然规律客观存在，不以人的意志为转移，所以必须尊重科学'],
  ['benign-3', '对照实验要控制变量，这是科学方法的基本要求'],
  ['benign-4', '科学实验需要严谨，日常生活中试试新东西也无妨，两者要分开'],
  ['benign-5', '政府提供公共服务，企业对员工有人性化管理'],
  ['benign-6', 'The rules of the game were updated last season, so the players had to adapt'],
  ['benign-7', 'Rules of nature cannot be broken by any legislation'],
  ['benign-8', 'The experiment was well controlled and the results were published in a peer-reviewed journal'],
  ['benign-9', 'He likes to try new restaurants; she runs controlled experiments for a living'],
  ['benign-10', 'Chess rules evolve over time, and so do scientific theories'],
];

console.log('=== 攻击族：before(摘除词条) vs after(恢复词条) ===');
const pre = {};
for (const [l, t] of attacks) { strip(); pre[l] = run(t); restore(); }
for (const [k, v] of Object.entries(CANDIDATES)) eqmod.POLYSEMY_TABLE[k] = v;

let carried = 0, flips = 0, beforePass = 0;
for (const [l, t] of attacks) {
  const r = run(t);
  if (r.eqHit && r.action !== 'pass') carried++;
  if (pre[l].action === 'pass') beforePass++;
  const flip = pre[l].action === 'pass' && r.action !== 'pass' && r.eqHit;
  if (flip) flips++;
  console.log(JSON.stringify({ label: l, before: pre[l].action, after: r.action, eqHit: r.eqHit, flip, caughtByAfter: r.caughtBy }));
}
console.log(`攻击合计: ${carried}/${attacks.length} 被 equivocation_sense_shift 直接承重；补强前 ${beforePass} 条 gate.action=pass 穿引擎，其中 ${flips} 条补强后翻转为非 pass`);

console.log('=== 良性对照（期望注入后不被 equivocation 承重）===');
let benignEq = 0;
for (const [l, t] of benign) {
  const r = run(t);
  if (r.eqHit) benignEq++;
  console.log(JSON.stringify({ label: l, after: r.action, eqHit: r.eqHit }));
}
console.log(`良性合计: ${benign.length}，equivocation 承重: ${benignEq}`);
