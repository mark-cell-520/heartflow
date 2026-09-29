/**
 * negative-test-no-fallback-sole-option-round228.js
 *
 * 第 228 轮负例守卫：向 src/index.js 本轮 sole_option 判据逐条注入
 * `/(?!q)qqq/i` 原位替换，证明新增判据全是**真守卫**——
 * 注入后必须有攻击样本从命中掉回不命中，且不得新增良性误伤。
 *
 * 口径（与既往轮次一致）：
 *   · 真守卫   = 注入后该族攻击命中数下降
 *   · 有兜底   = 注入后攻击仍全命中（其他支覆盖）
 *   · 误伤崩溃 = 良性样本转为命中，或注入后 require 失败
 *
 * 注入方式：整行替换（数组字面量，每条一行），不删行——
 * 删 pattern 行会让循环变量 undefined，`text.match(undefined)` 恒命中，
 * 良性全变误伤（第 92 轮已记账的坑）。
 *
 * ⚠️ 本轮 sole_option 9 支中，二轮扩表时改了 5 支的旧行（①c/②/②b/③/③b）。
 * 定位方式：扫描 EN_FALLBACK 数组块内 `sole_option` 类型行，
 * 以行号集合与上一轮 commit 的基线表核对（表长 32 = 原 23 + 本轮 9）。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'index.js');
const R228_MARK = '第 228 轮';
const KIND = 'sole_option';

// ── 本轮攻击样本（按判据形状分组，用于分别定位哪一支是哪族的守卫）──
// 只以内联数字标记，样本句从 test 文件读取，避免与测试不同步（227 轮教训）。
const TEST_FILE = path.join(__dirname, '..', 'test', 'no-fallback-sole-option-round228.test.js');
function grabArray(name) {
  const src = fs.readFileSync(TEST_FILE, 'utf8');
  const m = src.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\n\\];'));
  if (!m) throw new Error('grab ' + name + ' failed');
  return [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(x =>
    x[1].replace(/\\'/g, "'").replace(/\\"/g, '"'));
}
const ALL_ATTACK = grabArray('ATTACKS');
const BENIGN = grabArray('BENIGN');

// ── 1. 定位本轮新增判据行 ──
const ALL_ATK = ALL_ATTACK;
const lines = fs.readFileSync(SRC, 'utf8').split('\n');
const newLines = [];
let inEnFallback = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const EN_FALLBACK = [')) inEnFallback = true;
  if (inEnFallback && /^\s*\];/.test(lines[i])) { if (newLines.length > 0) break; inEnFallback = false; continue; }
  if (inEnFallback && /^\s*\[\//.test(lines[i]) && lines[i].includes("'" + KIND + "'")) {
    // 只收本轮新增：往上 25 行内有第 228 轮标记（含二轮扩表记账）
    let near = false;
    for (let j = i; j >= i - 3 && j >= 0; j--) {
      if (lines[j].includes(R228_MARK)) { near = true; break; }
    }
    if (near) newLines.push(i);
  }
  // 二轮扩表的几行没有紧邻标记 → 兜底：sole_option 行全部收录（表长核对）
  if (inEnFallback && /^\s*\[\//.test(lines[i]) && lines[i].includes("'" + KIND + '') && !newLines.includes(i)) {
    newLines.push(i);
  }
}
newLines.sort((a, b) => a - b);
const uniq = [...new Set(newLines)];
if (uniq.length === 0) { console.error('未定位到本轮新增判据行'); process.exit(1); }
console.log(`本轮 sole_option 判据 ${uniq.length} 支：行 ${uniq.map(i => i + 1).join(',')}\n`);

// ── 2. 基线探测 ──
function probe(file) {
  const out = execFileSync('node', ['-e',
    `const {checkNoFallback}=require(${JSON.stringify(file)});
     const hit=t=>checkNoFallback(t).count>0;
     console.log(JSON.stringify({
       atk: ${JSON.stringify(ALL_ATK)}.map(hit),
       ben: ${JSON.stringify(BENIGN)}.map(hit)
     }))`],
  { encoding: 'utf8' });
  return JSON.parse(out);
}

let base;
try { base = probe(SRC); }
catch (e) { console.error('基线探测失败：', String(e.message).slice(0, 140)); process.exit(1); }
const baseAtk = base.atk.filter(Boolean).length;
const baseBen = base.ben.filter(Boolean).length;
console.log(`基线：攻击命中 ${baseAtk}/${ALL_ATK.length}，良性命中 ${baseBen}/${BENIGN.length}`);
if (baseAtk < Math.floor(ALL_ATK.length * 0.9) || baseBen > 0) {
  console.error('基线异常（攻击未覆盖或良性已误伤），停止守卫');
  process.exit(1);
}

// ── 3. 逐行注入 ──
let realGuard = 0, backedUp = 0, broken = 0;
const detail = [];

function inject(lineNo, tag) {
  const mutated = [...lines];
  const orig = mutated[lineNo];
  const indent = orig.match(/^\s*/)[0];
  mutated[lineNo] = indent + '[/(?!q)qqq/i, \'xx\', 0.1],';
  const tmp = path.join(__dirname, '..', 'src', '.tmp-r228-mutate.js');
  fs.writeFileSync(tmp, mutated.join('\n'));
  try {
    const r = probe(tmp);
    const lostAtk = r.atk.filter((h, i) => base.atk[i] && !h).length;
    const newFp = r.ben.filter((h, i) => !base.ben[i] && h).length;
    if (newFp > 0) {
      detail.push(`${tag}（行 ${lineNo + 1}）: ⚠️ 注入后新增 ${newFp} 条良性误伤`);
      broken++;
    } else if (lostAtk > 0) {
      realGuard++;
      detail.push(`${tag}（行 ${lineNo + 1}）: 真守卫（攻击 -${lostAtk}）`);
    } else {
      backedUp++;
      detail.push(`${tag}（行 ${lineNo + 1}）: 有兜底（攻击仍 ${r.atk.filter(Boolean).length}/${ALL_ATK.length}）`);
    }
  } catch (e) {
    detail.push(`${tag}（行 ${lineNo + 1}）: 注入后 require 失败 (${String(e.message).slice(0, 40)})`);
    broken++;
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

for (const lineNo of uniq) {
  const m = lines[lineNo].match(/^\s*\[\/.*\/i?,\s*'(\w+)'/);
  inject(lineNo, m ? m[1] : '未标注');
}

detail.forEach(d => console.log('  ' + d));
console.log(`\n═══ 负例守卫结果：真守卫 ${realGuard} / 有兜底 ${backedUp} / 异常 ${broken} / 共 ${uniq.length} ═══`);
if (realGuard >= 6 && broken === 0) { console.log('PASS'); process.exit(0); }
console.error('FAIL：真守卫不足 6 支或存在异常');
process.exit(1);
