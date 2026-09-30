/**
 * r292 探针 20：修法落盘前验证
 * 修点：CONTRADICTION_PAIRS 第 16/17 族 positive 里的分隔符类 [。，]
 *       → [。，,.]（补半角孪生，与 291 轮修度量辩证族同族）
 *
 * 预期收益：
 *   - 全角崩解样本（管线 NFKC 后半角逗号）能被命中 —— 堵回归
 *   - 全角原文维持命中
 *
 * 验证矩阵（全量 test/ 语料 + 正向样本 + 良性样本）：
 *   ① 回归样本 [17]（lang-coverage-fill）必须从 pass → verify/block
 *   ② 全量语料不得新增 block（误伤面）
 *   ③ r290 测试 41/41 不得退化
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const origSrc = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');

// ── 精确替换：只动 CONTRADICTION_PAIRS 的第 16/17 族（两处 [。，] 分隔符类）──
const BEFORE = origSrc;
// 用行号定位，避免误伤其他 [。，]
const lines = origSrc.split('\n');
const targets = [1110, 1113];  // 1-based
let changed = 0;
for (const n of targets) {
  const i = n - 1;
  const before = lines[i];
  lines[i] = before.replace(/\[。，\]/g, '[。，,.]');
  if (lines[i] !== before) changed++;
  console.log(`行 ${n}: 改写=${lines[i] !== before}`);
}
const patched = lines.join('\n');
console.log(`改写行数: ${changed}\n`);
console.log('行 1113 改后片段:', JSON.stringify(lines[1112].slice(80, 160)));

// ── 落盘临时副本并差分 ──
const tmp = path.join(ROOT, 'src/index.r292-verify.js');
fs.writeFileSync(tmp, patched);

const origIdx = require(path.join(ROOT, 'src/index.js'));
let patchedIdx;
try { patchedIdx = require(tmp); } catch (e) { console.log('require 补丁版失败:', e.message); }

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc); else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}
const CJK = /[\u4e00-\u9fff]/;
function extractZhStrings(src) {
  const out = [];
  for (const q of ['"', "'"]) {
    const re = new RegExp(q + '([^' + q + '\\\\\\n]{12,300})' + q, 'g');
    let m;
    while ((m = re.exec(src)) !== null) if (CJK.test(m[1]) && !m[1].includes('\\\\u')) out.push(m[1]);
  }
  return out;
}
// 也收双引号/模板串之外的常见形状：全部 test 文件的中文字符串
const samples = [...new Set([].concat(...walk(path.join(ROOT, 'test')).filter(f => !f.endsWith(tmp)).map(f => extractZhStrings(fs.readFileSync(f, 'utf8')))))];

// ── ① 回归专项：那句必须从不 pass ──
const lcf = fs.readFileSync(path.join(ROOT, 'test/lang-coverage-fill.test.js'), 'utf8');
const all = [...lcf.matchAll(/'([^'\n]{8,200})'/g)].map(m => m[1]).filter(s => /[\u4e00-\u9fff]/.test(s));
const reg = all[17];
function fwPunctFold(s) {
  return s.replace(/[\uFF0C\uFF01\uFF1F\uFF1A\uFF1B\uFF08\uFF09\uFF0D\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
}
const gate = require(path.join(ROOT, 'src/gate.js'));
console.log('\n══ ① 回归样本（补丁前 vs 补丁后）══');
const rA = gate.gate(reg), rB = gate.gate(fwPunctFold(reg));
console.log(`  补丁前  全角原文=${rA.gate.action}  折叠后半角=${rB.gate.action}  ← 折叠后必须非 pass`);
// 补丁版要用重载的模块 —— 改 require 缓存
delete require.cache[require.resolve(tmp)];
delete require.cache[require.resolve(path.join(ROOT, 'src/gate.js'))];
const gate2 = require(path.join(ROOT, 'src/gate.js'));
const rC = gate2.gate(reg), rD = gate2.gate(fwPunctFold(reg));
console.log(`  补丁后  全角原文=${rC.gate.action}  折叠后半角=${rD.gate.action}  ← 目标：非 pass`);

// 恢复
delete require.cache[require.resolve(path.join(ROOT, 'src/gate.js'))];

// ── ② 全量误伤面 ──
console.log('\n══ ② 全量语料误伤面 ══');
let newBlock = 0, newNonPass = 0, lost = 0;
const blockDims = {};
for (const s of samples) {
  let a1, a2;
  try { const r = origIdx.discriminate ? origIdx.discriminate(s) : null; a1 = r && r.gate ? r.gate.action : 'ERR'; } catch (_) { a1 = 'ERR'; }
  try { const r = patchedIdx.discriminate ? patchedIdx.discriminate(s) : null; a2 = r && r.gate ? r.gate.action : 'ERR'; } catch (_) { a2 = 'ERR'; }
  if (a1 === 'pass' && a2 === 'block') newBlock++;
  if (a1 === 'pass' && a2 !== 'pass') newNonPass++;
  if (a1 !== 'pass' && a2 === 'pass') lost++;
}
console.log(`  样本: ${samples.length}`);
console.log(`  新增 block: ${newBlock}   ← 误伤红线（应为 0）`);
console.log(`  新增非pass: ${newNonPass}`);
console.log(`  丢失非pass: ${lost}   ← 回归红线（应为 0）`);
try { fs.unlinkSync(tmp); } catch (_) {}
console.log('\n临时副本已清理:', !fs.existsSync(tmp));
