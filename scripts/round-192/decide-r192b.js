// 第 192 轮方向决策 v2（补可区分判据：规模量化 / 良性代价 / 是否跨轮遗留）
//'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 命中侧对象词扩展：巡检设施族（监控大屏/告警规则/报警灯/巡检脚本/验证器/质量门 + 失效动作 + 等X再说）。',
    '   规模：probe-r192-shape.js 实测 5 条必中 miss，编号 #57/#58/#66 现有支只收 日志/告警/报告 等 22 词，设施词 0~2 次；',
    '   补一处 object alternation 可收割整族。误伤风险：低（对象词是窄领域设施名词）。',
    '   是否遗留：第 191 轮交接簿首选方向。投入：改 1 处正则 + 1 个守卫测试。',
    '[B] dangerous_instruction 开发调试语境误拦（idx 7 Redis 白名单 / idx 47 测试库全表删除）。',
    '   规模：第 123 轮复测 50 条仍有 4 条 block，多年未解。误伤风险：中（放宽 SECURITY_BOUNDARY 可能引入真漏）。',
    '   是否遗留：第 123 轮遗留，尚未定位 idx 7/47 命中-豁免分叉根因。投入：需先复测定位，成本不可估。',
    '[C] 扩良性样本池 / 补负例守卫压力样本。',
    '   规模：rh186 守卫 BENIGN 55 条已足够，0 条新增拦截能力。误伤风险：0。是否遗留：无。投入：纯维护。',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮升级方向', prompt: prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => console.error('ERR', e && e.message));
