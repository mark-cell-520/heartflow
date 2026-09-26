/**
 * negative-test-decision-ratio-gap-round99.js — 负例验证（v6.7.128 第 99 轮）
 *
 * 验证第 99 轮新增的 x/y 实测数字解析通道真的在守门：
 * 把 src/core/decision.js 的每段通道代码改写成失效形态（正则失配 / 通道返回 null），
 * 定向能力必须变红（候选从「能区分」退回「并列」）。
 *
 * ⚠️ 注入点全部取自 `[v6.7.128 第 99 轮]` 注释块内（第 95/96/97/98 轮同名族
 *    教训：全局 indexOf 会删到别处的行）。本文件只碰 decision.js 一处。
 *
 * 5 个注入点：
 *   ① 删 RATIO_ANCHOR 语义锚点（改成永不匹配）→ 所有 x/y 比例失效
 *   ② 删覆盖率百分比正则（改成永不匹配）→ 百分比通道失效，x/y 应仍能区分
 *   ③ 删 x/y 比例正则 → 比例通道失效，百分比应仍能区分（两条互为正交）
 *   ④ 通道整体禁用（ratioBonus 恒 0）→ 词表路径仍在，但数字不再贡献排序
 *   ⑤ 删「多比例取最大缺口」的 max 比较 → 取错比例时排序应失真
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER = '$^';  // 永不匹配的合法正则体
const SRC_PATH = path.join(HF, 'src', 'core', 'decision.js');
const SRC = fs.readFileSync(SRC_PATH, 'utf8');

const BLOCK = SRC.indexOf('[v6.7.128 第 99 轮]');
if (BLOCK < 0) throw new Error('未找到第 99 轮新增块');

// 每个注入点的行内锚点（在本轮块内定位，逐字）
const INJECTIONS = [
  {
    name: '① 删 RATIO_ANCHOR 语义锚点',
    anchor: 'const RATIO_ANCHOR = /',
    mutate: (s) => {
      const seg = s.slice(BLOCK);
      const re = /const RATIO_ANCHOR = \/\([\s\S]*?\)\/;/;
      const m = seg.match(re);
      if (!m) throw new Error('RATIO_ANCHOR 正文字面量未定位到');
      return s.replace(m[0], 'const RATIO_ANCHOR = /' + NEVER + '/;');
    },
    // 判定：detect 0/3 vs 2/8 vs 5/8 必须退回并列（全部回到词表默认值）
    expectTie: true,
  },
  {
    name: '② 删覆盖率百分比通道',
    anchor: 'const pct = text.match(',
    mutate: (s) => {
      const seg = s.slice(BLOCK);
      const re = /const pct = text\.match\([\s\S]*?\);/;
      const m = seg.match(re);
      if (!m) throw new Error('pct match 正文字面量未定位到');
      return s.replace(m[0], 'const pct = null;');
    },
    // 百分比失效后：含 x/y 的候选仍可区分，但纯百分比候选必须并列
    expectTie: true,
  },
  {
    name: '③ 删 x/y 比例正则',
    anchor: 'const re = /([0-9]{1,3})',
    mutate: (s) => {
      const seg = s.slice(BLOCK);
      const re = /const re = \/\(\[0-9\]\{1,3\}\)[\s\S]*?\/g;/;
      const m = seg.match(re);
      if (!m) throw new Error('比例正文字面量未定位到');
      return s.replace(m[0], 'const re = /' + NEVER + '/g;');
    },
    expectTie: true,
  },
  {
    name: '④ 通道整体禁用（ratioBonus 恒 0）',
    anchor: 'const ratioBonus = ratioGap',
    mutate: (s) => {
      const seg = s.slice(BLOCK);
      const re = /const ratioBonus = ratioGap \? Math\.min\(0\.35, ratioGap\.gap \* 0\.35\) : 0;/;
      const m = seg.match(re);
      if (!m) throw new Error('ratioBonus 表达式未定位到');
      return s.replace(m[0], 'const ratioBonus = 0;');
    },
    expectTie: true,
  },
  {
    name: '⑤ 删「多比例取最大缺口」比较',
    anchor: 'if (best === null || gap > best.gap)',
    mutate: (s) => {
      const seg = s.slice(BLOCK);
      const re = /if \(best === null \|\| gap > best\.gap\) best = \{ gap, source: 'ratio', x, y \};/;
      const m = seg.match(re);
      if (!m) throw new Error('best 比较语句未定位到');
      // 改成「取第一个比例」：候选 A 的第一个比例 7/8（缺口小）会盖掉
      // 后面的 0/4（缺口大）→ gap A(0.125) < gap B(0.25) → 排序必须翻转为 B。
      // ⚠️ 探针必须让每个候选含两个以上比例，否则「取最大」与「取第一个」
      //    结果相同、守卫假阴性（本轮首版踩过：单比例探针 1/5 未变红）。
      return s.replace(m[0], 'if (best === null) best = { gap, source: \'ratio\', x, y };');
    },
    expectFlip: true,
  },
];

// 探针：判定「通道是否还在工作」
// 每项判据 = [描述, prompt, 期望 chosen]。通道失效时 chosen 应变成 null 或翻转。
const PROBES = [
  {
    key: 'ratio',
    desc: 'x/y 三类缺口（0/3、2/8、5/8）',
    prompt: [
      '[A] decision x/y 解析：detect 0/3',
      '[B] victim_blaming EN：detect 2/8',
      '[C] moral_foundations EN：detect 5/8',
    ].join('\n'),
    healthyChosen: 'A',
  },
  {
    key: 'percent',
    desc: '覆盖率 10% / 60% / 90%',
    prompt: [
      '[A] 修 decision：覆盖率 10%，剩余大量边界未覆盖',
      '[B] 修 decision：覆盖率 60%，常见形态已覆盖',
      '[C] 修 decision：覆盖率 90%，只剩边角',
    ].join('\n'),
    healthyChosen: 'A',
  },
  {
    key: 'multi',
    desc: '多比例取最大缺口（每候选两个比例：7/8 与 0/4）',
    prompt: [
      '[A] 修 decision 解析：detect 7/8 主链路通过，detect 0/4 英文侧漏判',
      '[B] 修 decision 解析：detect 2/3 主链路通过，detect 1/4 英文侧漏判',
    ].join('\n'),
    healthyChosen: 'A',
  },
];

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const target = path.join(dir, 'src', 'core', 'decision.js');
  const before = fs.readFileSync(target, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(target, after);
  return dir;
}

function runProbe(dir) {
  const probe = path.join(dir, '_probe99.js');
  fs.writeFileSync(probe, [
    'const { HeartFlowDecision } = require(' + JSON.stringify(path.join(dir, 'src', 'core', 'decision.js')) + ');',
    'const d = new HeartFlowDecision(null);',
    'const probes = ' + JSON.stringify(PROBES) + ';',
    'const lines = [];',
    'for (const p of probes) {',
    '  let out;',
    '  try {',
    '    const r = d.decide({ task: "选方向", prompt: p.prompt });',
    '    out = r.chosen === null ? "TIE" : String(r.chosen);',
    '  } catch (e) { out = "CRASH:" + e.message; }',
    '  lines.push(p.key + "=" + out);',
    '}',
    'console.log(lines.join(" "));',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function parse(out) {
  const res = {};
  for (const kv of out.trim().split(/\s+/)) {
    const i = kv.indexOf('=');
    if (i > 0) res[kv.slice(0, i)] = kv.slice(i + 1);
  }
  return res;
}

// 通道存活时的正确输出：全部等于 healthyChosen
const HEALTHY = {};
for (const p of PROBES) HEALTHY[p.key] = p.healthyChosen;

const results = [];
let red = 0, problem = 0;

// ① 对照副本：未注入 → 必须全部等于 healthyChosen
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-dec99-control'), s => s, true);
  let got;
  try {
    got = parse(runProbe(dir));
  } catch (e) {
    got = {};
    results.push(['对照（未注入）', '探针崩溃: ' + String(e.stdout || e.message).split('\n')[0]]);
    problem++;
  }
  if (Object.keys(got).length && PROBES.every(p => got[p.key] === HEALTHY[p.key])) {
    results.push(['对照（未注入）', '全绿（' + PROBES.map(p => `${p.key}=${got[p.key]}`).join(' ') + '）']);
  } else if (Object.keys(got).length) {
    results.push(['对照（未注入）', '基线异常: ' + JSON.stringify(got)]);
    problem++;
  }
}

// ② 逐个注入：健康状况必须被打破（TIE 或翻转或崩溃均计入「守卫变红」）
for (const inj of INJECTIONS) {
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-dec99-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    inj.mutate
  );
  let got;
  try {
    got = parse(runProbe(dir));
  } catch (e) {
    results.push([inj.name, '变红（探针退出码非 0: ' + String(e.stdout || e.message).split('\n').pop().slice(0, 60) + '）']);
    red++;
    continue;
  }
  const broke = PROBES.some(p => got[p.key] !== HEALTHY[p.key]);
  if (broke) {
    const diff = PROBES.filter(p => got[p.key] !== HEALTHY[p.key])
      .map(p => `${p.key}: ${HEALTHY[p.key]}→${got[p.key]}`).join(', ');
    results.push([inj.name, '变红（' + diff + '）']);
    red++;
  } else {
    results.push([inj.name, '未变红（守卫失守: ' + JSON.stringify(got) + '）']);
    problem++;
  }
}

console.log('\n=== 第 99 轮负例守卫结果（decision 比例通道）===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log(`\n注入 ${INJECTIONS.length} 点：${red} 点让守卫变红，${problem} 个异常`);
const pass = red === INJECTIONS.length && problem === 0;
console.log(pass ? '\n负例守卫通过（每段通道代码都受真守卫）' : '\n负例守卫未通过');
process.exit(pass ? 0 : 1);
