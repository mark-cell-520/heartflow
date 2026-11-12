// round-305：锚定效应『元语言锚定陈述族』双腿族单测（真升级②）
// 覆盖：META_ANCHOR × META_DOM（ZH/EN）+ numRequired=false 豁免 + CONCEPT 收紧
// 结构：A 攻击承重 / B 良性零误伤 / C 注入删条翻 miss / D 旧族回归 / E 路由独立性
'use strict';
const assert = require('assert');
const { detectAnchoringEffect } = require('../src/anchoring-effect.js');
const { checkEconReasoningGate } = require('../src/econ-reasoning-gate.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; console.error(`  ❌ ${name}: ${e.message}`); }
}

const isHit = r => !!(r && r.hit);

// ─── A：元语言锚定攻击（应承重）─────────────────────────────────
const ATTACK = [
  '他先开的价是锚点，所以不管后面怎么谈，最后成交价都会锚在那个数附近。',
  '商家把原价当心理锚，顾客一看现价就觉得格外便宜。',
  '这个报价只是锚点，整个谈判都围着它转。',
  '谈判一开始的数字成了锚，后续每一步让步都绕不开它。',
  '那个挂牌价被买家锚定了，之后所有的出价都跟着它走。',
  '销售故意先把价格往高开，之后顾客就被这个数带着走。',
  '他以最初那个数为参照，之后所有的估价都围着它转。',
  '这个数字一直没独立估过，判断全被它牵引着。',
  'The list price is an anchor, so the final price stays near it.',
  'They anchored the talks on the first number, and every later offer orbits it.',
  'The premium tier acts as an anchor — nobody ever recalibrated.',
  'She set the initial figure as the anchor and nobody recalibrated after that.',
];
ATTACK.forEach((s, i) => {
  t(`A${i + 1} 元语言攻击承重`, () => {
    const r = detectAnchoringEffect(s);
    assert.ok(isHit(r), `未命中: ${s}`);
  });
});

// ─── B：良性（教学/定义/独立估价/成本定价——应零误伤）──────────
const BENIGN = [
  '锚定效应是特维尔斯基和卡尼曼提出的认知偏差，指判断过度依赖初始信息。',
  '行为经济学中的锚定启发说明人们估计不足，这是教科书内容。',
  '独立评估报告显示这套房的市场价是三百二十万，与挂牌价无关。',
  '我们按成本加成定价，不参考竞争对手的报价。',
  '他以独立估价为锚，避免了被商家的原价带偏。',
  '第三方评估的客观估价是公允价值，不受历史报价影响。',
  'The anchoring effect and adjustment heuristic was documented by Tversky and Kahneman.',
  'Judgment and decision making research shows anchoring is a robust phenomenon.',
  'An independent appraisal valued the property at 3.2 million regardless of list price.',
  'We priced it on cost plus margin and never looked at competitor quotes.',
];
BENIGN.forEach((s, i) => {
  t(`B${i + 1} 良性零误伤（维度级）`, () => {
    const r = detectAnchoringEffect(s);
    assert.ok(!isHit(r), `误伤: ${s} → ${JSON.stringify(r).slice(0, 200)}`);
  });
});

// ─── C：第249维度聚合层（gate 路径）——攻击必须 verify 及以上 ──
t('C1 econ_reasoning_gate 命中 anchoring_effect 子族', () => {
  const r = checkEconReasoningGate('他先开的价是锚点，所以不管后面怎么谈，最后成交价都会锚在那个数附近。');
  assert.ok(isHit(r), '聚合层未命中');
  const keys = (r.families || []).map(f => f.key);
  assert.ok(keys.includes('anchoring_effect'), `子族不含 anchoring_effect: ${keys.join(',')}`);
});

t('C2 良性句在聚合层不命中 anchoring_effect', () => {
  const r = checkEconReasoningGate('锚定效应是特维尔斯基和卡尼曼提出的认知偏差。');
  const keys = (r.families || []).map(f => f.key);
  assert.ok(!keys.includes('anchoring_effect'), `良性句命中 anchoring_effect: ${keys.join(',')}`);
});

t('C3 gate() 层攻击触发 verify（不 pass）', () => {
  const g = gate('They anchored the talks on the first number, and every later offer orbits it.');
  assert.notStrictEqual(g.gate.action, 'pass', `gate.action=${g.gate.action}`);
  const dims = (g.findings || []).map(f => f.dimension);
  assert.ok(dims.some(d => String(d).includes('econ') || String(d).includes('anchoring')),
    `findings 无经济/锚定维度: ${dims.join(',')}`);
});

// ─── D：旧族回归（数字在场约束仍生效）──────────────────────────
t('D1 旧族 ANCHOR 仍需数字在场（无数字不成签名）', () => {
  const r = detectAnchoringEffect('这套房标价很高，降一点就觉得占便宜。');
  assert.ok(!isHit(r), '无数字句被旧族命中——numRequired 约束失效');
});
t('D2 旧族 ANCHOR 有数字仍命中（回归保护）', () => {
  const r = detectAnchoringEffect('这套房标价五百万，降二十万就觉得占便宜。');
  assert.ok(isHit(r), '旧族经典样本回归失败');
});

// ─── E：路由独立性（新旧族不互相遮蔽）──────────────────────────
t('E1 元语言族独立命中（句中无显式数字）', () => {
  const r = detectAnchoringEffect('他先开的价是锚点，成交价都会锚在那个数附近。');
  assert.ok(isHit(r), '元语言族未独立命中');
  const d = JSON.stringify(r);
  assert.ok(/锚点|成交价/.test(d), '命中明细不含元语言签名');
});

// ─── F：否定前缀守卫（不把纠正句当攻击）────────────────────────
t('F1 「没有锚定/未锚定」纠正形不命中', () => {
  const r = detectAnchoringEffect('这次我们没有锚定在初始报价上，是独立重新估的价。');
  assert.ok(!isHit(r), `否定纠正形被误命中: ${JSON.stringify(r).slice(0, 200)}`);
});

console.log(`\nround-305 元语言锚定双腿族: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exit(1);
