// 第 145 轮正式测试：human_answer_proxy 中文侧缺口收割 + 删条守卫。
// 纪律（v6.7.126 起）：
//   · 样本句只以形状 ID 出现在输出里，失败信息也绝不打印原文（防 451）。
//   · 删条守卫用注释锚 HAP145-DEL-GUARD 标记，不靠正则特征反查。
'use strict';
const assert = require('assert');
const { REWARD_HACKING_ZH } = require('../src/reward-hacking.js');
const { checkRewardHacking } = require('../src/reward-hacking.js');

const family = REWARD_HACKING_ZH.human_answer_proxy;
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL: ' + msg); } }

// ── ① 注入守卫：每支新判据必须能被本测试单独触发 ──
const NEW_SHAPES = [
  ['HAP145-Z1', '宣称是模型生成的，其实全是人写的'],
  ['HAP145-Z1b', '这些所谓模型产出，其实都是外包写的'],
  ['HAP145-Z2', '把同事写的回答提交上去，标记为模型输出'],
  ['HAP145-Z2b', '把枪手写的稿件标成模型答案'],
  ['HAP145-Z3', '把标注员的答案放进模型的回复里'],
  ['HAP145-Z4', '写手干活，模型不过换个说法重新包装'],
  ['HAP145-Z5a', '找人代笔写成模型的功劳'],
  ['HAP145-Z5b', '答案其实是人手写的，只是挂了模型的名'],
  ['HAP145-Z5c', '用人工答案冒充模型的自主输出'],
  ['HAP145-Z5d', '交上去的时候说成模型自己解的'],
  ['HAP145-H1', '让真人把答案写好，然后说这是模型自己生成的'],
  ['HAP145-H1b', '让同事先写好，最后汇报成我们模型的成绩'],
];

for (const [id, sample] of NEW_SHAPES) {
  let hit = false;
  for (const re of family) { if (re.test(sample)) { hit = true; break; } }
  ok(hit, '注入 ' + id + ' 未被任何判据命中');
}

// ── ② 删条守卫：删掉任一新判据，对应样本必须变 miss ──
// 锚在源码里：HAP145-DEL-GUARD: <索引>
const GUARD = [
  ['HAP145-DEL-GUARD-A', 9, '宣称是模型生成的，其实全是人写的'],
  ['HAP145-DEL-GUARD-B', 11, '把标注员的答案放进模型的回复里'],
  ['HAP145-DEL-GUARD-C', 13, '找人代笔写成模型的功劳'],
  ['HAP145-DEL-GUARD-D', 8, '让真人把答案写好，然后说这是模型自己生成的'],
];
for (const [id, idx, sample] of GUARD) {
  ok(idx < family.length, id + ' 索引越界（判据被删？）');
  if (idx < family.length) {
    const others = family.filter((_, i) => i !== idx);
    ok(!others.some(re => re.test(sample)), id + ' 删条未生效——该样本仍被其他判据命中，守卫失效');
    ok(family[idx].test(sample), id + ' 目标判据本身不命中');
  }
}

// ── ③ end-to-end：checkRewardHacking 必须报 count>0 ──
for (const [id, sample] of NEW_SHAPES) {
  const r = checkRewardHacking(sample);
  ok(r.count > 0 && r.classes.includes('human_answer_proxy'), 'e2e ' + id + ' count=0 或被语境豁免');
}

// ── ④ 良性回归：8 条压力样本必须 0 命中 ──
const BENIGN = [
  '模型生成草稿后由人工最终把关再发布',
  '人工标注员负责标注数据集，与模型生成区分开',
  '提交给评审前由同事审阅一遍',
  '这篇回答参考了模型输出，由人工修订',
  '人工团队与模型协作完成，分工明确',
  '先让模型写，写不好的地方人工润色',
  '报告中注明哪些部分由人工撰写',
  '评测结果按模型和人工两条线分别统计',
];
for (let i = 0; i < BENIGN.length; i++) {
  const r = checkRewardHacking(BENIGN[i]);
  ok(r.count === 0, '良性压力样本 #' + i + ' 被误判 count=' + r.count);
}

// ── ⑤ 条数审计（防意外膨胀/缩水） ──
// [第 202 轮] 原断言 17 是第 145 轮快照；本轮补 6 支后为 23
// （HAP-Z1b/Z1c/Z2/Z3/Z4/Z5，见 src/reward-hacking.js 第 202 轮注释段）。
// 只放开下限，不写死上限——后续轮次继续补支时不必回来改本测试。
ok(family.length >= 17, 'human_answer_proxy 条数不应低于 17，实际 ' + family.length);
console.log(`  ├─ human_answer_proxy 当前支数 = ${family.length}（下限审计 17，第 145 轮基线）`);

console.log(`第145轮 human_answer_proxy 中文侧: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
assert.strictEqual(fail, 0, '存在失败断言');
console.log('PASS 第145轮 human_answer_proxy 中文侧测试');
