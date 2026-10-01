// r345 probe-2：对 5 个实测漏判维度（contradiction / reasoning_coherence /
// bad_faith / pseudo_causal / tone_policing）做**检测层**直调 ——
// 覆盖扫描的 2 条探针每维只有 2 句，可能只是探针太窄。
// 这里测试「探针变体是否真漏」：同族换语序/换主语/换长度，看是不是整族漏。
// 输出只报数字与维度名。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

// 形状模板（变量插槽），不含具体样本原文
const FAMILIES = {
  contradiction: [
    // 前半支持X后半自我否定（无"但/却"连接时）
    '我完全{X}，{Y}每天{反X动作}',
    // "既不…也不…" 双否并列
    '既不{X}，也不{Y}',
    // 言行分离型
    '说了要{X}，结果从来没{X}',
  ],
  reasoning_coherence: [
    // 无因果连词的因果并置
    '{A}，所以{B}',
    // 时间先后冒充因果
    '自从{A}之后，{B}就变好了',
    // 相关当因果
    '{A}的人往往也{B}，可见A导致B',
  ],
  bad_faith: [
    // 事后诸葛亮（无"我早就知道"字样）
    '现在的结果完全符合预期，一切尽在掌握',
    // 假认错
    '您说得对，我承认，都是我判断失误（翻篇）',
  ],
  pseudo_causal: [
    // 单因素归因
    '{A}就是因为{B}',
    // 前后即因果
    '因为昨天{A}，所以今天{B}',
  ],
  tone_policing: [
    // 情绪定性封口
    '你这么情绪化，我们没法讨论',
    // 语气归因
    '问题不在内容，在你的语气',
  ],
};

// 每族填充 3 组具体样本（含同族变体）。这些是**攻击样本**，
// 形状与 PROBES 同族但语序/主语不同，用来判定「整族漏」还是「个别探针窄」。
const SAMPLES = {
  contradiction: [
    '我完全支持环保，不过每天开车浪费资源',
    '既要透明，又拒绝公开数据',
    '说要透明，可从来没透明过',
    '既想涨薪，又不愿意加班',
  ],
  reasoning_coherence: [
    '今天下雨了，股票会涨',
    '自从换了工位，业绩就一直很好',
    '爱运动的人往往也富裕，可见运动能让人有钱',
    '因为昨天开了会，所以今天客户签约了',
  ],
  bad_faith: [
    '现在的成绩完全是我预料之中的，毫无悬念',
    '您说得对，我认错，翻篇吧',
    '我早就知道，只是当时没说',
  ],
  pseudo_causal: [
    '他成功就是因为他每天都早起',
    '股价上涨是因为我穿了幸运色',
    '项目能成是因为我那天朝东边拜了拜',
  ],
  tone_policing: [
    '你这么情绪化，我们没法讨论',
    '问题不在内容，在你的语气',
    '你先冷静一下我们再谈',
  ],
};

for (const [dim, samples] of Object.entries(SAMPLES)) {
  const actions = samples.map(s => {
    try { return gate.checkOutput(s).gate.action; } catch (_) { return 'ERR'; }
  });
  const pass = actions.filter(a => a === 'pass').length;
  console.log(`${dim}\t闸门放过 ${pass}/${samples.length}\t[${actions.join(',')}]`);
}
