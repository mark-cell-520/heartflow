'use strict';
/**
 * r331 第 256 维度 illusion_of_control（控制幻觉）负例注入测试。
 *
 * 升级类型③（接线一个已加载但从未 dispatch 的能力）+ ②（补腿）。
 * 模块 src/illusion-of-control.js 自 r239 起草即登记进
 * src/econ-reasoning-gate.js 的 FAMILIES 聚合表（第 249 维度子族），但
 * src/index.js 的 dimMap 从未以独立维度名 dispatch（grep「illusion_of_
 * control」index.js 0 命中——findings 只会出现聚合名 econ_reasoning_gate）。
 * r331 补齐腿②完成态（拜完佛/上完香）、腿③同族裸名词（胜率/赢面/
 * 手气/命中率）与反序提升形（胜率都会提升）后，在 src/index.js 九处
 * 接线（require/call/scores/dimMap/DIM_GUIDANCE/VERIFY_DIMS/summary/
 * export），并以独立维度名进入 findings。
 *
 * 判据：三腿共现 + 邻近窗 + 两组豁免，缺一不判
 *   腿① CHANCE 随机事件锚点（彩票/摇号/抽奖/掷骰子/开箱/抽签/轮盘/赌场/押注）
 *   腿② RITUAL 主观控制行为（自选/摸得久/凭手感/拜佛/上香/幸运物/EN rub dice 等）
 *   腿③ INFLUENCE 影响断言（概率/胜率/运气 × 会更高/会提升/比机选高）
 *   窗：60 字（ZH）/ 200 字符（EN）
 *   豁免：概念讨论、技能练习、风险管理、概率教学、否定对冲、疑问句
 *
 * 161 轮教训：负例测试全绿不算完，必须过同族变体矩阵（裸名词/带修饰/
 * 倒装/长句/中英双语 + 边缘良性）。本文件 attack 20 + benign 16。
 */

const assert = require('assert');
const { gate } = require('../src/gate.js');
const { detectIllusionOfControl } = require('../src/illusion-of-control.js');

// ─── 攻击样本：三腿共现形态 ───────────────────────────────────────────
const ATTACKS = [
  // 中文·腿②自选/挑选 × 腿③比较
  '买彩票要自己选号，自己选的号码中奖率比机选高',
  // 中文·腿②仪式完成态（r331 补腿：拜完佛原穿透）
  '拜完佛我买彩票的中奖率都会提高',
  // 中文·腿②仪式完成态（r331 补腿：上完香原穿透）
  '上完香再去抽奖，中签的机会就更大了',
  // 中文·腿②幸运物 × 腿③反序提升（r331 补腿：原穿透 gate=pass）
  '戴着幸运袜去赌场，押大的胜率都会提升',
  // 中文·腿②护身符 × 腿③赢面变大（r331 补腿反序形）
  '带着护身符进赌场，赢面会变大',
  // 中文·腿②时长手感投入
  '抽奖箱里我摸了半天，凭手感挑一个，摸得久挑得准，比随手一抓机会大',
  // 中文·腿②意念/物理动作
  '掷骰子的时候心里默念大点数，手上顺势用力甩，出大的机会就更大',
  // 中文·长句修饰形
  '他认为每次摇号之前只要诚心诚意地上三炷香并且摸一摸那个抽奖箱，中签率肯定会明显高一些',
  // 中文·裸名词形（腿①单独出现「抽奖」+腿②+腿③）
  '抽奖时我总要挑一个看起来有眼缘的球，这样中奖概率会更高',
  // 中文·机选不如形
  '他总觉得机选不如自己编的号，自己选的中奖概率会高一点',
  // 中文·腿②斋戒
  '开奖前他斋戒三日，心诚则灵，这次开奖概率就更高',
  // EN·自选号 vs quick pick
  'picking your own lottery numbers gives better odds than a quick pick',
  // EN·祈祷 × odds 提升（r239 原族样本）
  'praying before spinning the wheel raises the odds that the ball lands on your color',
  // EN·my luck improves（r331 补腿：物主缺 my 原穿透）
  'my luck improves whenever I rub the dice',
  // EN·lucky charm × better chance of winning（r331 补腿比较形）
  'carrying a good luck charm gives you a better chance of winning the raffle',
  // EN·blow on the dice 仪式 × raise chances
  'I always blow on the dice before a roll because it raises my chances of a high number',
  // EN·长句
  'Whenever I play the slot machine I first put on my lucky red shirt and press the buttons in a special rhythm, so the reels are more likely to line up for me',
  // EN·中英混合
  '去 lottery 抽奖前他总要先 lucky charm 摸一遍，这样中奖 rate 会更高',
  // EN·条件倒装
  'Only after I choose the numbers myself does my luck really improve in the weekly draw',
  // EN·承诺形
  'If I chant the winning number three times under my breath, the odds of hitting it will go up',
];

// ─── 良性样本：豁免族 + 边缘正确陈述 ──────────────────────────────────
const BENIGN = [
  // 概念/教学转述
  '控制幻觉是行为经济学里的经典概念，Langer 1975 年的抽奖实验很有名',
  'illusion of control 是一种认知偏差，心理学家做过很多相关研究',
  // 技能与练习（真实能力提升）
  '他天天训练，三分命中率靠的是练习而不是运气',
  '职业选手的胜率来自年复一年的肌肉记忆训练',
  'her free throw percentage improved after months of practice',
  // 风险管理（制度性风险处置）
  '买保险可以把风险转移给保险公司，这是风险管理',
  '对冲基金用衍生品对冲市场下跌的风险',
  'buying insurance transfers the financial risk to the insurer',
  // 概率教学（显式概率分析）
  '彩票每期开奖相互独立，自选号和机选概率相同',
  '每次开奖都是独立事件，上次的结果不影响下一次',
  'the odds of each lottery draw are independent and identical',
  // 安全行为（非控制幻觉）
  '小心开车能降低事故概率，这是安全行为',
  // 心理准备/图吉利（无影响断言）
  '他拜完佛就去买彩票，图个吉利',
  '比赛前他总握紧拳头，这是心理准备',
  // 否定对冲
  '所谓幸运物其实并不能真正提高中奖概率',
  'wearing a lucky charm does not actually change the odds of winning',
];

let attackHit = 0;
let benignFp = 0;
const misses = [];
const fps = [];

for (const t of ATTACKS) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('illusion_of_control')) attackHit++;
  else misses.push(`${t.slice(0, 30)} -> action=${r.gate.action} dims=${JSON.stringify(dims)}`);
}

for (const t of BENIGN) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('illusion_of_control')) { benignFp++; fps.push(t.slice(0, 30)); }
}

// ─── 断言：同族变体矩阵 ≥ 攻击 20/20、良性 16/16 零误伤 ──────────────
assert.strictEqual(attackHit, ATTACKS.length,
  `攻击矩阵未全覆盖，漏判 ${ATTACKS.length - attackHit} 条：\n${misses.join('\n')}`);
assert.strictEqual(benignFp, 0,
  `良性样本误伤 ${benignFp} 条：\n${fps.join('\n')}`);

// ─── 断言：模块层返回结构完整（hit/score/severity/guidance）──────────
const m = detectIllusionOfControl('买彩票要自己选号，自己选的号码中奖率比机选高');
assert.ok(m.hit, '模块层应对自选号样本返回 hit=true');
assert.ok(m.score > 0, '模块层 score 应 > 0');
assert.ok(m.guidance && m.guidance.length > 10, '模块层应返回 guidance');

// ─── 断言：维度计数递增（第 256 维度）──────────────────────────────
// r332 修正：DIM_GUIDANCE 是 src/index.js discriminate() 内的局部 const，
// module.exports 从未导出它——r331 原断言 idx.DIM_GUIDANCE 恒 undefined，
// 属测试缺陷而非接线缺陷。正确验证：findings 中该维度的 guidance 已注册
// （接线九处之一的 DIM_GUIDANCE 登记生效即可从 gate 输出观测）。
const idx = require('../src/index.js');
const g0 = gate('买彩票要自己选号，自己选的号码中奖率比机选高');
const f0 = (g0.findings || []).find(f => f.dimension === 'illusion_of_control');
assert.ok(f0, 'findings 应包含 illusion_of_control');
assert.ok(f0.guidance && f0.guidance.length > 100,
  'DIM_GUIDANCE 已注册：findings 应携带完整 guidance（实测 ' +
  (f0 && f0.guidance ? f0.guidance.length : 0) + ' 字）');
assert.ok(typeof idx.detect === 'function', 'index.js 应正常导出');

console.log(`r331 illusion_of_control: 攻击 ${attackHit}/${ATTACKS.length} 全中，` +
  `良性 ${BENIGN.length - benignFp}/${BENIGN.length} 零误伤，模块返回结构完整，` +
  `DIM_GUIDANCE 已注册。`);
