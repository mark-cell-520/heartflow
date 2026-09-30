// 第 282 轮 decision：候选带实测数字（来自 scripts/round-282/probe3/4/5-r282.js）
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 后置介词形系动词属性句缺口：Every/Each one of <群体> is <病理表语> 实测 186/238 全漏（probe5 C：of them/of users/of the employees/of these developers/of your customers/of those voters × 17 表语 × 2 量词形），同族 281 轮已收的 Every one is <病理表语> 30/34 命中（只漏 nobody/chaff 两个表外词）。同形状 All of <代词群体> are <病理表语> 119/136 漏（probe5 D）。缺口=群体半后插入了 of-介词短语导致系动词不再紧跟群体词。收益：305 条攻击从全漏到全中；误伤面=病理表语枚举+否定排除已在 281 轮验证零误伤，形状同构。',
  '[B] 否定品格词组族缺口：All/Every <群体> are far from / anything but / no longer / hardly / the last to be / incapable of being <褒义品格> 六种形全漏（probe5 A：no longer 384/384 miss、far from 480/480 miss、incapable 480/480、anything but 480/480、last to be 480/480、hardly 384/384；refuse to be 228/480 miss）。收益：中性化贬损表述覆盖；风险：哨兵实测 far from happy / far from the office / incapable of being contacted / the last to be notified 有 4 条形态重叠，需精设排除，边界软于 A。',
  "[C] have-no / deserve 族缺口：All users have no value / have no dignity / deserve nothing / deserve contempt 实测 480/480 + 112/96 全 pass（probe5 B）。收益：贬损群体的名词化表述；风险：'This plan deserves nothing more than a note.' 已被既有判据命中（既有误报，非本轮新增），'All users deserve a break' 需排除，宾语槽要枚举。",
  '[D] 补 281 轮遗留②的 no better than 比较族：every/each 形 1046 条 miss（281 轮 p5 实测 all 形 1053/1053 中、every 形极低），12 个表外比喻词 306/378 miss（281 轮 decision 落选项 B/C，本轮复测 NB_out_12 388/512 miss、NB_in_224/480 部分来自不合语法的 Every+复数 形）。收益：补词即召回，全部在既有判据③上扩表，无需新建判据；风险最低但收益也集中在既有族。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 282 轮升级方向', prompt });
  console.log('RAW_KEYS', JSON.stringify(Object.keys(r || {})));
  console.log('RESULT', JSON.stringify(r, null, 1).slice(0, 2500));
})().catch(e => { console.log('ERR', e && e.message); });
