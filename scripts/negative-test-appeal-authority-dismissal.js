#!/usr/bin/env node
/**
 * 第 697 轮负例守卫：注入-删条-必须变红
 *
 * 被测对象：src/index.js 的 AUTHORITY_DISMISSAL 双腿判据（r697 新增）。
 * 变异形态（每条变异必须在 test/round-697-appeal-authority-dismissal.js 上真红）：
 *   M1 摘权威腿（authHit 恒 false）          → 攻击样本必须翻转漏判
 *   M2 摘反质疑/资格剥夺腿（disHit 恒 false） → 攻击样本必须翻转漏判
 *   M3 只跑中文腿（dismissalLangs 恒 zh）     → 英文攻击样本必须漏判
 *   M4 双腿 AND 退化为单腿（!authHit 不拦截） → 单腿良性必须被误伤
 *   M5 CEO 大小写敏感化（/CEO/i → /CEO）      → 归一化小写形态必须漏判（r697 踩坑专项锁）
 * 对照组（无变异）必须全绿。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'index.js');
const TEST = 'test/round-697-appeal-authority-dismissal.js';
const BACKUP = path.join(ROOT, 'src', '__r697_neg_backup.js');

const orig = fs.readFileSync(SRC, 'utf8');
fs.writeFileSync(BACKUP, orig);

const MUTATIONS = [
  {
    name: 'M1_drop_authority_leg',
    apply: (s) => s.replace(
      '    const authHit = fam.authority.find(re => re.test(text));',
      '    const authHit = false;'),
  },
  {
    name: 'M2_drop_dismissal_leg',
    apply: (s) => s.replace(
      '    const disHit = fam.dismiss.find(re => re.test(text));',
      '    const disHit = false;'),
  },
  {
    name: 'M3_zh_only',
    apply: (s) => s.replace(
      "  const dismissalLangs = hasChinese ? ['zh'] : ['en'];",
      "  const dismissalLangs = hasChinese ? ['zh'] : ['zh'];"),
  },
  {
    name: 'M4_and_to_single_leg',
    apply: (s) => s.replace(
      '    const authHit = fam.authority.find(re => re.test(text));\n    if (!authHit) continue;',
      '    const authHit = fam.authority.find(re => re.test(text));\n    if (false) continue;'),
  },
  {
    name: 'M5_ceo_case_sensitive',
    apply: (s) => s.replace('/CEO/i,', '/CEO/,'),
  },
];

let red = 0;
let invalid = 0;
let crashed = 0;
const results = [];

try {
  // 对照：无变异必须全绿
  const ctl = execFileSync('node', [TEST], { cwd: ROOT, encoding: 'utf8' });
  const ctlPass = /(\d+) 通过, (\d+) 失败/.exec(ctl);
  if (ctlPass && Number(ctlPass[2]) === 0) results.push('CTL: PASS');
  else results.push('CTL: FAIL(' + ctl.trim().slice(0, 160) + ')');

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
      else if (/AssertionError/.test(so) || /AssertionError/.test(String(e.stderr || ''))) { results.push(m.name + ': RED(assert)'); red++; }
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
