// r297 探针 7：二分定位 DISREGARD_EN 中哪个前缀让 d5 分支失效。
// 方法：按顶层 | 切分（需跳过字符类内的 |），逐段累加 test，找到 d5 失效的前缀。
const ah = require('../../src/ad-hominem.js');
const I = ah.__internals();
const S = I.DISREGARD_EN.source;

// 按顶层 | 切分：跟踪字符类 [] 与分组深度
function splitTopLevel(src) {
  const parts = [];
  let depth = 0, inClass = false, cur = '';
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\\') { cur += ch + (src[i + 1] || ''); i++; continue; }
    if (inClass) { cur += ch; if (ch === ']') inClass = false; continue; }
    if (ch === '[') { inClass = true; cur += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === '|' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

const parts = splitTopLevel(S);
console.log('顶层分支数:', parts.length);
parts.forEach((p, i) => {
  const tag = /worthless/.test(p) ? ' <== d5 段' : '';
  console.log(`[${i}] len=${p.length}${tag} :: ${p.slice(0, 90)}`);
});

// 逐段累加，找 d5 段索引
const d5Idx = parts.findIndex(p => /worthless/.test(p));
console.log('\nd5 段索引:', d5Idx);

// 单独 test d5 段
try {
  const reD5 = new RegExp(parts[d5Idx], 'i');
  console.log('d5 单独 test "your conclusions are worthless":', reD5.test('your conclusions are worthless') ? 'Y' : '-');
} catch (e) { console.log('d5 段编译失败:', e.message); }

// 累加到 d5 前一段 / 含 d5
function build(idx) {
  return new RegExp(parts.slice(0, idx + 1).join('|'), 'i');
}
for (const k of [d5Idx - 1, d5Idx]) {
  try {
    const re = build(k);
    const ok = re.test('your conclusions are worthless');
    console.log(`累加 0..${k} test:`, ok ? 'Y' : '-');
  } catch (e) { console.log(`累加 0..${k} 编译失败:`, e.message); }
}

// 检查 d5 段自身的括号平衡
const d5 = parts[d5Idx];
let bal = 0;
for (const ch of d5) { if (ch === '(') bal++; if (ch === ')') bal--; }
console.log('d5 段括号平衡:', bal);

// 检查每段括号平衡，找出失衡段
parts.forEach((p, i) => {
  let b = 0, ic = false;
  for (let j = 0; j < p.length; j++) {
    const ch = p[j];
    if (ch === '\\') { j++; continue; }
    if (ic) { if (ch === ']') ic = false; continue; }
    if (ch === '[') { ic = true; continue; }
    if (ch === '(') b++;
    if (ch === ')') b--;
  }
  if (b !== 0) console.log(`!! 段 [${i}] 括号失衡 ${b}: ${p.slice(0, 100)}`);
});
