// scripts/negative-test-bulk-export-en-r381.js
// r381 负例守卫：删掉 bulk_export 英文支 → 英文侧耦合层必须全部退化。
// 参照 scripts/negative-test-multi-turn-sunk-cost-round93.js 的结构。
// 基线全绿 + 4 个还原点全部变红，否则本守卫无效。
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'src/multi-turn-tactics.js');
const LAD = path.join(ROOT, 'src/multi-turn-tactics.js');
const TMP = path.join(ROOT, 'src/.r381-neg-tmp.js');

const orig = fs.readFileSync(FILE, 'utf8');

// 还原点定义（只动 src/multi-turn-tactics.js 的 bulk_export re 行）
const EN_BRANCH = String.raw`\b(?:dump|pull|grab|fetch|retrieve|export|send|give|list|show|reveal|print|read|download|extract|forward)\b[^.\n]{0,28}\b(?:customer|user|employee|student|patient|subscriber|account)s?\s+(?:list|lists|table|tables|records?|data|numbers?|details?|addresses?)\b`;
// 删除时必须连同前导 | 一起删：只删分支体会在 re 末尾留下孤立 `|`，
// JS 把它解析成空分支（匹配空串）→ bulk_export 恒命中 → 探测端反而
// 显示 25/25 qualifies 但 softNonPass=15/15。这是「还原点制造恒真判据」
// 的坑（r381 probe-9 实测），故每个还原点都以 `|<branch>` 为单位删。
const EN_BRANCH_LEADING = String.raw`|\b(?:dump|pull|grab|fetch|retrieve|export|send|give|list|show|reveal|print|read|download|extract|forward)\b[^.\n]{0,28}\b(?:customer|user|employee|student|patient|subscriber|account)s?\s+(?:list|lists|table|tables|records?|data|numbers?|details?|addresses?)\b`;
const RESTORES = [
  {
    name: '删 bulk_export 英文支（连同前导 |）',
    apply: () => orig.replace(EN_BRANCH_LEADING, ''),
  },
  {
    name: '删掉 | 与英文支后 re 无英文形态',
    apply: () => orig.split(EN_BRANCH_LEADING).join(''),
  },
  {
    name: '英文支索取动词词表清空',
    apply: () => orig.replace(
      /\\b\(\?:dump\|pull\|grab\|fetch\|retrieve\|export\|send\|give\|list\|show\|reveal\|print\|read\|download\|extract\|forward\)\\b/,
      '\\b(?:__NEVER__)\\b'),
  },
  {
    name: '英文支 PII 集合名词词表清空',
    apply: () => orig.replace(
      /\\b\(\?:customer\|user\|employee\|student\|patient\|subscriber\|account\)s\?\\s\+\(\?:list\|lists\|table\|tables\|records\?\|data\|numbers\?\|details\?\|addresses\?\)\\b/,
      '\\b(?:__NEVER__)\\b'),
  },
];

function runProbe() {
  const out = execFileSync(process.execPath, [path.join(__dirname, 'round-381/probe-7-negcheck.js')], {
    cwd: ROOT, encoding: 'utf8',
  });
  return JSON.parse(out.trim().split('\n').pop());
}

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.error(`  ❌ ${name}: ${detail}`); }
}

console.log('═══ r381 负例守卫：bulk_export 英文支（还原点 = 必须变红）═══\n');

// 基线
const base = runProbe();
console.log(`基线: comboQualifies=${base.comboQualifies}/${base.comboTotal} gateNonPass=${base.gateNonPass} softNonPass=${base.softNonPass} benignNonPass=${base.benignNonPass}`);
check('基线: 英文组合 qualifies 全覆盖', base.comboQualifies === base.comboTotal && base.comboTotal > 0,
  `${base.comboQualifies}/${base.comboTotal}`);
check('基线: 软宾语不误伤', base.softNonPass === 0, `softNonPass=${base.softNonPass}`);

try {
  for (const r of RESTORES) {
    fs.writeFileSync(TMP, r.apply());
    // 直接替换目标文件
    fs.copyFileSync(FILE, LAD + '.bak381');
    fs.writeFileSync(LAD, r.apply());
    const res = runProbe();
    fs.copyFileSync(LAD + '.bak381', LAD);
    fs.unlinkSync(LAD + '.bak381');
    // 退化 = 命中/门禁下降，或软宾语误伤上升（恒真还原点也必须被抓到）
    const degraded = res.comboQualifies < base.comboQualifies
      || res.gateNonPass < base.gateNonPass
      || res.softNonPass > base.softNonPass;
    check(`还原: ${r.name}`, degraded,
      `comboQualifies=${res.comboQualifies} gateNonPass=${res.gateNonPass} softNonPass=${res.softNonPass}（未退化，守卫无效）`);
  }
} finally {
  fs.writeFileSync(LAD, orig);
  try { fs.unlinkSync(TMP); } catch (_) {}
}

// 收尾：确认文件已还原
const restored = fs.readFileSync(FILE, 'utf8');
check('文件已还原为原样', restored === orig, '文件内容与改前不一致');

console.log(`\n═══ 结果：${pass} passed, ${fail} failed ═══`);
if (fail > 0) process.exit(1);
