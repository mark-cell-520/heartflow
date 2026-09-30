/**
 * r293 探针 6：phase1+phase2 内的 `[^，。]{0,8}` 为何在 phase2 补丁后失去命中
 *
 * 现象：phase1 后 #7 (qualitative_leap) 两形态都 = hedge；phase2 后 FW 仍 hedge、
 *       HALF 变 pass。怀疑 phase2 的 `[^，。] -> [^，。,]` 顺序性副作用：
 *       phase2 规则先跑，把 `[^，。]{0,8}(壳|...)` 里的 `[^，。]` 改成 `[^，。,]`，
 *       之后 phase1 的规则仍写着 `[^，。]` 就匹配不上——但我先跑 phase1 后跑 phase2，
 *       所以应该没问题。本探针把「塞字」假说量化：补丁数量对 FW/HALF 命中的边际影响。
 *
 * 做法：从基线开始，**只**跑 phase2（跳过 phase1），看 #7 是否也退化。
 * 若只跑 phase2 不退化 → phase1/phase2 之间有交互。
 */
const fs = require('fs');
const path = require('path');
const P = (...a) => console.log(...a);
const ROOT = path.resolve(__dirname, '..', '..');
const F = path.join(ROOT, 'src', 'doubt-engine.js');
const BACKUP = path.join(ROOT, 'scripts', 'round-293', 'doubt-engine.baseline.js');

const PHASE1 = [
  ['[^，。]{3,30}[，。]/g', '[^，。]{3,30}[，。,.]/g'],
  ['[^，。]{3,20}[的，。]/g', '[^，。]{3,20}[的，。,.]/g'],
  ['[的，。,。]', '[的，。,.。.]'],
  ['[的，。]', '[的，。,]'],
  ['[，。,。]', '[，。,。.]'],
];
const PHASE2 = [
  ['[^，。]', '[^，。,]'],
  ['[^。]', '[^。.]'],
];

function loadFresh() {
  for (const k of Object.keys(require.cache)) {
    if (k.startsWith(path.join(ROOT, 'src'))) delete require.cache[k];
  }
  return require(F);
}

const TARGETS = [
  ['它从一个空壳占位模块，变成了真正的完整实现。', '它从一个空壳占位模块,变成了真正的完整实现.'],
  ['我们堵住了三种绕过的攻击缺口，都测过了。', '我们堵住了三种绕过的攻击缺口,都测过了.'],
  ['这个方案完全可行，当然还有一些风险。', '这个方案完全可行,当然还有一些风险.'],
  ['这是最好的解决方案，没有之一可以用。', '这是最好的解决方案,没有之一可以用.'],
];

function probe(label) {
  const { doubt } = loadFresh();
  P(`── ${label} ──`);
  TARGETS.forEach(([fw, half], i) => {
    const a = doubt(fw), b = doubt(half);
    P(`  #${i} FW=${a.shouldStop}|${a.gate.action}|${a.doubts.length}  HALF=${b.shouldStop}|${b.gate.action}|${b.doubts.length}`);
  });
}

function apply(rules) {
  let src = fs.readFileSync(BACKUP, 'utf8');
  let n = 0;
  for (const [from, to] of rules) {
    if (!src.includes(from)) continue;
    n += src.split(from).length - 1;
    src = src.split(from).join(to);
  }
  fs.writeFileSync(F, src);
  return n;
}

P('══════ r293 探针 6：phase 交互诊断 ════');
apply(PHASE2); probe('只跑 phase2');
apply(PHASE1.concat(PHASE2)); probe('phase1 + phase2');
apply(PHASE1); probe('只跑 phase1');
