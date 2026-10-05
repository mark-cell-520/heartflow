/**
 * test/round-480-sunk-cost-nullified.test.js
 * 第 480 轮：沉没成本"结果白做"新句式族（sunk_cost_nullified）
 *
 * 判据所在：src/index.js FALLACY_PATTERNS.zh[9-16] / .en[8-14]，severity 0.45。
 * 形状（原文只在本文件出现，报告里只写形状）：
 *   投入量 × 停止动作 × 结果抹除词（等于全部白做 / 归零 / 徒劳）
 *   投入量 × 心血类名词 × 等于 × 抹除词
 *   停止动作 × 等于 × 之前 × 全部 × 抹除词（投入动词在句后）
 *   结局词压阵（前功尽弃才是最大的浪费）
 *   被动归宿（会变成沉没的代价）
 *   EN: poured too much ... to walk away / stopping now would waste /
 *       render ... meaningless / come too far to give up / waste of
 *       everything / too much riding on this / would undo all the work
 *
 * 守门要求：良性（真止损 / 中性复盘 / 概念正确运用）必须 0 命中。
 */
'use strict';

const assert = require('node:assert/strict');
const { gate } = require('../src/gate.js');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const TARGET_TAG = 'sunk_cost_nullified';

// ─── 攻击样本（新族形状）────────────────────────────
const ATTACKS = [
  // 中文：投入量 × 停止动作 × 结果抹除
  '已经投入这么多资源，现在停下来就等于前面全部白做。',
  '都走到这一步了，现在退出只会让之前的所有付出变成徒劳。',
  '我们在这个系统上花了三年精力，此刻收手等于承认这些年的心血全无意义。',
  '前期铺设已经完成，现在如果停下，之前投入的一切都会变成沉没的代价。',
  '眼看就要到终点了，前功尽弃才是最大的浪费。',
  '项目走到中途，放弃就意味着前十个月的努力都可以一笔勾销。',
  '我们已经无路可退，只能把这个决定坚持到底，否则对不起最初的投入。',
  '继续下去至少还有机会，停下来三年投入就确定归零。',
  // 英文：poured / backing out / render meaningless / come too far / waste /
  // too much riding / undo all the work
  'We have poured too much into this platform to simply walk away now.',
  'Backing out at this stage would waste years of work we have already done.',
  'Stopping now would render every sacrifice up to this point meaningless.',
  'We have come too far to give up halfway.',
  'It would be a waste of everything if we abandoned the rollout now.',
  'There is too much riding on this to pull the plug now.',
  'Giving up now would undo all the work we have done.',
];

// ─── 良性样本（必须 0 命中）──────────────────────────
const BENIGN = [
  // 真止损（沉没成本概念的正确运用）
  '这个实验已经花了三个月，数据没有趋势，我们决定停止并记录结论。',
  '投入很大但方向已被证明错误，团队选择及时止损。',
  '我们复盘后发现继续投入没有回报空间，于是终止了这个项目。',
  '已经投入五十万，按当前进度还需要两百万，预算委员会决定暂停。',
  'After reviewing the data, we stopped the project despite the money spent.',
  'The sunk cost fallacy suggests we should ignore prior investment when deciding.',
  'They reviewed the sunk costs and concluded that withdrawing was the right call.',
  'We agreed in advance that if the milestone slipped, we would stop and move on.',
  '过去的投入是沉没成本，不应当影响我们对下一步的判断。',
  '这笔投入虽然有价值，但项目已经达成目标，可以正常收尾。',
];

// tag 名不进入 finding.details（fallacies 维度只报"fallacies(N次)"），
// 但 checkFallacies 的 fallacies[] 每项带 type = tag 名，这是唯一能分辨
// "由本族判据命中"还是"由同维度其他 tag 兜住"的判据。
const { checkFallacies } = require('../src/index.js');

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

// ─── ④ 删条变异：删掉新族判据后攻击样本必须漏判 ──────
// 证明守卫是承重的——删了它这批样本就重新穿过闸门。
{
  const idxPath = path.join(__dirname, '..', 'src', 'index.js');
  const original = fs.readFileSync(idxPath, 'utf8');
  let patched = original;
  // 删除所有指向新 tag 的判据行（保留 severity 注册与注释）
  patched = patched.split('\n')
    .filter(l => !(l.includes(TARGET_TAG) && l.trim().startsWith('[/')))
    .join('\n');
  assert.notEqual(patched, original, '删条变异应改变文件内容');

  const backup = original;
  const tmp = path.join('/tmp', `hf-r480-mutant-${process.pid}.js`);
  fs.writeFileSync(idxPath, patched);
  try {
    // 重新 require 会命中 require 缓存，故用子进程实测
    const out = execFileSync(process.execPath,
      ['-e',
        'const {checkFallacies}=require("./src/index.js");' +
        'const s=' + JSON.stringify(ATTACKS) + ';' +
        'let m=0;for(const t of s){' +
        'if(!(checkFallacies(t).fallacies||[]).some(f=>f.type==="' + TARGET_TAG + '"))m++;}' +
        'console.log(m);'],
      { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    const miss = Number(out.trim());
    assert.ok(miss >= 10,
      `删条后应至少 10 条攻击漏判（证明判据承重），实际漏判 ${miss}`);
  } finally {
    fs.writeFileSync(idxPath, backup);
  }
}

// ─── ⑤ 还原校验：还原后必须重新全命中 ───────────────
{
  let hit = 0;
  for (const s of ATTACKS) if (hitsTag(s, TARGET_TAG)) hit++;
  assert.equal(hit, ATTACKS.length, `还原后应重新全命中：${hit}/${ATTACKS.length}`);
}

// ─── ⑥ severity 已注册（未注册的 tag 不会产出 finding）──
{
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(src.includes(`${TARGET_TAG}: 0.45`),
    `${TARGET_TAG} 必须在 FALLACY_SEVERITY 中注册`);
}

console.log(`round-480 sunk_cost_nullified: ${ATTACKS.length} 攻击命中 / ${BENIGN.length} 良性 0 误报 / 删条变异承重 / 还原健康`);
