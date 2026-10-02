#!/usr/bin/env node
/**
 * r410 负例守卫：checkTests 异常退出路径不许出现「零用例空壳绿」
 *
 * 打的是 r410 修的 guard-abilities 缺陷：catch 分支只判 failed===0，
 * 缺 try 分支有的 passed>0 保护。run-all 异常退出时 stdout 若截到
 * "0 通过, 0 失败" 形态，一条零用例检查项会被判成 OK。
 *
 * 手法：不跑 400 秒的 run-all。直接抽取 guard-abilities.js 里
 * checkTests 的两条判据（try / catch），用同一组输入喂两侧，
 * 要求判据**逐条对称**。任何只在一边成立的保护都算缺陷。
 *
 * 退出前自证 guard-abilities.js 未留残留。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GA = path.join(ROOT, 'scripts/guard-abilities.js');
const original = fs.readFileSync(GA, 'utf8');

const RED = '\x1b[31m', GREEN = '\x1b[32m', RESET = '\x1b[0m';

/** 从源码抽取 checkTests 内 try 块和 catch 块的 ok 表达式（括号配平定函数体） */
function extractVerdicts(src) {
  const fnAt = src.indexOf('function checkTests()');
  const braceAt = src.indexOf('{', fnAt);
  let depth = 0, end = braceAt;
  for (let i = braceAt; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  const body = src.slice(fnAt, end);
  const tryIdx = body.indexOf('try {');
  const catchIdx = body.lastIndexOf('} catch (e) {');
  const tryBody = body.slice(tryIdx, catchIdx);
  const catchBody = body.slice(catchIdx);
  // 锚定到 name:'全量测试' 后的那个 ok:。
  // 注意：try 和 catch 块里各有两个 全量测试 resolve —— 另两个是
  // 失败路径（ok: false）。真正的判定表达式是那个非 false 的。
  const grabOk = s => {
    const all = [...s.matchAll(/name:\s*'全量测试',\s*ok:\s*([^,\n]+)/g)].map(x => x[1].trim());
    const real = all.find(x => x !== 'false' && x !== 'true');
    return real || (all.length ? all[all.length - 1] : null);
  };
  const tryOk = grabOk(tryBody);
  const catchOk = grabOk(catchBody);
  return { tryOk, catchOk };
}

const CASES = [
  { label: '正常全绿', line: '17349 通过, 0 失败, 共 17349 个', want: true },
  { label: '真失败', line: '17346 通过, 3 失败, 共 17349 个', want: false },
  { label: '空壳 0/0（中文）', line: '0 通过, 0 失败, 共 0 个', want: false },
  { label: '空壳 0/0（英文）', line: '0 passed, 0 failed', want: false },
];

function evalExpr(expr, passed, failed) {
  // 只支持形如 `failed === 0 && passed > 0` / `failed === 0` 的两种形态
  const norm = expr.replace(/\s+/g, '');
  if (norm === 'failed===0&&passed>0') return failed === 0 && passed > 0;
  if (norm === 'failed===0') return failed === 0;
  throw new Error('未知判据形态: ' + expr);
}

const { tryOk, catchOk } = extractVerdicts(original);
console.log(`[抽取] try 分支判据: ${tryOk}`);
console.log(`[抽取] catch 分支判据: ${catchOk}\n`);

const results = [];
for (const c of CASES) {
  const m = c.line.match(/(\d+)\s*通过[,\s]+(\d+)\s*失败[,\s]+(?:共\s*)?(\d+)\s*个/)
    || c.line.match(/(\d+)\s*passed[,\s]+(\d+)\s*failed/);
  const passed = parseInt(m[1], 10), failed = parseInt(m[2], 10);
  let t, g;
  try { t = evalExpr(tryOk, passed, failed); } catch (e) { t = 'ERR'; }
  try { g = evalExpr(catchOk, passed, failed); } catch (e) { g = 'ERR'; }
  const symmetric = t === g;
  const correct = t === c.want;
  results.push({
    key: c.label, ok: symmetric && correct,
    note: `try=${t} catch=${g} 期望=${c.want}`,
  });
}

console.log('══ checkTests 判据对称性负例（r410）══');
let pass = 0;
for (const r of results) { console.log(`  ${r.ok ? GREEN + 'OK' : RED + 'NG'} ${RESET} ${r.key} :: ${r.note}`); if (r.ok) pass++; }

// 消失测试：把 catch 判据改回旧形态，负例必须 NG（证明它真在守卫）
{
  const regressed = original.replace(/ok:\s*failed === 0 && passed > 0, detail: `\$\{passed\} 通过, \$\{failed\} 失败（异常退出路径）`/,
    "ok: failed === 0, detail: 'regressed'");
  const v2 = extractVerdicts(regressed);
  const emptyShell = evalExpr(v2.catchOk, 0, 0);
  const catchesIt = emptyShell !== false;
  if (catchesIt) { console.log(`  ${GREEN}OK${RESET} 消失测试 :: 回退到旧判据后负例能抓到`); pass++; }
  else { console.log(`  ${RED}NG${RESET} 消失测试 :: 回退后仍抓不到`); }
}

const clean = fs.readFileSync(GA, 'utf8') === original;
if (clean) { console.log(`  ${GREEN}OK${RESET} 还原自证 :: guard-abilities.js 无残留`); pass++; }
else { console.log(`  ${RED}NG${RESET} 还原自证 :: 文件被改动`); }

const total = results.length + 2;
// [r411] 汇总行必须是 run-all.js 能解析的 harness 标准格式
// 「N 通过, M 失败，共 N 个」。r410 版写的是 `结果: 6/6 符合预期`——
// 分数式不被 run-all 第 121-135 行的三种正则识别（分数式只认 `N/M passed`），
// 导致单跑 exit=0 而全量被判「未输出汇总行」，进 run-all 立刻失败。
const totalChecks = results.length + 2;
console.log(`\n结果: ${pass} 通过, ${totalChecks - pass} 失败, 共 ${totalChecks} 个`);
console.log(`${pass === totalChecks ? GREEN : RED}${pass}/${totalChecks} 符合预期${RESET}`);
process.exit(pass === totalChecks ? 0 : 1);
