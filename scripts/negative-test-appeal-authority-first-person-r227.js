#!/usr/bin/env node
/**
 * 第 227 轮负例守卫：注入-删条-必须变红
 *
 * 变体形态（不用「对象里插第二个同名键」——那是无效变异，JS 取最后一个键：
 *   1. 循环入口 splice 掉目标半（判据真的不进判定流程）
 *   2. 把 obey + dismiss 半边置空数组
 *   3. 把 identity 半边置空数组
 *   4. 删 RECORD_CONTEXT 豁免（良性侧应变红）
 *   5. 把 lang 三选一改成只跑 zh（en 攻击样本应变红）
 *   6. 把三半 AND 改成「只 identity 就记 signal」（良性单半样本应变红）
 * 每条变异必须在指定测试上真红；对照组（无变异）必须全绿。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'index.js');
const TEST = 'test/appeal-authority-first-person-r227.test.js';
const BACKUP = path.join(ROOT, 'src', '__r227_neg_backup.js');

const orig = fs.readFileSync(SRC, 'utf8');
fs.writeFileSync(BACKUP, orig);

const MUTATIONS = [
  {
    name: 'M1_splice_obey_dismiss_en',
    apply: s => s.replace(
      /    const halves = AUTHORITY_FIRST_PERSON\[lang\];\n    if \(!halves\) continue;\n    if \(lang === 'en' && RECORD_CONTEXT\.test\(text\)\) continue;\n    const identityHit = halves\.identity\.some\(re => re\.test\(text\)\);\n    if \(!identityHit\) continue;\n    const obeyHit = halves\.obey\.find\(re => re\.test\(text\)\);\n    const dismissHit = halves\.dismiss\.find\(re => re\.test\(text\)\);\n    if \(obeyHit \|\| dismissHit\) \{/,
      "    const halves = AUTHORITY_FIRST_PERSON[lang];\n    if (!halves) continue;\n    if (lang === 'en' && RECORD_CONTEXT.test(text)) continue;\n    const identityHit = halves.identity.some(re => re.test(text));\n    if (!identityHit) continue;\n    const obeyHit = false;\n    const dismissHit = false;\n    if (obeyHit || dismissHit) {"
    ),
    expect: 'red',
  },
  {
    name: 'M2_empty_identity',
    apply: s => s.replace(
      '    const identityHit = halves.identity.some(re => re.test(text));',
      '    const identityHit = false;'
    ),
    expect: 'red',
  },
  {
    name: 'M3_zh_only',
    apply: s => s.replace(
      "  const fpLangs = hasChinese ? ['zh'] : ['en'];",
      "  const fpLangs = hasChinese ? ['zh'] : [];"
    ),
    expect: 'red',
  },
  {
    name: 'M4_always_record_context_exempt',
    apply: s => s.replace(
      "    if (lang === 'en' && RECORD_CONTEXT.test(text)) continue;",
      "    if (true) continue;"
    ),
    expect: 'red',
  },
  {
    name: 'M5_identity_only_no_and',
    apply: s => s.replace(
      "    if (!identityHit) continue;\n    const obeyHit = halves.obey.find(re => re.test(text));\n    const dismissHit = halves.dismiss.find(re => re.test(text));\n    if (obeyHit || dismissHit) {",
      "    const obeyHit = true;\n    const dismissHit = true;\n    if (!identityHit) continue;\n    if (obeyHit || dismissHit) {"
    ),
    expect: 'red',
  },
];

let red = 0, invalid = 0, crashed = 0;
const results = [];

try {
  // 对照：无变异必须全绿
  const ctl = execFileSync('node', [TEST], { cwd: ROOT, encoding: 'utf8' });
  const ctlPass = /(\d+) 通过, (\d+) 失败/.exec(ctl);
  if (ctlPass && Number(ctlPass[2]) === 0) results.push('CTL: PASS');
  else results.push('CTL: FAIL(' + ctl.trim().slice(0, 120) + ')');

  for (const m of MUTATIONS) {
    const mutated = m.apply(orig);
    if (mutated === orig) { results.push(m.name + ': INVALID(no-op)'); invalid++; continue; }
    fs.writeFileSync(SRC, mutated);
    try {
      const out = execFileSync('node', [TEST], { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      const mm = /(\d+) 通过, (\d+) 失败/.exec(out);
      const fails = mm ? Number(mm[2]) : -1;
      if (fails > 0) { results.push(m.name + ': RED(' + fails + ')'); red++; }
      else results.push(m.name + ': INVALID(still green)');
      if (fails < 0) invalid++;
    } catch (e) {
      const so = String(e.stdout || '');
      const mm = /(\d+) 通过, (\d+) 失败/.exec(so);
      if (mm && Number(mm[2]) > 0) { results.push(m.name + ': RED(' + mm[2] + ')'); red++; }
      else if (/AssertionError|FAIL/.test(so) || /AssertionError/.test(String(e.stderr || ''))) { results.push(m.name + ': RED(assert)'); red++; }
      else { results.push(m.name + ': CRASHED(' + String(e.stderr || '').slice(0, 80) + ')'); crashed++; }
    } finally {
      fs.writeFileSync(SRC, orig);
    }
  }
} finally {
  fs.writeFileSync(SRC, orig);
  fs.unlinkSync(BACKUP);
}

console.log(results.join('\n'));
console.log('SUMMARY mutations=' + MUTATIONS.length + ' red=' + red + ' invalid=' + invalid + ' crashed=' + crashed);
process.exit(red === MUTATIONS.length && invalid === 0 && crashed === 0 ? 0 : 1);
