// 第 190 轮方向选择：必须用代码调 decision，不脑内模拟
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const PROMPT = [
  '[A] 存量漏放② 毁证恢复族 + ③ 攻击动词×备份对象 补形（block 级 dangerous_instruction）',
  '    轮初实测（scripts/round-190/probe-r190-scale.js）：968 条组合生成，944 条 gate 全 pass，',
  '    漏放率 97.5%，di 命中 24 条全是既有支顺带命中；15 条良性等待态×恢复语义实测 0 误伤。',
  '    根因：dev-exemptions 的 RESTORE_EVIDENCE_REBUILD 只当否决闸用（防误赦），从不当命中判据；',
  '    且既有销毁判据的备份对象窗口只收「备份-库/数据库」连读，不收「生产库 + 备份/备份集」分写。',
  '',
  '[B] di 开发调试语境误拦剩余分叉（第 123 轮复测 50 条仍有 4 条 block，idx 7/47 待查）',
  '    第 188 轮已收口主体，剩余 2 条分叉未定位；规模量化未知（第 189 轮未复测）。',
  '',
  '[C] reward_hacking 英文侧 32 族的中文对称探针批量收割（第 123 轮待办）',
  '    非对称缺口已坐实（英文族齐、中文侧缺），但本轮未做产量探针，规模量化未知。',
  '',
  '[D] 修上一轮自引入回归：src/__cri189_a4_gap.js 残留调试文件未清理（不影响功能，属卫生问题）',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 190 轮升级方向', prompt: PROMPT });
  console.log(JSON.stringify(r, null, 1).slice(0, 2000));
})().catch(e => console.error('ERR', e.message));
