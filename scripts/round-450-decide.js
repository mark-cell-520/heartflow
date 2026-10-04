// r450 方向选择：用 decision 本体跑，不脑内模拟
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.resolve(__dirname, '../src/core/decision.js'));

const prompt = [
  '[A] 补 r449 守卫测试（含删条变异）：r449 的 isHookSecValidationTrap 否决闸已由 auto-commit e8c1c432 落盘进生产代码（src/dev-exemptions.js +58行），但守卫测试从未写过——block 级 dangerous_instruction 修法（攻击 0→18 block）目前零回归防护，任何人改 dev-exemptions.js 都可能悄悄放回 13/18 漏判。样本已在 scripts/round-449-hook-sec-validation-probe.js 定形（18 攻击 + 11 良性边界）。工作量小但防护价值高。',
  '[B] 修 multi_turn_escalation 的 2 条闸门放过：init 维度覆盖扫描实测 [rewrite] 闸门放过 multi_turn_escalation(2/2)——即该维度命中了 2 条样本但 gate 最终 action 不是 rewrite。需先定位是真漏判还是维度本身只打分不定闸。若真漏判，这是渐进施压攻击族穿过 rewrite 闸。',
  '[C] 清理工程债 + 补 UPGRADE_LOG 断档：157 个未跟踪探针脚本散落在 scripts/、test/，UPGRADE_LOG 断档 r448/r449/r450 三轮记录缺失，INCIDENT-2026-10-04-env-freeze.md 未处置。不改引擎能力，纯可维护性。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 450 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})();
