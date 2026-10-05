/**
 * test/round-481-sunk-cost-coercion.test.js
 * 第 481 轮：沉没成本"承认当初错"新句式族（sunk_cost_coercion）
 *
 * 判据所在：src/index.js FALLACY_PATTERNS.zh（sunk_cost_coercion 13 支）
 * 与 .en（sunk_cost_coercion 13 支），severity 0.45。
 *
 * 形状（原文只在本文件出现，报告里只写形状）：
 *   停下 = 承认当初判断错（投入量 × 停止 × 等于 × 承认 × 之前错）
 *   停下 = 向所有人承认我们错了（投入量 × 停止 × 等于 × 向×承认）
 *   停下 = 说明一开始的坚持毫无意义
 *   继续走下去至少证明当初的决定没错（一致性压力形）
 *   通用形：投入量（任意位置） × 停止动作 × 结果抹除词（含口语隐喻）
 *   停止动作 × 就是承认 × 之前错了（无投入量词的紧凑形）
 *   压力转译：不继续投 = 不爱 / 没担当 / 不信任
 *   沉没量已成事实 × 只能继续 / 不能打水漂
 *   EN: stop now + admit earlier judgment wrong / concede the bet was wrong /
 *       would forfeit the years we already put / stopping means we were wrong
 *
 * 与 sunk_cost_nullified 的分界：压力落点不是"过去白做"（waste /
 * meaningless），而是"承认当初判断错"——用一致性压力挡住止损。此前零覆盖
 * （480 轮 nullified 的十支只认白做/归零/作废类词，不认"承认错"）。
 *
 * 守门要求：良性（真止损 / 中性复盘 / 概念正确运用）必须 0 命中。
 */
'use strict';

const assert = require('node:assert/strict');
const { gate } = require('../src/gate.js');
const { checkFallacies } = require('../src/index.js');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const TARGET_TAG = 'sunk_cost_coercion';
const ROOT = path.join(__dirname, '..');
const IDX = path.join(ROOT, 'src', 'index.js');

// ─── 攻击样本（新族形状）────────────────────────────
const ATTACKS = [
  // 停下 = 承认当初判断错
  '现在停就是承认之前全错了。',
  '如果现在停，就说明一开始的坚持毫无意义。',
  '继续做下去，至少证明我们当初的决定没有错。',
  // 停下 = 向所有人承认我们错了
  '已经做到这一步了，现在收手等于向所有人承认我们看走了眼。',
  // 停下 = 之前员工加班白搭（投入名词后置形）
  '现在收手，之前全体员工加的班就都白搭了。',
  // 通用三段形：投入量 × 停止 × 抹除词
  '都做了这么多了，现在放弃就全废了。',
  '项目已经砸进去三年，停下来这些投入就全部白费。',
  '钱都花了这么多，现在撤资等于把钱扔进水里。',
  // 压力转译：不投入 = 没担当
  '不肯继续投入，就是对这个团队没担当。',
  // 沉没量已成事实 × 只能继续
  '沉没成本已经付了这么多，只能继续走下去。',
  // 不许止损形（无显式停止动词）
  '前面投的几百万不能打水漂。',
  // EN: admit/concede/wrong 系列
  'If we stop now, that would admit our earlier judgment was wrong.',
  'We are too deep to admit the original plan was a mistake now.',
  'To abandon the rollout would be to concede the bet was wrong.',
  'Ceasing here would concede that our earlier choice was incorrect.',
  'Stopping now means we were wrong about the whole approach.',
  'All we did was in vain if we simply stop now.',
  'Quitting again would simply forfeit the two years we already spent.',
];

// ─── 良性样本（必须 0 命中）──────────────────────────
const BENIGN = [
  // 真止损（沉没成本概念的正确运用）
  '这个实验已经花了三个月，数据没有趋势，我们决定停止并记录结论。',
  '投入很大但方向已被证明错误，团队选择及时止损。',
  '我们复盘后发现继续投入没有回报空间，于是终止了这个项目。',
  '已经投入五十万，按当前进度还需要两百万，预算委员会决定暂停。',
  '过去投入的三年是沉没成本，不应影响我们对下一步的判断。',
  'After reviewing the data, we stopped the project despite the money spent.',
  'The sunk cost fallacy suggests we should ignore prior investment when deciding.',
  'They reviewed the sunk costs and concluded that withdrawing was the right call.',
  'We considered stopping the pilot; the team documented the tradeoff.',
  'The primary risk is scope creep; mitigation is a stage gate every month.',
];

function hitsTag(text, tag) {
  const r = checkFallacies(text);
  return (r.fallacies || []).some(f => f.type === tag);
}

// ─── ① 攻击样本全部命中本族 tag ──────────────────────
{
  let hit = 0;
  for (const s of ATTACKS) if (hitsTag(s, TARGET_TAG)) hit++;
  assert.equal(hit, ATTACKS.length,
    `攻击样本应全部命中 ${TARGET_TAG}：${hit}/${ATTACKS.length}`);
}

// ─── ② 攻击样本全部触发 gate 动作（不得 pass）────────
{
  let acted = 0;
  for (const s of ATTACKS) {
    const r = gate(s);
    if (r.gate.action !== 'pass') acted++;
  }
  assert.equal(acted, ATTACKS.length,
    `攻击样本不得穿过硬闸门：${acted}/${ATTACKS.length} 被拦`);
}

// ─── ③ 良性样本 0 命中 ─────────────────────────────
{
  let fp = 0;
  for (const s of BENIGN) if (hitsTag(s, TARGET_TAG)) fp++;
  assert.equal(fp, 0, `良性样本误报本族 tag：${fp}/${BENIGN.length}`);
}

// ─── ④ 与 sunk_cost_nullified 的分界①：nullified 样本不得改判到本族 ──
{
  const NULLIFIED = 'Stopping now would render every sacrifice up to this point meaningless.';
  assert.equal(hitsTag(NULLIFIED, TARGET_TAG), false,
    'nullified 族样本不应命中本族标签');
  assert.equal(hitsTag(NULLIFIED, 'sunk_cost_nullified'), true,
    'nullified 族样本仍应由原族标签兜住（回归护栏）');
}

// ─── ⑤ 删条变异：删掉新族判据后攻击样本必须漏判 ──────
// 证明守卫是承重的——删了它这批样本就重新穿过闸门。
{
  const original = fs.readFileSync(IDX, 'utf8');
  const patched = original.split('\n')
    .filter(l => !(l.includes(TARGET_TAG) && l.trim().startsWith('[/')))
    .join('\n');
  assert.notEqual(patched, original, '删条变异应改变文件内容');
  // nullified 判据仍应保留（证明删的只是本族判据）
  assert.ok(patched.includes('sunk_cost_nullified'), '删条不应动 nullified 判据');

  fs.writeFileSync(IDX, patched);
  try {
    // 重新 require 会命中 require 缓存，故用子进程实测
    const out = execFileSync(process.execPath,
      ['-e',
        'const {checkFallacies}=require("./src/index.js");' +
        'const s=' + JSON.stringify(ATTACKS) + ';' +
        'let m=0;for(const t of s){' +
        'if(!(checkFallacies(t).fallacies||[]).some(f=>f.type==="' + TARGET_TAG + '"))m++;}' +
        'console.log(m);'],
      { cwd: ROOT, encoding: 'utf8' });
    const miss = Number(out.trim());
    assert.ok(miss >= 10,
      `删条后应至少 10 条攻击漏判（证明判据承重），实际漏判 ${miss}`);
  } finally {
    fs.writeFileSync(IDX, original);
  }
}

// ─── ⑥ 还原校验：还原后必须重新全命中 ───────────────
{
  let hit = 0;
  for (const s of ATTACKS) if (hitsTag(s, TARGET_TAG)) hit++;
  assert.equal(hit, ATTACKS.length, `还原后应重新全命中：${hit}/${ATTACKS.length}`);
}

// ─── ⑦ severity 已注册（未注册的 tag 不会产出 finding）──
{
  const src = fs.readFileSync(IDX, 'utf8');
  assert.ok(src.includes(`${TARGET_TAG}: 0.45`),
    `${TARGET_TAG} 必须在 FALLACY_SEVERITY 中注册`);
}

console.log(`round-481 sunk_cost_coercion: ${ATTACKS.length} 攻击命中 / ${BENIGN.length} 良性 0 误报 / nullified 分界 / 删条变异承重 / 还原健康`);
