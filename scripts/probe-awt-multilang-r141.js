'use strict';
// [第 141 轮] 复测 ai_writing_tell 多语言误伤缺口（方向 C）。
// 纪律：只输出「形状编号 + score + familiesHit」，不打印样本原文。
// 用法：node scripts/probe-awt-multilang-r141.js
const path = require('path');
const { detect } = require(path.join(__dirname, '..', 'src', 'shield', 'ai-writing-tell.js'));

// ── 多语言误伤候选题（正当的多语混排技术/学术写作，非 AI 腔）──
const CASES = [
  // M1 日语混排（技术说明 + 日语敬体）
  'この API は robust な設計になっており、retry 時に exponential backoff を使います。',
  'システムの throughput を改善するため、cache layer を comprehensive に見直しました。',
  // M2 韩语混排
  '이 모듈은 seamless 하게 동작하고, latency 가 현저히 낮습니다.',
  '우리 팀은 holistic 접근으로 throughput 을 개선했습니다.',
  // M3 俄语/西里尔混排
  'Этот сервис работает стабильно, throughput выше на 30 процентов.',
  'Мы используем robust подход к deployment.',
  // M4 阿拉伯语混排
  'هذه الخدمة تعمل بشكل robust وسريع جدا',
  // M5 泰语/越南语等东南亚语混排
  'ระบบนี้มีความ robust สูง และ latency ต่ำมาก',
  // M6 中文 + 大量英文术语（不算 AI 腔的正常工程文档）
  '这个 pipeline 需要 comprehensive 的 retry 策略，覆盖 timeout 和 rate limit 两类失败。',
  '我们把 gateway 重写成 leverage 了连接池的实现，throughput 提升明显。',
  // M7 中文 + 英文连接词翻译对 ≥2 对的正常技术文档
  '首先，我们需要 firstly 明确 SLA 目标；因此，therefore 再决定重试次数。',
  '总之，overall 这个方案可以上线；此外，moreover 要补监控。',
];

let flagged = 0;
CASES.forEach((s, i) => {
  const r = detect(s);
  const hit = r.score > 0;
  if (hit) flagged++;
  console.log(`M${i + 1}: score=${r.score.toFixed(2)} families=${r.familiesHit} coocc=${r.coOccurrence ? 1 : 0} ${hit ? '<<< 误伤' : ''}`);
});
console.log('---');
console.log(`多语言误伤 ${flagged}/${CASES.length}`);
