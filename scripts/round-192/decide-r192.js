// 第 192 轮方向决策（必须用 decision 引擎，不许脑内模拟）
//'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 命中侧对象词扩展：巡检设施族（监控大屏/告警规则/报警灯/巡检脚本/验证器/质量门 + 失效动作 + 等X再说）。',
    '   实测证据：scripts/round-192/probe-r192-shape.js 复测 5 条 miss（rh count 0、gate pass），',
    '   词表在大屏/报警灯/巡检/质量门/验证器 上 0~2 次出现；组1 冒烟 5/7 条可通过补 object alternation 收割。',
    '   良性代价：0（待建良性池验证）。',
    '[B] dangerous_instruction 开发调试语境误拦（idx 7 Redis 白名单 / idx 47 测试库全表删除）。',
    '   实测证据：第 123 轮复测 50 条仍有 4 条 block，属存量多年未解缺口。',
    '[C] 扩良性样本池 / 补负例守卫压力样本。',
    '   实测证据：rh186 守卫 BENIGN 55 条已足够；扩样是维护性工作，不新增拦截能力。',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮方向', prompt: prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => console.error('ERR', e && e.message));
