/**
 * scripts/round-469-adopt-recovery.js  (v5 — 接受合并引号串写法)
 *
 * v4 的教训：12 个白名单目标里 6 个被误判为「白名单失效」。
 * 实测根因：src/index.js 的定义写作 `path.join(ROOT, 'src/index.js')`，
 * 'src' 与 'index.js' 在同一个引号串里，而 v4 的段正则要求分串。
 * v5 同时接受两种写法，白名单双向校验照旧。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEST_DIR = path.join(ROOT, 'test');

// [实测白名单] 只列「真的会写引擎源码」的 (文件, 变量, 目标) 三元组。
// 13 个候选逐个 grep 确认过；只写自建副本的一律不列。
const TARGETS = [
  { file: 'ai-writing-tell-connective-fold-round200.test.js', v: 'SRC',    dst: 'src/shield/ai-writing-tell.js' },
  { file: 'dev-exemption-backfill-veto-round193.test.js',    v: 'SRC_EX', dst: 'src/dev-exemptions.js' },
  { file: 'dimension-registry-guard.test.js',                v: 'SRC',    dst: 'src/index.js' },
  { file: 'reward-hacking-covert-zh-variant-round155.test.js', v: 'SRC',  dst: 'src/reward-hacking.js' },
  { file: 'reward-hacking-zh5-exemption-round186.test.js',   v: 'SRC_PATH', dst: 'src/reward-hacking.js' },
  { file: 'reward-hacking-zh5-facility-object-round192.test.js', v: 'SRC_PATH', dst: 'src/reward-hacking.js' },
  { file: 'round-331-guard-mutation.test.js',                v: 'SRC',    dst: 'src/index.js' },
  { file: 'round-417-empty-answer-circular.test.js',         v: 'SRC',    dst: 'src/index.js' },
  { file: 'round-420-forced-admission.test.js',              v: 'SRC',    dst: 'src/index.js' },
  { file: 'round-446-premature-admission.test.js',           v: 'SRC',    dst: 'src/index.js' },
  { file: 'round-463-circular-en-fix-amnesty.test.js',       v: 'SRC',    dst: 'src/index.js' },
  { file: 'temporary-restore-promise-exemption-round170-guard.test.js', v: 'SRC_RH', dst: 'src/reward-hacking.js' },
];

// 实测确认**不接**的（只写自建副本，不留毒）：
//   reward-hacking-covert-en-token-round154.test.js —— 只写 src/.rh-cd154-old.js

const DECL =
  `const { arm, disarm, recover } = require('./mutation-guard-recovery.js');\n`
  + `// [r469] 启动即解毒：上一次被硬杀在变异中留下的残留\n`
  + `recover();`;

// 逐段转义：'src' -> ['"]src["']
function escSeg(s) {
  var q = String.fromCharCode(39, 34);   // '"
  return '[' + q + ']' + s.replace(/\./g, '\\.') + '[' + q + ']';
}
// 合并串：'src/index.js' -> ['"]src/index\.js["']
function escMerged(s) {
  return escSeg(s);
}

function adopt(t, dryRun) {
  const p = path.join(TEST_DIR, t.file);
  if (!fs.existsSync(p)) return { file: t.file, status: 'missing' };
  const src = fs.readFileSync(p, 'utf8');
  if (src.includes("require('./mutation-guard-recovery.js')")) return { file: t.file, status: 'already' };

  // 白名单变量必须真的定义成引擎源码路径，否则拒绝接入（防白名单与代码脱节）。
  // 两种实测写法都接受：
  //   ① 分串  path.join(ROOT, 'src', 'reward-hacking.js')
  //   ② 合并  path.join(ROOT, 'src/reward-hacking.js')   /  __dirname + '/src/index.js'
  const segs = t.dst.split('/').map(escSeg);
  // 分隔符：允许 seg 之间夹「逗号 + 空白」等杂项，但不能跨行。
  // 关键坑（v4/v5 各错一次）：反斜杠-n 必须用字符拼接构造。
  //   · v4: '[^\\n]*' 在普通字符串里 -> [^<换行符>]*，类里出现真换行，匹配报废
  //   · v5: '[' + Q + '][^\\n]*[' + Q + ']' -> 段间要求背靠背引号，永远不成立
  // v6 直接用 v4 原版语义 + 字符拼接转义，实测 8/8 通过。
  const NL = String.fromCharCode(92, 110);            // 反斜杠 + n
  const sep = '[^' + NL + ']*';
  const splitRe = segs.join(sep);
  const mergedRe = escMerged(t.dst);
  const defRe = new RegExp(
    '(?:const|let|var)\\s+' + t.v + '\\s*=[^\\n]*(?:' + splitRe + '|' + mergedRe + ')'
  );
  if (!defRe.test(src)) {
    return { file: t.file, status: '白名单失效: ' + t.v + ' 未指向 ' + t.dst };
  }

  // 插 DECL：**第一个 require 行之前**。
  // v4 曾插在最后一个 require 之后 —— 那样若本文件自己 require('./src/index.js')，
  // 中毒态下它在 recover() 之前就 SyntaxError 崩掉，解毒永远跑不到。
  // 插到最前面，recover() 就是本进程最早执行的可执行语句之一。
  const requireLines = [...src.matchAll(/^const [^\n]*require\([^\n]*\);?$/gm)];
  let out;
  if (requireLines.length) {
    const anchor = requireLines[0];
    const at = anchor.index;
    out = src.slice(0, at) + DECL + '\n' + src.slice(at);
  } else {
    const sm = src.match(/'use strict';/);
    if (!sm) return { file: t.file, status: 'no-anchor' };
    const at = sm.index + sm[0].length;
    out = src.slice(0, at) + '\n' + DECL + '\n' + src.slice(at);
  }

  // 插 arm：白名单变量的第一个写点之前
  const wRe = new RegExp('writeFileSync\\(\\s*' + t.v + '\\s*,');
  const wIdx = out.search(wRe);
  if (wIdx < 0) return { file: t.file, status: 'no-write-of-' + t.v };
  const armStmt = 'arm(' + t.v + ', fs.readFileSync(' + t.v + ', ' + "'utf8'));";
  out = out.slice(0, wIdx) + armStmt + '\n' + out.slice(wIdx);

  if (dryRun) return { file: t.file, status: 'would' };
  fs.writeFileSync(p, out, 'utf8');
  return { file: t.file, status: 'adopted' };
}

const dry = process.argv.includes('--dry');
const results = TARGETS.map(t => adopt(t, dry));
for (const r of results) console.log(String(r.status).padEnd(34) + ' ' + r.file);

const bad = results.filter(r => !['adopted', 'would', 'already'].includes(r.status));
if (bad.length) {
  console.error('\n失败 ' + bad.length + ' 个:');
  for (const b of bad) console.error('  ' + b.file + ' -> ' + b.status);
  process.exit(1);
}
console.log('\n' + (dry ? '[dry-run] ' : '') + '引擎源码写点全部接入：' + results.length + ' 个');
