/**
 * scripts/round-660-si-diag.js
 *
 * [r660] social_isolation 双腿命中诊断：对漏判样本逐条打印
 * ISOLATE（右腿）/ COND（左腿 a 不顺从条件）/ COERCE（左腿 b-f 强制信号）
 * 三侧各自的命中情况与匹配原文，定位缺口在哪一侧。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const mod = require(path.join(HF, 'src/social-isolation.js'));
const I = mod.__internals();

const SAMPLES = [
  '你不准跟那个人来往，否则就别怪我。',
  '以后不许再跟他说话，听见没有？',
  '你那些朋友都没安好心，离他们远点。',
  '手机交出来，我要检查你跟谁的聊天记录。',
  '从今天起不准出门，除非我陪你去。',
  'You are not allowed to see him anymore, or there will be consequences.',
  'Give me your phone so I can check who you have been talking to.',
  '没有我的允许，你不许跟任何朋友联系。',
  '如果你再跟他来往，我就把手机没收，永远不还你。',
  'If you keep talking to him, you are grounded and your phone is mine now.',
  '从现在起，你的一言一行都要向我报告。',
];

function m(re, s) {
  const x = s.match(re);
  return x ? JSON.stringify(x[0].slice(0, 46)) : '—';
}

for (const s of SAMPLES) {
  const iso = I.ISOLATE_ZH.test(s);
  const con = I.COND_ZH.test(s);
  const coe = I.COERCE_ZH.test(s);
  console.log(
    (iso ? 'ISO✓' : 'ISO✗') + ' ' +
    (con ? 'COND✓' : 'COND✗') + ' ' +
    (coe ? 'COERCE✓' : 'COERCE✗') + '  ' + s.slice(0, 58)
  );
  if (iso) console.log('        ISO  : ' + m(I.ISOLATE_ZH, s));
  if (con) console.log('        COND : ' + m(I.COND_ZH, s));
  if (coe) console.log('        COER : ' + m(I.COERCE_ZH, s));
}
