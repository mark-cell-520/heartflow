#!/usr/bin/env node
'use strict';
/*
 * r362 立项候选探针 —— Will Rogers 族第三轮缺口穿透实证（v6.8.186 基线）
 *
 * 候选（claim direction 定拨，r361 交接项）：
 *   A  EN 腿②全称提升族：everyone's scores improved / across the board /
 *      all patients did better——存量 BE1–BE5 全部要求 both 在前或 in both，
 *      无 both 的全称提升断言零覆盖
 *   B  ZH 腿②成语扩族：屡创新高 / 连创新高 / 节节攀升——存量成语族只有
 *      水涨船高 / 步步高升（与 r357 CASE_SURGE_ZH7 划界：本族须腿①迁移
 *      共现才判，CASE_SURGE_ZH7 判病例数激增不要求迁移）
 *   C  ZH 腿①分层调整倒装形：调整了一下分层 / 重新分了层——存量
 *      MIGRATE_RECLASS_ZH 只收「分层调整」正序整词（r361 交接「只收整词」项）
 *   D  EN 腿① re-stratified / re-binned 形——存量 MIGRATE_RECLASS_EN 无
 *      stratif/bin 词根
 *
 * 判据：gate(action) === 'pass' 记为穿透（缺口成立）；良性样本须全部
 * pass（零误伤）。穿透样本同时打印模块层命中证真空缺。
 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const hf = require(path.join(ROOT, 'src', 'gate.js'));
const wr = require(path.join(ROOT, 'src', 'will-rogers-phenomenon.js'));

const CANDIDATES = {
  A_en_leg2_universal: [
    'After the reshuffle, everyone\\u2019s scores improved.',
    'After the reshuffle, everyone\'s scores improved.',
    'Regrouping the classes lifted scores across the board.',
    'Re-binning the students left all of them doing better.',
    'Once the tiers were redrawn, scores rose for everyone.',
    'The re-stratification moved several patients, and all patients did better.',
  ],
  B_zh_leg2_idiom: [
    '重新分组之后，两组的成绩屡创新高',
    '调整分班之后，两个班的分数连创新高',
    '转班之后，两个班的平均分节节攀升',
    '重新分层之后，两组的指标再创新高',
  ],
  C_zh_leg1_reclass_reorder: [
    '学校调整了一下分层，两组的及格率都提高了',
    '老师重新分了层，两个班的平均分一起涨了',
    '教务处变动了一下分层，两组的成绩都上升了',
  ],
  D_en_leg1_restrat: [
    'Re-stratifying the patients moved some between stages, and both stages\\u2019 survival rose.',
    'Re-stratifying the patients moved some between stages, and both stages\' survival rose.',
    'Re-binning the students by the new rule improved both groups.',
    'The patients were re-binned into new stages, and both stages did better.',
  ],
};

const BENIGN = [
  // 个体层面归因 → 豁免 C（EN every/each + 个体名词 + 提升词）
  'After the reshuffle, every student improved because each one practiced more.',
  // 无腿①的全称提升（市场/产品域，非分组迁移）
  'Sales rose across the board after the product launch.',
  '公司业绩屡创新高，因为市场需求真实增长',
  // 概念教学 → 豁免 A
  'Re-stratification is a known source of the Will Rogers phenomenon.',
  // 方向相反 → 腿②天然排除
  'After re-binning, one group improved and the other declined.',
  '调整了一下分层之后，两组的成绩一个升一个降',
  // 正确响应形 → 豁免 B
  '重新分组后两组成绩屡创新高，但这只是统计假象，需要核对个体数据',
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
    const mod = wr.detectWillRogersPhenomenon(s);
    const pen = sm.action === 'pass';
    if (pen) penAttack++;
    totalAttack++;
    console.log((pen ? 'PEN ' : 'blk ') + JSON.stringify({
      text: s.slice(0, 46), action: sm.action, dims: sm.dims, mod: mod.hit ? 'HIT' : 'miss',
    }));
  }
}
console.log('=== BENIGN（须全 pass）===');
let benignHit = 0;
for (const s of BENIGN) {
  const r = hf.check(s);
  const sm = summarize(r);
  if (sm.action !== 'pass') benignHit++;
  console.log((sm.action === 'pass' ? 'ok  ' : 'FP  ') + JSON.stringify({
    text: s.slice(0, 46), action: sm.action, dims: sm.dims,
  }));
}
console.log('=== 汇总 ===');
console.log(JSON.stringify({
  attack_total: totalAttack, attack_penetrated: penAttack,
  benign_total: BENIGN.length, benign_false_positive: benignHit,
}, null, 2));
