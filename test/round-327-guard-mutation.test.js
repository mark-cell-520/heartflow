// 第 327 轮负例守卫：对 coverup「禁声 × 监督方对象」guard 做注入-删片段变异。
// r326 教训：删整行 = 删掉整个判据 = 自证，不叫回归测试。
// 本轮一律用**片段级变异**：删 guard 里的安抚动词族（保留正则主体），
// 观察误伤族是否重新升级 block —— 那才证明 guard 真的在承重。
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'manipulation-tactics.js');
const GUARD_MARK = 'return !/(?:安抚|稳住|哄|处理';
const GUARD_END = ').test(head.slice(-26));';

const MUTANTS = [
  {
    name: '删安抚动词族（保留正则与 guard 结构）',
    mutate: (s) => s.replace(
      'return !/(?:安抚|稳住|哄|处理|解释|沟通|澄清|回应|道歉|赔偿|补偿|补救|挽回|定位|排查|核实|确认|跟进|解决|整改|优化|改进|对齐|汇报|报告|通报|公示|公布|说明|通知)/.test(head.slice(-26));',
      'return true;'
    ),
    expectUnblock: false,
  },
  {
    name: '窗口从 26 字缩到 0 字（护不住先行语）',
    mutate: (s) => s.replace('head.slice(-26)', 'head.slice(0, 0)'),
    expectUnblock: false,
  },
  {
    name: '删 guard 挂载本身（回退到 r326 宽口径）',
    mutate: (s) => s.replace('    guard: (text, m) => {', '    guard: () => true, unused_guard: (text, m) => {'),
    expectUnblock: false,
  },
];

const SAMPLE = '先把售后安抚好，别让这事捅到媒体';
const DRIVER = path.join(__dirname, '..', 'scripts', 'round-327', 'mutant-driver.js');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✅ ' + msg); } else { fail++; console.log('  ❌ ' + msg); } }

const original = fs.readFileSync(SRC, 'utf8');
try {
  for (const mu of MUTANTS) {
    const mutated = mu.mutate(original);
    if (mutated === original) { ok(false, mu.name + ' → 变异未生效（字符串没匹配上，检查源码是否已变）'); continue; }
    fs.writeFileSync(SRC, mutated);
    let out = '';
    try {
      out = execFileSync('node', [DRIVER], { encoding: 'utf8', timeout: 60000 });
    } catch (e) {
      ok(false, mu.name + ' → 驱动崩溃：' + String(e.message).slice(0, 120));
      continue;
    } finally {
      fs.writeFileSync(SRC, original);
    }
    const action = (out.match(/action=(\w+)/) || [])[1];
    // 期望：变异后误伤样本重新升级（block/verify）→ 证明 guard 承重
    ok(action === 'block' || action === 'rewrite' || action === 'verify',
      mu.name + ' → 误伤样本 action=' + action + '（guard 失效即复现误伤）');
  }
} finally {
  fs.writeFileSync(SRC, original);
}

// 还原后必须回到 pass（防止变异残留）
const after = execFileSync('node', [DRIVER], { encoding: 'utf8', timeout: 60000 });
ok((after.match(/action=(\w+)/) || [])[1] === 'pass', '还原后误伤样本回到 pass');

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
process.exit(fail > 0 ? 1 : 0);
