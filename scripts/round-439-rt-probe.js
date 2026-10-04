// r439 校验：运行期 history 是否保留了原文（RL 链路依赖它）
// r438 在调用点 input: _PrivacyExposure.sanitizeForPersistence(input).slice(0,200)
// 已先脱敏过一次，所以 history[0].input 理应已是指纹。
// 此处验证的是「_sanitizeHistoryForSave 不改运行期对象」这个不变量：
// 脱敏前后 this.history[0].input 必须逐字节相同。
const fs = require('fs');
const path = require('path');
const { JudgmentEngine } = require('../src/core/judgment-engine.js');
const P = require('../src/privacy-exposure.js');

const DIR = path.join(__dirname, '..', 'data', '_tmp_r439_rt');

(async () => {
  fs.rmSync(DIR, { recursive: true, force: true });
  const je = new JudgmentEngine({ dataDir: DIR });
  await je.judge('我姐根本没想过我的感受，只说我就是那种人');
  await new Promise(r => setTimeout(r, 2600));

  const before = JSON.stringify(je.history[0].input);
  const kwBefore = JSON.stringify(je.history[0].context.keywords);
  je._save();
  await new Promise(r => setTimeout(r, 200));
  const after = JSON.stringify(je.history[0].input);
  const kwAfter = JSON.stringify(je.history[0].context.keywords);

  console.log('RUNTIME_INPUT_STABLE=' + (before === after));
  console.log('RUNTIME_KEYWORDS_STABLE=' + (kwBefore === kwAfter));
  console.log('INPUT_IS_FINGERPRINT=' + before.startsWith('[redacted:'));
  console.log('KEYWORDS_RAW_PRESERVED=' + kwBefore.includes('我姐'));

  // sanitizeKeywordList 单测形状
  console.log('NEUTRAL_LIST_UNCHANGED=' + (JSON.stringify(P.sanitizeKeywordList(['alpha', 'beta'])) === JSON.stringify(['alpha', 'beta'])));
  console.log('NON_ARRAY_PASSTHRU=' + (P.sanitizeKeywordList(null) === null));
  fs.rmSync(DIR, { recursive: true, force: true });
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
