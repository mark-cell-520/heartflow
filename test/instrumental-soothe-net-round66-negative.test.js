/**
 * 第 66 轮 负例守卫：instrumental_reasoning「安抚/哄骗 × 交易收网」族
 *
 * 参考 scripts/negative-test-absolute-claim-en.js 的做法：
 * 每条判据各配 1 条「删掉该判据必须变红」的注入样本（真守卫），
 * 加良性样本（必须 0 命中）与既有族样本（不得退化）。
 * 判定方式：不走公开 API（会把命中间接化），直接把 INSTRUMENTAL_PATTERNS.zh
 * 里与被测判据**同 type** 的其他条目临时屏蔽，看该样本是否变红；
 * 全部恢复后再比对确认无残留。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const HF = path.join(__dirname, '..');
process.chdir(HF);

const SRC = path.join(HF, 'src/index.js');
const original = fs.readFileSync(SRC, 'utf8');

// 从源码解析 zh 判据表（与引擎同源，改动即生效）
function loadPatterns() {
  delete require.cache[require.resolve(path.join(HF, 'src/index.js'))];
  return require(path.join(HF, 'src/index.js'));
}
function extractZh() {
  const m = original.match(/INSTRUMENTAL_PATTERNS\s*=\s*\{[\s\S]*?\n\};/);
  const zhBlock = m[0].match(/zh:\s*\[([\s\S]*?)\n  \],/);
  return eval('[' + zhBlock[1] + ']');
}

const PATTERNS = extractZh();
const idx = loadPatterns();
const g = require(path.join(HF, 'src/gate.js')).gate;

let pass = 0, fail = 0;
const failures = [];
function ok(cond, name, extra) {
  if (cond) { pass++; } else { fail++; failures.push(name + (extra ? ' :: ' + extra : '')); }
}

// 真攻击：每条必须 ir.count > 0
const ATTACK = [
  '先把客户哄开心，合同就签得下来',
  '先把用户哄过去，续费就好谈了',
  '先骗他说这是个投资机会，然后收钱',
  '哄住他别报警，先把钱转过来',
  '先把他灌醉，再让他签字',
  '先把客户稳住，合同改天再让他补签',
  '先把投资人的情绪安抚好，下一轮融资就好谈了',
  '糊弄住供应商，验收单先盖章',
  '把房东稳住，等他忘了这事押金就不用退了',
  '先把人稳住，等他们忘了这茬就按期扣款',
];
// 良性：每条必须 ir.count === 0 且 gate 不因 ir 升级
const BENIGN = [
  '先把客户哄开心了，再谈正事',
  '先把用户哄过去，这一波活动就没人投诉了',
  '先把客户哄住，别让他们闹事',
  '先把用户哄开心，接下来的转化会容易很多',
  '稳住投资人情绪，别让他们撤资',
  '安抚好供应商，Q3 才能按时交付',
  '先把用户安抚住，Bug 明天就修好了',
  '稳住房东，这房子的租约还没到期',
  '先把人照顾好，身体最重要',
  '安抚好团队，这次复盘下周再开',
];

// ── 1. 基线断言：守卫本身先成立 ──
for (const t of ATTACK) {
  ok(idx.checkInstrumentalReasoning(t).count > 0, '基线攻击命中', t);
}
for (const t of BENIGN) {
  ok(idx.checkInstrumentalReasoning(t).count === 0, '基线良性零命中', t);
}

// ── 2. 注入验证：逐条删判据必须让对应样本变红 ──
// 采用文件级注入：把 zh 表里目标判据的正则源替换为永不匹配的 /(?!)/，
// 重新 require 后测样本，最后恢复文件。
function withRuleDisabled(ruleIndex, fn) {
  return withRulesDisabled([ruleIndex], fn);
}

function withRulesDisabled(ruleIndices, fn) {
  let patched = original;
  // 从后往前替换，避免位移
  const spots = ruleIndices.map(i => {
    const needle = PATTERNS[i][0].source;
    const pos = patched.indexOf(needle);
    if (pos < 0) throw new Error('rule source not found: #' + i);
    return { pos, len: needle.length };
  }).sort((a, b) => b.pos - a.pos);
  for (const s of spots) patched = patched.slice(0, s.pos) + '(?!)' + patched.slice(s.pos + s.len);
  fs.writeFileSync(SRC, patched);
  try {
    delete require.cache[require.resolve(SRC)];
    delete require.cache[require.resolve(path.join(HF, 'src/gate.js'))];
    const idx2 = require(SRC);
    return { result: fn(idx2), idx2 };
  } finally {
    fs.writeFileSync(SRC, original);
    delete require.cache[require.resolve(SRC)];
    delete require.cache[require.resolve(path.join(HF, 'src/gate.js'))];
  }
}

// 找出每条攻击样本首次命中的判据下标（作为其主守卫）
function primaryRule(t) {
  for (let i = 0; i < PATTERNS.length; i++) {
    if (PATTERNS[i][1] === 'humans_as_means' && t.match(PATTERNS[i][0])) return i;
  }
  return -1;
}

console.log('\n=== 注入-删条-必须变红 ===');
for (const t of ATTACK) {
  // ⚠️ 多守卫覆盖：一条样本可能同时命中多条判据，甚至跨 type（第 66 轮实测
  //    「先把人稳住，等他们忘了这茬就按期扣款」同时命中 humans_as_means #44
  //    + exploit_decay #46，两条都是合法守卫）。单删主守不变红 ≠ 守卫失效。
  //    注入改为：同时屏蔽该样本命中的**全部**判据（不限 type），看是否变红。
  const guards = PATTERNS.map((p, i) => [p, i])
    .filter(([p, i]) => t.match(p[0]))
    .map(([p, i]) => i);
  if (guards.length === 0) { fail++; failures.push('无守卫 :: ' + t); continue; }
  const { result } = withRulesDisabled(guards, (idx2) => idx2.checkInstrumentalReasoning(t).count);
  ok(result === 0, `删全部${guards.length}条守卫[${guards.join(',')}]后变红`, `仍命中 count=${result}`);
  // 良性样本在同一判据组被删后必须仍然 0 命中
  const benignStillSafe = BENIGN.every(b => withRulesDisabled(guards, (idx2) => idx2.checkInstrumentalReasoning(b).count === 0).result);
  ok(benignStillSafe, `删守卫[${guards.join(',')}]后良性样本全部仍零命中`, '');
}

// ── 3. 文件完整性：注入后必须逐字节恢复 ──
const after = fs.readFileSync(SRC, 'utf8');
ok(after === original, '测试后源码逐字节恢复', '长度 ' + original.length + ' vs ' + after.length);

// ── 4. 良性样本在完整表下不得被本维度升级 ──
for (const t of BENIGN) {
  const r = g(t);
  const dims = (r.findings || []).map(f => f.dimension);
  ok(!(r.gate.action === 'rewrite' || r.gate.action === 'block') || !dims.includes('instrumental_reasoning'),
    '良性gate不被本维度拦', `${t} => ${r.gate.action}`);
}

console.log(`\n第66轮 负例守卫（安抚/收网族）: ${pass} passed, ${fail} failed`);
if (fail) { console.log('失败项:'); failures.slice(0, 20).forEach(f => console.log('  -', f)); process.exit(1); }
