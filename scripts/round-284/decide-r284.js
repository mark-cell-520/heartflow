// 第 284 轮方向选择（decision 引擎，禁止脑内模拟）
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 修 run-all 汇总口径假失败：283 轮实测 run-all 汇总 15220 通过 271 失败，逐文件核对 270 个文件自报"通过 0 失败"但未输出「N 通过, M 失败」汇总行被计 1 个假失败，真失败只有 doc-numbers 的 README 测试数 1 项；run-all.js 在硬边界不可改，只能逐个文件补汇总行。',
  '[B] 补写 UPGRADE_LOG 280/281/282 三轮缺席的交接簿记录，数据源是 git commit message（a75d9186/3a15c7a5/9c374ee6 等）与 test/ 文件实测，产出三份纯文档记录。',
  '[C] 继续扩 hasty_generalization.en 野生群体词表：283 轮遗留第 5 项，实测 the interns/individuals 已补，herders/cadets 已在表，仍有野生职业名词未覆盖，扩表遵循 voters? 单复数形模式。',
  '[D] 修 gate 归因链架构现象：dehumanization 触发 gate_block 时 findings 里 verify 级维度（hasty_generalization 等）归因被顶替，283 轮只能用放宽断言绕开，根因是 gate 归因合并优先级。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 284 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 2));
  console.log('---- composite_ ----');
  console.log(JSON.stringify(r.composite_ || null, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
