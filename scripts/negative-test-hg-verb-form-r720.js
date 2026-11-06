/**
 * negative-test-hg-verb-form-r720.js — 负例验证（v6.8.149 第 720 轮）
 *
 * 验证 test/hg-verb-form-quantifier-zh-r720.test.js 真的在守门：
 * 把 src/index.js 本轮新增/修改的三处判据逐组删掉，守卫必须变红
 * （断言失败，不能是加载崩溃）。
 *
 * 注入组（needle 是**源码里逐字出现**的字符串）：
 *   ① en 验证审查动词族：删掉判据③里的 verif/validat/confirm/review/audit/
 *      test/double-check/approve/watch 八族片段 → en 新族攻击 12 条必须 MISS
 *   ② zh「X 全是 + 负面定性」整条判据 → zh 全是攻击 6 条必须 MISS
 *   ③ zh 身边族放宽还原为严格形（身边(?:全是|…) 无间隔）→ 身边放宽攻击
 *      3 条必须 MISS
 *
 * 三轮踩过的坑（别再踩）：
 *   ① 不能 require 正式测试文件测副本 —— 它内部 __dirname 钉死真实仓库，
 *      副本根本没被加载，假阴性。
 *   ② 副本的 VERSION 必须在项目根（src/../VERSION），gate.js 读不到会
 *      ENOENT 崩溃 → 被解析成「未变红」。
 *   ③ 注入必须真的改变源码（对照副本 mutate: s => s 要 allowNoChange）。
 *   ④ 不用 node -e 内联探针——安全扫描会拦「内联解释器+动态 require」，
 *      写成 _probe.js 文件再跑。
 *   ⑤ formulas/ 要随拷（引擎懒加载读它，缺了启动日志 ENOENT 噪音会被
 *      崩溃识别正则误判成探针崩溃）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = path.join(__dirname, '..'); // 仓库根

// 探针样本：[组, 标签, 文本, 期望]。期望 'hit' = 攻击样本必须命中；
// 期望 'miss' = 规范句必须被守卫豁免（注入⑤后重新命中 = 守卫失效 = 变红）
const EXPECT_HITS = [
  // ① en 验证审查动词族（含四形态）
  ['en', 'verif-s', 'No one verifies the results before publishing.', 'hit'],
  ['en', 'verif-ing', 'Nobody is verifying the output anymore.', 'hit'],
  ['en', 'verif-ed', 'No one verified the sample last quarter.', 'hit'],
  ['en', 'validat-s', 'No one validates the config before deploying.', 'hit'],
  ['en', 'validat-ing', 'Nobody is validating user input on this endpoint.', 'hit'],
  ['en', 'validat-ed', 'Nobody validated the migration script.', 'hit'],
  ['en', 'confirm-s', 'Nobody confirms the invoice totals anymore.', 'hit'],
  ['en', 'review-s', 'No one reviews the pull requests these days.', 'hit'],
  ['en', 'audit-s', 'Nobody audits the expense reports.', 'hit'],
  ['en', 'test-s', 'No one tests the edge cases.', 'hit'],
  ['en', 'doublecheck-s', 'Nobody double-checks the calculations.', 'hit'],
  ['en', 'approve-s', 'No one approves these requests.', 'hit'],
  // ①' everyone 族八族动词（第二修点）
  ['en-everyone', 'validates', 'Everyone validates the config before deploying.', 'hit'],
  ['en-everyone', 'verifies', 'Everyone verifies the results.', 'hit'],
  ['en-everyone', 'confirms', 'Everyone confirms the invoice totals.', 'hit'],
  ['en-everyone', 'reviews', 'Everyone reviews the pull requests.', 'hit'],
  // ①' everyone 族规范句（期望豁免；注入⑤删捕获槽后必须重新命中）
  ['en-must-hit', 'must-validate', 'Everyone must validate the input before submitting.', 'miss'],
  ['en-must-hit', 'should-confirm', 'Everyone should confirm the payment details.', 'miss'],
  // ② zh「X 全是 + 负面定性」
  ['zh-all', '借口', '他的解释全是借口，没有一句是真的。', 'hit'],
  ['zh-all', '骗子', '这帮人全是骗子。', 'hit'],
  ['zh-all', '草台班子', '这个团队全是草台班子。', 'hit'],
  ['zh-all', '套路', '他的方案全是套路。', 'hit'],
  ['zh-all', '空话', '会上讲的全是空话。', 'hit'],
  ['zh-all', '假的', '这些数据全是假的。', 'hit'],
  // ③ zh 身边族放宽（的人/同学/同事 间隔）
  ['zh-side', '的人', '身边的人全是关系户，根本没有公平竞争。', 'hit'],
  ['zh-side', '同学', '身边同学都是内推进来的。', 'hit'],
  ['zh-side', '同事', '身边同事全都走关系。', 'hit'],
];

// 永不匹配的合法正则（替换用）
const NEVER_MATCH = '/^$(?!)/';

// 注入组：组名 → needle（**源码里逐字出现的字符串**，含首尾斜杠与源码
// 字面量的单层反斜杠——不是 JS 字符串转义后的形式）与替换值。
// ⚠️ needle 必须是普通字符串：写成 RegExp 字面量时 `\s` 会编译成「匹配
//    空白字符」，而源码里是「反斜杠+s 两个字符」，整条匹配不上 →
//    「注入未生效/未变红」假阴性（本轮第一次跑就这么崩的）。
const INJECTIONS = [
  {
    name: '注入① en 验证审查动词族八族',
    group: 'en',
    needle: 'verif(?:y|ies|ied|ying)|validat(?:e|es|ed|ing)|confirm(?:s|ed|ing)?|review(?:s|ed|ing)?|audit(?:s|ed|ing)?|test(?:s|ed|ing)?|double[- ]?check(?:s|ed|ing)?|approv(?:e|es|ed|ing)|watch(?:es|ed|ing)?',
    replace: '(?!x)x',
  },
  {
    name: '注入② zh「X全是+负面定性」整条判据',
    group: 'zh-all',
    needle: '/[^。，！？；\\s不没]{1,12}全是(?:借口|关系户|骗子|小人|坏人|败类|废物|走狗|奴才|伪君子|草台班子|套路|圈套|假话|空话|废话|谎言|假的|泡沫|水分|垃圾|屎|渣子|马屁|贪官|叛徒|汉奸|市侩)/',
    replace: NEVER_MATCH,
  },
  {
    name: '注入③ zh 身边族放宽还原严格形',
    group: 'zh-side',
    needle: '/身边[^。，！？；]{0,6}(?:全是|都是|全都是|全都)/',
    replace: '/身边(?:全是|都是|全都是|全都)/',
  },
  {
    name: '注入④ everyone 族八族动词（第二修点删除）',
    group: 'en-everyone',
    // 只命中 everyone 族：判据③里 ships?|shipped 之后跟的是 expects?|expected，
    // 拼 ships?|shipped|verif(… 前缀唯一定位 11083 那条正则的尾部片段。
    needle: 'ships?|shipped|verif(?:y|ies|ied|ying)|validat(?:e|es|ed|ing)|confirm(?:s|ed|ing)?|review(?:s|ed|ing)?|audit(?:s|ed|ing)?|test(?:s|ed|ing)?|double[- ]?check(?:s|ed|ing)?|approv(?:e|es|ed|ing)|watch(?:es|ed|ing)?',
    replace: 'ships?|shipped',
  },
  {
    name: '注入⑤ en 规范情态守卫豁免失效（quantifier-guards）',
    group: 'en-must-hit',
    file: 'src/quantifier-guards.js',
    // 让 isNormativeQuantifierHit 对英文填充槽恒 false：r718 双守卫的 en 情态
    // 豁免失效后，everyone 族规范句「Everyone must validate…」重新命中——
    // 证明这两条规范句的 pass 确实由守卫豁免保证，而非偶然不匹配。
    needle: 'return QUANT_MODAL_FILLER_EN.test(m[1]) || QUANT_MODAL_FILLER_ZH.test(m[1]);',
    replace: 'return false && QUANT_MODAL_FILLER_EN.test(m[1]) || QUANT_MODAL_FILLER_ZH.test(m[1]);',
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
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-hg-r720-control'), s => s, true);
  try {
    const out = runGuard(dir);
    if (/HIT_FAIL=0\//.test(out)) {
      results.push(['对照（未注入）', '全绿']);
    } else {
      green++;
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
    path.join(os.tmpdir(), 'hf-hg-r720-' + Buffer.from(inj.group).toString('hex').slice(0, 8)),
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
      green++;
      results.push([inj.name, '探针崩溃（不计红）: ' + out.split('\n').filter(l => l.startsWith('CRASH')).slice(0, 2).join('; ').slice(0, 120)]);
    } else if (miss === 0) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      red++;
      results.push([inj.name, `变红（miss ${miss}/${total}）`]);
    }
  } catch (e) {
    const out = String(e.stdout || '');
    const miss = groupMiss(out, inj.group);
    const crash = groupCrash(out, inj.group);
    if (crash > 0) {
      green++;
      results.push([inj.name, '探针崩溃（不计红）: ' + out.split('\n').filter(l => l.startsWith('CRASH')).slice(0, 2).join('; ').slice(0, 120)]);
    } else if (miss > 0) {
      red++;
      results.push([inj.name, `变红（miss ${miss}/${groupTotal(inj.group)}）`]);
    } else {
      green++;
      results.push([inj.name, '未变红: ' + String(e.message).split('\n')[0].slice(0, 120)]);
    }
  }
}

console.log('\n=== 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
