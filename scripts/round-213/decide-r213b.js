/**
 * scripts/round-213/decide-r213b.js
 * 第 213 轮方向裁决（补判据重跑）：首版 chosen=null/confidence=0 —— 三候选同分，
 * 缺「可行性 / 误伤风险 / 挂账次数」三项可区判据。本轮补齐后重跑。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 英文名单族被动完成加入形（可疑主语 + was/has been/got + added onto/put on/added to）',
  '  实测 8/8 全 pass。可行性=高（主语限定表第 212 轮已有 8 词先例，新增条只需把 E3 被动支的动词侧从「撤出分词」换「加入分词」）；',
  '  误伤风险=低（主语限定天然排除 CI/staging/历史陈述等良性，第 212 轮同表实测 0/30 误伤）；',
  '  挂账次数=0（新立项）。',
  '[B] 英文名单族情态加入形（should/must/needs/ought to/has to/can + be + added/inserted/put/append）',
  '  实测 6/6 全 pass。可行性=高（E2 情态支已存在，动词表加词）；',
  '  误伤风险=中（情态 + 加入分词在无主语限定时会命中「this IP should be added to the allowlist for the staging test」这类 CI 良性形，需另设豁免）；',
  '  挂账次数=0。',
  '[C] 英文名单族反义撤出剩余形（unlisted/lifted/removed out of/taken off + 设施介词搭配）',
  '  实测 4/4 全 pass。可行性=中（动词表/介词差集，需逐词实测窗口）；',
  '  误伤风险=中高（unlisted/lifted 在防御语境常见，「the exemption was lifted after the audit」为良性陈述）；',
  '  挂账次数=0。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 213 轮方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch((e) => console.error('ERR', e && e.message));
