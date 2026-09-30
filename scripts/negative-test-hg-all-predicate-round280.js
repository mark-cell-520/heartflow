/**
 * negative-test-hg-all-predicate-round280.js — 负例验证（第 280 轮）
 *
 * 验证 test/hasty-all-predicate-enum-round280.test.js 真的在守门：
 * 把 src/index.js 里第 280 轮引入的 all 族②族谓词枚举判据逐段注入源码变异，
 * 守卫必须变红（断言失败，不能是加载崩溃或注入未生效）。
 *
 * 纪律（参考 round279 注释里踩过的坑）：
 *   ① 不 require 正式测试文件测副本（__dirname 钉死真实仓库 → 假阴性）
 *   ② 副本 VERSION 放项目根
 *   ③ 注入必须真的改变源码
 *   ④ needle 是源码逐字字符串（含 \b \s 的单层反斜杠）
 *   ⑤ 崩溃 ≠ 变红：必须读到 HIT_FAIL=n/… 才算红
 *   ⑥ action ∈ {block,rewrite,verify} 判命中
 *
 * mutation 方式：把目标正则片段替换成永不匹配的合法正则。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

// 每支变异的目标必须是「源码逐字出现」的字符串（含单层反斜杠）
const PRED_ENUM_TAIL = 'ignores?|ignored|refuses?|refused|hates?|hated';
// 谓词表前半主段（覆盖 mock/exploit/undermine 等守卫样本依赖的词）
const PRED_ENUM_TWO = 'blames?|blamed|mocks?|mocked|dismiss(?:es)?|dismissed|ridicules?|ridiculed|undermines?|undermined|sabotages?|sabotaged|cheats?|cheated|deceives?|deceived|manipulates?|manipulated|exploits?|exploited';
// 宽宾语形态的群体表头（只取头部一小段，避免整条正则通吃）
const WIDE_GROUP_HEAD = '(?:of\\s+)?(?:the\\s+)?(?:our\\s+|their\\s+|your\\s+)?(?:users?|customers?|developers?|managers?|teams?';
// 零宾语形态的尾锚（源码里 disjointed 字面）
const ZERO_TAIL = 'disagreed)\\s*\\.\\s*$/im,';
const WIDE_OBJ = 'a\\b|an\\b|the\\b|to\\s+(?:pay|support|help';

// 每支变异对应「守卫必须 miss」的样本（形状描述，样本本身只在此文件与 test/ 内）
const EXPECT_HITS = [
  ['280-wide', 'All users mock a stranger.', 'All citizens exploit the plan.'],
  ['280-tail', 'All of our customers undermined.', 'All taxpayers mocked.'],
  ['280-grp', 'All analysts mock a stranger.', 'All taxpayers mock us.'],
];

const INJECTIONS = [
  { name: 'M1 谓词枚举表主段失效（ignores…mocks 前半 22 词 → zzz，wide/tail/grp 应 miss）',
    anchor: PRED_ENUM_TWO, hits: [0, 1, 2], mutate: 'zzz' },
  { name: 'M2 群体表头替换为收窄集（46 词 → users/citizens/taxpayers 三词，wide/tail/grp 应 miss）',
    anchor: WIDE_GROUP_HEAD, hits: [0, 1, 2], mutate: '(?:of\\s+)?(?:the\\s+)?(?:our\\s+|their\\s+|your\\s+)?(?:users?|citizens?|taxpayers?' },
  { name: 'M3 零宾语尾缀失效（$ 锚点破坏 → tail 形态全 miss）',
    anchor: ZERO_TAIL, hits: [1], mutate: 'disagreed)\\s*\\.\\s/im,' },
  { name: 'M4 宽宾语槽收窄（去掉 the/a/an 具体宾语）',
    anchor: WIDE_OBJ, hits: [0], mutate: 'to\\s+(?:pay|support|help' },
];

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'index.js');
  const before = fs.readFileSync(idx, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(idx, after);
  return dir;
}

function runGuard(dir) {
  const probe = path.join(dir, '_probe280.js');
  fs.writeFileSync(probe, [
    'const gate = require(' + JSON.stringify(path.join(dir, 'src', 'gate.js')) + ');',
    'const expected = ' + JSON.stringify(EXPECT_HITS) + ';',
    'let fail = 0;',
    'for (const [f, s1, s2] of expected) {',
    '  for (const s of [s1, s2]) {',
    '    let a = "none";',
    '    try { const r = gate.checkOutput(s); a = r && r.gate ? r.gate.action : "none"; } catch (e) { a = "ERR"; }',
    '    if (a === "pass" || a === "none" || a === "ERR") { fail++; console.log("MISS[" + f + "] " + s); }',
    '  }',
    '}',
    'console.log("HIT_FAIL=" + fail);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/HIT_FAIL=(\d+)/);
  results.push([name, '变红（miss ' + (m ? m[1] : '?') + '）']);
}

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-280-control'), (s) => s, true);
  try {
    const out = runGuard(dir);
    const ok = /HIT_FAIL=0\b/.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
    green++;
  }
}

// ② 逐个注入：必须变红
for (const inj of INJECTIONS) {
  const count = SRC.split(inj.anchor).length - 1;
  if (count === 0) {
    results.push([inj.name, '锚点定位失败（源码无此串）']);
    green++;
    continue;
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-280-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    (s) => s.split(inj.anchor).join(inj.mutate)
  );
  try {
    const out = runGuard(dir);
    if (/HIT_FAIL=0\b/.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      recordRed(out, inj.name);
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) {
      recordRed(out, inj.name);
    } else {
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]);
      const detail = String(e.stderr || '') + ' || ' + out;
      if (detail.trim().length > 6) {
        console.error('    detail: ' + detail.split('\n').slice(0, 4).join('\n    ').slice(0, 400));
      }
    }
  }
}

console.log('\n=== 第 280 轮负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
