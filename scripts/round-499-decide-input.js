// round-499 方向选择输入：给 decision 本体消费的候选（探测器实测证据）
// 候选来源：heartflow-upgrade-scout.sh 第 499 轮探测，8 个候选全部 fp=0
// 注意：manufactured_consent 已作为第 64 维度接线（src/index.js L600），
// 仍 6/6 穿过 → 需判断是「新子族缺口（真升级②）」还是「接线回归」。
const fs = require('fs');
const out = [];
out.push('[A] manufactured_consent：沉默现状被当成集体同意的论证。实测：6/6 条攻击样本穿过硬闸门（gate=pass），良性对照 0 误伤。注意：该维度已接线（第64维度），若缺口为新子族则属真升级②，若为接线回归则为修 bug。');
out.push('[B] helplessness_induction：灌输「再努力也没用」的习得性无助。实测：5/6 条攻击样本穿过硬闸门（gate=pass），良性对照 0 误伤。引擎零覆盖，属全新维度。');
out.push('[C] loyalty_test：用忠诚度测试胁迫表态。实测：3/6 条攻击样本穿过硬闸门（gate=pass），良性对照 0 误伤。引擎零覆盖，属全新维度。');
out.push('[D] fixed_mindset_disparagement：以固定型思维贬低对方能力上限。实测：4/6 条攻击样本穿过硬闸门（gate=pass），良性对照 0 误伤。引擎零覆盖，属全新维度。');
out.push('[E] burden_shifting_guilt：把负担转嫁给对方并施加愧疚。实测：5/6 条攻击样本穿过硬闸门（gate=pass），良性对照 0 误伤。引擎零覆盖，属全新维度。');
out.push('[F] selective_minimization：选择性淡化自身过错。实测：3/6 条攻击样本穿过硬闸门（gate=pass），良性对照 0 误伤。引擎零覆盖，属全新维度。');
out.push('[G] retroactive_justification：事后为已发生的决定补造正当性。实测：6/6 条攻击样本穿过硬闸门（gate=pass），良性对照 0 误伤。引擎零覆盖，属全新维度。');
out.push('[H] identity_fusion_attack：把个人身份与集体彻底融合以消除独立判断。实测：6/6 条攻击样本穿过硬闸门（gate=pass），良性对照 0 误伤。引擎零覆盖，属全新维度。');
out.push('判据补充：A 可能只需补一个新子族（工作量小），B-H 都是全新维度（需 dimMap/allDims/severity/guidance 全套 9 处接线，工作量大但符合真升级①）。上一轮（498）刚完成一个全新维度，引擎新增维度会稀释已有维度命中率，需权衡。用户偏好：每次改动前先问「用户能感知到什么变化」。');
fs.writeFileSync('/tmp/hf-round499-decide-input.txt', out.join('\n') + '\n');
console.log('written', out.length, 'candidates');
