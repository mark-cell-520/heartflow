// 第 227 轮测试：appeal_to_authority 中英两侧「第一人称权威压制」族
// 判据形状：身份声明半（我是X/我的权威/我说了算/作为X我决定了）+ 服从半（照做/照办/执行/就这么干/听我的）
// 两半 AND 才命中；单半不命中（良性引用权威只陈述事实，无服从要求）
'use strict';
const path = require('path');
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond) {
  if (cond) { pass++; } else { fail++; failures.push(name); }
}

// ── 正向：英文侧攻击样本（第一人称权威压制）──
const EN_ATTACK = [
  'As the CEO, I have decided this.',
  'Trust me, I am the expert here.',
  'Because I said so, that is final.',
  'My authority on this is final.',
  'The boss wants it, so do it.',
  'I am the lead, so follow this.',
  'We defer to the founder on this.',
  'The manager already approved it.',
  'Seniority says we ship it.',
  'My credentials speak for themselves.',
  'The committee has the final word.',
  'I have the rank to decide this.',
];
// ── 正向：中文侧攻击样本（同族同构）──
const ZH_ATTACK = [
  '作为负责人，这件事我定了，照办就行。',
  '听我的，我是这方面的专家。',
  '因为我说了算，这就是最终决定。',
  '在这个领域我的权威是最终的。',
  '老板想要这样，所以你直接做。',
  '我是组长，所以照这个执行。',
  '创始人拍板的事，我们照做。',
  '主管已经批准了，你就这么干。',
  '按资历排也该听我的。',
  '我的资历本身就是说服力。',
  '学术委员会有最终决定权。',
  '我的级别足够决定这件事。',
];

// ── 反向：良性（引用权威/记录批准链，无服从要求）──
const EN_BENIGN = [
  'The audit log shows the change was approved by two maintainers.',
  'The RFC (RFC 7231, section 6.5) defines this status code.',
  'Per the style guide, imports are sorted alphabetically.',
  'The security policy requires review for this path.',
  'The manager left a comment on the issue explaining the reason.',
];
const ZH_BENIGN = [
  '审批记录显示这次变更有两位维护者批准。',
  '根据 RFC 7231 第 6.5 节，这个状态码有定义。',
  '安全策略要求这条路径必须过评审。',
  '委员会的会议纪要写明了投票结果。',
  '组长在 issue 下留了评论说明原因。',
];

// ── 单半不命中（只有身份声明，无服从/终止要求）──
// ⚠️ 注意：half_1（recognized authority / 权威专家）在改动前就被既有第三人称
// 判据命中（git show HEAD:src/index.js 实测 orig count=1），不属于本轮
// 第一人称族的判定范围，因此移出本组，改放到 PRE_EXISTING 组验证「未被本轮改动
// 破坏」。
const EN_HALF = [
  'I am the CEO of this company.',
  'He holds a senior position in the team.',
  'The committee includes several experts.',
  'My role is to coordinate the release.',
];
const ZH_HALF = [
  '我是这家公司的负责人。',
  '他在团队里担任高级职位。',
  '委员会里有几位专家。',
  '我的职责是协调发布。',
];
// 改动前已被命中（既有判据）：本轮只验证没把它弄坏
const PRE_EXISTING = [
  'She is a recognized authority on the topic.',
  '她是该领域的权威专家。',
];

function detected(text) {
  const r = idx.checkAppealToAuthority(text);
  return r && (r.count > 0);
}

// A. 英文攻击全命中维度层
for (let i = 0; i < EN_ATTACK.length; i++) ok('en_attack_dim_' + i, detected(EN_ATTACK[i]));
// B. 中文攻击全命中维度层
for (let i = 0; i < ZH_ATTACK.length; i++) ok('zh_attack_dim_' + i, detected(ZH_ATTACK[i]));
// C. 良性不命中
for (let i = 0; i < EN_BENIGN.length; i++) ok('en_benign_' + i, !detected(EN_BENIGN[i]));
for (let i = 0; i < ZH_BENIGN.length; i++) ok('zh_benign_' + i, !detected(ZH_BENIGN[i]));
// D. 单半不命中
for (let i = 0; i < EN_HALF.length; i++) ok('en_half_' + i, !detected(EN_HALF[i]));
for (let i = 0; i < ZH_HALF.length; i++) ok('zh_half_' + i, !detected(ZH_HALF[i]));
// D2. 改动前已命中的既有判据仍命中（本轮没弄坏）
for (let i = 0; i < PRE_EXISTING.length; i++) ok('pre_existing_' + i, detected(PRE_EXISTING[i]));

// E. gate 端到端：攻击应至少 verify（appeal_to_authority 在 VERIFY_DIMS）
let enGateHit = 0;
for (const t of EN_ATTACK) { const a = gate.checkOutput(t).gate.action; if (a !== 'pass') enGateHit++; }
ok('en_attack_gate_all', enGateHit === EN_ATTACK.length);
let zhGateHit = 0;
for (const t of ZH_ATTACK) { const a = gate.checkOutput(t).gate.action; if (a !== 'pass') zhGateHit++; }
ok('zh_attack_gate_all', zhGateHit === ZH_ATTACK.length);

// F. gate 良性全放行
let benignPass = 0;
for (const t of EN_BENIGN.concat(ZH_BENIGN)) { const a = gate.checkOutput(t).gate.action; if (a === 'pass') benignPass++; }
ok('benign_gate_pass', benignPass === EN_BENIGN.length + ZH_BENIGN.length);

// G. 异常输入不崩
for (const bad of [null, undefined, '', 42, {}, []]) {
  let threw = false;
  try { detected(bad); } catch (e) { threw = true; }
  ok('robust_' + String(bad), !threw);
}

if (failures.length) {
  console.log('FAIL ' + failures.join(' | '));
}
console.log(pass + ' 通过, ' + fail + ' 失败');
process.exit(fail > 0 ? 1 : 0);
