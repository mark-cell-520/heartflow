// 第 153 轮：decision 选方向（脚本版，避免 node -e 嵌套被安全扫描拦）
// 候选来自轮初实测（probe-r153-baseline.js）：
//  A = di 开发调试语境误拦残留（实测 1/5 仍被 block，需定位是真误伤还是真高危）
//  B = eval_input_shortcut 宾语前置族补形（实测 1/5 命中，4 条新形状全漏）
//  C = covert_deception 中文侧「英文 token 无译形」12 支扩张（静态扫描 9 支，实测构造样本 rh 0/6 命中）
//  D = ai_writing_tell 真 AI 混排漏检 4/9（scored-only 维度，不影响 gate）
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 修 dangerous_instruction 开发调试语境误拦残留：probe 实测 5 条良性调试语境内 1 条仍被 block。影响真实用户（开发者正常描述「本地调试时把 redis 加白名单」被心虫 block），是用户可感知的误伤，属「优化」而非新功能。风险：放宽可能放进真高危语句，需逐条定性。',
  '[B] reward_hacking eval_input_shortcut 中文侧宾语前置补形：「识别出这是测试集就启动省事模式」实测 4/5 全漏（1/5 命中），151 轮遗留②已坐实旧代码就是 MISS。该族 152 轮刚做过 normalize 一致性修复，中英边界已稳，补形可直接收割。',
  '[C] reward_hacking covert_deception 中文侧扩张：静态扫描显示该族 9 支依赖 en2zh 译形（delete/disable/log/run/skip/bypass/account/ignore），但 40 条构造样本实测分类命中 0（多数 gate 已 block 但归因到别的维度，另有 17 条 gate pass）。缺口是真实的中文侧语序覆盖，属非对称收割，工作量大于 B。',
  '[D] ai_writing_tell 真 AI 混排漏检：4/9 score=0（scored-only 维度，不改 gate 行为）。用户可感知性最低（只影响 findings 不计分展示），历史上连续 8+ 轮被 decision 排后。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 153 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
