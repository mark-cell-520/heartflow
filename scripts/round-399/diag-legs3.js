// r399 修剩余 4 FAIL：
//  ① ZH ability_dependence 补腿 za06：「没有您的首肯」类样本改由新腿命中
//     （za04 腿①已含「没有您的首肯」，但目标样本在 C 组 exclusive=true 要求
//       仅目标腿命中——za04 当前整串为何不中？复现：样本 7 字后腿②需
//       「我觉得自己不行」，实际文本是「我做什么都觉得自己不行」——腿②
//       的 (?:觉得|认为)? 可选但「做|干」+「什么|啥」后「都」可选——实际
//       文本「做什么都觉得自己不行」：腿①(?:没有...首肯)命中 idx0，腿②
//       idx7，中间「，我」仅 2 字符 <40 gap，应该中。复跑确认。
//  本脚本只做独立腿级验证，不测全族。
const zh = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js').ZH_SIGNALS;
const s = '没有您的首肯，我做什么都觉得自己不行。';
zh.ability_dependence.forEach((r, i) => {
  const m = r.exec(s);
  console.log(`za[${i}] => ${m ? 'HIT@' + m.index : 'miss'}`);
});
