/**
 * negative-test-sealioning-polite-trap-round51.js — 负例验证（第 51 轮）
 *
 * 验证 test/sealioning-polite-trap-round51.test.js 真的在守门：
 * 把本轮新增的判据组件逐条删掉，守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * 沿用 negative-test-absolute-claim-en.js 的副本 + 探针架构（三轮踩过的坑）：
 *   ① 不 require 正式测试文件——它 __dirname 钉死真实仓库，副本不会被加载；
 *   ② 副本 VERSION 必须放项目根（gate.js 读 src/../VERSION）；
 *   ③ 注入必须真的改变源码（mutate: s => s 会被判「注入未生效」）；
 *   ④ needle 从源码自取，不手写正则字面量（手写多一层反斜杠 = 全量假阴性）。
 *
 * 第 50 轮新增的教训（本轮直接应用）：
 *   ⑤ 探针必须只被目标判据单独命中——否则删掉目标判据后仍被别的判据
 *      兜底，误报成「不是真守卫」。本文件 INJECTIONS 的每个 probe 都
 *      经过单判据覆盖验证（见 verifyProbeExclusivity 的自检输出）。
 *
 * 注入方式：把整条正则（含首尾斜杠）替换成永不匹配的合法正则 /^$(?!)/。
 * ⚠️ 不能改成注释——那会把 RegExp 变成字符串，探针直接崩，崩溃 ≠ 变红。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER_MATCH = '/^$(?!)/';

// 源码只读一次；锚点定位失败按「未变红」计入（不能假阴性）
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

// 本族新增块的起点（只在块内定位，防止同名子串在别处被误取）
const BLOCK_START = SRC.indexOf('「假礼貌 × 举证要求 × 反咬」耦合判据');
if (BLOCK_START < 0) throw new Error('未找到第51轮 sealioning 新增块（源码被改动过？）');
const BLOCK = SRC.slice(BLOCK_START, BLOCK_START + 6000);

/** 从本族块内按锚点提取整条正则字面量（含首尾斜杠与 flag） */
function extractRegex(anchor) {
  const i = BLOCK.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const start = BLOCK.lastIndexOf('/', i);
  const end = BLOCK.indexOf('/i', i);
  if (start < 0 || end < 0 || end < start) throw new Error('无法定位正则边界: ' + anchor);
  return BLOCK.slice(start, end + 2);
}

/**
 * 注入表：每项 = { name, anchor, probe }
 * probe 经过「单判据覆盖」设计：只依赖被删的那条判据命中，
 * 删掉它守卫必须变红；其余判据不动。
 * （判据组合见 sealioningPoliteTrap：polite/demand/bite/repeat 四信号，
 *   core>=2 出 polite_bait_trap；repeat + core>=1 出 polite_repeat_trap）
 */
const INJECTIONS = [
  {
    name: '删自述礼貌判据（SEAL_POLITE_ZH）',
    anchor: '就事论事',
    // 只有 polite + bite（core=2 → bait）。删 polite 后 core=1 不命中。
    probe: '我很客气地请教你，你答不上来就是在编。',
  },
  {
    name: '删举证要求主判据（SEAL_DEMAND_ZH）',
    anchor: '截图|原文',
    // 只有 polite + demand（core=2 → bait）。删 demand 后 core=1 不命中。
    // ⚠️ 锚点必须取自 SEAL_DEMAND_ZH 自身（截图|原文 是它的独有宾语），
    //    不能用「给个交代」——那是 SEAL_DEMAND_FIX_ZH 的内容，删它不动主判据。
    probe: '我态度很诚恳，只是想请你提供一个来源，这不过分吧？',
  },
  {
    name: '删反咬断言判据（SEAL_BITE_ZH）',
    anchor: '不敢直面',
    // 只有 polite + bite（core=2 → bait）。删 bite 后 core=1 不命中。
    probe: '我没有骂人的意思，你这么激动其实就是理亏了吧？',
  },
  {
    name: '删反复追问判据（SEAL_REPEAT_ZH）',
    anchor: '一直不回答',
    // 只有 polite + repeat（1+0.5 → repeat 分支）。删 repeat 后 core=1 不命中。
    // ⚠️ 这条 probe 刻意不含 bite 词（否则走 bail 分支，删 repeat 不红）。
    probe: '我只是礼貌地问了一遍又一遍，你至于这么大反应吗？',
  },
];

/** 删条后必须「仍然命中」的对照样本（证明注入没把无关判据也打断） */
const MUST_STILL_HIT = [
  '我只是礼貌地请你好歹举一个来源，怎么就成了攻击？你举不出就是你在编。',
  '别误会，我没有攻击你的意思，只是想请你给出处，你给不出就说明在编。',
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

function runProbe(dir, probes, mustHit) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const idx = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const mustRed = ' + JSON.stringify(probes) + ';',
    'const mustHit = ' + JSON.stringify(mustHit) + ';',
    'let fail = 0;',
    'for (const s of mustRed) { if (idx.checkSealioning(s).count === 0) { fail++; console.log("MISS " + s); } }',
    'for (const s of mustHit) { if (idx.checkSealioning(s).count === 0) { fail++; console.log("BROKE " + s); } }',
    'console.log("PROBE_FAIL=" + fail + "/" + (mustRed.length + mustHit.length));',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * 自检：探针单判据覆盖性。
 * 对每个注入项，在**未注入**源码上验证该 probe 命中，且删掉目标判据后不命中。
 * 若某探针被多判据覆盖，这里会先发现（而不是等注入后才误报）。
 */
function verifyProbeExclusivity() {
  console.log('=== 探针单判据覆盖自检（第50轮教训：多判据覆盖会误报） ===');
  let bad = 0;
  for (const inj of INJECTIONS) {
    const dir = makeCopy(
      path.join(os.tmpdir(), 'hf-s51-chk-' + Buffer.from(inj.name).toString('hex').slice(0, 10)),
      s => {
        let needle;
        try { needle = extractRegex(inj.anchor); } catch (e) { throw e; }
        return s.split(needle).join(NEVER_MATCH);
      }
    );
    try {
      // 注入后目标 probe 必须不再命中（MISS 才算真守卫）
      const out = runProbe(dir, [inj.probe], []);
      if (/PROBE_FAIL=0\//.test(out)) {
        console.log('  ⚠️  ' + inj.name + ': 删条后 probe 仍命中 —— 探针被其他判据兜底，需更换');
        bad++;
      } else {
        console.log('  ✅  ' + inj.name + ': 删条后 probe 落空（真守卫）');
      }
    } catch (e) {
      const out = String(e.stdout || '');
      if (/PROBE_FAIL=[1-9]/.test(out)) {
        console.log('  ✅  ' + inj.name + ': 删条后 probe 落空（真守卫）');
      } else {
        console.log('  ⚠️  ' + inj.name + ': 探针崩溃 ' + String(e.message).split('\n')[0].slice(0, 120));
        bad++;
      }
    }
  }
  return bad;
}

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/PROBE_FAIL=(\d+)\/(\d+)/);
  const detail = m ? ('fail ' + m[1] + '/' + m[2]) : 'fail ?';
  results.push([name, '变红（' + detail + '）']);
}

// ① 探针单判据覆盖自检（先做——避免注入结果误报）
const exclusiveBad = verifyProbeExclusivity();
if (exclusiveBad > 0) {
  console.log('\n⚠️  ' + exclusiveBad + ' 个探针不具备单判据覆盖性，先修探针再跑注入（不记假阴性）');
}

// ② 对照副本：未注入必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-s51-control'), s => s, true);
  try {
    const out = runProbe(dir, INJECTIONS.map(i => i.probe), MUST_STILL_HIT);
    const ok = /PROBE_FAIL=0\//.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
  }
}

// ③ 逐个注入：守卫必须变红
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
    path.join(os.tmpdir(), 'hf-s51-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join(NEVER_MATCH)
  );
  try {
    const out = runProbe(dir, [inj.probe], MUST_STILL_HIT);
    if (/PROBE_FAIL=0\//.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      recordRed(out, inj.name);
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/PROBE_FAIL=[1-9]/.test(out)) {
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

console.log('\n=== 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0 && exclusiveBad === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
