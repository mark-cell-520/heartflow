// 第 284 轮方向选择（二跑：补可区分判据——可行性/后果/风险）
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 修 run-all 汇总口径假失败（283 轮实测 270 个文件因缺「N 通过, M 失败」汇总行被各计 1 个假失败，真失败仅 1 项；run-all.js 硬边界不可改，只能逐个文件补汇总行，逐个补可撤销可回滚，无引擎风险）',
  '[B] 补写 UPGRADE_LOG 280/281/282 三轮缺席的交接簿（纯文档，零引擎风险，但不产生任何可测的新能力，属于记账不是升级）',
  '[C] 扩 hasty_generalization.en 野生群体词表（283 轮遗留，实测 the interns/individuals 已补；改动直接碰 src/index.js 判据正则，有误伤风险需全量基线回归）',
  '[D] 修 gate 归因链架构现象（dehumanization block 顶替 verify 级维度归因，283 轮只能放宽断言绕开；根因是 gate  findings 合并优先级，属 gate 核心路径，影响面覆盖全部 50 维度，风险最高）',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 284 轮升级方向：按可行性、后果、风险补判据二跑', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
