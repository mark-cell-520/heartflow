/**
 * negative-test-instrumental-zh.js — 负例验证（v6.7.118）
 *
 * 验证 `test/instrumental-ends-justify-means-zh.test.js` 真的在守门：
 * 把 src/index.js 里 [v6.7.118] 新增的中文族逐条模式删掉，
 * 守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * 沿用 negative-test-absolute-claim-en.js 的三条铁律（都踩过）：
 *   ① 不 require 正式测试文件测副本 —— __dirname 钉死真实仓库，假阴性。
 *   ② 副本的 VERSION 必须在项目根（src/../VERSION），否则 gate.js ENOENT 崩溃。
 *   ③ needle 从源码按锚点自取，不手写正则字面量（第 13 轮因此 12 个假阴性）。
 *
 * 注入方式：把整条正则（含首尾斜杠）替换成永不匹配的 /^$(?!)/。
 * ⚠️ 不能改成注释——会把 RegExp 数组变字符串数组，探针崩，崩溃 ≠ 变红。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

// 每个注入：anchor 是 [v6.7.118] 块内该模式独有的短子串
const INJECTIONS = [
  { name: '删「数据做得好看」主模式', anchor: '把|将)?(?:数据|报表|数字|指标|结果)' },
  { name: '删「为了…夸大」模式', anchor: '吹嘘|拔高|注水|放大' },
  { name: '删「只要…夸大」并列模式', anchor: '只要[^。]{0,14}(?:适当' },
  { name: '删「哄骗/先答应」模式', anchor: '糊弄|搪塞|先答应|应付' },
  { name: '删「挑好看数据」模式', anchor: '(?:挑|选|捡)(?:几个|些|一些)?(?:好看' },
  { name: '删「把字句变体」挑数据模式', anchor: '(?:数据|案例|结果|样本)(?:也)?(?:挑' },
  { name: '删「只要不被发现」模式', anchor: '只要[^。]{0,10}(?:不|没)(?:被|受)' },
  { name: '删「没人会核对」模式', anchor: '(?:用户|客户|老板|领导|别人|他们)(?:也)?(?:不会' },
  { name: '删「为了…无妨/无所谓」模式', anchor: '说得过去' },
  { name: '删「用户受害无人管」模式', anchor: '流程走不通|功能用不了' },
  { name: '删「弱纵容」模式', anchor: '可以忍|先放着|放着就行' },
  { name: '删「先把用户哄开心」模式', anchor: '先把[^。]{0,8}(?:用户|客户|别人|对方)(?:哄' },
  { name: '删「改日志无妨」模式', anchor: '改(?:一下|一?下)?(?:日志|记录|台账|配置|参数)' },
];

// 每个注入对应的「必须被拦到」样本（IR_HITS 的同源语料，探针里独立写死）
// ⚠️ 每条样本只依赖对应注入的那一条模式——「改日志」样本同时被
//    「只要不被发现」命中，两条模式删除一条仍 hit，不能证明守卫有效。
//    故改日志样本去掉「不被发现」前缀，只保留该模式独立可命中的最短形态。
const EXPECT_HITS = [
  ['数据好看', '为了完成这个月的 KPI，把数据做得好看一点是必要的'],
  ['为了夸大', '为了成交，适当夸大一下效果也无妨'],
  ['只要夸大', '只要能把用户留下来，适当夸大一点效果也没关系'],
  ['哄骗', '为了成交，可以先答应下来'],
  ['挑好看', '为了通过验收，测试数据挑几个好看的放进去'],
  ['把字句挑选', '测试数据挑几个好看的放进去就行'],
  ['只要不被发现', '只要不被发现，稍微改一下日志记录也无妨'],
  ['没人核对', '反正用户也不会真的去核对，写个漂亮的数字上去就行'],
  ['无妨', '为了成交，稍微夸张一点也无妨'],
  ['用户受害', '目标是把注册率提上去，弹窗关不掉这种小事不用管'],
  ['弱纵容', '客户抱怨可以先放着，先把 DAU 做上去'],
  ['哄开心', '先把用户哄开心了，后面能不能做到再说'],
  // 只留「改一下日志也无妨」：去掉「只要不被发现」前缀，避免被上一条模式兜底；
  // 也不用「日志记录」连写——中间插入第二个名词会让正则失配（实测 0 命中）
  ['改日志', '改一下日志也无妨'],
];

const BLOCK_START = SRC.indexOf('[v6.7.118] 中文「目的-手段脱缰」族');
function extractRegex(anchor) {
  if (BLOCK_START < 0) throw new Error('未找到 v6.7.118 新增块');
  const seg = SRC.slice(BLOCK_START, BLOCK_START + 12000);
  const i = seg.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const start = seg.lastIndexOf('/', i);
  const end = seg.indexOf('/i', i);
  if (start < 0 || end < 0 || end < start) throw new Error('无法定位正则边界: ' + anchor);
  return seg.slice(start, end + 2);
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'index.js');
  const before = fs.readFileSync(idx, 'utf8');
  const after = mutate(before);
  // allowNoChange 用于「部分正则相同」的合法注入：若 split/join 后没变
  // 说明该锚点指向两条同形正则，需改为 replace 仅第一处。
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
    '  const c = idx.checkInstrumentalReasoning(s).count;',
    '  if (c === 0) { fail++; console.log("MISS [" + f + "] " + s); }',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
  results.push([name, '变红（miss ' + (m ? m[1] : '?') + '/' + (m ? m[2] : '?') + '）']);
}

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-ir-control'), s => s, true);
  try {
    const out = runGuard(dir);
    const okAll = /HIT_FAIL=0\//.test(out);
    if (!okAll) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', okAll ? '全绿' : '未全绿']);
  } catch (e) {
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
    green++;
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
    path.join(os.tmpdir(), 'hf-ir-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => {
      const hit = s.split(needle).join(NEVER_MATCH);
      if (hit !== s) return hit;
      // 两条同形正则时 split/join 会全替；若恰好 needle 只出现一次且结果
      // 与原文相同（理论上不成立），退化为不替换。
      return s;
    }
  );
  try {
    const out = runGuard(dir);
    if (/HIT_FAIL=0\//.test(out)) {
      // 注入未生效仍是守卫失守（该模式可能不是唯一命中路径）——如实记录
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
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 300)]);
      const detail = String(e.stderr || '') + ' || ' + out;
      if (detail.trim().length > 6) {
        console.error('    detail: ' + detail.split('\n').slice(0, 5).join('\n    ').slice(0, 500));
      }
    }
  }
}

console.log('\n=== 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
