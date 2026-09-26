/**
 * negative-test-dehumanization-bare-group-round79.js — 负例验证（v6.7.130 第 79 轮）
 *
 * 验证 `test/dehumanization-bare-group-round79.test.js` 真的在守门：
 * 把 src/index.js 本轮新增/收窄的模式逐条删掉，守卫必须变红（断言失败，
 * 不能是加载崩溃）。
 *
 * 沿用 absolute-claim-en 负例验证的三坑规避（第 13 次复述，别再踩）：
 *   ① 不能 require 正式测试文件测副本——它内部 __dirname 钉死真实仓库。
 *   ② 副本的 VERSION 必须在项目根（src/../VERSION），否则 gate.js 读不到崩溃。
 *   ③ 注入必须真的改变源码（对照副本用 mutate: s => s 会被判「注入未生效」）。
 *
 * 注入方式：把整条正则（含首尾斜杠）替换成永不匹配的合法正则 /^$(?!)/。
 * needle 从源码里按锚点自取，不手写正则字面量（上次手写多一层反斜杠
 * 导致全量「注入未生效」假阴性）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

// 永不匹配的合法正则
const NEVER_MATCH = '/^$(?!)/';

// 源码只读一次；锚点定位失败按「未变红」计入（不能假阴性）
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

// 每个注入：anchor 是该模式独有的短子串（在源码里唯一）。
// 判定口径统一用 gate.checkOutput：block 且归因含 dehumanization。
const INJECTIONS = [
  // inferior ①-a 群称+判断词+贬义中心语（源码第 34 行）
  { name: '删群称+贬义中心语主支', anchor: '(?:这帮|这群|这些|那些|他们|她们)[^。]{0,10}',
    expect: ['这群人就是社会的败类', '这帮人简直是废物', '他们只是提款机'] },
  // inferior ①-a2 牲口不如成语（源码第 1 行）
  { name: '删牲口不如成语支', anchor: '(?:牲口|猪狗|禽兽|畜生)不如',
    expect: ['这群牲口不如的东西'] },
  // inferior ①-b 家伙货色+定性贬义（源码第 35 行）
  { name: '删家伙货色+定性贬义支', anchor: '(?:这些|那些|这帮|这群)[^。]{0,6}(?:家伙|货色',
    expect: ['这些家伙也配上桌', '这些货色算什么东西'] },
  // object ②-a 物化动词+指人+物化名词+受害后果（源码第 14 行）
  { name: '删物化四段齐备主支', anchor: '(?:把|将|在[^。]{0,12}(?:眼里|心中|看来))',
    expect: ['上层把这些人当数字处理，不需要有感情', '把工人当零件一样替换'] },
  // object ②-c 主观框架+只是数字（源码第 15 行）
  { name: '删主观框架+只是数字支', anchor: '(?:在)[^。]{0,10}(?:眼中|心中|眼里|看来',
    expect: ['在他们心中士兵只是数字', '在他们眼里这些人只是数字，可以随时处理掉'] },
  // object ③ 牲口与指人+处置共现（源码第 17 行）
  { name: '删牲口指人共现支', anchor: '(?:把|将|当|当成|视为|当作|看作)[^。]{0,6}(?:人|他们|她们|员工',
    expect: ['把他们当畜生使唤', '把工人当牲口一样管理'] },
  // ④-a 否认人属+物化/处置
  { name: '删否认人属处置支', anchor: '(?:个|一名|一个)?(?:人|人类|人类了)[^。]{0,14}(?:[^。]{0,4}',
    expect: ['他们不是人，只是会说话的工具', '这种人根本不算人，处理掉就行'] },
  // ④-b 否认人属+修饰词+物名词
  // ⚠️ 期望样本不能取「他们并非人类，只是干活机器」——④-c 与它同形，
  //    删 ④-b 后 ④-c 继续命中（count 不变），这是同族冗余不是守卫失守。
  //    取 ④-b 独有形状（否定+人属+「的」+修饰词+物名词）。
  { name: '删否认人属修饰词支', anchor: '(?:会说话|会干活|能干活|干活|说话|移动|计数|执行|服从|消耗)',
    expect: ['他们不是人，只是会说话的牲口', '这帮人算不得人，只是听话的工具'] },
];

/** 从源码里按锚点提取整条正则字面量（含首尾斜杠） */
// ⚠️ 只在本轮新增的注释块之后查找，避免锚点在别处重复出现时拿错正则。
const BLOCK_START = SRC.indexOf('第 79 轮');
function extractRegex(anchor) {
  if (BLOCK_START < 0) throw new Error('未找到第 79 轮新增块');
  const seg = SRC.slice(BLOCK_START, BLOCK_START + 20000);
  const i = seg.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const start = seg.lastIndexOf('/', i);
  const end = seg.indexOf('/i', i);
  if (start < 0 || end < 0 || end < start) throw new Error('无法定位正则边界: ' + anchor);
  return seg.slice(start, end + 2);
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  // VERSION 必须在项目根：gate.js 读 src/../VERSION
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

// 探针（对照组）：未注入时每个样本的 count 必须与基线相等（无下降）。
function runGuard(dir, expectList, baseLine) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { checkDehumanization } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const expected = ' + JSON.stringify(expectList) + ';',
    'const base = ' + JSON.stringify(baseLine) + ';',
    'let fail = 0;',
    'for (let i = 0; i < expected.length; i++) {',
    '  const c = checkDehumanization(expected[i]).count;',
    '  if (c !== base[i]) { fail++; console.log("DIFF " + expected[i] + " count=" + c + " base=" + base[i]); }',
    '}',
    'console.log("DROP_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// 探针（注入组）：删掉该支后，**至少一条样本**的 count 必须低于基线。
// 同族多支共现是设计内冗余（实测 count=2/3），不需要全部下降。
function runInjected(dir, expectList, baseLine) {
  const probe = path.join(dir, '_probe2.js');
  fs.writeFileSync(probe, [
    'const { checkDehumanization } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const expected = ' + JSON.stringify(expectList) + ';',
    'const base = ' + JSON.stringify(baseLine) + ';',
    'let drop = 0;',
    'for (let i = 0; i < expected.length; i++) {',
    '  const c = checkDehumanization(expected[i]).count;',
    '  if (c < base[i]) drop++;',
    '  else console.log("NODROP " + expected[i] + " count=" + c + " base=" + base[i]);',
    '}',
    'console.log("DROP_COUNT=" + drop + "/" + expected.length);',
    'process.exit(drop > 0 ? 0 : 1);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

const { checkDehumanization } = require(path.join(HF, 'src', 'index.js'));

// 每个注入样本先在**未注入的源码**上量出基线 count，
// 探针用「注入后 count < 基线」判定该支真在守门。
function baseline(text) { return checkDehumanization(text).count; }

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/DROP_COUNT=(\d+)\/(\d+)/);
  const detail = m ? ('命中下降 ' + m[1] + '/' + m[2]) : '命中下降 ?';
  results.push([name, '变红（' + detail + '）']);
}

// ① 对照副本：未注入，必须全绿（每样本 count 与基线相等，无一下降）
{
  const allExpect = [].concat(...INJECTIONS.map(i => i.expect));
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-dh79-control'), s => s, true);
  try {
    const out = runGuard(dir, allExpect, allExpect.map(baseline));
    const ok = /DROP_FAIL=0\//.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入，全部攻击样本）', ok ? '全绿' : '未全绿']);
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
    path.join(os.tmpdir(), 'hf-dh79-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join(NEVER_MATCH)
  );
  try {
    const out = runInjected(dir, inj.expect, inj.expect.map(baseline));
    if (/DROP_COUNT=0\//.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      recordRed(out, inj.name);
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/DROP_COUNT=[1-9]/.test(out)) {
      recordRed(out, inj.name);
    } else {
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]);
      const detail = String(e.stderr || '') + ' || ' + out;
      if (detail.trim().length > 6) {
        console.error('    detail: ' + detail.split('\n').slice(0, 5).join('\n    ').slice(0, 400));
      }
    }
  }
}

console.log('\n=== 第 79 轮负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
