/**
 * negative-test-middle-ground-r726.js — 负例验证（v6.8.153 / r726）
 *
 * 验证 test/round-196-argument-to-moderation.js 的 r726 新增族真的在守门：
 * 把 src/argument-to-moderation.js 的 r726 新模式逐条删掉（替换成永不匹配的
 * 合法正则），守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * 三轮踩过的坑（承 negative-test-absolute-claim-en.js 的教训，别再踩）：
 *   ① 不能 require 正式测试文件测副本 —— 它内部 __dirname 钉死真实仓库，
 *      副本根本没被加载，假阴性。
 *   ② 副本的 VERSION 必须放在项目根（src/../VERSION）。
 *   ③ 注入必须真的改变源码（对照副本用 mutate: s => s 会被判「注入未生效」）。
 *   ④ 探针写成文件再跑，不用 node -e 内联（安全扫描会拦）。
 *
 * 注入方式：把整条正则（含首尾斜杠）替换成永不匹配的合法正则 /^$(?!)/。
 * ⚠️ needle 是源码里逐字出现的字符串（含 \b \s 的单层反斜杠）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HF = path.join(__dirname, '..'); // 仓库根（跨平台）
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'argument-to-moderation.js'), 'utf8');

// r726 新增的 6 族攻击代表样本（每族一条，中英混编）
// ⚠️ 负例注入按「该样本只依赖被注入的那一条模式」选样：若样本还有第二条
//    模式兜底（如「走极端本身就是错的」同时被 走极端…错 与 越极端… 覆盖），
//    注入单条不会变红——那正是双腿/多模式冗余设计的初衷，不是守卫失守。
const EXPECT_HITS = [
  ['A-真理在中间', '真相永远在中间，立场越极端越有问题。'],
  ['A-真理在中间-双副词', '对错从来都在两端之间，不在任何一极。'],
  ['B-中间最稳妥', '两个观点冲突时，取中间立场总是最稳妥的选择。'],
  ['B-中间必然正确', '中间立场必然是正确的，这是永恒的道理。'],
  ['C-和稀泥了结', '双方各打五十大板，各退一步，这事就算了。'],
  ['C-和稀泥过去', '这件事谁也说不清，和稀泥和过去算了。'],
  ['D-双方都有道理', '这件事没有绝对的对错，所以两方都有道理。'],
  ['D-争不出结果', '两边其实都有道理，争不出结果来。'],
  ['E-走极端即错', '两个观点都太极端，走极端本身就是错的。'],
  ['E-越极端越有问题', '立场越极端越有问题，中间路线最可靠。'],
  ['E-极左极右', '极左极右都不可取，只有不偏不倚才是正道。'],
  ['EN-真理在中间', 'The truth is always in the middle of any dispute.'],
  ['EN-总是最合理', 'The middle position is always the most reasonable one, no matter the evidence.'],
  ['EN-moderate-path', 'A moderate stance is the sensible choice available.'],
  ['EN-无绝对对错', "There's no absolute right or wrong here, so let's just meet in the middle."],
  ['EN-极端即错', 'Extremism on both sides is wrong, so the moderate path must be right.'],
  // [r726b] 谚语族
  ['谚-公说公有理', '公说公有理，婆说婆有理，其实折中才是对的。'],
  ['谚-各打三十大板', '各打三十大板，两边都长长记性，这事就了了。'],
  ['谚-折中处理最合理', '两边都不干净，各退一步海阔天空，折中处理最合理。'],
  ['谚-各让一步最公平', '和事佬劝双方各让一步，各让一步才是最公平的结局。'],
  ['谚-平分责任', '吵架的双方各有过错，平分责任才是公正的处理。'],
  ['谚-中间数最公平', '两边的说法都有道理，取个中间数最公平。'],
  ['EN-split even', "Let's just split the difference and call it even."],
  ['EN-truth somewhere', 'The truth is somewhere in between the two claims.'],
  ['EN-answer must lie', 'Both sides have a point, so the answer must lie in the middle.'],
  ['EN-a little from each', 'A little from each side is the correct way to settle this.'],
];

// 每个注入：anchor 是该模式在源码里独有的短子串，用它定位整条正则
// （向前找最近的 /，向后找 /i 或 /），替换成 NEVER_MATCH。
// r726 族：腿① 副词间隙形 / 腿② 六族断言 / 腿① EN 新词 / 腿② EN 新断言。
const INJECTIONS = [
  { name: 'r726 腿①副词间隙形（真相[永远]在中间）', anchor: '所在)?(?:就|正|恰恰|恰好' },
  { name: 'r726 腿①双方都有道理族', anchor: '有|存在)?(?:一定)?道理' },
  { name: 'r726 腿①两端极端族', anchor: '极右)(?:[^。；，]{0,4})' },
  { name: 'r726 腿②全称量化×最高级', anchor: '总是|一定|必然|永远|肯定|历来' },
  { name: 'r726 腿②中间=是正确（副词间隙）', anchor: '显然|确实|就是)?(?:才)?是(?:对|正确|真理|真相|最)' },
  { name: 'r726 腿②真理在中间自足断言', anchor: '正解|说法|是非|对错)(?:的)?(?:所在)?' },
  { name: 'r726 腿②争不出对错', anchor: '争|辩|讨论|说)(?:不出|不清|不明|不出来)' },
  { name: 'r726 腿②没有绝对对错', anchor: '没有|无)(?:绝对的?)?(?:对错|是非|黑白)' },
  { name: 'r726 腿②走极端=错', anchor: '走极端[^。；，]{0,10}' },
  { name: 'r726 腿②越极端越有问题', anchor: '越(?:极端|激进|偏激)' },
  { name: 'r726 腿①EN in the middle', anchor: 'in the middle\\b/i' },
  { name: 'r726 腿①EN moderate', anchor: 'moderate\\b/i' },
  { name: 'r726 腿①EN compromise', anchor: 'compromise\\b/i' },
  { name: 'r726 腿①EN extremism', anchor: 'extrem(?:ism|ist)s?' },
  { name: 'r726 腿②EN全称量化×最高级', anchor: 'always|invariably|certainly|necessarily|must be|by definition' },
  { name: 'r726 腿②EN真理在中间', anchor: 'truth|answer|verdict|facts?|conclusion)\\s+(?:always' },
  { name: 'r726 腿②EN no absolute', anchor: 'no absolute (?:right|wrong|truth)' },
  { name: 'r726 腿②EN答案=折中', anchor: 'answer|solution|result|truth)\\s+(?:must be' },
  { name: 'r726 腿②EN moderate path', anchor: 'moderate|middle|centrist|moderation)\\s+\\w{3,12}' },
  { name: 'r726b 腿①各打N大板', anchor: '各打(?:三十|五十|二十)(?:大板|棍子)' },
  { name: 'r726b 腿①两边说法都有道理', anchor: '说法|观点|立场|主张)?(?:都|各自|全|其实' },
  { name: 'r726b 腿①各有过错', anchor: '各有(?:过错|责任|错|不是)' },
  { name: 'r726b 腿②名词前置最合理', anchor: '折中|中间|各让一步|各退一步|平分|和稀泥' },
  { name: 'r726b 腿②裸最公平', anchor: '明智|理性|客观)(?:的)?(?:处理|解决|做法' },
  { name: 'r726b 腿②各打N大板了结', anchor: '了了|了结|了断|不再计较' },
  { name: 'r726b 腿①EN a little from each side', anchor: 'a (?:little|bit|part|piece|portion) from' },
  { name: 'r726b 腿①EN both sides have a point', anchor: 'both sides? have a point' },
  { name: 'r726b 腿②EN split difference even', anchor: 'call it even|is even|to even' },
  { name: 'r726b 腿②EN truth somewhere between', anchor: 'must\\s+lie|must\\s+be|can\\s+only\\s+be' },
];

/** 从源码里按锚点提取整条正则字面量（含首尾斜杠） */
function extractRegex(anchor) {
  const i = SRC.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const start = SRC.lastIndexOf('/', i);
  // 向后找与该正则配对的结束斜杠：取 anchor 之后第一个 / 且其后是 i 或 ,
  // （正则体里可能含转义斜杠，但 r726 族无此形；保守取第一个 /i 或 /）
  const m = SRC.slice(i).match(/^[^\n]*?(\/i|\/)(,|\s*\n)/);
  if (start < 0 || !m) throw new Error('无法定位正则边界: ' + anchor);
  const end = i + m[0].length - m[2].length + (m[1] === '/i' ? 2 : 1);
  return SRC.slice(start, end);
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  if (fs.existsSync(path.join(HF, 'formulas'))) {
    fs.cpSync(path.join(HF, 'formulas'), path.join(dir, 'formulas'), { recursive: true });
  }
  const target = path.join(dir, 'src', 'argument-to-moderation.js');
  const before = fs.readFileSync(target, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(target, after);
  return dir;
}

function runProbe(dir, probeFile, script) {
  const probe = path.join(dir, probeFile);
  fs.writeFileSync(probe, script);
  const r = spawnSync(process.execPath, [probe], { encoding: 'utf8' });
  return (r.stdout || '') + '\n' + (r.stderr || '');
}

function runGuard(dir) {
  // 探针直接 require 副本里的 argument-to-moderation.js（该模块零依赖，
  // 无需启动整个引擎），命中数必须 > 0。
  return runProbe(dir, '_probe.js', [
    'const { checkArgumentToModeration } = require(' + JSON.stringify(path.join(dir, 'src', 'argument-to-moderation.js')) + ');',
    'const expected = ' + JSON.stringify(EXPECT_HITS) + ';',
    'let fail = 0;',
    'for (const [f, s] of expected) {',
    '  const c = checkArgumentToModeration(s).count;',
    '  if (c === 0) { fail++; console.log("MISS [" + f + "] " + s); }',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
}

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
  const detail = m ? ('miss ' + m[1] + '/' + m[2]) : 'miss ?';
  results.push([name, '变红（' + detail + '）']);
}

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-mg-r726-control'), s => s, true);
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
for (const inj of INJECTIONS) {
  let needle;
  try {
    needle = extractRegex(inj.anchor);
  } catch (e) {
    results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 60)]);
    green++;
    continue;
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-mg-r726-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join(NEVER_MATCH)
  );
  try {
    const out = runGuard(dir);
    if (/HIT_FAIL=0\//.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      recordRed(out, inj.name);
    }
  } catch (e) {
    // spawnSync 不抛错；保留兜底以防将来改回 execFileSync
    const out = (e.stdout || '') + '\n' + (e.stderr || '');
    if (/HIT_FAIL=0\//.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      recordRed(out, inj.name);
    }
  }
}

// ③ 良性样本在对照副本必须零命中（防注入改出误伤）
{
  const benign = [
    '调解员建议双方各让一步，最终双方达成了和解协议。',
    '三个数 3、6、9 的平均值是 6，取中间值就是中位数。',
    '儒家讲中庸，不是和稀泥，而是分寸感。',
    '中间立场并不总是对的，还是要看证据。',
    '考试答案在卷子的中间部分，大家可以先看中间再作答。',
    '交通事故责任认定书认定双方负同等责任，各自承担一半损失。',
  ];
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-mg-r726-benign'), s => s, true);
  const out = runProbe(dir, '_probe2.js', [
    'const { checkArgumentToModeration } = require(' + JSON.stringify(path.join(dir, 'src', 'argument-to-moderation.js')) + ');',
    'const benign = ' + JSON.stringify(benign) + ';',
    'let fp = 0;',
    'for (const s of benign) { if (checkArgumentToModeration(s).count > 0) { fp++; console.log("FP " + s); } }',
    'console.log("FP_FAIL=" + fp + "/" + benign.length);',
    'process.exit(fp > 0 ? 1 : 0);',
  ].join('\n'));
  const ok = /FP_FAIL=0\//.test(out);
  results.push(['良性零误伤（对照副本）', ok ? '零误伤' : '有误伤']);
  if (!ok) green++;
}

console.log('\n══ negative-test-middle-ground-r726 ══');
for (const [n, r] of results) {
  const bad = r.indexOf('未变红') >= 0 || r.indexOf('崩溃') >= 0 || r.indexOf('失守') >= 0
    || r.indexOf('有误伤') >= 0 || r.indexOf('失败') >= 0 || r.indexOf('未全绿') >= 0;
  console.log('  ' + (bad ? '❌' : '✅') + ' ' + n + ' → ' + r);
}
console.log('注入点 ' + INJECTIONS.length + ' 个：变红 ' + red + ' / 未变绿 ' + green);
process.exit(red === INJECTIONS.length && green === 0 ? 0 : 1);
