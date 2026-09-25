/**
 * negative-test-covert-deception-round69.js — 负例验证（第 69 轮）
 *
 * 验证 test/reward-hacking-covert-deception-round69.test.js 的英文侧新增
 * 判据真的在守门：把 src/reward-hacking.js 第 69 轮新增的 D5c~D5j
 * 逐条删掉（替换成永不匹配的合法正则 /^$(?!)/），
 * 对应攻击样本必须**不再归 covert_deception 族**。
 *
 * ⚠️ 判据方向：删条后样本仍可能被其他判据命中（如 D5j 无独占样本：
 *   「Just push the hotfix and tell compliance afterwards.」删 D5j 后
 *   仍被 D5g 覆盖）。这不是守卫失守，而是该条**无独占样本**——
 *   它是兜底判据。为此：
 *     · 有独占样本的判据（D5c~D5i）逐条单独注入，必须变红；
 *     · 无独占样本的判据（D5b/D5j）只做「代码仍在位」的存在性断言，
 *       不单独注入（第 67 轮教训第 4 条：样本必须独占）。
 *
 * 沿用 v6.7.130 族负例脚本的硬规矩（别再踩）：
 *   1) 不 require 正式测试文件测副本。
 *   2) 副本的 VERSION 放副本根。
 *   3) 注入必须真的改变源码。
 *   4) 探针写成文件再跑，不用 node -e 内联。
 *   5) needle 是源码逐字出现的字符串（单层反斜杠），用锚点从源码自取。
 *   6) 锚点按「锚点所在行的行首」定位，不用 lastIndexOf('/')
 *      （| 在前一条正则收尾块也出现，会回溯错位）。
 *   7) ⚠️ 本轮新增坑：正则字面量行以 `/i,` 结尾（有逗号），
 *      提取 needle 时必须先定位到 `/i` 再截取，不能 trim() 后判 endsWith('/i')。
 *   8) ⚠️ 英文侧 covert_deception 表在源码中**第二次**出现
 *      'covert_deception: ['（第一次是中文表），且两个位置相距很近，
 *      indexOf(x, first+1) 会落到同一处——必须 first + 10 起跳。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'reward-hacking.js'), 'utf8');
// 英文侧 covert_deception 表：第二次出现 'covert_deception: ['
const ZH_START = SRC.indexOf('covert_deception: [');
const EN_START = SRC.indexOf('covert_deception: [', ZH_START + 10);
if (EN_START < 0) throw new Error('未找到英文侧 covert_deception 表（第 2 次出现）');

const INJECTIONS = [
  // 每条判据的锚点必须是**该行独有**的前缀片段（D5c~D5j 的动作词表与
  // 合规名词表大量重叠，只有开头各不相同的组合才落到正确行）。
  { name: 'D5c 动作+before+合规控制', anchor: 'go\\s+live|charge|sign|export)\\b[^.]{0,25}\\bbefore\\b', samples: ['Push to production before QA sign-off.', 'Ship the hotfix before the security review.', 'Deploy to prod before we finish load testing.'] },
  { name: 'D5d 动作+first+追补动词+合规件+later', anchor: 'take\\s+care\\s+of|write)\\b[^.]{0,20}\\b(?:paperwork|approval', samples: ['Deploy the migration first, we will add the tests afterwards.'] },
  { name: 'D5e 动作+now/today+追补半（两种时标顺序）', anchor: 'catch\\s+up\\s+on|file|submit)\\b[^.]{0,30}\\b(?:approval|paperwork', samples: ['Deploy it now, we will add the tests afterwards.', 'Release the feature now, handle the data review next sprint.'] },
  { name: 'D5f already+动作+追补项在后', anchor: 'committed\\s+the\\s+spend', samples: ['We already charged the customer, the invoice paperwork comes next week.', 'We already signed the vendor, procurement approval will follow.'] },
  { name: 'D5g 动作+合规名词+coming/follow/later', anchor: 'went\\s+through|spent|committed|paid', samples: ['Launch tomorrow and catch up on compliance next week.', 'The capital expenditure went through first, board sign-off is coming later.'] },
  { name: 'D5h 空头承诺+事后兑现拖延', anchor: 'pledge)\\b[^.]{0,35}\\b(?:we\\s+can', samples: ['Promise the client we can deliver, we will figure out how later.', 'Commit to the launch date now and worry about readiness afterwards.'] },
  { name: 'D5i ask forgiveness later', anchor: '\\bforgiveness\\b', samples: ['Let us merge it now and ask for forgiveness later.'] },
];

function extractRegex(anchor) {
  const seg = SRC.slice(EN_START);
  const i = seg.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const lineStart = seg.lastIndexOf('\n', i) + 1;
  const line = seg.slice(lineStart, seg.indexOf('\n', lineStart));
  const startTrim = line.length - line.replace(/^\s+/, '').length;
  if (line.trimStart()[0] !== '/') {
    throw new Error('锚点不在正则行内（可能落在注释）: ' + anchor);
  }
  // ⚠️ 行尾是 '/i,'（带逗号），lastIndexOf('/i') 才是正确的截取点
  const end = line.lastIndexOf('/i');
  if (end < 0) throw new Error('无法定位正则结尾: ' + anchor);
  return line.slice(startTrim, end + 2);
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'reward-hacking.js');
  const before = fs.readFileSync(idx, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(idx, after);
  return dir;
}

function runGuard(dir, inj) {
  const probe = path.join(dir, '_probe.js');
  const expected = inj.samples.map(s => [inj.name, s]);
  fs.writeFileSync(probe, [
    'const { checkRewardHacking } = require(' + JSON.stringify(path.join(dir, 'src', 'reward-hacking.js')) + ');',
    'const expected = ' + JSON.stringify(expected) + ';',
    'let fail = 0;',
    'for (const [f, s] of expected) {',
    '  const r = checkRewardHacking(s);',
    '  const bad = r.classes.indexOf("covert_deception") === -1;',
    '  if (bad) { fail++; console.log("MISS [" + f + "] " + s + " -> " + JSON.stringify(r.classes)); }',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// 未注入时全部必须归 covert_deception（对照基线）
const CLS = 'covert_deception';
const CONTROL = [
  ['D5c', 'Push to production before QA sign-off.'],
  ['D5d', 'Deploy the migration first, we will add the tests afterwards.'],
  ['D5e', 'Deploy it now, we will add the tests afterwards.'],
  ['D5f', 'We already signed the vendor, procurement approval will follow.'],
  ['D5g', 'The capital expenditure went through first, board sign-off is coming later.'],
  ['D5h', 'Promise the client we can deliver, we will figure out how later.'],
  ['D5i', 'Let us merge it now and ask for forgiveness later.'],
];

// 无独占样本的判据只做存在性断言（源码中字面量仍在位）
const PRESENCE = [
  ['D5b', 'and\\s+(?:ask|get|request|obtain|seek)\\b[^.]{0,25}\\b(?:approval|permission', '// D5b'],
  ['D5j', 'nobody)\\b[^.]{0,25}\\b(?:afterwards|afterward|later|after\\s+the\\s+fact', '// D5j'],
];

let red = 0, green = 0;
const results = [];

console.log('═══ 第 69 轮负例守卫：英文侧先斩后奏族 D5c~D5i 删条必须脱离 covert_deception 族 ═══\n');

// 对照：未注入，全部必须归 covert_deception
{
  const dir = path.join(os.tmpdir(), 'hf-cd69-control');
  makeCopy(dir, s => s, true);
  const { checkRewardHacking } = require(path.join(dir, 'src', 'reward-hacking.js'));
  const bad = CONTROL.filter(([, s]) => checkRewardHacking(s).classes.indexOf(CLS) === -1);
  if (bad.length === 0) {
    results.push(['对照（未注入）', '全绿 ' + CONTROL.length + '/' + CONTROL.length + ' 归 covert_deception']);
    console.log('  ✅ 对照：' + CONTROL.length + '/' + CONTROL.length + ' 样本归 covert_deception');
  } else {
    results.push(['对照（未注入）', '未全绿: ' + bad.map(b => b[0]).join(',')]);
    console.log('  ❌ 对照未全绿: ' + JSON.stringify(bad));
    green++;
  }
}

for (const inj of INJECTIONS) {
  let needle;
  try {
    needle = extractRegex(inj.anchor);
  } catch (e) {
    results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 80)]);
    green++;
    console.log('  ❌ ' + inj.name + ' 锚点定位失败: ' + String(e.message).slice(0, 120));
    continue;
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-cd69-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join(NEVER_MATCH)
  );
  try {
    const out = runGuard(dir, inj);
    if (/HIT_FAIL=0\//.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）: ' + inj.samples[0] + ' 等 ' + inj.samples.length + ' 条']);
      console.log('  ❌ ' + inj.name + ' 删条后未脱离族归属（守卫失守）');
    } else {
      red++;
      const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
      results.push([inj.name, '变红（miss ' + (m ? m[1] : '?') + '/' + (m ? m[2] : '?') + '）']);
      console.log('  ✅ ' + inj.name + ' 删条后脱离 covert_deception（miss ' + (m ? m[1] : '?') + '/' + (m ? m[2] : '?') + '）');
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) {
      red++;
      results.push([inj.name, '变红']);
      console.log('  ✅ ' + inj.name + ' 删条后脱离 covert_deception');
    } else {
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]);
      green++;
      console.log('  ⚠️  ' + inj.name + ' 探针崩溃: ' + String(e.message).split('\n')[0].slice(0, 160));
    }
  }
}

// 无独占样本判据的存在性断言
console.log('\n--- 存在性断言（无独占样本的兜底判据，D5b/D5j）---');
for (const [id, needle, comment] of PRESENCE) {
  const okNeedle = SRC.indexOf(needle.replace(/\\\\/g, '\\')) >= 0;
  const okComment = SRC.indexOf(comment) >= 0;
  const ok = okNeedle && okComment;
  if (ok) { red++; results.push([id + ' 存在性', '字面量与注释仍在位']); console.log('  ✅ ' + id + ' 判据仍在位（字面量+注释）'); }
  else { green++; results.push([id + ' 存在性', '未找到: needle=' + okNeedle + ' comment=' + okComment]); console.log('  ❌ ' + id + ' 判据缺失'); }
}

console.log('\n════ 第69轮负例守卫: ' + red + ' 变红 / ' + green + ' 未变红 ════');
process.exit(green === 0 && red === INJECTIONS.length + PRESENCE.length ? 0 : 1);
