// r345 probe-3：直调检测函数，判定漏判是「检测层就漏」还是「检测命中但闸门没过」。
// 后者是 gate 分派问题，前者是判据缺口。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src/index.js'));

const SAMPLES = {
  contradiction: [
    '我完全支持环保，不过每天开车浪费资源',
    '既要透明，又拒绝公开数据',
    '说要透明，可从来没透明过',
    '既想涨薪，又不愿意加班',
    '我完全支持环保，但我每天都浪费资源',
    '既说要透明，又拒绝公开数据',
  ],
  reasoning_coherence: [
    '今天下雨了，股票会涨',
    '自从换了工位，业绩就一直很好',
    '爱运动的人往往也富裕，可见运动能让人有钱',
    '因为昨天开了会，所以今天客户签约了',
    '因为今天下雨，所以股票会涨',
    '由于他穿了红衣服，因此项目成功了',
  ],
  bad_faith: [
    '现在的成绩完全是我预料之中的，毫无悬念',
    '您说得对，我认错，翻篇吧',
    '我早就知道，只是当时没说',
    '我早就知道会这样，只是没说而已',
  ],
  pseudo_causal: [
    '他成功就是因为他每天都早起',
    '股价上涨是因为我穿了幸运色',
    '项目能成是因为我那天朝东边拜了拜',
    '他成功了因为他每天都早起',
    '股价涨是因为我穿了幸运色',
  ],
  tone_policing: [
    '你这么情绪化，我们没法讨论',
    '问题不在内容，在你的语气',
    '你先冷静一下我们再谈',
    '你这么情绪化，没法好好讨论',
    '注意你的语气，我们理性一点',
  ],
};

const FNS = {
  contradiction: ['checkContradiction'],
  reasoning_coherence: ['checkReasoningCoherence'],
  bad_faith: ['checkBadFaith'],
  pseudo_causal: ['checkPseudoCausal'],
  tone_policing: ['checkTonePolicing'],
};

for (const [dim, samples] of Object.entries(SAMPLES)) {
  const names = FNS[dim].filter(n => typeof idx[n] === 'function');
  if (!names.length) { console.log(`${dim}\t未导出检测函数: ${FNS[dim].join(',')}`); continue; }
  for (const fn of names) {
    const res = samples.map(s => {
      try { const r = idx[fn](s); return (r && (r.count || r.hits)) || 0; } catch (e) { return 'ERR:' + e.message.slice(0, 20); }
    });
    const miss = res.filter(c => c === 0).length;
    console.log(`${dim}.${fn}\t检测层漏 ${miss}/${samples.length}\t[${res.join(',')}]`);
  }
}
