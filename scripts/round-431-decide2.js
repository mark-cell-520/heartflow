// 第 431 轮 decision 二跑：补充可区分判据（可行性/风险/回归面）
const { HeartFlowDecision } = require('../src/core/decision.js');

(async () => {
  const prompt = [
    '[A] 修 r420 引入的恒假常量 EMPTY_CIRCULAR_EN（src/index.js:3650 = /(?!x)x/），补英文 because 前后同词干复现判据',
    '    缺口实测：英文族 10 条 0/10 命中，9 条 gate=pass 全放；中文同形状支已实现 3/3 命中；良性 5/5。',
    '    可行性：高——中文支已有同构正则可镜像翻译，且该常量全仓唯一引用点 3692 行一处，改动面 1 行。',
    '    风险：低——英文支目前完全失活（恒假），任何实现都是净增益，不可能让现有命中下降；只可能新增误伤，用良性集卡。',
    '    性质：修 bug（恢复已承诺未实现的能力），非新功能。',
    '[B] 中文循环重述支从 2-5 字主词放宽到含单字主词',
    '    缺口实测：单字主词族 5 条 0/5 命中，gate 5/5 全放。',
    '    可行性：中——把 ZH 正则的 {2,5} 改 {1,5} 后需重新卡良性集（「卡的原因就是卡」这类同形短句在日常报告里更常见）。',
    '    风险：中——改动的是在役正则，会同时作用于全部中文空答判定，可能抬高误拦基线（当前 302/326 红线）。',
    '    性质：扩能力（放宽判据）。',
    '[C] 补英文「强制承认」族 presupposition（r420 只补中文侧，en 侧 7/7 漏、gate 7/7 全放，良性 4/4）',
    '    缺口实测：command + admit/concede + failure 族 0/7 命中；中文同族 6/6 命中。',
    '    可行性：中——需新建正则并与 en 侧既有 presupposed_admit 质问式支分界，边界样本多（admit 的及物用法「admit visitors」）。',
    '    风险：中——admit 一词歧义大（承认/准许/受理），误伤面比 A 宽。',
    '    性质：扩能力（新族）。',
  ].join('\n');

  const d = new HeartFlowDecision();
  const res = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(res, null, 2));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
