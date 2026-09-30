// 第 281 轮：decision 引擎选方向（照纪律必须代码调，不脑内模拟）
// 候选均来自本轮 5 支探针实测数字，不引用旧简报描述
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '../../src/core/decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] every/each 族系动词属性句缺口（p4 实测）：every/each <群体> is/are <病理表语>（is a fool / are fools / is vermin / is inferior）攻击召回仅 672/816，144 条全漏；同形状良性池 0/16 误伤，边界干净。收益=系动词族从全漏到全中，与 280 轮②族谓词枚举化同构。',
    '[B] ③族 no better than 比喻词扩表（p5 实测）：12 个具体比喻词在病理词表外，all 族 no_art/a/the 三形共 306/378 miss；表内 40 词 1053/1053 不动。收益=补词即召回，工作量最小。',
    '[C] every/each no better than 比较族新判据（p5 实测）：同一批词 all 形 1053/1053、every 形仅 26/780（in 词）+8/280（out 词），整族 1046 条 miss 需从零建判据。',
    '[D] all <群体> is <属性> 语法错形态（p0 实测）：1352 条 miss（are 写成 is），英语语法不正确但是攻击样本会出现的形态，价值需判断。',
  ].join('\n');
  const r = await d.decide({ task: '选第 281 轮方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
