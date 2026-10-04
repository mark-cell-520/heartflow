// 第 431 轮 decision 本体调用（不靠读简报脑内模拟）
const { HeartFlowDecision } = require('../src/core/decision.js');

(async () => {
  const prompt = [
    '[A] 修 r420 引入的恒假常量 EMPTY_CIRCULAR_EN（src/index.js:3650 = /(?!x)x/），把英文循环重述族判据补上',
    '    实测证据：英文 because 前后同词干复现族 10 条 0/10 命中，其中 9 条 gate=pass 全放；',
    '    同形状中文侧已实现且命中 3/3；良性 5/5 零误伤；常量由 commit f69a9826 引入后 r421-r428 共 8 轮未还。',
    '[B] 中文循环重述支放宽到单字主词（当前要求 2-5 个汉字，单字主词族 5/5 全漏、gate 5/5 全放）',
    '    实测证据：scripts/round-431-probe-b-c.js，「它很卡，卡的原因就是卡」族 0/5 命中。',
    '[C] 补英文「强制承认」族（r420 只补了中文侧，en 侧 7/7 漏、gate 7/7 全放，良性 4/4）',
    '    实测证据：同族中文侧 6/6 命中；英文侧 command + admit/concede + failure 族 0 命中。',
  ].join('\n');

  const d = new HeartFlowDecision();
  const res = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(res, null, 2));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
