/** negative-test-bad-faith-feigned-discussion-round52.js — 负例验证（第 52/53 轮）
 * 把第52轮新增的 4 条正则逐条删掉，守卫必须变红（断言失败，不能加载崩溃）。
 */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

const BLOCK_START = SRC.indexOf('BADFAITH_DISGUISE_ZH');
if (BLOCK_START < 0) throw new Error('未找到第52轮 bad_faith 新增块');
const BLOCK = SRC.slice(BLOCK_START, BLOCK_START + 5000);

function extractRegex(anchor) {
  const i = BLOCK.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const start = BLOCK.lastIndexOf('/', i);
  const end = BLOCK.indexOf('/i', i);
  if (start < 0 || end < 0 || end < start) throw new Error('无法定位正则边界: ' + anchor);
  return BLOCK.slice(start, end + 2);
}

// 每条 probe 只依赖被删的那条正则命中（disguise × attack 共现）
const INJECTIONS = [
  {
    name: '删伪装判据中文（BADFAITH_DISGUISE_ZH）',
    anchor: '我不是要?抬杠',
    probe: '就事论事地说，你这套逻辑根本站不住脚',
  },
  {
    name: '删攻击判据中文（BADFAITH_ATTACK_ZH）',
    anchor: '立场有问题',
    probe: '我不是要抬杠，但你这个观点确实立场有问题，不够客观',
  },
  {
    name: '删伪装判据英文（BADFAITH_DISGUISE_EN）',
    anchor: "just (playing|to play|play) devil",
    probe: "Just play devil’s advocate for a second, but you are being irrational about this",
  },
  {
    name: '删攻击判据英文（BADFAITH_ATTACK_EN）',
    anchor: 'irrational|emotional',
    probe: 'I have no stake in this, but your logic is completely biased',
  },
];

const MUST_STILL_HIT = [
  '我不是要抬杠，但你这个观点确实立场有问题，不够客观',
  '就事论事地说，你这套逻辑根本站不住脚',
  'With all due respect, your argument makes no sense here',
  'Objectively speaking, your position is frankly naive',
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
    'for (const s of mustRed) { if (idx.checkBadFaith(s).count === 0) { fail++; console.log("MISS " + s); } }',
    'for (const s of mustHit) { if (idx.checkBadFaith(s).count === 0) { fail++; console.log("BROKE " + s); } }',
    'console.log("PROBE_FAIL=" + fail + "/" + (mustRed.length + mustHit.length));',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function verifyProbeExclusivity() {
  console.log('=== 探针单判据覆盖自检 ===');
  let bad = 0;
  for (const inj of INJECTIONS) {
    const dir = makeCopy(
      path.join(os.tmpdir(), 'hf-s52-chk-' + Buffer.from(inj.name).toString('hex').slice(0, 10)),
      s => {
        let needle;
        try { needle = extractRegex(inj.anchor); } catch (e) { throw e; }
        return s.split(needle).join(NEVER_MATCH);
      }
    );
    try {
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
  results.push([name, '变红（' + (m ? 'fail ' + m[1] + '/' + m[2] : 'fail ?') + '）']);
}

const exclusiveBad = verifyProbeExclusivity();
if (exclusiveBad > 0) console.log('\n⚠️  ' + exclusiveBad + ' 个探针不具备单判据覆盖性');

{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-s52-control'), s => s, true);
  try {
    const out = runProbe(dir, INJECTIONS.map(i => i.probe), []);
    const ok = /PROBE_FAIL=0\//.test(out);
    if (!ok) { console.error('对照副本未全绿：\n' + out); results.push(['对照（未注入）', '未全绿']); }
    else results.push(['对照（未注入）', '全绿']);
  } catch (e) {
    console.error('对照副本崩了: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
    green++;
  }
}

for (const inj of INJECTIONS) {
  let needle;
  try { needle = extractRegex(inj.anchor); }
  catch (e) { results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 60)]); green++; continue; }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-s52-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join(NEVER_MATCH)
  );
  try {
    const out = runProbe(dir, [inj.probe], MUST_STILL_HIT);
    if (/PROBE_FAIL=0\//.test(out)) { green++; results.push([inj.name, '未变红（守卫失守）']); }
    else recordRed(out, inj.name);
  } catch (e) {
    const out = String(e.stdout || '');
    if (/PROBE_FAIL=[1-9]/.test(out)) recordRed(out, inj.name);
    else {
      results.push([inj.name, '探针崩溃（不计红）']);
      green++;
    }
  }
}

console.log('\n=== 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0 && exclusiveBad === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
