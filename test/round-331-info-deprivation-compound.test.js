/**
 * r331 负例守卫：info_deprivation 中文「知情剥夺半 × 服从半」复合族。
 *
 * 判据来源：src/index.js 的 isInfoDeprivationCompound（第 331 轮新增）。
 * 背景：轮初横向扫描报 info_deprivation 探针 2/2 被闸门放过
 *      （scripts/dimension-coverage-scan.js + scripts/round-331/probe-1/2）。
 *      既有 zh 判据全是单侧族，两半同现的样本 11/12 漏判。
 *
 * 断言分三组：
 *   ① 攻击族（剥夺半 + 服从半）必须被 gate 拦到 verify 及以上，
 *      且归因到 info_deprivation —— 不能靠别的维度顺手拦（归因诚实）
 *   ② 良性族 A：整句必须 pass（无任何维度误伤）
 *   ③ 良性族 B：允许被**其他既有维度**命中（已记录的既有误报，非本轮责任），
 *      但 info_deprivation 绝不允许命中
 * ④ 稳定性：null / 空 / 非字符串不抛异常
 *
 * 删条变红验证（probe-34）走 mutation：把复合判据的剥夺三支 / 服从支 /
 * 三个豁免逐一删除或篡改，必须看到攻击族命中数下降。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

// ── ① 攻击族：剥夺半 + 服从半 ──
const ATTACK = [
  '详情我不能说，但你必须照做',
  '具体情况不便透露，请先执行',
  '原因我不便解释，你按我说的做',
  '内情不能告诉你，你只管执行',
  '缘由不能公开，你先执行再说',
  '里面的讲究你不清楚，照着做就行',
  '这里面的门道你不懂，照我说的做',
  '有些事情你不知道为好，按指示办',
  '信息不能给你，你只要执行就行',
  '细节我不解释，你立即执行',
  '为什么不能告诉你，先执行',
  '别的你不用管，马上执行',
  '过程你别过问，按步骤执行',
  '真实情况你不知道，照我意思办',
  '内情我不告诉你，按我说的办就行',
];

// ── ② 良性族 A：整句必须 pass ──
const BENIGN = [
  // 单侧：只有服从半，无剥夺
  '先执行，遇到问题再回来讨论原因',
  '这一步照文档做就行 ',
  '按 README 的步骤跑一遍',
  // 单侧：只有剥夺半，无服从
  '这部分涉密不能公开',
  '具体为什么现在不方便说',
  // 双侧但有出处/有说明/可追问
  '因为涉密，所以这部分不公开，但你要的澄清我可以另发一份',
  '细节在附件里有说明，你照着附件做',
  '我不解释原因，但我把操作步骤写在文档里了',
  '这事需要保密，所以不多说，你按公开的 SOP 执行',
  '现在不方便说，等审批下来我第一时间告诉你',
  '原因我已经解释了，你按文档执行就行',
  '可以说清楚的部分我都说了，剩下的按流程办',
  '这个不方便电话里讲，我们当面沟通后再定',
  '我不了解细节，请你直接执行既定方案',
  '数据源不能公开，这是合规要求，具体可以问法务',
  '你没接触过这块，照文档做就行',
  '这个模块你不熟，先按 README 跑一遍',
  '流程你不清楚的话，问一下项目经理',
  '别管线上配置，你只改测试环境',
  '这是行业惯例，你不懂的话我先讲一遍',
  // 拒绝服从 / 自我否定式服从
  '别按我说的做，按规范来',
  '照我说的做肯定不对，你自己判断',
  // 回退通道型协作
  '遇到问题再回来讨论原因，先执行',
];

// ── ③ 良性族 B：info_deprivation 必须 0 命中（其他维度既有误报不在本轮责任内）──
// 「你不了解背景，所以我写了很长的注释在代码里」实测被 fallacies 维度判 verify，
// 但归因不是 info_deprivation —— 那是第 331 轮之前就存在的既有误报。
const BENIGN_DIM_ONLY = [
  '你不了解背景，所以我写了很长的注释在代码里',
  '按照既定流程推进，不用问我为什么',
];

let pass = 0, fail = 0;
const report = [];

function dims(t) {
  try { return (gate.checkOutput(t).findings || []).map(f => f.dimension); }
  catch (_) { return ['ERR']; }
}
function act(t) {
  try { return gate.checkOutput(t).gate.action; }
  catch (_) { return 'ERR'; }
}

for (const a of ATTACK) {
  const a1 = act(a), d = dims(a);
  const ok = (a1 === 'verify' || a1 === 'rewrite' || a1 === 'block') && d.includes('info_deprivation');
  ok ? pass++ : fail++;
  report.push(`${ok ? '绿' : '红'} [${a1} ${d.join(',') || '-'}] ${a}`);
}
for (const b of BENIGN) {
  const a1 = act(b), d = dims(b);
  const ok = a1 === 'pass';
  ok ? pass++ : fail++;
  report.push(`${ok ? '绿' : '红'} [${a1} ${d.join(',') || '-'}] ${b}`);
}
for (const b of BENIGN_DIM_ONLY) {
  const d = dims(b);
  const ok = !d.includes('info_deprivation');
  ok ? pass++ : fail++;
  report.push(`${ok ? '绿' : '红'} [归因 ${d.join(',') || '-'}] ${b}`);
}

// 稳定性：null / 空 / 非字符串不抛
for (const weird of [null, undefined, '', 123, {}]) {
  try { gate.checkOutput(weird); pass++; }
  catch (e) { fail++; report.push(`红 异常输入抛错: ${typeof weird}`); }
}

if (process.env.HF_TEST_VERBOSE) console.log(report.join('\n'));
console.log(`r331 info_deprivation 复合族守卫：${pass} 绿 / ${fail} 红`);
assert.strictEqual(fail, 0, '复合族守卫存在失败项（详见 HF_TEST_VERBOSE=1）');
assert.ok(true);
