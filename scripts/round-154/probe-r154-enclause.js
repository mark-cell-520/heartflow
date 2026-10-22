// 第 154 轮探针 3：en-clause 候选判据预演（不改 src，纯逻辑复刻）
// 判据：中文文本 + 连续 ≥4 个英文词且其中含代词主语（we/you/they/it/I/us/them）
//   ——中文写作插一两个英文术语是正当技术混排（名词短语，无代词）；
//     把**主谓结构**写成英文（we need to / it is important that）是 AI 翻译腔
//     的结构性痕迹：主语都没译成中文。
// 三组对照：
//   ATTACK  = r141 原池 10 + C 组 6 + 新构造 en-clause 8 条
//   BENIGN  = r141 多语言池 12 + r142 池 11 + DELIBERATE_SKIP 1 + 技术混排 12
//   EDGE    = 已知边界样本（确认仍维持既有行为）
'use strict';

// —— 候选判据（预演版，与将写入 src 的逻辑一致）——
const EN_RUN_RE = /[A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){3,}/g;
const EN_PRONOUN_RE = /\b(?:we|you|they|it|i|us|them|our|your|he|she)\b/i;

function candidateEnClause(text) {
  if (!/[\u4e00-\u9fff]/.test(text)) return { hit: false, run: null };
  const runs = text.match(EN_RUN_RE) || [];
  for (const run of runs) {
    if (EN_PRONOUN_RE.test(run)) return { hit: true, run };
  }
  return { hit: false, run: null };
}

const ATTACK = [
  // r141 原池（4 漏检样本为重点）
  ['A1', '总而言之，This approach demonstrates significant value across multiple dimensions of our work.'],
  ['A3', '值得注意的是，It is worth noting that 这个策略存在潜在的重大风险。'],
  ['A2', '综上所述，我们需要 comprehensively evaluate 这个方案的优劣与可行性。'],
  ['A9', '这是一个 game-changer，可以 leverage 现有资源创造价值。'],
  ['A10', '系统 poised 实现 unprecedented 的增长，前景十分光明。'],
  ['A4', '总的来说，In conclusion 这个方案是可行且 robust 的。'],
  ['A6', '换句话说，we need to delve into the intricate details of the design.'],
  // C 组（英文整句形状）
  ['C1', '综上所述，we need to comprehensively evaluate 这个方案的优劣。'],
  ['C2', '值得注意的是，it is important to note that 这个方案存在风险。'],
  ['C4', '换句话说，in other words, 这个方案还有优化空间。'],
  ['C5', '首先，let us consider the trade-offs between latency and throughput。'],
  // 新构造：中文 + 英文小句（换动词/换主语/换锚点）
  ['E1', '总之，we should leverage this framework to streamline the whole process。'],
  ['E2', '值得注意的是，you need to ensure that every case is deterministic。'],
  ['E3', '综上所述，they plan to refactor the module before the release。'],
  ['E4', '首先，it is crucial that we validate all edge cases。'],
  ['E5', '换句话说，we can avoid this by caching the parsed result。'],
  ['E6', '总的来说，this approach requires us to rethink the data model。'],
  ['E7', '一方面，our team needs to balance latency against throughput。'],
  ['E8', '第二，you must double-check the identifier before merging。'],
];

const BENIGN = [
  // r141 多语言池（12）
  ['B1', 'この API は robust な設計になっており、retry 時に exponential backoff を使います。'],
  ['B2', 'システムの throughput を改善するため、cache layer を comprehensive に見直しました。'],
  ['B3', '이 모듈은 seamless 하게 동작하고, latency 가 현저히 낮습니다.'],
  ['B4', '우리 팀은 holistic 접근으로 throughput 을 개선했습니다.'],
  ['B5', 'Этот сервис работает стабильно, throughput выше на 30 процентов.'],
  ['B6', 'Мы используем robust подход к deployment.'],
  ['B7', '此服务运行 robust 且速度极快'],
  ['B8', 'ระบบนี้มีความ robust สูง และ latency ต่ำมาก'],
  ['B9', '这个 pipeline 需要 comprehensive 的 retry 策略，覆盖 timeout 和 rate limit 两类失败。'],
  ['B10', '我们把 gateway 重写成 leverage 了连接池的实现，throughput 提升明显。'],
  ['B11', '首先，我们需要 firstly 明确 SLA 目标；因此，therefore 再决定重试次数。'],
  ['B12', '总之，overall 这个方案可以上线；此外，moreover 要补监控。'],
  // r142 池增补
  ['B13', '服务端对请求做 comprehensive 的校验，包括 timeout 与 rate limit 两类限制。'],
  ['B14', '方案 encompassing 了 all critical aspects。'],
  // 技术混排新扩（中文 + 英文术语，最长串 ≤3 词、无代词）
  ['B15', '该服务通过 gateway 暴露 HTTP 接口，latency 控制在 50ms 以内。'],
  ['B16', '部署时需配置 rate limit 与 timeout 两个参数。'],
  ['B17', '我们参考了 CAP 定理，最终选择了 strong consistency。'],
  ['B18', '缓存层用 Redis 实现，hit rate 超过 95%。'],
  ['B19', '这个 pipeline 包含 build、test、deploy 三个阶段。'],
  ['B20', '接口遵循 REST 规范，支持 pagination 与 filtering。'],
  ['B21', '代码走查重点关注 edge case 与 error handling。'],
  ['B22', '压测报告显示 p99 latency 下降明显。'],
  ['B23', '「设计模式那句话：favor composition over inheritance」是经典原则。'],
  ['B24', '团队约定 commit message 用 conventional commits 格式。'],
  ['B25', '文档说明：never trust user input，要做校验。'],
  ['B26', '安全基线要求 enable MFA 并 rotate keys。'],
];

console.log('=== ATTACK（en-clause 应命中）===');
let aHit = 0;
for (const [tag, s] of ATTACK) {
  const r = candidateEnClause(s);
  if (r.hit) aHit++;
  console.log(`${tag}: ${r.hit ? 'HIT ' : 'miss'} ${r.run ? 'run="' + r.run.slice(0, 50) + '"' : ''}`);
}
console.log(`候选判据命中: ${aHit}/${ATTACK.length}\n`);

console.log('=== BENIGN（en-clause 必须不命中）===');
let fp = 0;
for (const [tag, s] of BENIGN) {
  const r = candidateEnClause(s);
  if (r.hit) { fp++; console.log(`  ✗ 误伤 ${tag}: run="${r.run}"`); }
}
console.log(`候选判据误伤: ${fp}/${BENIGN.length}`);
