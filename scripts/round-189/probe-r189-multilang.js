// 第 189 轮探针：ai_writing_tell 多语言误伤量化
// 良性池 = 正当的多语言技术写作（各语种与英文术语/中文混排的正常文档句）。
// 输出：detect 打分分布 + gate 动作分布 + 命中族归因。只报数字与族名，不贴样本原文。
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const tw = require(path.join(ROOT, 'src/shield/ai-writing-tell.js'));

// lang 字段只用于归因统计
const POOL = [
  { lang: 'ja', t: 'この API の retry 戦略は exponential backoff を採用しています。timeout は 30 秒に設定してください。' },
  { lang: 'ja', t: '負荷分散の構成として、gateway の手前で rate limit をかけ、backend は stateless に保ちます。' },
  { lang: 'ja', t: 'マイクロサービスの deployment は rolling update で行い、health check が通らない instance は自動的に切り離されます。' },
  { lang: 'ko', t: '이 서비스의 retry 정책은 exponential backoff를 사용하며 timeout은 30초입니다.' },
  { lang: 'ko', t: '트래픽이 급증하면 gateway에서 rate limit을 적용하고 backend은 stateless하게 유지합니다.' },
  { lang: 'ko', t: '배포는 rolling update 방식으로 진행되며 health check에 실패한 instance는 자동으로 제외됩니다.' },
  { lang: 'ru', t: 'Стратегия retry использует exponential backoff, timeout 30 секунд.' },
  { lang: 'ru', t: 'Мы используем robust подход с rate limit на gateway и stateless backend.' },
  { lang: 'ru', t: 'Система мониторинга собирает метрики latency и error rate с каждого instance.' },
  { lang: 'ar', t: 'تستخدم خدمةنا استراتيجية retry مع exponential backoff ومهلة 30 ثانية.' },
  { lang: 'ar', t: 'يتم تطبيق rate limit على gateway بينما يبقى backend ohne state.' },
  { lang: 'th', t: 'บริการนี้ใช้กลยุทธ์ retry แบบ exponential backoff และตั้ง timeoutไว้ 30 วินาที' },
  { lang: 'th', t: 'เมื่อ traffic เพิ่มขึ้น เราใช้ rate limit ที่ gateway และทำให้ backend stateless' },
  { lang: 'vi', t: 'Chiến lược retry của dịch vụ này dùng exponential backoff với timeout 30 giây.' },
  { lang: 'vi', t: 'Khi tải tăng đột biến, chúng tôi áp dụng rate limit tại gateway và giữ backend stateless.' },
  { lang: 'tr', t: 'Bu servisin retry stratejisi exponential backoff kullanır ve timeout 30 saniyedir.' },
  { lang: 'de', t: 'Die Retry-Strategie nutzt exponential backoff mit einem Timeout von 30 Sekunden.' },
  { lang: 'fr', t: 'La stratégie de retry utilise un backoff exponentiel avec un timeout de 30 secondes.' },
  { lang: 'zh-en', t: '这个 pipeline 需要 comprehensive 的 retry 策略，backoff 用 exponential 退避。' },
  { lang: 'zh-en', t: '我们的 gateway 层做 rate limit，backend 保持 stateless，方便 horizontal scaling。' },
  { lang: 'zh-en', t: '监控系统会采集每个 instance 的 latency 和 error rate 两个指标。' },
  { lang: 'zh-ja', t: 'この設計では、サービス単位で deployment を行い、failure 时自动 rollback します。' },
  { lang: 'zh-en-tech', t: '数据库层面我们给 order 表加了 index，query latency 从 200ms 降到 12ms。' },
  { lang: 'zh-en-tech', t: '压力测试结果显示，QPS 从 1200 提升到 8600，p99 latency 控制在 80ms 以内。' },
  { lang: 'ja-mixed', t: '設定ファイルに timeout と retry count を記述し、deployment スクリプトから読み込む構成です。' },
  { lang: 'ko-mixed', t: '설정 파일에 timeout과 retry count를 기록하고 deployment 스크립트에서 읽어옵니다.' },
  { lang: 'ru-mixed', t: 'Мониторинг dashboard показывает p99 latency и error rate по каждому service.' },
  { lang: 'ar-mixed', t: 'لوحة المراقبة تعرض p99 latency و error rate لكل service على حدة.' },
  { lang: 'zh-en-doc', t: '第三阶段接入 cache 层，命中率约 85%，回源压力下降明显。' },
  { lang: 'zh-en-doc', t: '为了排查 performance 问题，我们在 staging 环境复现了该场景并记录 flame graph。' },
];

let scoreGt0 = 0, scoreGe05 = 0, gateNotPass = 0;
const famCount = {};
const byLang = {};
for (const s of POOL) {
  const r = tw.detect(s.t);
  const g = gate.gate(s.t);
  const action = g.gate.action;
  byLang[s.lang] = byLang[s.lang] || { n: 0, scored: 0, notPass: 0 };
  byLang[s.lang].n++;
  if (r.score > 0) { scoreGt0++; byLang[s.lang].scored++; }
  if (r.score >= 0.5) scoreGe05++;
  if (action !== 'pass') { gateNotPass++; byLang[s.lang].notPass++; }
  for (const f of r.findings) {
    const k = f.dimension + (f.zhEnSrc ? `(${f.zhEnSrc})` : '');
    famCount[k] = (famCount[k] || 0) + 1;
  }
  if (r.score > 0 || action !== 'pass') {
    console.log(JSON.stringify({
      lang: s.lang, score: r.score, fams: r.familiesHit, action,
      reason: g.gate.reason,
      dims: r.findings.map(f => f.dimension + (f.zhEnSrc ? `|${f.zhEnSrc}` : '')),
    }));
  }
}
console.log(JSON.stringify({
  pool: POOL.length,
  scoreGt0, scoreGe05, gateNotPass,
  byLang, famCount,
}, null, 1));
