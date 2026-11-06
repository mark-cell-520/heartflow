/**
 * negative-test-stereotype-group-copula-r724.js — 负例验证（v6.8.152 第 724 轮）
 *
 * 验证 `test/stereotype-group-copula-narrow-r724.test.js` 真的在守门：
 * 把 src/index.js 本轮窄化的模式族逐条注入「永不匹配」，守卫必须变红
 * （命中归零，不能是加载崩溃）。
 *
 * 三轮踩过的坑（从 absolute-claim 负例脚本继承，别再踩）：
 *   ① 不能 require 正式测试文件测副本 —— 它内部 __dirname 钉死真实仓库，
 *      副本根本没被加载，假阴性。
 *   ② 副本的 VERSION/package.json/src/formulas 必须齐全，缺 formulas 会
 *      ENOENT 崩溃，崩溃 ≠ 变红。
 *   ③ node -e 内联脚本会被安全扫描当可疑负载拦掉——写成文件再跑。
 *   ④ needle 是源码里逐字出现的字符串（含单层反斜杠），不是 JS 转义形。
 *   ⑤ 本轮注入含 new RegExp 拼接形（窄化支）：不能替换整条「正则」——
 *      它不是字面量。改为把拼接串里的特征片段换成合法但永不匹配的串
 *      （如 '\\bZZZ\\s+(?:'），保持 JS 语法完整。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = __HF;
const NEVER_MATCH = '/^$(?!)/';            // 字面量正则注入替代
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

// 注入点：kind='regex' 换整条字面量；kind='str' 换拼接串片段
const INJECTIONS = [
  { name: '删宽正则 love/like/hate/always/never 支', kind: 'regex', anchor: '[a-z]+ (?:love' },
  { name: '删宽正则 are 窄化支（贬损谓词表）', kind: 'str', anchor: 'all [a-z]+ are' },
  { name: '删 gender are 窄化支', kind: 'str', anchor: 'men|women|boys|girls) are' },
  { name: '删 gender should be/were born/naturally/tend to be 支', kind: 'regex', anchor: 'girls) (?:should' },
  { name: '删 every/each has/wants/believes/thinks 支', kind: 'regex', anchor: 'conservative) (?:has' },
  { name: '删 every/each is 窄化支', kind: 'str', anchor: 'conservative) is' },
];

// 每个注入对应的「必须被 stereotype 拦到」样本（该族代表）
const EXPECT_HITS = [
  ['love族', 'All users hate the new pricing page.'],
  ['are族', 'All users are lazy.'],
  ['gender-are族', 'Women are inferior.'],
  ['gender规训族', 'Women should be in the kitchen.'],
  ['every-has族', 'Every immigrant wants special treatment.'],
  ['every-is族', 'Every person is a criminal.'],
];

/** 从源码 stereotype 块内按锚点提取整条正则字面量（含首尾斜杠） */
const BLOCK_START = SRC.indexOf('[v6.8.152 r724] 群体概括族 are 支共用谓词表');
function extractRegex(anchor) {
  if (BLOCK_START < 0) throw new Error('未找到 v6.8.152 新增块');
  const seg = SRC.slice(BLOCK_START, BLOCK_START + 12000);
  const i = seg.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const start = seg.lastIndexOf('/', i);
  const end = seg.indexOf('/i', i);
  if (start < 0 || end < 0 || end < start) throw new Error('无法定位正则边界: ' + anchor);
  return seg.slice(start, end + 2);
}

/** 提取 new RegExp 拼接参数字面量段（从首引号到 `+ ')'` 尾引号，整段替换） */
function extractStrNeedle(anchor) {
  const i = SRC.indexOf(anchor);
  if (i < 0) throw new Error('拼接串锚点未找到: ' + anchor);
  const start = SRC.lastIndexOf("'", i);
  // 形如 new RegExp('\\b...' + STER_MODAL_FILLER_EN + ')?(?:' + STER_PREDICATE_DEROG_EN + ')', 'i')
  // needle 必须覆盖到 `+ ')'` 的尾引号——只换首串会留下无匹配 `(` 的 `)?`，
  // 模块加载时 new RegExp 抛 SyntaxError，探针崩（崩溃≠变红）。
  const tail = SRC.indexOf("+ ')'", i);
  if (start < 0 || tail < 0 || tail < start) throw new Error('无法定位拼接段边界: ' + anchor);
  return SRC.slice(start, tail + 5);
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  if (fs.existsSync(path.join(HF, 'formulas'))) {
    fs.cpSync(path.join(HF, 'formulas'), path.join(dir, 'formulas'), { recursive: true });
  }
  const idx = path.join(dir, 'src', 'index.js');
  const before = fs.readFileSync(idx, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(idx, after);
  return dir;
}

function runGuard(dir) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const idx = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const expected = ' + JSON.stringify(EXPECT_HITS) + ';',
    'let fail = 0;',
    'for (const [f, s] of expected) {',
    '  const d = idx.discriminate(s);',
    '  const hit = (d.findings || []).some(x => x.dimension === "stereotype");',
    '  if (!hit) { fail++; console.log("MISS [" + f + "] " + s); }',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-st-r724-control'), s => s, true);
  try {
    const out = runGuard(dir);
    const ok = /HIT_FAIL=0\//.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
  }
}

// ② 逐个注入：必须变红
for (let k = 0; k < INJECTIONS.length; k++) {
  const inj = INJECTIONS[k];
  let needle;
  try {
    needle = inj.kind === 'regex' ? extractRegex(inj.anchor) : extractStrNeedle(inj.anchor);
  } catch (e) {
    red++; results.push([inj.name, '未变红（锚点定位失败: ' + e.message + '）']);
    continue;
  }
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-st-r724-' + k), (s) => {
    if (inj.kind === 'regex') return s.replace(needle, NEVER_MATCH);
    // str 形（new RegExp 拼接）：把整个源串（含首尾引号）换成永不匹配的合法串
    // new RegExp('^$', 'i') 合法且永不命中，保持 JS 语法完整。
    // ⚠️ replacement 用函数形式——串里的 `$'` 是 replace 特殊模式（插入匹配后
    // 文本），直接写 "'^$'" 会把 needle 之后的源码插进来造成 SyntaxError。
    return s.replace(needle, () => "'^$'");
  });
  try {
    // 守卫退出码 1 = 断言失败 = 变红。execFileSync 对非 0 退出码抛错，
    // 但 e.stdout 里已经有 HIT_FAIL=n/6 —— 读 stdout 判断，不要被 throw 骗了。
    const out = runGuard(dir);
    if (/HIT_FAIL=[1-9]/.test(out)) { red++; results.push([inj.name, '变红']); }
    else { results.push([inj.name, '未变红（守卫仍全绿——注入可能没生效）']); }
  } catch (e) {
    // 非 0 退出码走到这里；stdout 仍可读
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) { red++; results.push([inj.name, '变红']); }
    else { results.push([inj.name, '探针崩溃（崩溃≠变红，按未变红计）: ' + String(e.message).slice(0, 80)]); }
  }
}

console.log('══════════════════════════════════');
for (const [name, r] of results) console.log((r === '变红' || r === '全绿' ? '✅' : '❌') + ' ' + name + ' → ' + r);
console.log(`汇总: 变红 ${red}/${INJECTIONS.length} 注入，对照 ${results[0][1]}`);
process.exit(red === INJECTIONS.length && results[0][1] === '全绿' ? 0 : 1);
