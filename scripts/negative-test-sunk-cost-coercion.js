/**
 * scripts/negative-test-sunk-cost-coercion.js
 *
 * [r643] 第 98 维度 sunk_cost_coercion 的负例脚本——证明守护测试真的会红。
 * 手法：对模块内部正则做变异注入，逐一确认「删掉判据 → 测试必须 FAIL」。
 * 7 个变异体，每个都必须让对应断言从 true 翻 false。
 */
'use strict';

const path = require('path');
const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/sunk-cost-coercion.js'));

let pass = 0, fail = 0;
const results = [];
function t(name, ok, detail) {
  if (ok) { pass++; results.push('  ✅ ' + name); }
  else { fail++; results.push('  ❌ ' + name + ' — ' + detail); }
}

const NEVER = /(?!x)x/; // 恒不匹配

// 变异体 1：置空 INVESTED_ZH（投入腿）→ 中文攻击样本必须不判
{
  const r = mod.checkSunkCostCoercion('钱都交了，你现在退出不是白花了', { INVESTED_ZH: NEVER });
  t('M1 置空 INVESTED_ZH → 中文样本不判', !r.hit, '仍命中: ' + r.detail);
}
// 变异体 2：置空 SUNK_ZH（沉没腿）→ 中文攻击样本必须不判
{
  const r = mod.checkSunkCostCoercion('钱都交了，你现在退出不是白花了', { SUNK_ZH: NEVER });
  t('M2 置空 SUNK_ZH → 中文样本不判', !r.hit, '仍命中: ' + r.detail);
}
// 变异体 3：置空 INVESTED_EN → 英文攻击样本必须不判
{
  const r = mod.checkSunkCostCoercion('You have paid for the course, so you might as well finish it.', { INVESTED_EN: NEVER });
  t('M3 置空 INVESTED_EN → 英文样本不判', !r.hit, '仍命中: ' + r.detail);
}
// 变异体 4：置空 SUNK_EN → 英文攻击样本必须不判
{
  const r = mod.checkSunkCostCoercion('You have paid for the course, so you might as well finish it.', { SUNK_EN: NEVER });
  t('M4 置空 SUNK_EN → 英文样本不判', !r.hit, '仍命中: ' + r.detail);
}
// 变异体 5：拆「双腿共现」为「或」——只投入也判（模拟共现铁律被破坏）
{
  // 用一个只有投入腿的良性样本：共现铁律在时应不判；若铁律被改成「或」就会判
  const r = mod.checkSunkCostCoercion('这个项目已经投入了三年的研发精力');
  t('M5 共现铁律：只有投入腿不判', !r.hit, '单腿被判: ' + r.detail);
}
// 变异体 6：拆「共现」反向——只有沉没腿也不判
{
  const r = mod.checkSunkCostCoercion('半途而废确实不太好，你要想清楚');
  t('M6 共现铁律：只有沉没腿不判', !r.hit, '单腿被判: ' + r.detail);
}
// 变异体 7：置空 ANALYSIS_ZH 后，分析语境样本仍不得判（验证它本就靠双腿缺席）
{
  const r = mod.checkSunkCostCoercion('这是沉没成本，应该忽略它，只看未来的收益', { ANALYSIS_ZH: NEVER });
  t('M7 置空 ANALYSIS_ZH 后分析句仍不判', !r.hit, '仍命中: ' + r.detail);
}
// 变异体 8（反向对照）：四条腿齐全时原样本必须判（证明负例不是恒真）
{
  const r = mod.checkSunkCostCoercion('钱都交了，你现在退出不是白花了', {});
  t('M8 对照：原样本在无变异时必判', r.hit, '未命中');
}
// 变异体 9：ACCOUNTING 看守被置空后会计句仍不判（双腿缺席）
{
  const r = mod.checkSunkCostCoercion('财务上这笔费用需要核销并计入当期损益', { ACCOUNTING_ZH: NEVER });
  t('M9 置空 ACCOUNTING_ZH 后会计句仍不判', !r.hit, '仍命中: ' + r.detail);
}

console.log('═══ 负例脚本：sunk_cost_coercion ═══');
for (const r of results) console.log(r);
console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exitCode = fail > 0 ? 1 : 0;
