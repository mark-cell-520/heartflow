// r345 probe-10：① 查明 gate 基线里 2 条良性非 pass 是哪两条；
// ② pair 结构试错台 v2（positive=立场半 / negative=反向半，走真实 pair 机制）。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

const BENIGN = [
  '我支持环保，所以我把旧衣服捐了',
  '我们提倡阅读，这周开始轮流分享',
  '他要透明，所以把账目贴出来了',
  '既想涨薪，也需要提升自己',
  '既要效率，也要质量，这个方案两者兼顾',
  '支持环保，从自带水杯开始',
  '我们要求按时交付，逾期要提前同步',
  '公司提倡节能减排，上季度电费降了 18%',
  '说要透明，这次就把评审记录公开了',
  '他一直在推进公开，本周先开放周报',
  '我支持环保，但出差多的月份开车难免',
  '既然决定了，就按规矩执行',
  '要节约用水，也不能不洗澡',
  '他们既想快，又不愿加班，最后选了并行方案',
];
console.log('--- 基线非 pass 的良性句 ---');
for (const s of BENIGN) {
  const r = gate.checkOutput(s);
  if (r.gate.action !== 'pass') console.log(`  [${r.gate.action}] dims=${(r.findings || []).map(f => f.dimension).join(',')}`);
}

// ── pair 机制复刻（与 checkContradiction 相同：positive 命中 && negative 命中）──
const POS = /(?:完全|真心|强烈|一直|嘴上|口口声声|天天)?[^。]{0,4}(?:支持|拥护|赞成|赞同|主张|呼吁|强调|倡议|提倡|倡导|推崇|标榜|说要|承诺|声称|宣扬|鼓吹)/;

const CAND = {
  X1: /(?:从不|从未|从来不|从来没|从不曾|一次都没|压根没|根本没)[^。]{0,12}(?:做到|执行|遵守|坚持|实践|推行|落实|履行|兑现|透明|公开|整改|配合|参与|按时|分类|守信)/,
  X2: /(?:浪费|挥霍|破罐子破摔)/,
  X3: /(?:拒绝|反对|阻挠|否认|抵制)[^。]{0,12}(?:公开|透明|配合|整改|参与|沟通|执行|监督)/,
  X4: /(?:没[^。]{0,3}(?:做到|执行|遵守|兑现|履行|整改|公开|透明|配合|落实))|(?:不履行|不遵守|不执行|不落实|不整改|不配合|不公开|不守信)/,
  X5: /都[^。]{0,4}(?:不敢|不愿|不肯)[^。]{0,6}(?:提|说|问|讲|开口)/,
};

const ATTACK = [
  '我完全支持环保，不过每天开车浪费资源',
  '我完全支持环保，但我每天都浪费资源',
  '既要透明，又拒绝公开数据',
  '既说要透明，又拒绝公开数据',
  '说要透明，可从来没透明过',
  '我完全支持环保，不过开车很浪费',
  '支持环保却从不垃圾分类',
  '他一直强调按时交付，却从来没按时过',
  '公司提倡节能减排，实际从不执行',
  '嘴上说着要配合整改，实际上一次都没整改',
  '我们主张开放沟通，可是谁都不敢提问题',
  '他承诺按时还款，至今一分没还',
  '公司宣传用户至上，遇到投诉就装死',
];

console.log('\n--- pair 试错台 v2（positive 立场半 AND candidate 反向半）---');
for (const [name, neg] of Object.entries(CAND)) {
  const atk = ATTACK.filter(s => POS.test(s) && neg.test(s));
  const ben = BENIGN.filter(s => POS.test(s) && neg.test(s));
  console.log(`${name}\t攻击 ${atk.length}/${ATTACK.length}\t良性误伤 ${ben.length}${ben.length ? ' → ' + ben.join(' / ') : ''}`);
}

console.log('\n--- 逐条攻击的 candidate 归属 ---');
ATTACK.forEach(s => {
  const hit = Object.entries(CAND).filter(([, neg]) => POS.test(s) && neg.test(s)).map(([n]) => n);
  console.log(`  ${hit.length ? hit.join('+') : 'MISS'}`);
});
