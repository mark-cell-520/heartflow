#!/usr/bin/env node
'use strict';
/**
 * scripts/lint-regex-exec-loops.js — 零依赖静态 lint（node 可直接跑）
 *
 * 背景（真实事故，两条都要防）：
 *
 *  A) r266 conjunction_fallacy 英文侧计数死循环：
 *     按 flags 透传构造 `new RegExp(re.source, re.flags + 'i')`，原正则只有
 *     i 没有 g，`while ((m = g.exec(text)) !== null)` 永远返回同一匹配 →
 *     死循环挂起（存量样本实测复现）。已修为硬编码 'gi'（src/conjunction-fallacy.js
 *     cmpEn 注释）。形态本质：exec 循环的正则不含 g/y。
 *
 *  B) r265 sycophancy-check matchAll 非全局正则：
 *     `text.matchAll(re)` 的 re 不带 g → 直接抛 TypeError，i18n 单测
 *     10/10 全挂。修复用 _countMatches（全局化后计数）。
 *
 * 检出规则：
 *   R1 exec-loop-non-global       while/for 条件里的 `.exec(`：正则是字面量时
 *                                 检查有没有 /g（或 /y）；是 `new RegExp(...)`
 *                                 构造时检查 flags 表达式。
 *   R2 regexp-flags-passthrough   `new RegExp(source, flags)` 的 flags 表达式
 *                                 无法静态证明含 'g'：字符串字面量 flags 直接判
 *                                 'g' in flags；裸变量/属性透传形态报警（正是
 *                                 事故 A 的形态）。guarded 形态
 *                                 （`re.flags.includes('g') ? re.flags : re.flags+'g'`
 *                                 / `... + 'g'` / 硬编码 'g'/'gi'）判过。
 *   R3 matchall-non-global        `.matchAll(` 的**实参**正则非全局（matchAll
 *                                 要求全局，会直接抛 TypeError）。注意：exec
 *                                 循环认 g 或 y（sticky 也推进），matchAll
 *                                 只认 g（spec：非全局即 TypeError）。
 *
 * 解析策略（保守优先，宁缺勿滥）：
 *   - 只检查「同一行内」while/for 条件中的 .exec(，或上一行以 `while (` /
 *     `for (` 结尾的多行条件形态；.exec( 出现在循环体（非条件）不查——
 *     单发调用没有 lastIndex 复跑风险。
 *   - 正则来源四种形态：正则字面量 / 行内 new RegExp(...) / 简单标识符（同文件
 *     内 const|let|var 定义解析，取使用行之前最近的定义，限深 3 层）/
 *     属性访问（a.b，静态不可证 → 跳过不判）。
 *   - `new RegExp(pat.source, pat.flags)` 忠实拷贝形态：若 pat 是 for-of
 *     循环变量且遍历的数组（同文件定义）内**全部**正则字面量都带 g/y → 判过；
 *     数组里混有不带 g/y 的字面量 → 报警（实测 src/completion-evidence.js
 *     EMPTY_VERIFY 正是此形态，命中即死循环）。
 *   - 标识符定义解析不到 → 不判违规（缺证不判）；但 flags 表达式是裸标识符时
 *     正是事故 A 形态，按违规报警。
 *
 * 用法：
 *   node scripts/lint-regex-exec-loops.js            # 默认扫 src/
 *   node scripts/lint-regex-exec-loops.js src test   # 指定目录（可多个）
 * 退出码：0 = 0 violations；1 = 有违规。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'archive', 'dist', '.tmp']);

const argv = process.argv.slice(2);
const dirArgs = argv.filter((a) => !a.startsWith('--'));
const targets = dirArgs.length > 0 ? dirArgs : ['src'];

/** 递归收集 .js 文件 */
function collectJs(dir, out = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      collectJs(full, out);
    } else if (ent.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

/** 从 endIdx-1 位置（应为 ')'）向前配平，返回匹配 '(' 的下标；找不到返回 -1 */
function matchParenBack(str, endIdx) {
  let depth = 0;
  for (let i = endIdx - 1; i >= 0; i--) {
    const ch = str[i];
    if (ch === ')') depth++;
    else if (ch === '(') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

/** 按顶层逗号切分实参（忽略字符串/括号内的逗号） */
function splitTopLevelArgs(argStr) {
  const args = [];
  let cur = '';
  let depth = 0;
  let quote = null;
  for (let i = 0; i < argStr.length; i++) {
    const ch = argStr[i];
    if (quote) {
      cur += ch;
      if (ch === '\\') { cur += argStr[i + 1] || ''; i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) { args.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim() !== '' || args.length > 0) args.push(cur.trim());
  return args;
}

/** 提取行内 new RegExp 的实参文本；prefix 需以 ')' 结尾（紧邻 .exec(） */
function extractNewRegExpArgs(prefix) {
  const t = prefix.replace(/\s+$/, '');
  if (!t.endsWith(')')) return null;
  const open = matchParenBack(t, t.length);
  if (open < 0) return null;
  const head = t.slice(0, open);
  if (!/new\s+RegExp\s*$/.test(head)) return null;
  return t.slice(open + 1, -1);
}

/** 正则字面量匹配（prefix 末尾处） */
const LITERAL_RE = /(\/(?:\\.|\[(?:\\.|[^\]\\])*\]|[^\/\\\n])+\/[a-z]*)\s*$/;
/** 全局版：扫数组文本内全部字面量（必须锚定起始 '/'，否则会切出 `    /all` 残片） */
const LITERAL_RE_G = /\/(?:\\.|\[(?:\\.|[^\]\\])*\]|[^\/\\\n])+\/[a-z]*/g;

function literalFlags(lit) {
  const lastSlash = lit.lastIndexOf('/');
  return lit.slice(lastSlash + 1);
}

/**
 * flags 表达式是否静态可证含所需标志。
 * need: 'g'（matchAll）或 'gy'（exec 循环，sticky 也推进）。
 */
function flagsProvable(expr, need, ctx, depth = 0) {
  if (!expr || depth > 3) return false;
  // 1) 表达式内任意字符串字面量含所需字符 → 可证
  //    （覆盖 'gi' / + 'g' / guarded 三元里的 'g' 字面量）
  const strs = expr.match(/'[^']*'|"[^"]*"|`[^`]*`/g) || [];
  for (const s of strs) {
    const body = s.slice(1, -1);
    for (const ch of need) if (body.includes(ch)) return true;
  }
  // 2) 裸标识符 → 查同文件定义（取使用行之前最近的定义）递归判定
  const idm = expr.match(/^([A-Za-z_$][\w$]*)$/);
  if (idm) {
    const def = ctx.lookupDef(idm[1], ctx.usageLine);
    if (def !== null) return flagsProvable(def, need, ctx, depth + 1);
    return false; // 裸标识符 flags，定义不可见 → 透传形态，报警
  }
  // 3) 属性透传 X.flags（忠实拷贝形）→ 查 for-of 数组全量带 g/y
  const pm = expr.match(/^([A-Za-z_$][\w$]*)\.flags$/);
  if (pm) {
    const arrName = ctx.findForOfArray(pm[1], ctx.usageLine);
    if (arrName) {
      const arrText = ctx.resolveArrayText(arrName, ctx.usageLine);
      if (arrText) {
        const lits = arrText.match(LITERAL_RE_G) || [];
        if (lits.length > 0 && lits.every((l) => need.split('').some((ch) => literalFlags(l).includes(ch)))) {
          return true; // 遍历数组全部字面量带 g/y → 拷贝必全局
        }
      }
    }
    return false; // 数组混带/不可见 → 不可证，报警
  }
  return false;
}

/** 收集同文件定义：IDENT → [{line, rhs}]（rhs 截到首个 ';'，可跨行） */
function collectDefs(src) {
  const defs = new Map();
  const re = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]+);/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const line = src.slice(0, m.index).split('\n').length;
    if (!defs.has(m[1])) defs.set(m[1], []);
    defs.get(m[1]).push({ line, rhs: m[2].trim() });
  }
  return defs;
}

/** 提取 src 中 `for (const X of ARR)` 的 ARR（X 使用行之前最近的一个） */
function findForOfArray(varName, src, usageLine) {
  const re = new RegExp('for\\s*\\(\\s*(?:const|let|var)\\s+' + varName + '\\s+of\\s+([A-Za-z_$][\\w$.]*)\\s*\\)', 'g');
  let m; let best = null;
  while ((m = re.exec(src)) !== null) {
    const line = src.slice(0, m.index).split('\n').length;
    if (line <= usageLine && (!best || line > best.line)) best = { line, arr: m[1] };
  }
  return best ? best.arr.split('.').pop() : null;
}

/** 解析 `const ARR = [ ... ]` 的数组文本（括号配平，可跨行） */
function resolveArrayText(arrName, src, usageLine) {
  const declRe = new RegExp('(?:const|let|var)\\s+' + arrName + '\\s*=\\s*\\[', 'g');
  let m; let best = null;
  while ((m = declRe.exec(src)) !== null) {
    const line = src.slice(0, m.index).split('\n').length;
    if (line <= usageLine && (!best || line > best.line)) best = { line, openIdx: m.index + m[0].length - 1 };
  }
  if (!best) return null;
  let depth = 0;
  for (let i = best.openIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) return src.slice(best.openIdx + 1, i); }
  }
  return null;
}

/**
 * 判定一个「正则来源表达式」的全局性。
 * expr: 字面量文本 / `new RegExp(...)` 文本 / 标识符 / 其它。
 * 返回 { kind: 'ok'|'bad'|'unknown', detail }。
 */
function judgeRegexExpr(expr, need, ctx) {
  const t = expr.replace(/\s+$/, '');
  // 1) 正则字面量
  if (LITERAL_RE.test(t) && t.match(LITERAL_RE)[1] === t.replace(/\s+$/, '')) {
    const lit = t.match(LITERAL_RE)[1];
    const flags = literalFlags(lit);
    const ok = need.split('').some((ch) => flags.includes(ch));
    return ok ? { kind: 'ok' } : { kind: 'bad', detail: `字面量 ${lit} 标志位「${flags || '(无)'}」不含 ${need.split('').join('/')}` };
  }
  // 2) 行内 new RegExp(...)
  if (/^new\s+RegExp\s*\(/.test(t) && t.endsWith(')')) {
    const open = t.indexOf('(');
    const args = splitTopLevelArgs(t.slice(open + 1, -1));
    const flagsExpr = args.length >= 2 ? args[1] : '';
    if (flagsExpr === '') return { kind: 'bad', detail: 'new RegExp(...) 未传 flags（无 g）' };
    if (flagsProvable(flagsExpr, need, ctx)) return { kind: 'ok' };
    return { kind: 'bad', detail: `new RegExp flags 表达式「${flagsExpr}」无法证明含 ${need.split('').join('/')}（变量透传形态）` };
  }
  // 3) 简单标识符 → 同文件定义解析
  const idm = t.match(/^([A-Za-z_$][\w$]*)$/);
  if (idm) {
    const def = ctx.lookupDef(idm[1], ctx.usageLine);
    if (def !== null) return judgeRegexExpr(def, need, ctx);
    return { kind: 'unknown', detail: `${idm[1]} 定义不可见` };
  }
  return { kind: 'unknown', detail: '属性访问/复杂表达式，静态不可证' };
}

/** 从 .exec( 的 prefix 提取接收端正则表达式文本；属性访问返回 null */
function extractExecReceiver(prefix) {
  const t = prefix.replace(/\s+$/, '');
  if (LITERAL_RE.test(t)) return t.match(LITERAL_RE)[1];
  const argStr = extractNewRegExpArgs(t);
  if (argStr !== null) return 'new RegExp(' + argStr + ')';
  const idm = t.match(/([A-Za-z_$][\w$]*)$/);
  if (idm && !t.slice(0, t.length - idm[1].length).endsWith('.')) return idm[1];
  return null;
}

/** 从 .matchAll( 调用提取第一个实参文本（正则在实参，不在接收端）；跨行返回 null */
function extractMatchAllArg(line, dotIdx) {
  const open = dotIdx + '.matchAll'.length; // '(' 的位置
  if (line[open] !== '(') return null;
  let depth = 0;
  let quote = null;
  for (let i = open; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) {
        const inner = line.slice(open + 1, i);
        const args = splitTopLevelArgs(inner);
        return args[0] || '';
      }
    }
  }
  return null;
}

/** 单文件扫描，返回违规数组 */
function lintFile(file) {
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch (e) { return []; }
  const defs = collectDefs(src);
  const ctx = {
    src,
    lookupDef(name, usageLine) {
      const list = defs.get(name);
      if (!list) return null;
      let best = null;
      for (const d of list) if (d.line <= usageLine && (!best || d.line > best.line)) best = d;
      return best ? best.rhs : null;
    },
    findForOfArray: (v, line) => findForOfArray(v, src, line),
    resolveArrayText: (a, line) => resolveArrayText(a, src, line),
    usageLine: 0,
  };
  const lines = src.split('\n');
  const violations = [];
  const rel = path.relative(ROOT, file).split(path.sep).join('/');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = i > 0 ? lines[i - 1] : '';
    const multiLineCond = /\b(?:while|for)\s*\(\s*$/.test(prev);
    ctx.usageLine = i + 1;

    // —— R1/R2：while/for 条件里的 .exec( ——
    let idx = 0;
    while ((idx = line.indexOf('.exec(', idx)) !== -1) {
      const prefix = line.slice(0, idx);
      const condBody = prefix.replace(/^\s*(?:while|for)\s*\(/, '');
      const inLoopCond = (/\b(?:while|for)\s*\(/.test(prefix) && !/[;{}]/.test(condBody)) || multiLineCond;
      if (inLoopCond) {
        const recv = extractExecReceiver(prefix);
        if (recv !== null) {
          const v = judgeRegexExpr(recv, 'gy', ctx);
          if (v.kind === 'bad') {
            violations.push({
              file: rel, line: i + 1, snippet: line.trim().slice(0, 160),
              rule: 'exec-loop-non-global',
              detail: 'while/for 条件中的 .exec 循环：' + v.detail + '；无 g/y 时 exec 每次返回同一匹配 → 死循环（r266 conjunction-fallacy 事故形态）',
            });
          }
        }
      }
      idx += '.exec('.length;
    }

    // —— R3：.matchAll( 实参非全局正则 ——
    idx = 0;
    while ((idx = line.indexOf('.matchAll(', idx)) !== -1) {
      const arg = extractMatchAllArg(line, idx);
      if (arg !== null && arg !== '') {
        const v = judgeRegexExpr(arg, 'g', ctx);
        if (v.kind === 'bad') {
          violations.push({
            file: rel, line: i + 1, snippet: line.trim().slice(0, 160),
            rule: 'matchall-non-global',
            detail: '.matchAll 实参正则非全局：' + v.detail + '；matchAll 要求全局，非全局直接抛 TypeError（r265 sycophancy-check 事故形态）',
          });
        }
      }
      idx += '.matchAll('.length;
    }
  }
  return violations;
}

// === MAIN ===
const files = [];
for (const t of targets) files.push(...collectJs(path.resolve(ROOT, t)));

const allViolations = [];
for (const f of files) allViolations.push(...lintFile(f));

if (allViolations.length === 0) {
  console.log(`0 violations（扫描 ${files.length} 个 .js 文件：${targets.join(', ')}）`);
  process.exit(0);
}
console.log(`${allViolations.length} violations（扫描 ${files.length} 个 .js 文件：${targets.join(', ')}）\n`);
for (const v of allViolations) {
  console.log(`${v.file}:${v.line}: [${v.rule}] ${v.snippet}`);
  console.log(`    ${v.detail}`);
}
process.exit(1);
