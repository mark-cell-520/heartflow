'use strict';
/**
 * scripts/negative-test-hg-quantifier-nounverb-r723.js
 * 第 723 轮（v6.8.151）负例脚本——证明 test/hg-quantifier-nounverb-r723.test.js
 * 真的在测本轮新增/修改的 Pattern（不是靠别的 Pattern 命中）。
 *
 * 方法（沿用 r721/r718 负例脚本的注入法）：
 *   把源码复制到临时目录，逐条删除/回退本轮改动对应的 Pattern 字面量，
 *   再跑探针——断言「本该命中的攻击样本 MISS」或「本该放行的误伤样本重新
 *   HIT」。任一注入没让对应样本翻转，即测试有假阳性，本脚本 exit 1。
 *
 * needle 一律用 extractRegex() 从 src/index.js 按锚点自取整条正则字面量，
 * 不手写转义（手写 \\s 会被 JS 字符串层吃掉，匹配不上——r718 踩过的坑）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = path.join(__dirname, '..');
const P = path.join(HF, 'src/index.js');
const src = fs.readFileSync(P, 'utf8');

// ── 常量 ────────────────────────────────────────────────────────────
const NEVER_MATCH = '/(?!x)x/i';
// 轮初修复后的「尾词非限定词」感知填充槽（v6.8.151）
const DET_SLOT = String.raw`((?:(?:\w+\s+){0,2}(?!(?:the|a|an|this|that|these|those|our|your|their|its|his|her|my|some|any|another|either|neither|such|which|what|no|every|each|all|both)\s)\w+\s+)?)`;
// 修复前的无约束填充槽（r229/r720 遗留形）
const PLAIN_SLOT = String.raw`((?:\w+\s+){0,3})`;

function extractRegex(s, anchor) {
  const i = s.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const start = s.lastIndexOf('/', i);
  const end = s.indexOf('/i', i);
  if (start < 0 || end < 0 || end <= start) throw new Error('正则边界解析失败: ' + anchor);
  return s.slice(start, end + 2);
}

// ── 九个注入（对应本轮九处改动）────────────────────────────────────
const INJECTIONS = [
  {
    id: 'inject-1-everyone-主判据删除',
    desc: '删除 everyone 主判据（含名动同形修复槽）→ 攻击样本应全部 MISS',
    needle: extractRegex(src, String.raw`refuses?|reads?`),
    replace: NEVER_MATCH,
    group: 'g-everyone-main', expect: 'hit',
  },
  {
    id: 'inject-2-nobody-主判据删除',
    desc: '删除 nobody/no one 主判据（含名动同形修复槽）→ 攻击样本应全部 MISS',
    needle: extractRegex(src, String.raw`reads?|wants?|hates?|ignores?`),
    replace: NEVER_MATCH,
    group: 'g-nobody-main', expect: 'hit',
  },
  {
    id: 'inject-3-all-族零贡献支删除',
    desc: '删除 all 族零贡献新支 → "All developers leave no comments." 应 MISS',
    needle: extractRegex(src, String.raw`\ball\s+(?:of\s+)?(?:the\s+)?(?:our\s+|their\s+|your\s+)?(?:users?|customers?|developers?|managers?|teams?|analysts?|attendees?|accountants?`),
    replace: NEVER_MATCH,
    group: 'g-all-zc', expect: 'hit',
  },
  {
    id: 'inject-4-everybody-零贡献支删除',
    desc: '删除 everybody 零贡献新支 → "Everybody leaves no comments." 应 MISS',
    needle: extractRegex(src, String.raw`\beverybody\s+((?:\w+\s+){0,3})(?:writes?`),
    replace: NEVER_MATCH,
    group: 'g-everybody-zc', expect: 'hit',
  },
  {
    id: 'inject-5-noone-零贡献支删除',
    desc: '删除 no one/nobody 零贡献（any|no）新支 → "No one leaves any comments." 应 MISS',
    needle: extractRegex(src, String.raw`(?:no\s+one|nobody)\s+((?:\w+\s+){0,3})(?:writes?|leaves?`),
    replace: NEVER_MATCH,
    group: 'g-nobody-zc', expect: 'hit',
  },
  {
    id: 'inject-6-贡献动词支删除',
    desc: '删除 no one/nobody 贡献动词新支 → "No one updates the docs." 应 MISS',
    needle: extractRegex(src, String.raw`(?:logs?|updates?|fixes?|answers?|tracks?|records?|maintains?|writes?)`),
    replace: NEVER_MATCH,
    group: 'g-contrib', expect: 'hit',
  },
  {
    id: 'inject-7-everyone-修复槽还原',
    desc: '把 everyone 族填充槽还原为无约束槽 → 名动同形误伤句应重新 HIT',
    needle: extractRegex(src, String.raw`refuses?|reads?`),
    replace: null, // 动态：needle.replace(DET_SLOT, PLAIN_SLOT)
    slotRevert: true,
    group: 'g-nv-everyone', expect: 'miss',
  },
  {
    id: 'inject-8-nobody-修复槽还原',
    desc: '把 nobody 族填充槽还原为无约束槽 → 名动同形误伤句应重新 HIT',
    needle: extractRegex(src, String.raw`reads?|wants?|hates?|ignores?`),
    replace: null,
    slotRevert: true,
    group: 'g-nv-nobody', expect: 'miss',
  },
  {
    id: 'inject-9-everyeach-零贡献捕获槽删除',
    desc: '删除 every/each 零贡献支捕获槽 → 副词填充攻击 "always leaves no comments" 应 MISS',
    needle: extractRegex(src, String.raw`readers?)\s+((?:\w+\s+){0,3})(?:writes?`),
    replace: null, // 动态：needle.replace(PLAIN_SLOT, '')
    slotDrop: true,
    group: 'g-eacheach-slot', expect: 'hit',
  },
];

// ── 探针样本（每组 = 一处注入的守卫哨兵）────────────────────────────
const EXPECT_HITS = [
  // g-everyone-main：只有 everyone 主判据能抓的攻击形
  ['g-everyone-main', 'everyone-audits', 'Everyone audits the expense reports.', 'hit'],
  ['g-everyone-main', 'everyone-ignores-warnings', 'Everyone ignores security warnings.', 'hit'],
  ['g-everyone-main', 'everyone-on-team-ignores', 'Everyone on the team ignores the docs.', 'hit'],
  // g-nobody-main：只有 nobody 主判据能抓的攻击形
  ['g-nobody-main', 'noone-verifies', 'No one verifies the results before publishing.', 'hit'],
  ['g-nobody-main', 'nobody-reviews', 'Nobody reviews the contract before signing.', 'hit'],
  ['g-nobody-main', 'nobody-on-team-questions', 'Nobody on the team questions the design.', 'hit'],
  // g-all-zc：只有 all 族零贡献新支能抓
  ['g-all-zc', 'all-leaves-no', 'All developers leave no comments.', 'hit'],
  ['g-all-zc', 'all-sends-no', 'All reviewers send no reply.', 'hit'],
  // g-everybody-zc：只有 everybody 新支能抓（everyone 判据不匹配 everybody）
  ['g-everybody-zc', 'everybody-leaves-no', 'Everybody leaves no comments.', 'hit'],
  // g-nobody-zc：只有 no one/nobody 零贡献（any|no）新支能抓
  ['g-nobody-zc', 'noone-leaves-any', 'No one leaves any comments.', 'hit'],
  ['g-nobody-zc', 'nobody-gives-any', 'Nobody gives any feedback.', 'hit'],
  // g-contrib：只有贡献动词新支能抓
  ['g-contrib', 'noone-updates', 'No one updates the docs.', 'hit'],
  ['g-contrib', 'nobody-logs', 'Nobody logs the errors.', 'hit'],
  // g-nv-everyone / g-nv-nobody：名动同形误伤句（当前必须放行；槽还原后应重新命中）
  ['g-nv-everyone', 'fp-audit-team', 'Everyone on the audit team must verify the findings.', 'miss'],
  ['g-nv-everyone', 'fp-test-group', 'Everyone in the test group must complete the survey.', 'miss'],
  ['g-nv-nobody', 'fp-review-team', 'Nobody on the review team reads the docs.', 'miss'],
  ['g-nv-nobody', 'fp-audit-team', 'No one on the audit team verified the results.', 'miss'],
  // g-eacheach-slot：every/each 零贡献支捕获槽（有槽才抓副词填充攻击）
  ['g-eacheach-slot', 'always-leaves-no', 'Every customer always leaves no comments.', 'hit'],
];

// ── 复制工程（只带必需文件，不带 node_modules）──────────────────────
const tmpRoot = path.join(HF, 'tmp-negtest-r723');
const copyRoot = path.join(tmpRoot, 'copy');
fs.rmSync(tmpRoot, { recursive: true, force: true });
fs.mkdirSync(copyRoot, { recursive: true });
for (const item of ['VERSION', 'package.json', 'src', 'formulas']) {
  const from = path.join(HF, item);
  if (fs.existsSync(from)) execFileSync('cp', ['-r', from, copyRoot]);
}
const PROBE = 'probe-r723.js';
fs.writeFileSync(path.join(copyRoot, PROBE), [
  "const { checkHastyGeneralization } = require('./src/index.js');",
  'const t = process.argv[2];',
  'try { const r = checkHastyGeneralization(t); console.log(JSON.stringify({ n: r.count })); }',
  'catch (e) { console.log(JSON.stringify({ err: String(e && e.message || e).slice(0, 200) })); }',
].join('\n'));

function runProbe(text) {
  const out = execFileSync(process.execPath, [PROBE, text], {
    cwd: copyRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  const j = JSON.parse(out.trim());
  return j.err ? 'ERR:' + j.err : j.n;
}

let ok = true;
const summary = [];

for (const inj of INJECTIONS) {
  let s = fs.readFileSync(P, 'utf8');
  let replace = inj.replace;
  if (inj.slotRevert) {
    if (!inj.needle.includes(DET_SLOT)) throw new Error(inj.id + ': needle 里找不到修复槽');
    replace = inj.needle.split(DET_SLOT).join(PLAIN_SLOT);
  }
  if (inj.slotDrop) {
    if (!inj.needle.includes(PLAIN_SLOT)) throw new Error(inj.id + ': needle 里找不到捕获槽');
    replace = inj.needle.split(PLAIN_SLOT).join('');
  }
  const before = s.split(inj.needle).length - 1;
  if (before !== 1) throw new Error(inj.id + ': needle 出现 ' + before + ' 次，期望 1');
  s = s.split(inj.needle).join(replace);
  fs.writeFileSync(path.join(copyRoot, 'src/index.js'), s);

  const samples = EXPECT_HITS.filter(x => x[0] === inj.group);
  const results = [];
  for (const [, , text, expect] of samples) {
    const n = runProbe(text);
    const hit = typeof n === 'number' ? n > 0 : false;
    // expect 'hit'：正常必须命中，注入后 MISS = 变红（哨兵有效）
    // expect 'miss'：正常必须不命中，注入后 HIT = 变红（哨兵有效）
    const red = expect === 'hit' ? !hit : hit; // 红=按预期翻转=哨兵有效
    if (!red) ok = false; // 黑=没翻转=该组哨兵失效，测试有假阳性
    results.push((red ? '红' : '黑') + ':' + text.slice(0, 40) + '=' + n);
  }
  summary.push(`${inj.id} → ${results.join(' | ')}`);
}

fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log(summary.join('\n'));
console.log(ok ? 'ALL-GREEN' : 'SOME-RED');
process.exit(ok ? 0 : 1);
