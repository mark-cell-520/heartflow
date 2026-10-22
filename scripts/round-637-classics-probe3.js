// r637 探针 3：典籍检索链可用性（回归：classics-base 路径解析）
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const cb = require(__HF + '/src/knowledge/classics-base.js');
const cr = require(__HF + '/src/knowledge/classics-rules.js');

console.log('CLASSICS_BASE =', cb.CLASSICS_BASE);
console.log('SCRIPT =', cb.SCRIPT);
console.log('SCRIPT exists =', cb.SCRIPT ? fs.existsSync(cb.SCRIPT) : false);

// 真实检索腿：多关键词批检索
const t0 = Date.now();
const batch = cr.searchClassicsBatch(['仁政','王道'], '');
console.log('searchClassicsBatch 命中数 =', batch.hits.length, 'error =', batch.error || 'none');
console.log('耗时 ms =', Date.now() - t0);
if (batch.hits.length) console.log('首条 =', String(batch.hits[0].raw).slice(0, 160));

// 单关键词腿
const single = cr.searchClassics('省刑罚', '');
console.log('searchClassics 命中数 =', single.hits.length, 'error =', single.error || 'none');

// evaluateRules 腿（古典命题判别，不依赖外部语料库）
const ev = cr.evaluateRules('只要施行仁政，百姓自然归服，国家就能大治');
console.log('evaluateRules 命中 =', ev.fired, 'signal =', ev.signal, 'reason =', ev.reason);
