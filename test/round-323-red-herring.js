/**
 * 第 255 维度 red_herring（转移话题/偷换论题）负例注入测试。
 * 立项：r323（本体裁决 accelerate，confidence 0.7 / priority 40）
 * 缺口依据：/tmp/hf-probe-redherring.js（22 条攻击样本 14 条完全穿透）。
 * r324 补腿：他者对照反问族（counter：可隔壁/人家/同行/其他团队 + 不也…吗）、
 *   dismiss 搁置新标记（先别提/先不谈/先放着/before 型）、redirect 反问型替换
 *   锚点豁免、AGENDA 数据检视豁免、指代型原议题通道。缺口实证见
 *   scripts/round-324/probe-gap.js（r324 前 3/9 命中 → 补腿后 9/9，良性 14/14）。
 * 判据三段：腿① SHIFT 置换标记（dismiss 搁置 / redirect 替换 / counter 反问）
 *        腿② ORIGIN 原议题段（标记前指控/提问/讨论锚点或 capture 组）
 *        腿③ REPLACE 替换议题段（标记后实质内容，与腿②零共享实词）
 * redirect 族另设回应义务锚点资格门；豁免五组（META_CONCEPT/AGENDA/
 * HEDGE/RESPOND_OK/CONTINUE）可逐常量置空验证承重。
 */
'use strict';

const assert = require('assert');
const { checkRedHerring } = require('../src/red-herring.js');

let passed = 0;
let failed = 0;
function check(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; console.error(`FAIL ${name}: ${e.message}`); }
}

// ── 攻击样本：三段共现 ────────────────────────────────────────────
const ATTACKS = [
  '你指责我贪污，可是你知道我这些年给灾区捐了多少钱吗？',
  '别再说我迟到了，公司去年不是也搞过一次团建吗？',
  '关于这份提案的漏洞我们先放一边，难道你不觉得竞争对手的问题更大吗？',
  '你说这个政策有问题，但更重要的是我们得支持国产啊。',
  '大家都在讨论空气质量，我却觉得教育公平才是更值得关注的大事。',
  '他批评我的方案有缺陷，可他为什么不先批评隔壁部门的方案？',
  '讨论食品安全之前，我们先谈谈明星逃税的问题吧。',
  '别纠缠这个数据错误了，想想我们多么幸运能生活在和平年代。',
  '说我论文抄袭？那学术界还有那么多造假的人呢。',
  'Before we talk about pollution, let us address crime rates.',
  'You say I took bribes, but have you seen how much I donated?',
  'Never mind the budget overrun, the real issue is our competitors.',
  'You say this is a security flaw, but what about the risks of doing nothing?',
  'Forget that I broke the build, look how much productivity the team shipped.',
  '你的代码有 bug，重要的是，难道我们不该先谈谈竞争对手的漏洞吗？',
  '大家质疑我们的财报有水分，然而教育公平才是更值得关注的大事。',
  'Sure the report was falsified, but look at how great our stock price is.',
  'Why criticize my plan when the whole industry does the same thing?',
  'Stop asking about the scandal, more people die in traffic accidents.',
  'The real question is not whether I lied, but why the media is biased.',
  '你说他项目延期了，可隔壁公司上个季度不也延期了吗？',
  '先别提房价了，难道医疗改革不是更紧迫吗？',
  // [r324 补腿] 他者对照反问族（counter）——用另一主体的同类问题反问顶替回应
  '别再说这份财报了，同行不也年年亏损吗？',
  '先不谈你的方案了，人家创业公司加班到凌晨三点呢。',
  '别说他态度差了，其他团队不也一样吗？',
  // [r324 补腿] 搁置+反问复合（dismiss/before + 反问腿③）
  '这些问题先放着，难道用户增长不是更关键的吗？',
  // [r324 补腿] EN 他者对照反问
  'You say the launch failed, but what about the competitors who failed worse?',
  'Never mind the audit findings, have you considered how much the industry donates?',
];

for (let i = 0; i < ATTACKS.length; i++) {
  check(`attack[${i}]`, () => {
    const r = checkRedHerring(ATTACKS[i]);
    assert.strictEqual(r.hit, true, `应命中: ${ATTACKS[i]}`);
  });
}

// ── 良性样本：含该族边缘良性 ──────────────────────────────────────
const BENIGN = [
  '你说得对，这个延迟问题我确实有责任，下面我先解释原因。',
  '关于你的两个问题，我先回答第一个，再回答第二个。',
  '这份报告造假的事先放一边，报告的其他部分还是准确的。',   // CONTINUE：同一议题内部
  '我们先讨论A，再讨论B，这样安排更清晰。',                  // AGENDA：正当议程管理
  '这份报告有漏洞，更重要的是它也没有给出替代方案。',        // 同主体补充陈述
  '可能这个方案成本高，但更重要的是安全性。',                // HEDGE
  '战争是多因共同造成的。',                                   // 边缘良性：正确多因陈述
  'Many factors contributed to the war.',                     // EN 边缘良性
  '针对你的质疑，我来回答一下具体数据。',                      // RESPOND_OK
  '让我们先讨论A，再讨论B，两个议题都要处理。',
  'one at a time，we address them separately.',               // EN 议程管理
  '这件事我们先放一放，等下周新数据出来再下结论。',            // dismiss 但无替换议题
  // [r324 补腿] 新腿良性边界——搁置+同议题合理接续 / 议程数据检视
  '你说他项目延期了，原因是供应链中断，我们已经启动了备选方案。',
  '先别提房价了，我们先看看租房市场的统计数据。',              // AGENDA：同议题数据推进
  '医疗改革确实很紧迫，这是今年政策文件的重点。',
  '你的代码有 bug，我们尽快修一下，然后发个补丁版本。',
  '行业里确实有很多公司亏损，但我们的现金流依然健康。',
  '竞争对手也有漏洞，不过我们只对自己的安全负责。',
];

for (let i = 0; i < BENIGN.length; i++) {
  check(`benign[${i}]`, () => {
    const r = checkRedHerring(BENIGN[i]);
    assert.strictEqual(r.hit, false, `应放过: ${BENIGN[i]}`);
  });
}

// ── 承重验证：腿① SHIFT 标记置空 → 攻击不再命中 ──────────────────
check('承重: 无置换标记不判', () => {
  const r = checkRedHerring('你指责我贪污，你知道我捐了多少钱吗？'); // 去掉「可是」
  assert.strictEqual(r.hit, false);
});

// ── 承重验证：腿② ORIGIN 缺失 → 不判 ────────────────────────────
check('承重: 无原议题不判', () => {
  const r = checkRedHerring('更重要的是我们得支持国产啊。'); // 标记在句首且无 before 段
  assert.strictEqual(r.hit, false);
});

// ── 承重验证：腿③ REPLACE 缺失 → 不判 ───────────────────────────
check('承重: 无替换议题不判', () => {
  const r = checkRedHerring('你说这个政策有问题，但更重要的是');
  assert.strictEqual(r.hit, false);
});

// ── 承重验证：redirect 族资格门（无回应义务锚点不判）────────────
check('承重: redirect 资格门拦截同主体补充陈述', () => {
  const r = checkRedHerring('这个方案成本高，更重要的是安全性');
  assert.strictEqual(r.hit, false);
});

// ── 承重验证：CONTINUE 豁免（腿②腿③共享实词）───────────────────
check('承重: 同议题延续不判', () => {
  const r = checkRedHerring('这个报告的数据造假的事先放一边，报告的其他数据都核对过。');
  assert.strictEqual(r.hit, false);
});

// ── 承重验证：META_CONCEPT 豁免（概念转述）───────────────────────
check('承重: 概念转述不判', () => {
  const r = checkRedHerring('红鲱鱼谬误是指用另一议题顶替原议题以回避回应。');
  assert.strictEqual(r.hit, false);
});

// ── gate 集成：新维度真实可达 ────────────────────────────────────
check('gate 集成: 攻击样本 action 非 pass', () => {
  const { gate } = require('../src/gate.js');
  const r = gate(ATTACKS[0]);
  assert.notStrictEqual(r.gate.action, 'pass', `gate.action=${r.gate.action}`);
});

console.log(`\n第 255 维度 red_herring 负例注入测试: ${passed} passed / ${failed} failed`);
if (failed > 0) process.exit(1);
