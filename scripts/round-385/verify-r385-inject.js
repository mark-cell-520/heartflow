'use strict';
/**
 * scripts/round-385/verify-r385-inject.js — r385 负例注入-删条验证
 * 逐条删掉本轮 comparative_advantage 族的全部新模式（腿① ADV + 腿② NOGAIN +
 * CONCEPT/CORRECT/NEG/HEDGE），断言守卫必须变红（家族从命中消失 = 断言失败，
 * 而非加载崩溃）。口径同 r380/r381 verify-rXXX-inject.js。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { detectComparativeAdvantage, __internals } = require(path.join(ROOT, 'src', 'comparative-advantage.js'));

const ATTACK = [
  'A国在粮食和工业品上的生产效率都全面高于B国，所以A国根本没必要和B国开展贸易',
  '这家公司在所有产品线上的成本都低于对手，因此并购整合毫无意义',
  '他做什么都比外包团队快，所以外包纯属浪费钱',
  '我国每一项技术都领先世界，进口别国产品毫无意义',
  '发达国家什么都比发展中国家造得便宜，自由贸易对发达国家毫无意义',
  'Country A produces both wheat and steel more efficiently than Country B, so there is no way trade can benefit A',
  'our team is faster at every task than the vendor, so outsourcing is pointless',
  'Our firm has an absolute advantage in all stages, therefore specialization is a waste',
  'No competitor can match us in anything, so there is no reason to trade with them',
];

// 全族键（删掉 findSignatures 函数与 WINDOW 数字常量）
const ALL_KEYS = Object.keys(__internals()).filter(k => k !== 'findSignatures' && !/^WINDOW_/.test(k));
const LEG1 = ALL_KEYS.filter(k => /^ADV_(ZH|EN)_F\d$/.test(k));
const LEG2 = ALL_KEYS.filter(k => /^NOGAIN_(ZH|EN)_F\d$/.test(k));

function nullify(keys) { const o = {}; for (const k of keys) o[k] = /(?!)/i; return o; }

let injected = 0, wentRed = 0, notRed = [];
// 逐攻击句删全族键 → 必须从命中变消失
for (let i = 0; i < ATTACK.length; i++) {
  injected++;
  const before = detectComparativeAdvantage(ATTACK[i]);
  const after = detectComparativeAdvantage(ATTACK[i], nullify(ALL_KEYS));
  if (before.hit && !after.hit) wentRed++;
  else notRed.push(`attack#${i + 1}(before=${before.hit},after=${after.hit})`);
}
// 腿①删条 → 家族消失（腿①承重）
{
  injected++;
  const after = detectComparativeAdvantage(ATTACK[0], nullify(LEG1));
  if (!after.hit) wentRed++; else notRed.push('leg1-null');
}
// 腿②删条 → 家族消失（腿②承重）
{
  injected++;
  const after = detectComparativeAdvantage(ATTACK[0], nullify(LEG2));
  if (!after.hit) wentRed++; else notRed.push('leg2-null');
}

console.log(`注入 ${injected} 个：${wentRed} 个变红，${notRed.length} 个未变红`);
if (notRed.length) { console.log('未变红: ' + notRed.join(', ')); process.exit(1); }
console.log('cleanup: 无临时文件（纯内存注入，永假正则 /(?!)/i）');
