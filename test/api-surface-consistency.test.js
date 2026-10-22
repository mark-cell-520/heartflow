/**
 * 测试：API 表面一致性（v6.7.79，心虫 decision.decide 0.90）
 *
 * 来源：第 44 轮心虫选「核对 API 参考表」。
 *
 * 一、审计结论：无幽灵方法，但有 4 个导出从未被文档提及
 *
 * gate.js 导出 8 个函数：
 *   gate, check, pipeline, runPipeline, discriminate,
 *   checkInput, checkDraft, checkOutput
 *
 * 三份文档只提到 4 个（checkInput / checkDraft / checkOutput / runPipeline）。
 * 缺的 4 个里 **`gate` 和 `pipeline` 是硬闸门本体**——第 12 轮起所有
 * block/rewrite 判定都从 gate() 出，但文档从来没说过它存在。
 *
 * 好消息：**0 个"文档有但导出没有"的幽灵方法**（即没有第 43 轮
 * Quick start 那种复制即崩）。本次是把缺的补齐，不是修错的。
 *
 * 二、为什么值得单独守卫
 *
 * API 表格是调用方**选哪个函数**的直接依据。两类失败都不好：
 *   - 幽灵方法（文档有、导出无）→ 复制即崩
 *   - 漏列（导出有、文档无）  → 调用方不知道有更强的工具，
 *     只能用 checkInput 拿不到 gate.action 的完整 findings
 * 前者更难发现（要复制才知道），后者只是信息缺失。
 *
 * 三、本测试守两条
 *   ① 零幽灵方法（硬失败）
 *   ② 全部导出都被至少一份文档提及（硬失败——防止再漏）
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

const gate = require(path.join(HF, 'src/gate.js'));
const EXPORTS = Object.keys(gate).filter(k => typeof gate[k] === 'function');

console.log('\n[收集文档提到的方法名]');

const DOCS = ['README.md', 'AGENTS.md', 'SKILL.md'];
const mentioned = new Set();
for (const d of DOCS) {
  const p = path.join(HF, d);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');
  for (const m of src.matchAll(/\|\s*`(\w+)\s*\(/g)) mentioned.add(m[1]);
  for (const m of src.matchAll(/#+\s*`(\w+)\s*\(/g)) mentioned.add(m[1]);
  // 行内代码 `checkInput(` 形式
  for (const m of src.matchAll(/`(\w+)\s*\(/g)) mentioned.add(m[1]);
}

console.log(`  gate.js 导出 ${EXPORTS.length} 个函数`);
console.log(`  文档提及 ${mentioned.size} 个方法名`);

console.log('\n[零幽灵方法]');

t('文档提到的每个方法都真实存在', () => {
  const bogus = [...mentioned].filter(n =>
    typeof gate[n] !== 'function' && /^(check|gate|run|discriminate|pipeline)/.test(n));
  assert.strictEqual(bogus.length, 0,
    `文档列了导出里不存在的方法: ${bogus.join(', ')}。调用方复制即崩。`);
});

console.log('\n[导出不漏列]');

t('全部导出都被至少一份文档提及', () => {
  const missing = EXPORTS.filter(e => !mentioned.has(e));
  assert.strictEqual(missing.length, 0,
    `这些导出没有任何文档提及: ${missing.join(', ')}。` +
    `调用方不知道它们存在，只能用入口函数。`);
});

t('gate() 硬闸门本体有文档说明', () => {
  // gate() 是 block/rewrite 判定的出处，必须被文档化
  const anyDoc = DOCS.some(d => {
    const p = path.join(HF, d);
    return fs.existsSync(p) && /`gate\(text\)`/.test(fs.readFileSync(p, 'utf8'));
  });
  assert.ok(anyDoc, '没有任何文档说明 gate(text) —— 硬闸门本体对调用方不可见');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
