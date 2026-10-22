// 第 154 轮探针 4：en-clause 门槛 3 词 vs 4 词的误伤代价
'use strict';
const EN_PRONOUN_RE = /\b(?:we|you|they|it|i|us|them|our|your|he|she)\b/i;
const ZH_RE = /[\u4e00-\u9fff]/;

function hit(text, minWords) {
  if (!ZH_RE.test(text)) return { hit: false, run: null };
  const re = new RegExp(`[A-Za-z][A-Za-z'’-]*(?:\\s+[A-Za-z][A-Za-z'’-]*){${minWords - 1},}`, 'g');
  const runs = text.match(re) || [];
  for (const run of runs) if (EN_PRONOUN_RE.test(run)) return { hit: true, run };
  return { hit: false, run: null };
}

const ATTACK = [
  ['A1', '总而言之，This approach demonstrates significant value across multiple dimensions of our work.'],
  ['A3', '值得注意的是，It is worth noting that 这个策略存在潜在的重大风险。'],
  ['A6', '换句话说，we need to delve into the intricate details of the design.'],
  ['C1', '综上所述，we need to comprehensively evaluate 这个方案的优劣。'],
  ['C2', '值得注意的是，it is important to note that 这个方案存在风险。'],
  ['C4', '换句话说，in other words, 这个方案还有优化空间。'],
  ['C5', '首先，let us consider the trade-offs between latency and throughput。'],
  ['E1', '总之，we should leverage this framework to streamline the whole process。'],
  ['E4', '首先，it is crucial that we validate all edge cases。'],
  ['E8', '第二，you must double-check the identifier before merging。'],
  // 3 词英文串形状（降门槛才收）
  ['F1', '值得注意的是，it matters a lot。'],
  ['F2', '总之，we cannot ignore this。'],
  ['F3', '换句话说，it depends on context。'],
];

const BENIGN = [
  ['B1', 'この API は robust な設計になっており、retry 時に exponential backoff を使います。'],
  ['B2', 'システムの throughput を改善するため、cache layer を comprehensive に見直しました。'],
  ['B5', 'Этот сервис работает стабильно, throughput выше на 30 процентов.'],
  ['B6', 'Мы используем robust подход к deployment.'],
  ['B9', '这个 pipeline 需要 comprehensive 的 retry 策略，覆盖 timeout 和 rate limit 两类失败。'],
  ['B10', '我们把 gateway 重写成 leverage 了连接池的实现，throughput 提升明显。'],
  ['B12', '总之，overall 这个方案可以上线；此外，moreover 要补监控。'],
  ['B13', '服务端对请求做 comprehensive 的校验，包括 timeout 与 rate limit 两类限制。'],
  ['B14', '方案 encompassing 了 all critical aspects。'],
  ['G1', '代码走查重点关注 edge case 与 error handling。'],
  ['G2', '安全基线要求 enable MFA 并 rotate keys。'],
  ['G3', '文档说明：never trust user input，要做校验。'],
  ['G4', '该服务通过 gateway 暴露 HTTP 接口，latency 控制在 50ms 以内。'],
  ['G5', '接口遵循 REST 规范，支持 pagination 与 filtering。'],
  ['G6', '「设计模式那句话：favor composition over inheritance」是经典原则。'],
  ['G7', '团队约定 commit message 用 conventional commits 格式。'],
  ['G8', '部署时需配置 rate limit 与 timeout 两个参数。'],
  ['G9', '缓存层用 Redis 实现，hit rate 超过 95%。'],
  ['G10', '代码审查时我们 review 了所有 PR，lint 零告警。'],
  ['G11', '遵循 least privilege 原则分配权限。'],
  ['G12', '接口要求 idempotent，重试不会重复下单。'],
];

for (const minWords of [4, 3]) {
  let a = 0; for (const [, s] of ATTACK) if (hit(s, minWords).hit) a++;
  let fp = 0; const fps = [];
  for (const [tag, s] of BENIGN) { const r = hit(s, minWords); if (r.hit) { fp++; fps.push(tag + ': "' + r.run + '"'); } }
  console.log(`门槛 ${minWords} 词: 攻击命中 ${a}/${ATTACK.length} | 误伤 ${fp}/${BENIGN.length}`);
  for (const f of fps) console.log('    ✗ ' + f);
}
