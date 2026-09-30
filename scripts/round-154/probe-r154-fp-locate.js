// 第 154 轮探针 10：定位 vs 前后版本都存在的那 1 条良性打分（净增量 0 个案）
// delta 探针报误伤 1/26，改动前后一致 → 是既有误伤，非本轮引入。
'use strict';
const path = require('path');
const { detect } = require(path.join(__dirname, '..', '..', 'src', 'shield', 'ai-writing-tell.js'));

const BENIGN = [
  'この API は robust な設計になっており、retry 時に exponential backoff を使います。',
  'システムの throughput を改善するため、cache layer を comprehensive に見直しました。',
  '이 모듈은 seamless 하게 동작하고, latency 가 현저히 낮습니다.',
  '우리 팀은 holistic 접근으로 throughput 을 개선했습니다.',
  'Этот сервис работает стабильно, throughput выше на 30 процентов.',
  'Мы используем robust подход к deployment.',
  '此服务运行 robust 且速度极快',
  'ระบบนี้มีความ robust สูง และ latency ต่ำมาก',
  '这个 pipeline 需要 comprehensive 的 retry 策略，覆盖 timeout 和 rate limit 两类失败。',
  '我们把 gateway 重写成 leverage 了连接池的实现，throughput 提升明显。',
  '服务端对请求做 comprehensive 的校验，包括 timeout 与 rate limit 两类限制。',
  '方案 encompassing 了 all critical aspects。',
  '俗话说 as we all know，质量是设计出来的。',
  '论文标题就是 What We Cannot Know。',
  '海报上印着 Yes We Can 三个词。',
  '注释里写着 FIXME we need to clean this up later。',
  '邮件里他写 sorry I missed your call。',
  '文档写明 when we say stable we mean no API changes。',
  '代码评审记录：we should refactor this before merge。',
  'CI 失败日志：it seems the cache is stale。',
  '用户反馈原文：I cannot find the export button。',
  '会议纪要：they will provide the API spec next week。',
  'Issue 标题：we need better error messages。',
  '上线公告：we have migrated to the new cluster。',
  '总之，overall 这个方案可以上线；此外，moreover 要补监控。',
  '首先，我们需要 firstly 明确 SLA 目标；因此，therefore 再决定重试次数。',
];

for (const [i, s] of BENIGN.entries()) {
  const r = detect(s);
  if (r.score > 0) {
    console.log(`误伤 #${i + 1}: score=${r.score.toFixed(2)} fams=${r.familiesHit}`);
    for (const f of r.findings) console.log(`   dim=${f.dimension} sev=${f.severity} trig="${f.trigger}" zhEnSrc=${f.zhEnSrc || '-'}`);
  }
}
