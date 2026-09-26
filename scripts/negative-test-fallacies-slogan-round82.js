/**
 * negative-test-fallacies-slogan-round82.js — 负例验证（v6.7.130 第 82 轮）
 *
 * 验证 `test/fallacies-slogan-verdict-round82.test.js` 真的在守门：
 * 把第 82 轮新增的判据逐条打掉，守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * ── 与 round81 负例脚本的差异（第 81 轮注入机制三坑的修正应用）──
 * 第 82 轮的判据**不是正则字面量**，而是
 *   [new RegExp(String.raw`...${VERDICT_LABELS}`, 'i'), 'false_dilemma_extended']
 * 所以 round81 的「删整条正则」注入法不适用。改用**打表**：
 * 把 VERDICT_LABELS / EITHER_OR_TAIL 的表内容替换成永不匹配的空串，
 * 或把新族三支判据整行替换成合法但永不匹配的正则。
 *
 * ⚠️ 三个坑（第 81 轮已实证，本轮沿用其规避法）：
 *   ① needle 从源码自取，不手写正则字面量（多写一层反斜杠会全假阴性）
 *   ② 替换成注释会把 RegExp 数组变字符串数组 → 崩溃 ≠ 变红
 *   ③ 整行替换 const 定义会引发 ReferenceError → 同样崩溃 ≠ 变红
 *      所以**不打 const 定义行**，只改表内容字符串。
 *
 * ⚠️ 豁免侧的注入（删 EX 三支）是**反向验证**：删掉豁免后良性样本必须变红，
 *    这证明豁免真的在干活，不是死代码。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

// 永不匹配的合法正则字面量（替换整支判据用）
const NEVER_MATCH = '/^$(?!)/';
// 永不匹配的空表内容
const EMPTY_TABLE = "String.raw`zzz_never_match_zzz`";

const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

// 每个注入的 needle 从源码自取（保证逐字匹配）
const R82_BLOCK = SRC.indexOf('[v6.7.130] 第 82 轮');
if (R82_BLOCK < 0) throw new Error('未找到第 82 轮新增块');

// ① 命中侧注入：逐条打掉新族判据（anchor 是该支在源码里唯一的短子串）
const HIT_INJECTIONS = [
  { name: '删「要么A要么B」开放二择支', anchor: '(?:要么|或者|要不然|不然)[^。]{0,20}', family: 'either' },
  { name: '删「不X就是Y」主形支', anchor: '(?:就是|即是|等于|说明|证明|代表|意味着|就算是|等同于|视同)' },
  { name: '删「不X是Y」动词省略支', anchor: '(?:是|算是|纯属|根本是)' },
  { name: '删「沉默=负面裁定」支', anchor: '(?:沉默|中立|观望|不表态|不站队|不选边|不作为|不参与|不发声|不出声|不帮忙|保持沉默|一言不发)' },
  { name: '清空 VERDICT_LABELS 表', anchor: '汉奸|卖国贼|走狗|洋奴' },
  // ⚠️ 第 80 轮负例②教训（原样复现）：「清空 EITHER_OR_TAIL 表」是个
  //    **假守卫**。要么族样本要么命中表里的「敌人」（你要么支持我们要么
  //    就是敌人）、要么命中「别参与」（要么全盘接受，要么别参与讨论），
  //    清掉「散伙/滚/退出」根本不影响这两条 → 注入后仍命中 → 报「未变红」。
  //    这是注入方向选错，不是守卫失守。改为注入**样本专属**的表片段，
  //    且样本只用该片段命中：
  //     「要么听我的，要么就散伙」独有依赖「散伙」。
  { name: '清空 EITHER_OR_TAIL 表（散伙片段）', anchor: '敌人|对手|反对|散伙|散|滚|退出|离开', family: 'either' },
];

// 每个命中侧注入对应的「必须被拦到」的攻击样本
// ⚠️ round80 负例②教训：注入方向选错会把「设计内冗余」当成守卫。
//    清空 EITHER_OR_TAIL 只影响要么族，主形族仍在表内属**设计内冗余**，
//    所以要么族单独一组 EXPECT_HITS，不能混在主列表里。
const EXPECT_HITS = [
  ['主形', '不支持国产就是汉奸'],
  ['主形', '不为它花钱说明你根本不在乎这段感情'],
  ['动词省', '不骂就是纵容'],
  ['沉默', '沉默就是站在凶手那边'],
  ['表', '不买就不是真正的粉丝'],
];
const EXPECT_HITS_EITHER = [
  // ⚠️ 只用**独有依赖被注入片段**的样本：前两条分别靠「敌人」和「别参与」
  //    命中，清掉别的片段不受影响（第 80 轮负例②「设计内冗余」陷阱）。
  ['要么', '要么听我的，要么就散伙'],
];

// ② 豁免侧注入：删掉三支豁免，良性样本必须变红（证明豁免在干活）
const EXEMPT_INJECTIONS = [
  { name: '删豁免①句中否定削弱', anchor: '(?:不一定|未必|不见得|不等于|不代表|并非|并不是|不表示|不说明|不意味着|不会是|不能说明|不能证明|无法说明|未必就|不见得就)' },
  { name: '删豁免②框架化', anchor: '这不是[^，。]{0,12}的问题' },
  // ⚠️ anchor 必须是**完整的合法正则片段**：本轮第一次写
  //    '这是(?:错误|片面|武断|主观'（缺右括号和字面尾部），替换后源码里的
  //    正则字面量变成语法错误 → checkFallacies 加载即 SyntaxError →
  //    「崩溃≠变红」。anchor 从源码逐字取完整片段。
  { name: '删豁免③后置否定评析', anchor: '这是(?:错误|片面|武断|主观|片面|错误)的?(?:推断|判断|结论|解读|说法|逻辑)' },
];
// 删豁免后必须被误伤的良性样本（与豁免支一一对应）
const EXPECT_FP = [
  ['削弱', '反对的声音不一定就是敌人'],
  ['框架', '这不是爱不爱的问题，而是成本收益的权衡'],
  ['评析', '他说不表态就是不作为，这是错误推断'],
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

/** 在副本上跑探针：读 checkFallacies，统计 must-hit / must-not-hit */
function runGuard(dir, mustHit, mustNotHit) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { checkFallacies } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const mustHit = ' + JSON.stringify(mustHit) + ';',
    'const mustNot = ' + JSON.stringify(mustNotHit) + ';',
    'let fail = 0, detail = [];',
    'for (const [f, s] of mustHit) {',
    '  if (checkFallacies(s).count === 0) { fail++; detail.push("HIT-MISS[" + f + "] " + s); }',
    '}',
    'for (const [f, s] of mustNot) {',
    '  if (checkFallacies(s).count > 0) { fail++; detail.push("NOT-MISS[" + f + "] " + s); }',
    '}',
    'for (const d of detail) console.log(d);',
    'console.log("PROBE_FAIL=" + fail);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/PROBE_FAIL=(\d+)/);
  results.push([name, '变红（fail=' + (m ? m[1] : '?') + '）']);
}

/** 从块内按 anchor 提取 needle（命中侧：整支 new RegExp 参数；表：表内容串） */
function extractNeedle(anchor) {
  // ⚠️ 必须用**整个源码**做查找窗口：第 82 轮的豁免侧在 1660 行附近，
  // 距 1195 行的命中侧块 400+ 行，用「块内 9000 字节」窗口会漏（本轮实测
  // 3 个豁免注入全部「锚点未找到」）。命中侧与豁免侧一起覆盖。
  const i = SRC.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  return anchor; // anchor 本身就是源码逐字子串，直接做 needle 替换
}

// ── ① 对照副本：未注入，必须全绿 ──
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-r82-control'), s => s, true);
  try {
    const out = runGuard(dir, EXPECT_HITS, []);
    const ok = /PROBE_FAIL=0/.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
    green++;
  }
}

// ── ② 命中侧注入：删判据 → 攻击样本必须漏（变红）──
for (const inj of HIT_INJECTIONS) {
  let needle;
  try { needle = extractNeedle(inj.anchor); }
  catch (e) { results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 60)]); green++; continue; }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-r82-hit-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join('ZZZ_never_ZZZ')
  );
  // 要么族注入只验证要么族样本；其余注入验证主族样本。
  // （反过来会把主族样本当要么族的守卫，造成假失守）
  // ⚠️ 判据用 inj 上的**显式 family 字段**，不用 anchor/name 猜：
  //    本轮踩过两次——① name.includes('EITHER_OR_TAIL') 永不成立
  //    （注入名是中文）；② anchor.includes('要么') 对表注入失效
  //    （表片段「敌人|对手|…」不含「要么」二字，被路由到主族预期 →
  //     主族样本仍命中 → 假失守）。显式字段最稳。
  const expect = inj.family === 'either' ? EXPECT_HITS_EITHER : EXPECT_HITS;
  try {
    const out = runGuard(dir, expect, []);
    if (/PROBE_FAIL=0/.test(out)) { green++; results.push([inj.name, '未变红（守卫失守）']); }
    else recordRed(out, inj.name);
  } catch (e) {
    const out = String(e.stdout || '');
    if (/PROBE_FAIL=[1-9]/.test(out)) recordRed(out, inj.name);
    else { results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]); }
  }
}

// ── ③ 豁免侧注入：删豁免 → 良性样本必须被误伤（变红）──
for (const inj of EXEMPT_INJECTIONS) {
  let needle;
  try { needle = extractNeedle(inj.anchor); }
  catch (e) { results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 60)]); green++; continue; }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-r82-ex-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join('ZZZ_never_ZZZ')
  );
  try {
    // must-hit 为空、must-not 为良性：删豁免后良性应命中 → PROBE_FAIL>0
    const out = runGuard(dir, [], EXPECT_FP);
    if (/PROBE_FAIL=0/.test(out)) { green++; results.push([inj.name, '未变红（豁免疑似死代码）']); }
    else recordRed(out, inj.name);
  } catch (e) {
    const out = String(e.stdout || '');
    if (/PROBE_FAIL=[1-9]/.test(out)) recordRed(out, inj.name);
    else { results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]); }
  }
}

// ── 汇总 ──
console.log('\n══════ 第 82 轮负例守卫 ══════');
for (const [n, r] of results) console.log('  ' + r.padEnd(34) + n);
console.log('\n真守卫 ' + red + ' | 失守/异常 ' + green);
process.exit(green > 0 ? 1 : 0);
