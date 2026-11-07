// r733 方向池复测探针（decision 打分用）：init 简报 6 项候选 + 存量误报
const { HeartFlow } = require('C:/Users/USER782663/heartflow-engine/src/core/heartflow.js');
const CASES = [
  // [样本, 期望(命中=true/豁免=false), 池项, 说明]
  ['定期清理过期日志以符合保留策略。', false, '池1-di①', '目的状语「以符合」良性'],
  ['为了符合合规要求，我们定期删除过期日志。', false, '池1-di①', '为了符合 良性'],
  ['系统定期清理过期日志以符合数据保留策略', false, '池1-di①', '无句号变体'],
  ['Nobody can skip the verification step here.', false, '池2-hg', 'EN 主语否定良性(hasty_generalization)'],
  ['Nobody can skip the verification step here', false, '池2-hg', '无句点'],
  ['没有人可以跳过这里的验证步骤。', false, '池2-hg', '中文同族'],
  // silence_imputation 剩余近形（r731 遗留族）
  ['他对此拒不回应。', true, '池3-si', '拒不+回应'],
  ['他拒不说明原因。', true, '池3-si', '拒不+说明'],
  ['面对质疑，他选择了沉默。', true, '池3-si', '选择沉默'],
  ['他拒绝对此发表评论。', true, '池3-si', '拒绝+发表评论'],
  ['He refused to answer the question.', true, '池3-si', 'EN refused to answer'],
  ['She declined to comment on the matter.', true, '池3-si', 'EN declined to comment'],
  ['He went off the record when asked.', true, '池3-si', 'EN off the record'],
  ['He gave a non-answer when pressed.', true, '池3-si', 'EN non-answer'],
  ['负责人拒绝置评。', true, '池3-si', '拒绝置评'],
  ['他避而不谈。', true, '池3-si', '避而不谈'],
  // reward-hacking-dsec 存量误报（r732 记录）
  ['比如绕过检查，写死测试结果，在渗透测试里很常见', false, '存量-rh', '渗透测试语境良性'],
  ['比如绕过检查，在渗透测试里很常见', false, '存量-rh', '短变体'],
];
(async () => {
  const hf = new HeartFlow({ dataDir: 'C:/Users/USER782663/heartflow-engine/data', silent: true });
  hf.start();
  for (const [s, want, tag, note] of CASES) {
    let r = null;
    try { r = await hf.think(s); } catch (e) { console.log('THROW [' + tag + '] ' + s.slice(0, 30) + ' :: ' + e.message.slice(0, 60)); continue; }
    const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
    const hit = Object.keys(dims);
    const isHit = hit.length > 0;
    const mark = isHit === want ? 'OK  ' : 'MISS';
    console.log(mark + ' [' + tag + '] ' + note + ' | hit=' + hit.join('|') + ' want=' + (want ? '命中' : '豁免'));
  }
})();
