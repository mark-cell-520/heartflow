/**
 * r474 轮测：peak_end_rule 中间过程可牺牲宣告族（独立第二签名路径）。
 *
 * 真升级类型②：既有维度全新措辞家族——「用峰终定律为由宣布中间过程/
 * 体验可牺牲」。存量三腿与 r310/r319 族一字不动，src/index.js 零改动。
 *
 * 攻击样本 28 条（ZH 18 + EN 10），良性 32 条（ZH 18 + EN 14），
 * 存量回归 12 条（r245/r310/r319 攻击 7 + 良性 5）。
 *
 * 判定口径：模块直调 detectPeakEndRule hit = true；良性 hit = false。
 * gate 层归因 econ_reasoning_gate 另行断言（聚合器接线）。
 */
'use strict';
const assert = require('node:assert');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const { detectPeakEndRule } = require(path.join(ROOT, 'src', 'peak-end-rule.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const { checkEconReasoningGate } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

// —— 攻击：峰终话题 × 中间可牺牲宣告 × 中间过程三腿共现 ——
const ATTACK = [
  // 存量族新句（原有三腿路径已覆盖的延伸）
  '用户只会记住高峰时刻和结尾，所以中间体验做成什么样都无所谓。',
  '全程体验不重要，只要收尾够惊艳，整体评价自然就好。',
  '用户记不住中间步骤，我们只打磨第一印象和最后一步就行。',
  '过程再拖沓也没关系，结局精彩用户就会给好评。',
  // r474 新族：引用峰终定律/常识做中间可牺牲宣告
  '峰值和终点决定一切，中间流程随便做做。',
  '反正用户中途就会忘记，重点把开头结尾做好。',
  '中间出点问题用户不会记得，不用修。',
  'Users only remember the peak and the end, so the middle can be neglected.',
  'Nobody remembers the middle of the journey, so focus only on the finale.',
  'The middle experience does not matter since users forget it anyway.',
  'If the ending is delightful, the tedious process is irrelevant.',
  // r474 新族：资源全投首尾、中间牺牲
  '按峰终定律，我们的设计资源应该全部投在首尾两端。',
  '根据峰终定律，中间步骤的体验不进入用户记忆，可以牺牲。',
  'Nobody remembers the middle steps, so we can skip polishing them.',
  '把预算全砸在首尾，中间环节能省则省。',
  '把全部注意力集中在第一印象和收尾，中间交互随便做。',
  'Put all our resources on the first impression and the finale; the middle flow can be sloppy.',
  // r474 新族：否定守卫穿透族（「不会记得/没人看/不进入记忆」）
  '中间流程做成什么样都无所谓，反正没人记得。',
  '只要结局惊艳，中间多烂都无所谓。',
  '反正没人看过程，结尾漂亮就行。',
  '中间步骤不用管，用户反正记不住。',
  'The middle can be neglected since nobody will remember it.',
  '用户不会记得中间的报错，所以不用修。',
  '没人会记得等待时长，我们把预算全押在首尾。',
  'Nobody will remember the waiting time, so there is no point fixing the latency.',
  '反正没人关注中间的步骤，我们只把开头结尾做好。',
  '客户不会察觉中途的卡顿，不用较真。',
  '反正用户不会记得过程，重点把开头结尾做好就行。',
];

// —— 良性：概念教学 / 兼顾全程 / 全链路跟踪 / 否定守卫不误伤 ——
const BENIGN = [
  '峰终定律提醒我们首尾体验影响记忆，我们会优化它们，同时保证中间流程符合标准。',
  '除了结尾，我们同样关心中间步骤的等待时长和报错处理。',
  '体验设计要兼顾全程，而不是只做表面功夫。',
  'The peak-end rule is a documented cognitive bias; we still audit the full journey.',
  '我们参照峰终定律改进了入口和收尾，中间环节的质量指标也一并跟踪。',
  '记忆会偏向极端时刻，但每一步都可能成为极端时刻。',
  '我们会优化首尾，同时保证每一个中间步骤都达标。',
  'We focus on the beginning and the end while still ensuring every middle step meets our quality bar.',
  '用户可能只记得开头和结尾，所以我们仍然审计全链路的每一次交互。',
  '不能只凭首尾印象评价服务质量，中间流程的合规同样要验收。',
  'Although users remember the peak, we still monitor each intermediate stage.',
  '峰值和结尾固然重要，中间环节的错误率也一并纳入了监控。',
  '心理学教材在讲峰终定律：用户会记住峰值和结尾，这是记忆的系统性偏差。',
  '峰终定律由卡尼曼提出，是持续时间忽视的经典案例。',
  'The peak-end rule shows people judge experiences by their peak and end, neglecting duration.',
  '评价课程要综合课前课中课后全周期，而不是只看结课那一刻。',
  '我们统计了全年每一天的满意度，按时间加权得到整体体验分。',
  'We averaged satisfaction across every session, not just the first and last.',
  '用户会记住峰值和结尾，但中间的加载时长同样是我们的北极星指标。',
  '开头和结尾影响记忆，所以我们同样把关中间的每一次服务响应。',
  'The ending matters, but so does every middle step of the onboarding flow.',
  '过程再拖沓也需要复盘，结局好不能掩盖中间的体验问题。',
  '再烂的过程也要记录在案，结局漂亮不等于全程合格。',
  'While the finale is important, we still review the tedious middle sessions.',
  '首尾投入更多是策略，但中间流程的 SLA 一项都没放松。',
  '虽然没人会专门记得等待时长，但我们的 SLA 一项都没放松。',
  '用户不会记住每次加载，但我们仍然监控全链路的响应时间。',
  'Nobody will remember every loading screen, yet we still track the latency of each step.',
  '就算客户不记得报错，故障复盘也一次没落下。',
  'Even if users forget the errors, we still run a postmortem on every failure.',
  '用户不记得中间步骤，所以我们更要记录全链路日志。',
  '没人关注过程，但审计要覆盖每一个中间环节。',
];

// —— 存量回归：r245/r310/r319 攻击仍命中，存量良性仍豁免 ——
const REGRESSION_ATTACK = [
  '全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了。',
  '虽然过程很煎熬，但最后那一刻特别美好，整件事我就算它成功。',
  '这部电影前面昏昏欲睡，结尾一击致命，我直接给满分。',
  '装修那三个月天天吵架，但搬家那天全家都很开心，所以这次装修值了',
  '培训过程再枯燥都无所谓，最后发证那一刻很激动，所以这次培训值了',
  'The move was brutal — we fought every day for three months, but the day we moved in felt perfect, so the whole thing was worth it',
  'Six months of chaos and sleepless nights, but the launch day party made it all worthwhile',
];
const REGRESSION_BENIGN = [
  '虽然结尾很惊艳，但整个过程拖沓，综合时长和节奏我只能给中等。',
  '不能只因为收尾漂亮就忽略中间数小时的乏味，整体评价要打折扣。',
  '这次旅行一塌糊涂，全程都不满意。',
  '心理学教材在讲峰终定律：全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了——经典案例。',
  '结尾确实惊艳，虽然全程乏味煎熬，但综合时长与整体分布来看，这趟依然值得。',
];

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) { if (cond) { pass++; } else { fail++; fails.push(label); } }

console.log('=== r474 攻击：模块直调 + gate 归因 ===');
for (const a of ATTACK) {
  const r = detectPeakEndRule(a);
  const g = gate(a);
  const dims = (g.findings || []).map(f => f.dimension);
  const gateHit = dims.includes('econ_reasoning_gate') && g.gate.action !== 'pass';
  const agg = checkEconReasoningGate(a);
  ok(r.hit, `模块未命中: ${a.slice(0, 30)}`);
  ok(gateHit, `gate 未归因 econ_reasoning_gate: ${a.slice(0, 30)}`);
  ok(agg.hit, `聚合层未命中: ${a.slice(0, 30)}`);
}

console.log('=== r474 良性：零误伤 ===');
for (const b of BENIGN) {
  const r = detectPeakEndRule(b);
  const g = gate(b);
  const dims = (g.findings || []).map(f => f.dimension);
  const fp = r.hit || dims.includes('econ_reasoning_gate');
  ok(!fp, `误伤: ${b.slice(0, 30)}`);
}

console.log('=== 存量回归：r245/r310/r319 ===');
for (const a of REGRESSION_ATTACK) {
  const r = detectPeakEndRule(a);
  ok(r.hit, `存量攻击回归失败: ${a.slice(0, 30)}`);
}
for (const b of REGRESSION_BENIGN) {
  const r = detectPeakEndRule(b);
  ok(!r.hit, `存量良性回归误伤: ${b.slice(0, 30)}`);
}

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
if (fail > 0) {
  console.log('失败项：');
  for (const f of fails) console.log('  - ' + f);
}
assert.strictEqual(fail, 0, `r474 轮测有 ${fail} 项失败`);
console.log('r474 轮测全绿。');
