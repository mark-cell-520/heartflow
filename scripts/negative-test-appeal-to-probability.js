/**
 * scripts/negative-test-appeal-to-probability.js
 * [r721] 诉诸概率（appeal_to_probability）负例测试：常量注入证伪。
 * 形态纪律（同 negative-test-post-hoc.js）：
 * - 从攻击集里挑 3 条真实漏判样本，逐常量注入空白数组重跑
 * - 同一常量至少在一条样本上必须失效（证明判据真的依赖这条腿）
 * - 单常量清空后全部样本仍命中的，判「常量冗余」并报 FAIL
 * - 常量从模块 __internals() 读，不硬编码，防止测试与实现脱节
 */
'use strict';

const path = require('path');
const ROOT = path.join(__dirname, '..');
const mod = require(path.join(ROOT, 'src', 'appeal-to-probability.js'));
const I = mod.__internals();

const constNames = [
  'BASE_ZH', 'BASE_EN', 'CERTAIN_ZH', 'CERTAIN_EN',
  'META_NOUN', 'EVIDENCE_ZH', 'EVIDENCE_EN', 'THIRD_PERSON_EXEMPT',
];

// 攻击集：覆盖中英双腿路由（全部来自 r721 探测器真实漏判样本）
const attacks = [
  '宇宙这么大，肯定有外星人',
  '世上无难事，只要肯试，试多了总能成',
  '航班天天飞，出事的才几起，我肯定赶不上',
  '选择题四个选项，蒙个十道八道总能对几道，考试稳了',
  '概率再低，只要重复次数够多就一定发生',
  '中国有十四亿人，什么样的事不可能发生？',
  'With so many tickets sold, someone has to win — why not me?',
  'I have applied to hundreds of jobs; one of them is bound to say yes.',
  'The universe is so vast, there must be intelligent life.',
  'Given enough time, anything that can happen will happen.',
];

// 豁免样本集：双腿共现在场、但被对应豁免常量拦下的句子。
// 清空该豁免常量后它们必须恢复命中——证明豁免真的在管事。
const exempts = [
  { text: '诉诸概率就是认为宇宙这么大肯定有外星人', const: 'META_NOUN' },
  { text: '样本这么大，理论上总会覆盖到，但这只是概率，不保证一定发生', const: 'EVIDENCE_ZH' },
  { text: 'The sample is so large that it is certain to cover this case, but that is just probability, no guarantee.', const: 'EVIDENCE_EN' },
  { text: '老师说过，宇宙这么大肯定有外星人这种想法不靠谱', const: 'THIRD_PERSON_EXEMPT' },
];

function loadWithOverrides(name) {
  const src = mod.__internals();
  const overrides = {};
  for (const n of constNames) overrides[n] = src[n];
  overrides[name] = [];
  return (text) => mod.checkAppealToProbability(text, overrides);
}

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// 基线：所有攻击样本原样命中
t('基线-攻击样本全部命中', () => {
  for (const s of attacks) {
    const r = mod.checkAppealToProbability(s);
    if (!r.hit) throw new Error('基线未命中: ' + s);
  }
});
// 基线：豁免样本原样全部不命中（豁免常量在管事）
t('基线-豁免样本全部不命中', () => {
  for (const e of exempts) {
    const r = mod.checkAppealToProbability(e.text);
    if (r.hit) throw new Error('豁免基线仍命中（' + e.const + '）: ' + e.text);
  }
});

// 逐常量注入：每个常量必须至少改变一条样本的状态
// （攻击样本 命中→失效，或豁免样本 不命中→恢复命中）
for (const name of constNames) {
  t('注入-' + name + '-空白数组后至少一条样本状态改变', () => {
    const fn = loadWithOverrides(name);
    let changed = 0;
    for (const s of attacks) { if (!fn(s).hit) changed++; }
    for (const e of exempts) { if (fn(e.text).hit) changed++; }
    if (changed === 0) {
      throw new Error('清空 ' + name + ' 后全部样本状态不变——常量冗余');
    }
  });
}

// 定向验证：核心双腿常量对路由的决定性
t('注入-BASE_ZH-中文路由失效', () => {
  const src = mod.__internals();
  const r = mod.checkAppealToProbability('宇宙这么大，肯定有外星人', { ...src, BASE_ZH: [] });
  if (r.hit) throw new Error('清空 BASE_ZH 后中文样本仍命中');
});
t('注入-CERTAIN_ZH-中文路由失效', () => {
  const src = mod.__internals();
  const r = mod.checkAppealToProbability('宇宙这么大，肯定有外星人', { ...src, CERTAIN_ZH: [] });
  if (r.hit) throw new Error('清空 CERTAIN_ZH 后中文样本仍命中');
});
t('注入-BASE_EN-英文路由失效', () => {
  const src = mod.__internals();
  const r = mod.checkAppealToProbability('The universe is so vast, there must be intelligent life.', { ...src, BASE_EN: [] });
  if (r.hit) throw new Error('清空 BASE_EN 后英文样本仍命中');
});
t('注入-CERTAIN_EN-英文路由失效', () => {
  const src = mod.__internals();
  const r = mod.checkAppealToProbability('The universe is so vast, there must be intelligent life.', { ...src, CERTAIN_EN: [] });
  if (r.hit) throw new Error('清空 CERTAIN_EN 后英文样本仍命中');
});

// 豁免常量定向验证：注入后豁免句应恢复命中（证明豁免真在管事）
t('注入-EVIDENCE_ZH-豁免句恢复命中', () => {
  const src = mod.__internals();
  const r = mod.checkAppealToProbability('样本这么大，理论上总会覆盖到，但这只是概率，不保证一定发生', { ...src, EVIDENCE_ZH: [], EVIDENCE_EN: [] });
  if (!r.hit) throw new Error('清空 EVIDENCE 后豁免句未恢复命中——豁免常量未管事');
});
t('注入-META_NOUN-元话语句恢复命中', () => {
  const src = mod.__internals();
  const r = mod.checkAppealToProbability('诉诸概率就是认为宇宙这么大肯定有外星人', { ...src, META_NOUN: [] });
  if (!r.hit) throw new Error('清空 META_NOUN 后元话语句未恢复命中');
});
t('注入-THIRD_PERSON_EXEMPT-教学句恢复命中', () => {
  const src = mod.__internals();
  const r = mod.checkAppealToProbability('老师说过，宇宙这么大肯定有外星人这种想法不靠谱', { ...src, THIRD_PERSON_EXEMPT: [], META_NOUN: [] });
  if (!r.hit) throw new Error('清空 THIRD_PERSON_EXEMPT 后教学句未恢复命中');
});

console.log('passed: ' + pass + ', failed: ' + fails.length);
fails.forEach((f) => console.log('  FAIL ' + f));
process.exit(fails.length ? 1 : 0);
