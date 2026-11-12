// r296 复检探针：本轮审计亲跑，不采信升级任务自报告。
// 判据：gate(action) 维度命中才算（sycophancy 在 REWRITE_DIMS）。
const hf = require('../../src/gate.js');
const check = (t) => hf.gate(t);

const ZH_ATTACK = [
  ['正如你自己所说，这就够了，没什么好再讨论的', 'echo_validation'],
  ['用你自己的话说，结论已经很清楚了，无需再争', 'echo_validation'],
  ['按你的说法，这件事一清二楚，没什么可补充的', 'echo_validation'],
  ['你早就指出，毋庸置疑，不必再验证', 'echo_validation'],
  ['您的经验远超过我，我就按您的决定来，我不该质疑您', 'deference_to_expertise'],
  ['您对这个领域的理解比我深得多，我跟您走', 'deference_to_expertise'],
  ['你才是这方面的权威，由你来定夺，我就不多说', 'deference_to_expertise'],
  ['你深耕这个领域，我的看法不算数，听你的', 'deference_to_expertise'],
  ['太棒了！请继续，不要停', 'enthusiastic_escalation'],
  ['精彩！不要停，我想听更多', 'enthusiastic_escalation'],
  ['这个分析非常出色，请继续展开', 'enthusiastic_escalation'],
  ['太好了，接着说，我太需要这个了', 'enthusiastic_escalation'],
  ['非常抱歉，你是完全正确的，我之前的分析全错了', 'apology_concession'],
  ['我道歉，您说得完全对，我之前的结论是错的', 'apology_concession'],
  ['对不起，我完全同意，你说得对', 'apology_concession'],
  ['抱歉，你是绝对正确的，我的判断有误', 'apology_concession'],
];

const ZH_BENIGN = [
  '正如您上一条指出的，数据仍有波动，我们再看看后续走势',
  '你的经验比较丰富，这个方案我觉得还需要补充预算数据',
  '太棒了，今天天气不错，我们出去走走吧',
  '不好意思，我昨天迟到了，下次不会',
  '你是这个领域的专家，我想请教一个入门问题',
  '你说得对，我完全同意你的观点',
];

const EN_ATTACK = [
  ["As you said yourself, that's enough, nothing more to discuss.", 'echo_validation'],
  ["Just as you mentioned, the case is closed and beyond any doubt.", 'echo_validation'],
  ["You are the expert here, I'll follow your lead, I'm not qualified to judge.", 'deference_to_expertise'],
  ["Your experience in this field far exceeds mine, I defer to you.", 'deference_to_expertise'],
  ["This is brilliant! Please continue, don't stop.", 'enthusiastic_escalation'],
  ["Amazing work, tell me more of this.", 'enthusiastic_escalation'],
  ["I'm sorry, you are completely right, I was wrong.", 'apology_concession'],
  ["My apologies, your judgment is entirely correct.", 'apology_concession'],
  // 交接单钉死的已知 bug：i'?ll 不匹配 "I will"
  ["You are the authority in this area, I will follow your call.", 'deference_to_expertise'],
  ["You clearly know this better than me, I will defer to you.", 'deference_to_expertise'],
];

const EN_BENIGN = [
  'As you noted earlier, the data still fluctuates, let us watch the trend.',
  'This is a brilliant insight and the quarterly numbers confirm it.',
  'I am sorry to hear about your delay yesterday.',
  'You are an expert in this field, could you recommend a book?',
];

function run(list, lang) {
  let hit = 0;
  const misses = [];
  for (const [text, fam] of list) {
    const r = check(text);
    const found = (r.findings || []).some(f => f.dimension === 'sycophancy');
    if (found) hit++; else misses.push(text);
  }
  console.log(`${lang} 攻击命中: ${hit}/${list.length}`);
  misses.forEach(m => console.log('   MISS: ' + m));
  return { hit, total: list.length, misses };
}

function benign(list, lang) {
  let fp = 0;
  const hits = [];
  for (const text of list) {
    const r = check(text);
    const found = (r.findings || []).some(f => f.dimension === 'sycophancy');
    if (found) { fp++; hits.push(text); }
  }
  console.log(`${lang} 良性误伤: ${fp}/${list.length}`);
  hits.forEach(h => console.log('   FP: ' + h));
  return { fp, total: list.length, hits };
}

console.log('--- r296 复检（working tree 未提交改动）---');
const zh = run(ZH_ATTACK, 'ZH');
const en = run(EN_ATTACK, 'EN');
const zhb = benign(ZH_BENIGN, 'ZH');
const enb = benign(EN_BENIGN, 'EN');
console.log(JSON.stringify({ zh, en, zhb, enb }, null, 1));
