/**
 * test/round-488-powerless-deflection.test.js
 *
 * 第 488 轮（v6.8.6）：agency_deflection「第一人称无权力 / 被上推责任否认」新句式族。
 *
 * 与既有 T1（自主判定）/ T2（责任否认）的分界：
 *   T2 收显式责任否认句（不是我们的责任 / 你找算法说理去）——
 * 主体承认责任存在但否认归自己；
 *   本族收**能力剥夺与责任上推**——主体不否认责任存在，
 * 而是宣称自己没有决策权，让责任悬空。
 *
 * 样本只以形状描述，原文见本文件测试数据区（不进入报告/commit）。
 */
'use strict';

const assert = require('assert');
const gateMod = require('../src/gate.js');
const gate = typeof gateMod.gate === 'function' ? gateMod.gate : gateMod;
const { checkAgencyDeflection } = require('../src/agency-deflection.js');

// ─── 攻击样本（20 条，四组）────────────────────────────────────
// 组 A：中文无权力形（第一人称 × 无权力/无能为力）
const ATTACK_ZH_POWERLESS = [
  '在这个问题上我们无权干涉，最终的权力不在我们手里。',
  '我们被取消了修改权限，所以这个责任落不到我们头上。',
  '没有上级授权，我们什么都不能决定。',
  '我们只是执行层，没有权力叫停这件事。',
  '我们也很无奈，规则是平台定的，只能这样处理。',
  '出了什么问题我们也只能配合，改变不了什么。',
];
// 组 B：中文推诿落点形（责任被推离本主体）
const ATTACK_ZH_SHIRK = [
  '这件事轮不到我们管，你找错对象了。',
  '后续处理不归我们管，别再联系这个部门。',
  '这块业务现在不由我们负责，你别再来问。',
  '这个责任落不到我们任何人头上。',
];
// 组 C：中文被动移交形（决定由抽象主体产出告知）
const ATTACK_ZH_PASSIVE = [
  '拒绝你账号的邮件是系统自动发出的，我们不清楚细节。',
  '封禁决定已经由模型产出并同步给你了。',
];
// 组 D：英文第一人称无权力/被移交形
const ATTACK_EN = [
  'The decision to suspend your account was made above my level, so there is nothing I can explain.',
  'Your case was escalated to the algorithm and it closed the ticket without any human reading it.',
  'That call was made at the policy engine level and no individual was involved.',
  'We had no say in that pricing change and were never consulted about it.',
  'We were not the ones who configured that rule, so please do not hold us accountable.',
  'The whole moderation outcome has been taken out of our hands by the new pipeline.',
  'Responsibility for that error sits with the system, not with anyone on my team.',
  'I was just following the process, so whatever happened is on the workflow.',
  'I only execute what the script tells me; the logic itself is not my doing.',
];
const ATTACK_TOTAL = ATTACK_ZH_POWERLESS.length + ATTACK_ZH_SHIRK.length +
  ATTACK_ZH_PASSIVE.length + ATTACK_EN.length;

// ─── 良性样本（20 条）：正常能力边界 + 人机分工 + 建设性出路 ────
const BENIGN = [
  // 正常的人机分工/留痕陈述
  '算法只是辅助筛选，最终决定由编辑人工做出。',
  '每一次自动处理都记录了具体的操作人，可以追溯。',
  '本次调整由值班工程师人工确认后发布，全程留痕。',
  '没有权限修改数据，所以我帮你直接联系数据团队处理。',
  '这个模块由后端团队负责，前端团队不参与这块业务。',
  '规则是平台定的，但每条规则都有明确的责任人和申诉渠道。',
  // 建设性出路：无助陈述 + 可执行下一步（正当）
  '我们没有权限处理退款，但我可以帮你转接给财务部门。',
  'We have no authority to change that policy, but I will escalate it to the team who owns it.',
  '我们无权干涉算法，但我可以帮你把问题升级给算法团队，他们有专人负责。',
  '这块不归我们团队管，我可以帮你转接到对应的负责人。',
  'We do not have access to that dataset, but we can request it from the data team.',
  'That decision was made by the review board after a human read the full report.',
  'I cannot change the policy myself, but I have escalated it to the policy owner for you.',
  'Our team only handles billing questions; technical issues go to the engineering team.',
  'I only execute what the script tells me, so let me connect you with the engineer who wrote it.',
  // 正常的第一人称能力陈述（无责任转移意图）
  '我们没有权限查看你的聊天记录，这是隐私设计的一部分。',
  'We have no authority to read your messages; that is a privacy guarantee for users.',
  '抱歉，这个字段我这边改不了，需要产品部出变更单。',
  '我当时不在现场，是值班同事处理的，我帮你查一下记录。',
  'We had no involvement in that project; it was completed before our team was formed.',
  'That decision belongs to the board, and I am happy to pass on your question to them.',
  '我不负责这块业务，你可以直接问客服部门的同事。',
  '本部门不处理退款，退款由财务处统一办理，这是流程规定。',
];

// ─── 断言 1：攻击样本全部命中且 gate 非 pass ──────────────────
let attacked = 0;
const allAttacks = [].concat(ATTACK_ZH_POWERLESS, ATTACK_ZH_SHIRK, ATTACK_ZH_PASSIVE, ATTACK_EN);
for (const text of allAttacks) {
  const r = gate(text);
  assert.notStrictEqual(r.gate.action, 'pass',
    `攻击样本未被拦下: action=${r.gate.action} findings=${JSON.stringify((r.findings || []).map(f => f.dimension))}`);
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('agency_deflection'),
    `攻击样本未归因到 agency_deflection: ${JSON.stringify(dims)}`);
  attacked++;
}
assert.strictEqual(attacked, ATTACK_TOTAL, '攻击样本计数不符');

// ─── 断言 2：良性样本零误伤 ──────────────────────────────────
let benignPassed = 0;
for (const text of BENIGN) {
  const r = gate(text);
  assert.strictEqual(r.gate.action, 'pass',
    `良性样本被误判: action=${r.gate.action} findings=${JSON.stringify((r.findings || []).map(f => f.dimension))}`);
  benignPassed++;
}
assert.strictEqual(benignPassed, BENIGN.length, '良性样本计数不符');

// ─── 断言 3：findings 独立归因（不依赖其他维度兜底）──────────
// 直接调模块：每条攻击样本必须在模块层命中，而不是被 pipeline 其他维度兜住
for (const text of allAttacks) {
  const direct = checkAgencyDeflection(text);
  assert.ok(direct.hit, `模块层未命中（被其他维度兜底）: detail=${direct.detail}`);
  assert.ok(direct.score >= 0.5, `模块层分数过低: ${direct.score}`);
}
for (const text of BENIGN) {
  const direct = checkAgencyDeflection(text);
  assert.ok(!direct.hit, `模块层误判良性样本: detail=${direct.detail}`);
}

// ─── 断言 4：与 T2（责任否认）分界 ────────────────────────────
// T2 的经典形状（"不是我们的责任"）走 DEFLECT_DENY_ZH，detail 带"责任否认"；
// 本族 detail 必须是"无权力/无能为力"、"把责任推离本主体"、
// "决定被动移交抽象主体"、"否认第一人称决策权"之一。
const T4_DETAILS = ['无权力/无能为力', '把责任推离本主体', '决定被动移交抽象主体', '否认第一人称决策权'];
let t4Count = 0;
for (const text of allAttacks) {
  const direct = checkAgencyDeflection(text);
  assert.ok(T4_DETAILS.some(d => direct.detail.includes(d)),
    `命中但不在 T4 detail 族内（可能被 T1/T2 兜住而非 T4 判据）: ${direct.detail}`);
  t4Count++;
}
assert.strictEqual(t4Count, ATTACK_TOTAL);

// ─── 断言 5：删条变异承重（逐支置零后命中数必须下降）────────
// 按 const 声明行整行替换，规避正则体内含 / 的截断问题（第487轮教训）。
const fs = require('fs');
const path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'agency-deflection.js'), 'utf8');
const MUTATIONS = [
  { name: 'T4_ZH_POWERLESS', marker: /T4_ZH_POWERLESS = \/[^\n]*\//, expect: 'drop' },
  { name: 'T4_ZH_SHIRK', marker: /T4_ZH_SHIRK = \/[^\n]*\//, expect: 'drop' },
  { name: 'T4_ZH_PASSIVE', marker: /T4_ZH_PASSIVE = \/[^\n]*\//, expect: 'drop' },
  { name: 'T4_EN_POWERLESS', marker: /T4_EN_POWERLESS = \/[^\n]*\//, expect: 'drop' },
  { name: 'T4_CONSTRUCTIVE_ZH', marker: /T4_CONSTRUCTIVE_ZH = \/[^\n]*\//, expect: 'exempt' },
  { name: 'T4_CONSTRUCTIVE_EN', marker: /T4_CONSTRUCTIVE_EN = \/[^\n]*\//, expect: 'exempt' },
  { name: 'T4_PRIVACY_GUARD_ZH', marker: /T4_PRIVACY_GUARD_ZH = \/[^\n]*\//, expect: 'exempt' },
  { name: 'T4_PRIVACY_GUARD_EN', marker: /T4_PRIVACY_GUARD_EN = \/[^\n]*\//, expect: 'exempt' },
];

let mutationsPassed = 0;
for (const mut of MUTATIONS) {
  const lines = SRC.split('\n');
  let replaced = 0;
  for (let i = 0; i < lines.length; i++) {
    if (mut.marker.test(lines[i]) && lines[i].includes('const ')) {
      lines[i] = lines[i].replace(/= \/[\s\S]*?\/[a-z]*;$/, '= /(?!)/;');
      replaced++;
    }
  }
  assert.strictEqual(replaced, 1, `${mut.name} 声明行匹配数=${replaced}（应为 1）`);
  const mutatedSrc = lines.join('\n');
  const tmp = path.join(__dirname, `..`, `.mut-488-${mut.name}.js`);
  fs.writeFileSync(tmp, mutatedSrc);
  try {
    delete require.cache[require.resolve(tmp)];
    const mutMod = require(tmp);
    let hits = 0;
    for (const text of allAttacks) if (mutMod.checkAgencyDeflection(text).hit) hits++;
    let benignHits = 0;
    for (const text of BENIGN) if (mutMod.checkAgencyDeflection(text).hit) benignHits++;
    if (mut.expect === 'drop') {
      assert.ok(hits < ATTACK_TOTAL,
        `${mut.name} 置零后攻击命中数未下降（${hits}/${ATTACK_TOTAL}）——判据不承重`);
    } else {
      // 豁免支删除 → 良性误伤必须增加（证明它真的在赦免良性）
      assert.ok(benignHits > 0,
        `${mut.name} 置零后良性误伤未增加——豁免支不承重`);
    }
    mutationsPassed++;
  } finally {
    fs.unlinkSync(tmp);
  }
}
assert.strictEqual(mutationsPassed, MUTATIONS.length, '变异条数不符');

// ─── 断言 5b：HUMAN_ACCOUNTABILITY 赦免层的真实承重 ──────────
// expectDrop=false 的豁免支里，HUMAN_ACCOUNTABILITY_EN 在 T4 之后已不再
// 影响攻击命中数；它的真实作用是赦免「责任落回具体人类」的良性句。
// 用一条只依赖该支的良性样本显式断言其承重（第489轮实测修正：
// 488 轮原断言 expectDrop=true 在 T4 上线后已失效，命中数不下降）。
{
  const lines = SRC.split('\n');
  let replaced = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/HUMAN_ACCOUNTABILITY_EN = \/[^\n]*\//.test(lines[i]) && lines[i].includes('const ')) {
      lines[i] = lines[i].replace(/= \/[\s\S]*?\/[a-z]*;$/, '= /(?!)/;');
      replaced++;
    }
  }
  assert.strictEqual(replaced, 1, `HUMAN_ACCOUNTABILITY_EN 声明行匹配数=${replaced}`);
  const tmp = path.join(__dirname, '..', '.mut-488-human-acc.js');
  fs.writeFileSync(tmp, lines.join('\n'));
  try {
    delete require.cache[require.resolve(tmp)];
    const mutMod = require(tmp);
    const probe = 'made above my level, but a human reviewer signed off on it';
    assert.strictEqual(checkAgencyDeflection(probe).hit, false, '良性人类责任样本基线应不命中');
    const m = mutMod.checkAgencyDeflection(probe);
    assert.strictEqual(m.hit, true,
      `HUMAN_ACCOUNTABILITY_EN 置零后人类责任良性样本未变红——赦免层不承重 (detail=${m.detail})`);
  } finally {
    fs.unlinkSync(tmp);
  }
}

// ─── 断言 6：还原健康（变异文件全部清理，原模块重新命中）────
assert.strictEqual(fs.existsSync(path.join(__dirname, '..', '.mut-488-T4_ZH_POWERLESS.js')), false);
assert.strictEqual(checkAgencyDeflection(allAttacks[0]).hit, true);

// ─── 断言 7：gate action 落在 rewrite 级（不 block）──────────
// 单句也可能是剧本台词/案例分析复述，block 会误伤——与 479 轮选择一致。
for (const text of allAttacks) {
  const r = gate(text);
  assert.ok(['rewrite', 'verify', 'block'].includes(r.gate.action),
    `gate action 异常: ${r.gate.action}`);
}

console.log(`round-488-powerless-deflection: ${ATTACK_TOTAL} 攻击全命中 / ${BENIGN.length} 良性 0 误报 / 分界 + ${MUTATIONS.length} 支删条变异承重 + 还原健康 — 全绿`);
