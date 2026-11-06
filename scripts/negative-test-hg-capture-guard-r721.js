'use strict';
/**
 * negative-test-hg-capture-guard-r721.js — 负例验证（v6.8.150 第 721 轮）
 *
 * 验证 test/hg-capture-guard-zero-contrib-r721.test.js 真的在守门：
 * 把 src/index.js + src/quantifier-guards.js 本轮新增/修改的七处逐组删掉，
 * 守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * 注入组（needle 是**源码里逐字出现**的字符串，含单层反斜杠）：
 *   ① every/each 族捕获槽删除 → 规范句 4 条重新命中（守卫接入失效）
 *   ② these/those 宾语槽删除 → every/each 族 these/those 攻击 4 条 MISS
 *   ③ 群体词六族删除（四处 replace_all）→ 12 条 MISS
 *   ④ writes-no 支谓词扩展还原 writes 单形（两族）→ 10 条 MISS
 *   ⑤ everyone 族 writes-no 新支整条删除 → 3 条 MISS
 *   ⑥ expected 负向断言删除（三处）→ 被动义务句 3 条重新命中
 *   ⑦ 守卫 be+义务分词表扩充删除 → 被动+攻击动词句 2 条重新命中
 *
 * 沿用 r720 纪律：needle 是普通字符串（RegExp 字面量 \s 编译陷阱）；
 * 副本必须带 VERSION（gate.js 读它）+ formulas/（懒加载 ENOENT 噪音）；
 * 注入必须真的改变源码（对照副本 allowNoChange）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = path.join(__dirname, '..'); // 仓库根

// 探针样本：[组, 标签, 文本, 期望]。'hit' = 攻击必须命中；'miss' = 规范句
// 必须豁免（注入后重新命中 = 守卫失效 = 变红）
const EXPECT_HITS = [
  // ① every/each 族捕获槽（副词填充攻击形依赖捕获槽命中）
  ['g-fill', 'always', 'Every customer always ignores the docs.', 'hit'],
  ['g-fill', 'usually', 'Each reviewer usually ignores the noise.', 'hit'],
  ['g-fill', 'ever', 'Every developer ever ignores the warnings.', 'hit'],
  ['g-fill', 'really', 'Every manager really ignores the feedback.', 'hit'],
  ['g-fill', 'inthisteam', 'Every analyst in this team ignores the reports.', 'hit'],
  // ② these/those 宾语槽
  ['g-these', 'every-these', 'Every customer ignores these warnings.', 'hit'],
  ['g-these', 'every-those', 'Every manager ignores those complaints.', 'hit'],
  ['g-these', 'each-these', 'Each reviewer ignores these issues.', 'hit'],
  ['g-these', 'all-these', 'All users ignore these warnings.', 'hit'],
  // ③ 群体词六族 × every/each/all
  ['g-group', 'every-accountant', 'Every accountant ignores the notice.', 'hit'],
  ['g-group', 'every-vendor', 'Every vendor ignores the contract.', 'hit'],
  ['g-group', 'every-supplier', 'Every supplier ignores the deadline.', 'hit'],
  ['g-group', 'every-contractor', 'Every contractor ignores the spec.', 'hit'],
  ['g-group', 'every-consultant', 'Every consultant ignores the brief.', 'hit'],
  ['g-group', 'every-auditor', 'Every auditor ignores the finding.', 'hit'],
  ['g-group', 'each-accountant', 'Each accountant ignores the notice.', 'hit'],
  ['g-group', 'all-accountant', 'All accountants ignore the notice.', 'hit'],
  ['g-group', 'all-vendor', 'All vendors ignore the contract.', 'hit'],
  ['g-group', 'all-auditor', 'All auditors ignore the finding.', 'hit'],
  ['g-group', 'ofour-auditor', 'All of our auditors ignore the finding.', 'hit'],
  ['g-group', 'their-supplier', 'All their suppliers ignore the deadline.', 'hit'],
  ['g-group', 'auditor-writesno', 'Every auditor writes no findings.', 'hit'],
  ['g-group', 'vendor-writesno', 'Every vendor leaves no documentation.', 'hit'],
  // ④ writes-no 支谓词扩展（every/each 族九形中 writes 以外八形）
  ['g-wn-verb', 'leaves', 'Every developer leaves no comments on the PR.', 'hit'],
  ['g-wn-verb', 'sends', 'Every reviewer sends no reply.', 'hit'],
  ['g-wn-verb', 'gives', 'Every customer gives no feedback.', 'hit'],
  ['g-wn-verb', 'provides', 'Every vendor provides no documentation.', 'hit'],
  ['g-wn-verb', 'posts', 'Every user posts no complaints.', 'hit'],
  ['g-wn-verb', 'responds', 'Every attendee responds without feedback.', 'hit'],
  ['g-wn-verb', 'offers', 'Every volunteer offers no explanation.', 'hit'],
  ['g-wn-verb', 'each-leaves', 'Each developer leaves no comments.', 'hit'],
  // writes 本体存量形（注入④后仍须命中——还原只删扩展不伤存量，
  // 不变红是设计正确）；responds 样本走 every/each 主判据存量路径
  // （主判据谓词表含 responds?|replies，非 writes-no 支），同样不变红
  ['g-wn-verb', 'writes-存量', 'Every developer writes no comments.', 'hit'],
  // ⑤ everyone 族 writes-no 新支
  ['g-wn-everyone', 'leaves', 'Everyone leaves no comments.', 'hit'],
  ['g-wn-everyone', 'sends', 'Everyone sends no reply.', 'hit'],
  ['g-wn-everyone', 'gives', 'Everyone gives no feedback.', 'hit'],
  // ⑥ expected 负向断言（被动义务句豁免）
  ['g-expected', 'everyone', 'Everyone is expected to comply.', 'miss'],
  ['g-expected', 'noone', 'No one is expected to sign in.', 'miss'],
  ['g-expected', 'every', 'Every user is expected to comply.', 'miss'],
  // ⑦ 守卫 be+义务分词表（被动式 + 攻击动词经守卫豁免）
  ['g-guard', 'expected-ignore', 'Everyone is expected to ignore the docs.', 'miss'],
  ['g-guard', 'required-ignore', 'Everyone is required to ignore the warnings.', 'miss'],
];

// 永不匹配的合法正则（替换用）
const NEVER_MATCH = '/^$(?!)/';

// ⚠️ needle 必须是普通字符串：写成 RegExp 字面量时 `\s` 会编译成「匹配
//    空白字符」，而源码里是「反斜杠+s 两个字符」，整条匹配不上 → 假阴性。
const INJECTIONS = [
  {
    name: '注入① every/each 族捕获槽删除（副词填充攻击形 MISS）',
    group: 'g-fill',
    // 唯一定位：everyone 族填充槽后接 reads?，nobody 族后接 reads?|wants?，
    // 仅 every/each 族是 `((?:\w+\s+){0,3})(?:ignores?|refuses?|refused|hates?`
    // 删后 always/usually/ever/really 填充形整句不匹配 → MISS 变红。
    // （规范句 must/can/should 不变红是预期：情态不在谓词表，删不删都赦。）
    needle: '\\s+((?:\\w+\\s+){0,3})(?:ignores?|refuses?|refused|hates?',
    replace: '\\s+(?:ignores?|refuses?|refused|hates?',
  },
  {
    name: '注入② these/those 宾语槽删除（every/each 族）',
    group: 'g-these',
    needle: '(?:this\\b|that\\b|these\\b|those\\b|about\\b|me\\b|us\\b|them\\b|him\\b|her\\b|you\\b|without\\b|the\\b|\\.\\s*$|a\\b|an\\b|to\\s+(?:pay|support|help|fix|replace|upgrade|renew|wait|talk|share|review|test|deploy|switch|move|change|read|sign|answer|reply|comply|listen|trust|believe|join|leave|stay|go|do|use|try|buy|cancel|opt|agree|accept))',
    replace: '(?:this\\b|that\\b|about\\b|me\\b|us\\b|them\\b|him\\b|her\\b|you\\b|without\\b|the\\b|\\.\\s*$|a\\b|an\\b|to\\s+(?:pay|support|help|fix|replace|upgrade|renew|wait|talk|share|review|test|deploy|switch|move|change|read|sign|answer|reply|comply|listen|trust|believe|join|leave|stay|go|do|use|try|buy|cancel|opt|agree|accept))',
  },
  {
    name: '注入③ 群体词六族删除（四处群体表 replace_all 还原）',
    group: 'g-group',
    needle: 'attendees?|accountants?|vendors?|suppliers?|contractors?|consultants?|auditors?|operators?|volunteers?',
    replace: 'attendees?|operators?|volunteers?',
  },
  {
    name: '注入④ writes-no 支谓词扩展还原 writes 单形（every/each + everyone 两族）',
    group: 'g-wn-verb',
    needle: '(?:writes?|leaves?|sends?|gives?|provides?|posts?|replies|responds?|offers?)\\s+(?:no|without)\\b',
    replace: 'writes?\\s+(?:no|without)\\b',
  },
  {
    name: '注入⑤ everyone 族 writes-no 新支整条删除',
    group: 'g-wn-everyone',
    needle: '/\\beveryone\\s+((?:\\w+\\s+){0,3})(?:writes?|leaves?|sends?|gives?|provides?|posts?|replies|responds?|offers?)\\s+(?:no|without)\\b/i',
    replace: NEVER_MATCH,
  },
  {
    name: '注入⑥ expected 负向断言删除（三处 replace_all）',
    group: 'g-expected',
    needle: 'expected(?!\\s+to\\b)',
    replace: 'expected',
  },
  {
    name: '注入⑦ 守卫 be+义务分词表扩充删除（quantifier-guards）',
    group: 'g-guard',
    file: 'src/quantifier-guards.js',
    needle: '|expected|required|permitted|encouraged|asked|told|instructed|advised|obligated|obliged|mandated|compelled|forced|meant|destined',
    replace: '',
  },
];

function makeCopy(dir, mutate, allowNoChange, file) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  if (fs.existsSync(path.join(HF, 'formulas'))) {
    fs.cpSync(path.join(HF, 'formulas'), path.join(dir, 'formulas'), { recursive: true });
  }
  const target = path.join(dir, file || 'src/index.js');
  const before = fs.readFileSync(target, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码: ' + (file || 'src/index.js'));
  fs.writeFileSync(target, after);
  return dir;
}

function runGuard(dir) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { checkHastyGeneralization } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const expected = ' + JSON.stringify(EXPECT_HITS) + ';',
    'let fail = 0;',
    'for (const [g, f, s, expect] of expected) {',
    '  let c;',
    '  try { c = checkHastyGeneralization(s).count; } catch (e) { console.log("CRASH [" + g + "/" + f + "] " + e.message); fail++; continue; }',
    '  const bad = expect === "hit" ? c === 0 : c >= 1;',
    '  if (bad) { fail++; console.log("RED [" + g + "/" + f + "] count=" + c + " expect=" + expect); }',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/** 从 stdout 提取某组「违背期望」条数（hit 组未命中 / miss 组重新命中） */
function groupMiss(out, group) {
  const re = new RegExp('RED \\[' + group + '/[^\\]]+\\]', 'g');
  return (out.match(re) || []).length;
}
function groupCrash(out, group) {
  const re = new RegExp('CRASH \\[' + group + '/[^\\]]+\\]', 'g');
  return (out.match(re) || []).length;
}
function groupTotal(group) {
  return EXPECT_HITS.filter(e => e[0] === group).length;
}

let red = 0, green = 0;
const results = [];

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-hg-r721-control'), s => s, true);
  try {
    const out = runGuard(dir);
    if (/HIT_FAIL=0\//.test(out)) {
      green++;
      results.push(['对照（未注入）', '全绿']);
    } else {
      results.push(['对照（未注入）', '未全绿（守卫本身失守）']);
      console.error('对照副本未全绿：\n' + out);
    }
  } catch (e) {
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
  }
}

// ② 逐个注入：目标组必须 MISS > 0（变红），且不许出现 CRASH
for (const inj of INJECTIONS) {
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-hg-r721-' + Buffer.from(inj.group).toString('hex').slice(0, 8)),
    s => s.split(inj.needle).join(inj.replace),
    false,
    inj.file
  );
  try {
    const out = runGuard(dir);
    const miss = groupMiss(out, inj.group);
    const crash = groupCrash(out, inj.group);
    const total = groupTotal(inj.group);
    if (crash > 0) {
      red++;
      results.push([inj.name, 'CRASH ' + crash + '/' + total + '（崩溃≠变红）']);
    } else if (miss > 0) {
      green++;
      results.push([inj.name, '变红 ' + miss + '/' + total]);
    } else {
      red++;
      results.push([inj.name, '未变红 0/' + total + '（守卫失守）']);
    }
  } catch (e) {
    // 探针有 RED 时 exit 1 → execFileSync 抛错，输出在 e.stdout（r720 模式）
    const out = String(e.stdout || '') + String(e.stderr || '');
    const miss = groupMiss(out, inj.group);
    const crash = groupCrash(out, inj.group);
    const total = groupTotal(inj.group);
    if (crash > 0) {
      red++;
      results.push([inj.name, 'CRASH ' + crash + '/' + total + '（崩溃≠变红）']);
    } else if (miss > 0) {
      green++;
      results.push([inj.name, '变红 ' + miss + '/' + total]);
    } else {
      red++;
      results.push([inj.name, '未变红 0/' + total + '（' + String(e.message).split('\n')[0].slice(0, 100) + '）']);
    }
  }
}

console.log('═══ r721 负例验证结果 ═══');
for (const [name, verdict] of results) {
  console.log('  ' + (verdict.startsWith('全绿') || verdict.startsWith('变红') ? '✅' : '❌') + ' ' + name + ' => ' + verdict);
}
console.log('═══ 汇总: ' + green + ' 符合预期, ' + red + ' 异常 ═══');
process.exit(red > 0 ? 1 : 0);
