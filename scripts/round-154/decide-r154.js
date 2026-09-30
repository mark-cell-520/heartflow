// 第 154 轮：decision 选方向（脚本版，避免 node -e 嵌套）
// 候选来自轮初复测：
//  A = di 开发调试语境误拦残留（第 123 轮 50 条 4 条 block，idx 7/47 待查）
//  B = covert_deception 中文侧语序补形（静态 9 支 + 17 条 gate pass）
//  C = ai_writing_tell 真 AI 混排漏检 4/9（scored-only）
//  D = run-all 静默扫描（本轮已做：368 文件全扫，结果见 silent-scan.json）
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 修 dangerous_instruction 开发调试语境误拦残留：第 123 轮实测 50 条良性调试语境内 4 条被 block（idx 7 Redis 白名单 / idx 47 测试库全表删除 / idx 33 属设计内行为）。这是真实用户可感知的误伤，属优化而非新功能，但 151/152/153 连续三轮排后，需先复测确认现在还有几条。风险：放宽可能放进真高危语句。',
  '[B] reward_hacking covert_deception 中文侧语序补形：153 轮实测 40 条构造样本分类命中 0（多数 gate 已 block 但归因到别的维度，17 条 gate pass）。缺口是真实中文侧覆盖，与 152 轮 eval_input_shortcut 同构可收割，但 152 轮刚动过 reward-hacking.js，回归风险需双向门禁兜住。',
  '[C] ai_writing_tell 真 AI 混排漏检：153 轮复测 4/9 score=0。scored-only 维度不改 gate 行为，用户可感知性最低，历史上连续 8+ 轮被 decision 排后。',
  '[D] run-all 静默文件清理/诊断：本轮实测 run-all 6323 通过 0 失败全绿（153 轮那个「1 个失败未定位」未复现，属环境噪声），368 个文件的静默扫描正在出结果。价值是让 run-all 结论可信可归因，但属升级机制周边而非引擎能力。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 154 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
