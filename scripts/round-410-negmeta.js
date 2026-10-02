#!/usr/bin/env node
/**
 * r410 元校验：负例脚本必须是真负例（注入-删条必须变红）
 *
 * 手法：把被测文件 test/doc-numbers-accuracy.test.js 的「自锁告警」和
 * 「total 比对」两条守卫各删一次，负例脚本必须从 6/6 变成有 FAIL。
 * 若删了守卫负例仍全绿 → 负例是装饰品，等于没测。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TEST = path.join(ROOT, 'test/doc-numbers-accuracy.test.js');
const NEG = path.join(ROOT, 'scripts/negative-test-doc-numbers-round410.js');

const orig = fs.readFileSync(TEST, 'utf8');

function runNeg() {
  const r = cp.spawnSync('node', [NEG], { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const line = (out.match(/结果: \d+\/\d+ 符合预期/) || ['<none>'])[0];
  const ng = (out.match(/NG [^\n]*/g) || []).slice(0, 3).join(' ; ');
  return { rc: r.status, line, ng };
}

const DELETIONS = [
  {
    key: 'D1-删自锁告警',
    from: /\s*if \(M\.testFailed > 0\) \{[\s\S]*?\n\s*\}\n/,
    mustBreak: ['N1-selflock-must-warn'],
  },
  {
    key: 'D2-删 total strictEqual',
    // 用行号定位而非正则：源码里的 .replace(/,/g, '') 含 / 字符，
    // 正则字面量转义极易写错（r410 实测已错过一次）。按特征行整行删。
    fromLine: /^\s*assert\.strictEqual\(parseInt\(mm\[1\]\.replace\(/m,
    deleteUntil: /实测共 \$\{total\} 个用例`\);\s*$/m,
    mustBreak: ['N2-doc-drift-must-still-red', 'N4-negative-failed-must-not-pass'],
  },
  {
    key: 'D3-删无缓存抛错',
    from: /\s*throw new Error\(`\$\{label\} 规格表 Test suite = \$\{rows\['Test suite'\]\}[^\n]*\n/,
    mustBreak: ['N3-no-cache-must-throw'],
  },
];

const results = [];
const deleteLines = (src, fromRe, untilRe) => {
  const lines = src.split('\n');
  const start = lines.findIndex(l => fromRe.test(l));
  if (start < 0) return null;
  let end = start;
  while (end < lines.length && !untilRe.test(lines[end])) end++;
  return lines.slice(0, start).concat(lines.slice(end + 1)).join('\n');
};

try {
  for (const d of DELETIONS) {
    fs.writeFileSync(TEST, orig);
    let after;
    if (d.deleteUntil) {
      after = deleteLines(orig, d.fromLine, d.deleteUntil);
    } else {
      const cur = fs.readFileSync(TEST, 'utf8');
      const hit = cur.match(d.from);
      if (!hit) { results.push({ key: d.key, ok: false, note: '锚点未匹配（删除模式写错，元校验无效）' }); continue; }
      after = cur.replace(d.from, '\n');
    }
    if (after === null) { results.push({ key: d.key, ok: false, note: '起止锚点未匹配（删除区间写错）' }); continue; }
    fs.writeFileSync(TEST, after);
    const r = runNeg();
    const brokeAny = r.rc !== 0;
    results.push({ key: d.key, ok: brokeAny, note: brokeAny ? `负例变红 (${r.line}) ${r.ng}` : `删了守卫负例仍全绿 ${r.line} (负例是装饰品)` });
  }
} finally {
  fs.writeFileSync(TEST, orig);
}

console.log('\n══ 负例有效性元校验（r410）══');
let pass = 0;
for (const r of results) { console.log(`  ${r.ok ? 'OK' : 'NG'} ${r.key} :: ${r.note}`); if (r.ok) pass++; }
const total = results.length + 1;
const restored = fs.readFileSync(TEST, 'utf8') === orig;
if (restored) { console.log('  OK 还原自证 :: 被测文件已还原'); pass++; } else { console.log('  NG 还原自证 :: 文件未还原'); }
console.log(`\n${pass === total ? 'PASS' : 'FAIL'}: ${pass}/${total}`);
process.exit(pass === total ? 0 : 1);
