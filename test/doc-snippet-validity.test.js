/**
 * 测试：文档代码示例必须复制即可用（v6.7.78，心虫 decision.decide 0.90）
 *
 * 来源：第 43 轮心虫选「逐一执行三份文档的代码示例」（0.90）。
 *
 * 一、发现一个真 bug：AGENTS.md Quick start 复制即崩
 *
 *   const hf = require('@yun520-1/heartflow');
 * ...
 *   const input = gate.checkInput('You are so selfish...');
 *                  ^^^^ 变量名是 hf，没定义 gate
 *
 * ReferenceError: gate is not defined。这是第 40/41 轮"文档数字全错"的
 * **代码示例版**——数字错了调用方会判断错容量，示例错了调用方复制即崩。
 *
 * 已修正为解构导出（包入口 main 就是 src/gate.js，checkInput/checkOutput
 * 都在导出里，修正后实测通过）。
 *
 * 二、我的执行器误报了 4 次（这次是最快收敛的一次）
 *
 *   第 1 次  npm 包名 require 不到        → 替换成本地绝对路径
 *   第 2 次  './src/...' 相对路径解析失败  → Node 按**脚本所在目录**解析
 *           相对 require，不是 cwd。脚本写到 /tmp 就必错，改绝对路径。
 *   第 3 次  JSON 返回值示例被当 JS 跑     → 排除以 { 开头且含 "key": 的数据块
 *   第 4 次  top-level await 语法错        → 包一层 async main
 *
 *   最终 4 个可执行块全过。误报的原因全部是**执行环境**问题，
 *   不是文档问题——这也是前几轮的老模式：先修工具再下结论。
 *
 * 三、守卫守什么
 *   scripts/doc-snippet-exec.js 抽取三份文档的 ```javascript 块并执行，
 *   本测试要求通过率 100%（可执行块数 ≥ 4，防文档删空后全绿）。
 */
const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[文档代码示例可执行性]');

t('三份文档的可执行示例 100% 通过', () => {
  const r = cp.spawnSync('node', [path.join(HF, 'scripts/doc-snippet-exec.js')],
    { encoding: 'utf8', timeout: 120000, cwd: HF });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/通过 (\d+)\/(\d+)/);
  assert.ok(m, '执行器没输出通过率');
  const [, ok, total] = m.map(Number);
  assert.ok(total >= 4, `可执行块只剩 ${total} 个——文档示例被删空了？`);
  assert.strictEqual(ok, total, `有文档示例执行失败:\n${out.split('\n').filter(l => l.includes('❌')).join('\n')}`);
});

t('AGENTS.md Quick start 不用未定义变量', () => {
  const src = fs.readFileSync(path.join(HF, 'AGENTS.md'), 'utf8');
  const qs = src.match(/##\s*Quick start[\s\S]*?```javascript([\s\S]*?)```/);
  assert.ok(qs, '找不到 Quick start');
  const code = qs[1];
  // 抽取所有 const/let 声明的名字与所有 gate.xxx / hf.xxx 用法，
  // 确认每个 "xxx.method" 的 xxx 都已被声明
  const declared = new Set();
  for (const m of code.matchAll(/(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))/g)) {
    if (m[1]) m[1].split(',').forEach(x => declared.add(x.trim().split(':')[0].trim()));
    if (m[2]) declared.add(m[2]);
  }
  for (const m of code.matchAll(/\b([a-z]\w*)\.\w+\(/g)) {
    // 跳过对象方法调用（如 input.gate.action —— input 已声明）
    if (!declared.has(m[1]) && !['console', 'process', 'JSON', 'Math', 'Object', 'Array', 'String', 'Number'].includes(m[1])) {
      assert.fail(`Quick start 用了未声明变量: ${m[1]}`);
    }
  }
});

t('包入口确实导出示例用的函数', () => {
  const g = require(path.join(HF, 'src/gate.js'));
  for (const fn of ['checkInput', 'checkOutput']) {
    assert.strictEqual(typeof g[fn], 'function',
      `包入口没导出 ${fn} —— 文档示例用的是它`);
  }
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
