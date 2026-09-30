// 第 154 轮探针 2：定位 A3 漏检根因 + en-clause 候选判据采样
'use strict';
const path = require('path');
const { detect } = require(path.join(__dirname, '..', '..', 'src', 'shield', 'ai-writing-tell.js'));

const SAMPLES = [
  ['A3-r141', '值得注意的是，It is worth noting that 这个策略存在潜在的重大风险。'],
  ['A2-r141', '综上所述，我们需要 comprehensively evaluate 这个方案的优劣与可行性。'],
  ['A9-r141', '这是一个 game-changer，可以 leverage 现有资源创造价值。'],
  ['A10-r141', '系统 poised 实现 unprecedented 的增长，前景十分光明。'],
  // 含英文整句的同族新样本（候选 en-clause 收割面）
  ['C1', '综上所述，we need to comprehensively evaluate 这个方案的优劣。'],
  ['C2', '值得注意的是，it is important to note that 这个方案存在风险。'],
  ['C3', '总的来说，the future looks bright for this approach。'],
  ['C4', '换句话说，in other words, 这个方案还有优化空间。'],
  ['C5', '首先，let us consider the trade-offs between latency and throughput。'],
  ['C6', '总之，we should leverage this framework to streamline the whole process。'],
  // 良性对照：技术混排最长英文串均 <4 词
  ['B1', '此服务运行 robust 且速度极快'],
  ['B2', '这个 pipeline 需要 comprehensive 的 retry 策略，覆盖 timeout 和 rate limit 两类失败。'],
  ['B3', '我们把 gateway 重写成 leverage 了连接池的实现，throughput 提升明显。'],
  ['B4', 'この API は robust な設計になっており、retry 時に exponential backoff を使います。'],
  ['B5', '方案 encompassing 了 all critical aspects。'],
  ['B6', '总之，overall 这个方案可以上线；此外，moreover 要补监控。'],
  ['B7', '首先，我们需要 firstly 明确 SLA 目标；因此，therefore 再决定重试次数。'],
];

for (const [tag, s] of SAMPLES) {
  const r = detect(s);
  // 连续英文词最长串
  const runs = (s.match(/[a-zA-Z][a-zA-Z'’-]*(?:\s+[a-zA-Z][a-zA-Z'’-]*){2,}/g) || [])
    .map(x => ({ len: x.split(/\s+/).length, text: x }));
  const longest = runs.sort((a, b) => b.len - a.len)[0];
  console.log(`${tag}: score=${r.score.toFixed(2)} fams=${r.familiesHit} co=${r.coOccurrence} dims=[${(r.findings || []).map(f => f.dimension.replace(/^ai-tell-/, '')).join(',')}] 最长英文串=${longest ? longest.len + '词(' + longest.text.slice(0, 40) + ')' : '无'}`);
}
