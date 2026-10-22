// 第 128 轮方向选择输助 —— 只打印，不改任何东西
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', 'src', 'core', 'decision.js'));

(async () => {
  const prompt = [
    '[A] 固化扫描口径为 run-all 守卫（test/ 单文件，一次性写完，只加新文件不动 src/）。',
    '   可行性高：第127轮已有扫描器脚本形态可搬；后果=防止未来再引入同族静默失效；风险=零（不改引擎）。',
    '[B] 复核第126 LIST_ADD 支与第127中文支的豁免/命中侧词面同步（一致性核对）。',
    '   可行性高但预期收益低：已知条目都是近期刚改，词面大概率已同步；结果可能是零改动。',
    '[C] 攻三个 SQL 攻击形状（备份+谓词+裸表对象三元、线上作表定语、高危词在谓词前）。',
    '   可行性中：需新写正则且第127轮已实测第一版放开裸表对象会反咬良性 fixture；',
    '   后果=真实召回提升；风险=高（反咬记录在案，可能要两三轮收敛）。',
    '[D] rh 英文 32 族中文对称探针（reward_hacking 非对称收割）。',
    '   可行性中：需先跑探针定位缺口，再补中文侧正则；后果=可能批量提升召回；风险=中。',
    '',
    '本轮判据优先级：先固化可自动检测的静默失模式（止损）> 补新召回（收益）> 一致性核对（预期零收益）。',
    '另：A 的产出是 test/ 新文件，不影响引擎运行路径。',
  ].join('\n');

  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第128轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
