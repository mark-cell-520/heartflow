// 第 230 轮方向裁决：用 decision 引擎真调裁决，不用脑内模拟。
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 收窄旧判据 `all <群体> are <属性>`：本轮 probe2 实测 10/10 良性工程全称句被 hasty_generalization 误拦（A_ATTRIB 全部归因 hasty_generalization），同时 5/5 人类群体属性句仍命中。风险：动 301/326 误拦基线，需整轮做收窄 + 基线重算 + 全部 extended 集回归。缺口性质=收敛误伤，不改会持续污染门禁。',
  '[B] hasty_generalization 英文侧 every/each + 群体 + 行为谓词族召回恢复：229 轮扩表后形状 recall 仍 1/9（8 条 miss），良性 0/4 零误伤，缺口仍最大。front-load 工作=加判据，风险低。',
  '[C] unsupported_claim 英文侧 <研究名词> <动词> <结论> 族召回恢复：r227 miss 5 条实测仍 miss 4 条，形状 recall 2/7，良性 0/4 零误伤。缺口 5 条但已有 76 支判据，交叉风险中等。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(res));
})().catch(e => console.log('ERR ' + e.message));
