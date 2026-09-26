/**
 * negative-test-gaslighting-denied-feeling-blame-en-round98.js — 负例验证（v6.7.129）
 *
 * 验证第 98 轮新增的 5 支 en_denied_feeling_blame 判据真的在守门：
 * 把 src/index.js 的每条新判据整条删掉（替换为永不匹配的合法正则），
 * 守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * ⚠️ 锚点必须从**本轮新增块**内取，不能全局 indexOf：
 *    第 96/97 轮连续踩过同名族坑——`negated_feeling_blame` 这个 type 名
 *    在 double_bind zh 表（第 76 轮）、double_bind en 表（第 97 轮注释）、
 *    以及本轮 gaslighting 表里都出现过，全局定位会删到别的族的行。
 *    本脚本按 BLOCK_START = '[v6.7.129] 第 98 轮' 圈定范围后再取锚点。
 * ⚠️ 只删本轮新增的 en 判据，绝不碰 zh_denied_feeling_blame（第 76 轮）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

// 本轮新增块起点（源码注释逐字）
const BLOCK_START = SRC.indexOf('[v6.7.129] 第 98 轮：ZH 第 76 轮 negated_feeling_blame');
if (BLOCK_START < 0) throw new Error('未找到第 98 轮新增块');

// 5 支 en 判据各自的独有锚点（取自本轮块内，逐字含单层反斜杠的源码字面量）
const INJECTIONS = [
  { name: '删①否认在场感受→缺陷归因主支', anchor: "not calling you)" },
  { name: '删②情绪→because/proves→缺陷支', anchor: "never (?:satisfied|happy|content)" },
  { name: '删③全因追问 reason you are X is Y', anchor: "greedy|never satisfied)" },
  { name: '删④the fact you are this upset→shows 支', anchor: "something wrong|too sensitive" },
  { name: '删⑤get this emotional because you are 支', anchor: "impossible|the problem|greedy)" },
];

// 每个注入对应的「必须被拦到」样本（每条独属于该支形状）。
// 支②③④ 的样本不含「I'm not angry/upset/mad」否认前缀，因此支①不命中，
// 只有目标支能命中——删目标支后 HIT_FAIL 必须 >0（真守卫）。
const EXPECT_HITS = [
  ['支①-1', "I'm not angry, it's just that everything you do is selfish."],
  ['支②-1', "You're only so upset because you're just too sensitive."],
  ['支③-1', "The real reason you're upset is that you're just too sensitive."],
  ['支④-1', "The fact you are so angry shows you're broken."],
  ['支⑤-1', "I'm not mad at all. I only point out that you get this emotional because you're insecure."],
];

// ZH 侧独立对照样本：不得因删 EN 判据而失守（zh 表另一套）
const ZH_GUARD = [
  ['zh-1', '你之所以不开心，就是因为你想控制一切。'],
  ['zh-2', '我没有怪你，是你自己太敏感了。'],
];

function extractRegex(anchor) {
  const seg = SRC.slice(BLOCK_START, BLOCK_START + 9000);
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
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(idx, after);
  return dir;
}

function runGuard(dir) {
  // 用 checkGaslighting 直检：删条后 EN 攻击 count 必须降到 0（或降到
  // 不再进 findings 的程度）；ZH 对照样本必须仍命中（证明只删了 EN 侧）
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { checkGaslighting } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const attacks = ' + JSON.stringify(EXPECT_HITS) + ';',
    'const zh = ' + JSON.stringify(ZH_GUARD) + ';',
    'let fail = 0, zhOk = 0;',
    'for (const [f, s] of attacks) {',
    '  const r = checkGaslighting(s);',
    '  const hasType = (r.signals || []).some(x => x.type === "en_denied_feeling_blame");',
    '  if (!hasType || r.count === 0) { fail++; console.log("MISS [" + f + "] " + s); }',
    '}',
    'for (const [f, s] of zh) {',
    '  const r = checkGaslighting(s);',
    '  if ((r.signals || []).some(x => x.type === "zh_denied_feeling_blame")) zhOk++;',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + attacks.length + " ZH_OK=" + zhOk + "/" + zh.length);',
    'const ok = fail > 0 && zhOk === zh.length;',
    'process.exit(ok ? 1 : 0);  // 退出码 1 = 守卫按预期变红',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

// ① 对照副本：未注入，探针应以 exit 0 结束（EN 5/5 命中 + ZH 2/2 命中）。
//    注意守卫探针的设计是「只在失守时 exit 1」，因此对照 = 正常运行拿到
//    stdout（不抛错）；抛错反而是异常。
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-gl98-control'), s => s, true);
  let out;
  try {
    out = runGuard(dir);
  } catch (e) {
    out = String(e.stdout || '');
  }
  if (/HIT_FAIL=0\/5/.test(out) && /ZH_OK=2\/2/.test(out)) {
    results.push(['对照（未注入）', '全绿（EN 5/5 命中 + ZH 2/2 命中，守卫基线正常）']);
  } else {
    results.push(['对照（未注入）', '基线异常: ' + out.split('\n').slice(-3).join(' | ')]);
    green++;
  }
}

// ② 逐个注入：删该支后必须「EN 失守 + ZH 不受影响」才算真守卫
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
    path.join(os.tmpdir(), 'hf-gl98-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join(NEVER_MATCH)
  );
  try {
    const out = runGuard(dir);
    // 退出码 0 = 守卫没变红（失守）
    green++;
    results.push([inj.name, '未变红（守卫失守）: ' + out.split('\n').slice(-3).join(' | ')]);
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out) && /ZH_OK=2\/2/.test(out)) {
      red++;
      const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
      results.push([inj.name, '变红（miss ' + m[1] + '/' + m[2] + '，ZH 2/2 未受影响）']);
    } else {
      results.push([inj.name, '探针崩溃或 ZH 被误伤（不计红）: ' + out.split('\n').slice(-2).join(' | ')]);
      green++;
    }
  }
}

console.log('\n=== 第 98 轮负例守卫结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 支：' + red + ' 支让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例守卫通过（每条判据都被真守卫）' : '\n负例守卫未通过');
process.exit(pass ? 0 : 1);
