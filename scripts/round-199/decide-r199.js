// 轮 199 方向选择：decision.decide 本体（不许脑内模拟）
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(HF, 'src/core/decision.js'));

const prompt = [
  '[A] rh 英文侧 9 个 EMPTY 族补形：measurement_rigging / metric_denominator_gaming / self_referential_loop / evaluation_awareness / eval_input_shortcut / task_substitution / eval_ruleset_masking / eval_leakage / condition_tuning',
  '[B] check_suppression + human_answer_proxy 英文侧剩余缺口补形（4/5 + 2/5 = 6 条 miss）',
  '[C] ai_writing_tell 纯中文侧从零建判据（24 攻击 / 20 良性实测全 0，需新判据族）',
  '[D] dangerous_instruction 开发调试语境误拦修复（第 123 轮 idx 7 / idx 47 两条命中-豁免分叉）',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 199 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})();
