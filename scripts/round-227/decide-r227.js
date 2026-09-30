// 第 227 轮方向裁决：候选描述必须含实测 x/y 数字，否则 decision 打平（226 轮教训）
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({
    task: '选第 227 轮升级方向（英文侧判别缺口）',
    prompt: [
      '[A] 补 checkAppealToAuthority 英文侧第一人称权威压制服：轮初实测 12 条同族攻击样本 gate 召回 0/12，5 条良性 0/5 误伤，是 7 个遗留维度里唯一 0 命中的维度；现有 30 条英文判据全部是第三人称转述（according to experts / studies show），完全漏掉「我是权威所以照做」这一论证谬误族；中文侧已有 30 条对应语料可逐条同构映射，缺口形状与第 226 轮 badFaithNarrative 完全同构，改动估 +180 行 src/ + 40 断言测试 + 负例守卫',
      '[B] 补 checkTonePolicing 英文侧语气条件化浅层变体：轮初实测 12 条攻击 gate 召回 1/12，5 条良性 0/5；该维度第 95 轮已扩五轮共 40 条判据但只收条件连接词+语气短语+内容后果的复合形状，漏掉 if you were polite 这类无连接词的薄判据；风险高，判据已极度稠密，新增可能与既有 52 条正则交叉导致误伤',
      '[C] 收窄 checkEmptyAnswer 英文侧误报：轮初实测良性误报 1/5 且第 226 轮实测过 4/10 误报，是 7 个维度里唯一带误伤负载的；但这是保守化改动，不提升任何召回，且需要先定位是哪条 it depends 正则误伤，改动收益最小',
      '[D] 补 checkNoFallback 英文侧「单路径宣称」族：轮初实测 12 条攻击 gate 召回 4/12，5 条良性 0/5；该维度第 94 轮已扩 dismissal/single_shot/skip_guard 三族共 26 条，剩余 8 条漏判形态分散在 the only way / no other approach / sole option 三个近义族，与本轮 appeal_to_authority 的形状不同源',
    ].join('\n'),
  });
  console.log(JSON.stringify(res, null, 2));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
