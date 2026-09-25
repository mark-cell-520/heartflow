// 第50轮主测试：中英混杂 AI 腔族（zh-en code-mixing）
// 攻击 23 条 / 良性 3 组 / 单族不计分（第36轮共现纪律）/ DELIBERATE_SKIP 锁当前边界
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
process.chdir(ROOT);
const { detect } = require(path.join(ROOT, 'src/shield/ai-writing-tell.js'));

const ATTACK_ANCHOR_MIX = [
  '总而言之，This approach demonstrates significant value across multiple dimensions.',
  '综上所述，我们需要 comprehensively evaluate 这个方案的优劣。',
  '值得注意的是，It is worth noting that 这个策略存在潜在风险。',
  '总的来说，In conclusion 这个方案是可行的。',
  '总之，In conclusion, we should leverage this robust framework to streamline processes.',
  '换句话说，we need to delve into the intricate details.',
];
const ATTACK_DOUBLE_CONNECTIVE = [
  '首先，Firstly 我们要明确目标；其次，Secondly 要制定计划。',
  '首先，Firstly 我们要收集需求；然后，Then 我们开始设计。',
  '一方面 this is important, 另一方面 that is also critical。',
  '第一 To begin with 是明确目标，第二 Second 是拆解任务。',
  '此外 Furthermore 我们要上线，最后 Finally 要复盘。',
];
const ATTACK_TIER_PHRASE = [
  '这个 robust 的方案能够 multifaceted 地解决问题。',
  '我们需要 holistic 地 streamline 整个流程。',
  '这是一个 game-changer，可以 leverage 现有资源。',
  '团队要 embrace 这个 pivotal 的转变。',
  '系统 poised 实现 unprecedented 的增长。',
  '方案 encompassing 了 all critical aspects。',
  '这是 world-class 的 harness 方式。',
  '架构 underlying principles 很 sophisticated。',
  '我们要 unleash 这个 transformative 的能力。',
  '路线图 burgeoning 且 quintessential。',
];
const ALL_ATTACKS = [...ATTACK_ANCHOR_MIX, ...ATTACK_DOUBLE_CONNECTIVE, ...ATTACK_TIER_PHRASE];

const BENIGN_TECH = [
  '我在准备一次技术分享，主题是关于分布式系统的一致性模型。我打算从 CAP 理论讲起，然后介绍强一致性、最终一致性、因果一致性这几种常见的模型，最后讲讲工程上的取舍。',
  '我们团队用 React 和 Node 开发，Python 部分用 Django，数据库选 PostgreSQL。',
  '这个 bug 已经修了，你先 checkout 最新代码，然后跑一下 CI，如果失败就把 log 发我。',
  '会议室的 HDMI 线坏了，投影仪连不上，你看是不是转接头的问题。',
  'OKR 要写到文档里，别只放在 PPT 上面，老板要看具体数字。',
  '接口文档里写了 query 参数和 header，注意 Content-Type 要设成 JSON。',
  '这个模块我们决定用 Redis 做缓存，Kafka 处理消息队列。',
  '数据库连接池配置在 config 文件里，默认 max_connections 是 100。',
];

const BENIGN_ZH_ONLY = [
  '综上所述，这个方案在成本控制方面还有优化空间，建议下一季度重新评估。',
  '首先我们要明确目标，其次要拆解任务，最后要复盘总结。',
  '值得注意的是，这个市场在过去三年增长了四倍，但增速正在放缓。',
];
const BENIGN_EN_ONLY = [
  'In conclusion, this approach demonstrates significant value across multiple dimensions.',
  'Furthermore, we need to leverage this robust framework to streamline our processes.',
  'This comprehensive and holistic method fosters seamless collaboration across teams.',
];

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.log(`  FAIL: ${label}`); }
}
function hasMixing(t) {
  const r = detect(t);
  return (r.findings || []).some(f => f.dimension === 'ai-tell-zh-en-mixing');
}

console.log('── 攻击：混杂族命中 ──');
for (const t of ALL_ATTACKS) ok(hasMixing(t), `混杂族未命中: ${t.slice(0, 40)}`);

console.log('── 良性：中文技术混排不命中 ──');
for (const t of BENIGN_TECH) ok(!hasMixing(t), `中文技术句误伤: ${t.slice(0, 40)}`);

console.log('── 良性：纯中文 AI 套话不命中（混杂族要求英文在场）──');
for (const t of BENIGN_ZH_ONLY) ok(!hasMixing(t), `纯中文套话误伤: ${t.slice(0, 40)}`);

console.log('── 良性：纯英文不命中（本族只针对中英混杂）──');
for (const t of BENIGN_EN_ONLY) ok(!hasMixing(t), `纯英文误伤: ${t.slice(0, 40)}`);

console.log('── 第 36 轮共现纪律：混杂单族命中 score 归零 ──');
const SINGLE_FAMILY = [
  '综上所述，我们需要 comprehensively evaluate 这个方案的优劣。',
  '方案 encompassing 了 all critical aspects。',
];
for (const t of SINGLE_FAMILY) {
  const r = detect(t);
  ok(r.score === 0 && r.coOccurrence === false, `单族未清零: ${t.slice(0, 30)} score=${r.score}`);
  ok((r.findings || []).some(f => f.dimension === 'ai-tell-zh-en-mixing'), `单族应仍进 findings: ${t.slice(0, 30)}`);
}
console.log('── 多族共现仍计分（回归护栏）──');
for (const t of ['这个 robust 的方案能够 multifaceted 地解决问题。']) {
  const r = detect(t);
  ok(r.coOccurrence === true && r.score > 0, `多族应计分: score=${r.score}`);
}

console.log('── DELIBERATE_SKIP：单对中英连接词不命中（正常术语混排，刻意留白）──');
const SKIP = [
  '首先，Firstly 我们要明确这个目标，然后再讨论资源分配的问题。',
  '因此 Therefore 我们决定推迟发布，等测试全部通过再说。',
];
for (const t of SKIP) ok(!hasMixing(t), `单对连接词被误判: ${t.slice(0, 30)}`);

console.log(`\n第50轮主测试: ${pass} passed ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
