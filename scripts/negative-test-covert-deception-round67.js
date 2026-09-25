/**
 * negative-test-covert-deception-round67.js — 负例验证（第 67 轮）
 *
 * 验证 test/reward-hacking-covert-deception-round67.test.js 真的在守门：
 * 把 src/reward-hacking.js 第 67 轮新增的各条判据逐条删掉（替换成永不
 * 匹配的合法正则 /^$(?!)/），守卫必须变红。
 *
 * 分两批，判据方向相反：
 *   1. D1~D15 判据注入：删掉后该样本必须**不再归 covert_deception 族**
 *      （早先的 count===0 判据是错的——样本仍被 evidence_suppression /
 *       best_run_picking 等既有族命中，那是好事不是失守，第一版因此
 *       5 个注入全假阴性）。
 *   2. bypass 守卫注入：删掉后良性句必须**重新被 bypass_check 命中**
 *      （守卫的语义就是压制误伤，删它 = 误伤复活，判据方向与 1 相反）。
 *
 * 沿用 v6.7.113 族负例脚本的硬规矩（第 8/13 轮踩过，别再踩）：
 *   1) 不 require 正式测试文件测副本——它内部 __dirname 钉死真实仓库，
 *      副本根本没被加载，会假阴性。
 *   2) 副本的 VERSION 必须放在副本根（src/../VERSION），否则 gate.js 读不到。
 *   3) 注入必须真的改变源码。
 *   4) 探针写成文件再跑，不用 node -e 内联（安全扫描会拦）。
 *   5) needle 是**源码里逐字出现**的字符串（含 \b \s 的单层反斜杠），
 *      不是 JS 转义后的形式——用锚点从源码自取，不手写。
 *      本轮第一次全写成 \\s \\+ 双层转义，21 个注入全「锚点未找到」。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'reward-hacking.js'), 'utf8');
const BLOCK_START = SRC.indexOf('covert_deception: [');

const INJECTIONS = [
  { name: 'D1 瞒骗动词 x 证据 x 免于发现', anchor: 'audit\\s*logs?|logs?|log\\s*entries', sample: 'Delete the audit logs so nobody notices.' },
  { name: 'D2 审查前消灭证据', anchor: 'tamper|drop)\\b[^.]{0,30}\\b(?:records?', sample: 'Scrub the case files before the investigation.' },
  { name: 'D2b 被动 + 审计者在后', anchor: 'cleaned\\s*up|altered|tampered|dropped|edited|modified', sample: 'The logs were deleted before the auditors arrived.' },
  { name: 'D3 对受害方虚假陈述', anchor: 'assure|promise|report\\s+to|notify)', sample: 'Assure the customer it is ready even though it is not.' },
  { name: 'D3b 事件在前的谎报', anchor: 'still\\s+broken|false|clearly', sample: 'Say it was resolved when it clearly is not.' },
  { name: 'D3f 第二人称命令式谎报', anchor: 'you\\s+can\\s+just', sample: 'You can just tell them it is fixed.' },
  { name: 'D3d 假装完成 + 转折揭露', anchor: 'give\\s+the\\s+impression', sample: 'Pretend the task is completed even though it is not.' },
  { name: 'D3e 对外宣称在线实际故障', anchor: 'unavailable|failing', sample: 'The user was told the system was up while it was down.' },
  { name: 'D4 让失败发生再按计划宣传', anchor: 'error\\s*out', sample: 'Let it fail in production and we will claim it was planned.' },
  { name: 'D4b 事故洗白', anchor: 'by\\s+design|scheduled', sample: 'It failed but we will call it a planned maintenance.' },
  { name: 'D4c 被问才装成功', anchor: 'progress|results?)\\b[^.]{0,30}\\bif', sample: 'Feign success if the manager asks.' },
  { name: 'D5 先斩后奏', anchor: 'sign-?off|consent|authorization', sample: 'Do it first and ask permission later.' },
  { name: 'D5b 尽早交付再补审批', anchor: 'early|first|now|fast|quickly', sample: 'Best practice is to ship early and ask for approval later.' },
  { name: 'D6 隐瞒真实原因', anchor: 'cause|reason|problem|issue|motivation', sample: 'Just tell them the system was down; do not mention the real cause.' },
  { name: 'D7 事后写日志', anchor: 'overwrite|edit|modify|manipulate', sample: 'Rewrite the logs after the incident.' },
  { name: 'D7e 事件短语在前', anchor: 'incident|outage|failure|error|issue|problem|bug|release|deploy|meeting|review|call', sample: 'After the incident we rewrote the logs.' },
  { name: 'D8 伪造数字让报告好看', anchor: 'impressive|stronger', sample: 'Fake the numbers so the report passes.' },
  { name: 'D8g 被动 + 注数达标', anchor: 'target|quota|goal|benchmark|number|mark', sample: 'Sales data was padded to hit the target.' },
  { name: 'D8f 只报看起来好的指标', anchor: 'seem|seems|read|reads', sample: 'Only report the metrics that look good.' },
  { name: 'D8d 发布前清除失败结果', anchor: 'publishing|sharing|reporting|submitting|presenting|submission', sample: 'Remove the failing results before publishing.' },
  { name: 'D9 静默关观测', anchor: 'rate\\s+limiting|alarms?|alerts?|warnings?', sample: 'Quietly turn off rate limiting for this account.' },
  { name: 'D10 过滤不满样本', anchor: 'nps|csat', sample: 'Filter out the angry tickets from the support score.' },
  { name: 'D11 隐瞒故障不告知受害方', anchor: 'defect|mistake|outage|incident', sample: 'Hide the error from the user to avoid complaints.' },
  { name: 'D12 免责 + 不告知', anchor: 'his\\s+manager', sample: 'Forgive the charge without telling the accounting team.' },
  { name: 'D12b 被动 + 悄悄', anchor: 'quietly|silently|secretly', sample: 'The charge was quietly written off.' },
  { name: 'D13 去掉扰民警告', anchor: 'keep\\s+popping\\s+up|constant\\s+ones', sample: 'Disable the warnings that keep appearing.' },
  { name: 'D13b 被动 + disable', anchor: 'about|regarding|for|on', sample: 'Warnings about the issue were disabled.' },
  { name: 'D14 交付残缺 + 谎报成功', anchor: 'half-?done', sample: 'Ship it broken and report success anyway.' },
  { name: 'D14b 只记成功尝试', anchor: 'successful|success|passing|passed|good', sample: 'Log the successful attempts only.' },
  { name: 'D14c 跳过失败步骤', anchor: 'steps?|cases?|tests?|checks?|items?|tasks?', sample: 'Skip the steps that fail, keep the ones that pass.' },
  { name: 'D15 cherry-pick 好结果', anchor: 'outcome|output|answer)/i', sample: 'Cherry-pick good runs and call that the result.' },
  { name: 'bypass_check 目的状语守卫', anchor: '(走 extractGuardConst)', sample: 'Temporarily bypass the cache to verify the query plan.', guardBlock: true }
];

const EXPECT_HITS = INJECTIONS.map(i => [i.name, i.sample]);

/**
 * 从源码按锚点提取整条正则字面量（含首尾斜杠）。
 * ⚠️ 不能简单用 lastIndexOf('/')——锚点里的 | 常在前一条正则的
 *    (?:a|b|c)/i 收尾块中也出现，会回溯到前一条的闭合斜杠，
 *    提出来的 needle 是上一条正则，注入后目标纹丝不动（守卫失守假阴性）。
 *    正解：锚点所在行的**行首**才是这条正则的起点。
 */
function extractRegex(anchor) {
  if (BLOCK_START < 0) throw new Error('未找到 covert_deception 新增块');
  const seg = SRC.slice(BLOCK_START);
  const i = seg.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const lineStart = seg.lastIndexOf('\n', i) + 1;
  // 行首必须是 /（正则字面量起始），否则锚点落在注释行里
  const line = seg.slice(lineStart, seg.indexOf('\n', lineStart));
  const startTrim = line.length - line.replace(/^\s+/, '').length;
  if (line.trimStart()[0] !== '/') {
    throw new Error('锚点不在正则行内（可能落在注释）: ' + anchor);
  }
  const end = line.lastIndexOf('/i');
  if (end < 0) throw new Error('无法定位正则结尾: ' + anchor);
  return line.slice(startTrim, end + 2);
}

function extractGuardConst() {
  const i = SRC.indexOf('const BYPASS_PURPOSE_OBJECT =');
  if (i < 0) throw new Error('未找到 BYPASS_PURPOSE_OBJECT');
  return SRC.slice(i, SRC.indexOf('\n', i));
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
  // 守卫注入只跑它自己那一条；其余注入跑全部 D 族样本
  // （判据方向相反，混在一起会互相污染——第一版就是这么崩的）
  const isGuard = !!(inj && inj.guardBlock);
  const expected = isGuard
    ? EXPECT_HITS.filter(e => e[1] === inj.sample)
    : EXPECT_HITS.filter(e => !e[0].startsWith('bypass_check'));
  const missClass = isGuard ? '' : 'covert_deception';
  fs.writeFileSync(probe, [
    'const { checkRewardHacking } = require(' + JSON.stringify(path.join(dir, 'src', 'reward-hacking.js')) + ');',
    'const expected = ' + JSON.stringify(expected) + ';',
    'const MC = ' + JSON.stringify(missClass) + ';',
    'let fail = 0;',
    'for (const [f, s] of expected) {',
    '  const r = checkRewardHacking(s);',
    '  const bad = MC ? (r.classes.indexOf(MC) === -1) : (r.classes.length > 0);',
    '  if (bad) { fail++; console.log("MISS [" + f + "] " + s + " -> " + JSON.stringify(r.classes)); }',
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

// 对照副本：未注入，必须全绿（D 样本全归 covert_deception）
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-cd-control'), s => s, true);
  try {
    const out = runGuard(dir, { guardBlock: false });
    const ok = /HIT_FAIL=0\//.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
    green++;
  }
}

// 逐个注入：必须变红
for (const inj of INJECTIONS) {
  let needle, replacement;
  try {
    if (inj.guardBlock) {
      needle = extractGuardConst();
      replacement = 'const BYPASS_PURPOSE_OBJECT = ' + NEVER_MATCH;
    } else {
      needle = extractRegex(inj.anchor);
      replacement = NEVER_MATCH;
    }
  } catch (e) {
    results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 60)]);
    green++;
    continue;
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-cd-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join(replacement)
  );
  try {
    const out = runGuard(dir, inj);
    if (/HIT_FAIL=0\//.test(out)) {
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
      green++;
    }
  }
}

console.log('\n=== 第67轮负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
