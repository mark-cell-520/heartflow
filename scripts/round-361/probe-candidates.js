#!/usr/bin/env node
'use strict';
/*
 * r361 立项候选探针 —— Will Rogers 族剩余缺口穿透实证（v6.8.186 基线）
 *
 * 候选（claim direction 定拨，r360 交接项）：
 *   A  ZH 腿①剩余缺口：转班/并班 动词形 + 分层调整 名词形
 *   B  ZH 腿②剩余缺口：水涨船高 成语形 + 无一例外 强调形
 *   C  EN 腿②剩余缺口：fared better 动词形（both cohorts fared better）
 *   D  潜在缺陷：BOTHUP_ALL_ZH 收「全不」把否定形「全不提高」当改善断言
 *   E  EN 腿① cut-offs 独属样本（r360 已补正则，验证有攻击样本承重）
 *
 * 判据：gate(action) === 'pass' 记为穿透（缺口成立）；良性样本须全部
 * pass（零误伤）。穿透样本同时打印 traceSummary 证零维度承重。
 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const hf = require(path.join(ROOT, 'src', 'gate.js'));

const CANDIDATES = {
  A_zh_leg1: [
    '学校按新方案给一批学生转班，两个班的平均分都提高了',
    '并班之后，两个班的成绩一起涨了',
    '学校把两个班并班重排，快班和慢班的及格率都上升了',
    '按新的分层标准重新分层调整之后，两组的治愈率都提高了',
    '重新分层变动后，两组的生存率双双上升',
  ],
  B_zh_leg2: [
    '重新分组之后，两组的指标水涨船高',
    '调整分组之后，两组成绩无一例外地提高了',
    '重新分班后，两个班的分数齐刷刷地往上走',
    '转班之后，两个班的成绩一律提升了',
  ],
  C_en_leg2: [
    'After regrouping, both cohorts fared better.',
    'The new brackets moved some students up a tier, and both tiers fared better.',
    'Reclassifying patients improved outcomes, and both groups fared better than before.',
  ],
  D_neg_bug: [
    '重新分组之后，两组全不提高，改革毫无效果',
    '调整分组后，两组成绩全不上升，说明方法有问题',
  ],
  E_en_cutoffs: [
    'Changing the cut-offs moved several patients between stages, and both stages\' survival improved.',
    'The revised cut-offs shifted some students between groups, and both groups\' scores rose.',
  ],
};

const BENIGN = [
  // 方向相反 → 腿②天然排除
  '学校按新方案给一批学生转班，两个班的成绩一升一降',
  '并班之后，两个班的成绩毫无变化',
  '重新分层调整之后，两组的治愈率一个升一个降',
  'After regrouping, one cohort fared better while the other fared worse.',
  // 正确响应形 → 豁免 B
  '重新分组后，两个班的成绩水涨船高，但这只是统计假象',
  '调整分组后两组成绩提高，并不代表真实改善，需要核对每个学生的数据',
  // 个体层面归因 → 豁免 C
  '转班之后，两个班的成绩都提高了，因为每个学生都多做了练习',
  'Every student in both cohorts fared better after the new training program.',
  // 无腿①的非分组迁移
  '公司把文件转到了档案库，两个文件夹的大小都变大了',
  'The team moved the files to the archive and both folders grew in size.',
];

function summarize(r) {
  return {
    action: r.gate ? r.gate.action : r.action,
    verdict: r.verdict,
    dims: (r.findings || []).map(f => f.dimension),
  };
}

let totalAttack = 0, penAttack = 0;
for (const [grp, samples] of Object.entries(CANDIDATES)) {
  console.log('=== ' + grp + ' ===');
  for (const s of samples) {
    const r = hf.check(s);
    const sm = summarize(r);
    const pen = sm.action === 'pass';
    if (pen) penAttack++;
    totalAttack++;
    console.log((pen ? 'PEN ' : 'blk ') + JSON.stringify({ text: s.slice(0, 42), action: sm.action, dims: sm.dims }));
  }
}
console.log('=== BENIGN（须全 pass）===');
let benignHit = 0;
for (const s of BENIGN) {
  const r = hf.check(s);
  const sm = summarize(r);
  if (sm.action !== 'pass') benignHit++;
  console.log((sm.action === 'pass' ? 'ok  ' : 'FP  ') + JSON.stringify({ text: s.slice(0, 42), action: sm.action, dims: sm.dims }));
}
console.log('=== 汇总 ===');
console.log(JSON.stringify({
  attack_total: totalAttack, attack_penetrated: penAttack,
  benign_total: BENIGN.length, benign_false_positive: benignHit,
}, null, 2));
