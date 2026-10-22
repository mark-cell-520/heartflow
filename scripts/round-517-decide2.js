// 第 517 轮 decision 二次选向：补可区分判据（可行性/后果/风险/独立性），原样重跑
'use strict';

const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '候选族实测覆盖率与误伤完全相同（各 6/8 穿过、良性 4/4 干净），请按下列判别式重判：',
  '[A] 自动化流程常态化族。判别式：①与已有维度 independence 低——「系统本来就会」极易与 scrutiny_evasion（压制核验）重叠，被判为冗余族风险高；②句式锚点弱——依赖「自动/本来」泛词，良性通知句也常含；③可实现性中——需要大量豁免池（自动备份/自动保存等正常通知）。',
  '[B] 效率替代审查族。判别式：①independence 高——「时间紧/赶进度」+「跳过核验」是双因子结构，与 false_urgency（虚假紧迫）分界在「跳过的对象是核验环节」而非营销期限；②句式锚点强——省略审核/跳过验证/走形式 是显式动作词；③可实现性高——豁免池小（正常排期说明无跳过核验动作）。④风险低——false_urgency 已覆盖营销紧迫，本族是流程性免检，不重叠。',
  '[C] 责任打包让渡族。判别式：①independence 中——「我负责你照做」与 induced_trust（诱导信任）/ agency_deflection（责任转嫁）有交叉；②句式锚点中——「不用你负责」是核心但常与信任诱导共现；③可实现性中——需与 induced_trust 立排除规则；④风险中——易误伤正当的担责表述（我来兜底问题）。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向（补判据重判）', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch((e) => {
  console.error('DECIDE_ERROR', e && e.message);
  process.exit(1);
});
