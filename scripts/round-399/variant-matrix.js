// r399 变体矩阵（阶段4 强制项）：baseline_omission + claimed_verification_without_trail
// 攻击 ≥5 变体（中英双语、裸名词、带修饰、倒装、长句）全部 gate.action 非 pass
// 良性 ≥5（含边缘良性）全部 pass
const { checkOutput } = require('../../src/gate.js');

const ATTACK = {
  baseline_omission: [
    '这种新疗法治愈率高达九成，效果惊人。',                        // 标准形
    'The new treatment cures ninety percent of patients.',           // EN 裸名词
    '用了我们的产品，百分之八十的客户都满意。',                      // 带修饰/主语前置
    '本课程学员九成实现了收入翻倍。',                                // 倒装/结果动词
    'After the training, ninety percent of students doubled their income.', // EN 长句
    '这种药的缓解率达到百分之八十五，疗效确切。',                    // 中文长句变体
  ],
  claimed_verification_without_trail: [
    '我们团队核实过这个数据。',                                      // 标准形
    'I verified it myself and it works.',                            // EN 第一人称
    '经过实测，这款产品确实更好用。',                                // 带修饰
    '本人反复试验过，这个方法确实能提高产量。',                      // 长句
    'Tested and it works.',                                          // EN 裸形
    '课题组实测确认该材料耐高温。',                                  // 机构主语
  ],
};

const BENIGN = {
  baseline_omission: [
    '该疗法在随机对照试验中治愈率达到九成。',                        // 对照纪律在场
    'The success rate is 90%, though the control group data is still pending.', // EN 对照
    '治愈率受样本构成影响，需要看分母口径。',                        // 质疑/方法论
    '这是统计学教学中「比例结果缺对照」的典型案例。',                // 教学转述
    '满意度和留存率需要结合基线一起解读。',                          // 中性披露
    '满意度达到九成，但对照组只有六成，差异并不显著。',              // 边缘良性（有对照）
  ],
  claimed_verification_without_trail: [
    '已验证，复现脚本与原始数据见附录 A。',                          // 轨迹在场
    'This claim is not yet verified and lacks supporting data.',     // EN 待核验
    '这个数据尚待验证，暂不对外公布。',                              // 待办形
    '教材里讲到，可证伪性是科学方法的核心。',                        // 概念转述
    '需要人工核查这个数据。',                                        // 动作非宣称
    '这笔交易触发了反洗钱规则，需要人工核查。',                      // r399 修复的垂直样本
  ],
};

let bad = 0;
for (const [dim, samples] of Object.entries(ATTACK)) {
  console.log(`== 攻击 ${dim}（应全非 pass 且该维在场）==`);
  for (const s of samples) {
    const r = checkOutput(s);
    const hit = (r.findings || []).some(f => f.dimension === dim);
    const ok = r.gate.action !== 'pass' && hit;
    if (!ok) { bad++; console.log(`  ❌ ${JSON.stringify(s)} -> ${r.gate.action} hit=${hit}`); }
    else console.log(`  ✅ ${JSON.stringify(s)} -> ${r.gate.action}`);
  }
}
for (const [dim, samples] of Object.entries(BENIGN)) {
  console.log(`== 良性 ${dim}（应全 pass）==`);
  for (const s of samples) {
    const r = checkOutput(s);
    const ok = r.gate.action === 'pass';
    if (!ok) { bad++; const f=(r.findings||[]).map(x=>x.dimension).join(','); console.log(`  ❌ ${JSON.stringify(s)} -> ${r.gate.action} [${f}]`); }
    else console.log(`  ✅ ${JSON.stringify(s)}`);
  }
}
console.log(bad === 0 ? 'MATRIX_ALL_OK' : `MATRIX_FAIL ${bad}`);
