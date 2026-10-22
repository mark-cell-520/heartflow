/**
 * negative-test-appeal-to-ignorance-wiring.js — 负例守卫（第 62 维度）
 *
 * 验证 src/index.js 的接线点真的承重：逐个注入破坏接线点，守卫必须变红。
 * 每个注入点有各自的「承重判据」，不是一律看 gate（否则被其他维度兜住时
 * 会出现假阴性——这正是第一版跑出的 ③④ 未变红）：
 *
 *   ① pipeline 调用行  → findings 里必须还有 appeal_to_ignorance 归因
 *   ② allDims 登记     → findings 里必须还有 appeal_to_ignorance 归因
 *   ③ dimMap 登记      → discriminate().dimensions.appeal_to_ignorance 必须可查
 *   ④ VERIFY_DIMS 登记 → gate.action 必须为 verify（不得降 pass）
 *
 * 全部注入在 /tmp 副本上进行，绝不动真实仓库源码。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const PROBE_ZH = '没人能证明这个方案有问题，所以可以放心上';
const PROBE_EN = 'You cannot prove this is wrong, therefore it is right.';

// 在副本里评估四项承重判据
function evalInCopy(copyRoot) {
  const out = execFileSync(process.execPath, ['-e', `
    const { gate, discriminate } = require(${JSON.stringify(path.join(copyRoot, 'src', 'gate.js'))});
    const probes = ${JSON.stringify([PROBE_ZH, PROBE_EN])};
    let dimHits = 0, actionOk = 0, regOk = 0;
    for (const p of probes) {
      const g = gate(p);
      const dims = (g.findings || []).map(f => f.dimension);
      if (dims.includes('appeal_to_ignorance')) dimHits++;
      if (g.gate.action === 'verify') actionOk++;
      const d = discriminate(p);
      const reg = d.dimensions && d.dimensions.appeal_to_ignorance;
      if (reg && reg.score > 0) regOk++;
    }
    console.log('RESULT:' + JSON.stringify({ dimHits, actionOk, regOk, total: probes.length }));
  `], { cwd: copyRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const line = out.split('\n').filter(l => l.startsWith('RESULT:')).pop();
  return JSON.parse(line.slice(7));
}

// 建一份隔离副本（不含 node_modules，src 全部拷贝）
function makeCopy(tag) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-neg62-' + tag + '-'));
  fs.cpSync(path.join(HF, 'src'), path.join(root, 'src'), { recursive: true });
  fs.cpSync(path.join(HF, 'test'), path.join(root, 'test'), { recursive: true });
  fs.cpSync(path.join(HF, 'bin'), path.join(root, 'bin'), { recursive: true });
  for (const f of ['VERSION', 'package.json']) {
    const src = path.join(HF, f);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(root, f));
  }
  return root;
}

const INJECTIONS = [
  {
    name: '① 删 pipeline 调用行（checkAppealToIgnorance 不再被调用）',
    judge: r => r.dimHits !== r.total,
    mutate(s) {
      return s.replace(
        /const aig = _applyPedagogyRelaxation\(checkAppealToIgnorance\(_normText\), "appeal_to_ignorance", pedagogyRelaxation\);[^\n]*/,
        'const aig = { score: 0, count: 0 };');
    },
  },
  {
    name: '② 删 allDims 登记（findings 不再收录）',
    judge: r => r.dimHits !== r.total,
    mutate(s) {
      return s.replace(
        /\{\s*score: aig\.score, name:'appeal_to_ignorance'\},[^\n]*\n(?:\s*\/\/[^\n]*\n)*/,
        '');
    },
  },
  {
    name: '③ 删 dimMap + dimensions 两处登记（discriminate.dimensions 查不到）',
    judge: r => r.regOk !== r.total,
    mutate(s) {
      // 第 778 行 dimMap（gate 内部维度表）与第 1216 行 dimensions（返回值登记表）
      // 两处都删，才等于真正断链（只删一处另一处仍可查 → 假阴性）
      let out = s.replace(
        /\n    \/\/ \[v6\.8\.4\] 第 62 维度：诉诸无知 \/ 举证责任倒置\n    appeal_to_ignorance: aig\n  \};/,
        '\n  };');
      out = out.replace(
        /\n      \/\/ \[v6\.8\.4\] 第 62 维度：诉诸无知 \/ 举证责任倒置\n      appeal_to_ignorance: aig,/,
        '');
      return out;
    },
  },
  {
    name: '④ 删 VERIFY_DIMS 登记（gate 从 verify 降 pass）',
    judge: r => r.actionOk !== r.total,
    mutate(s) {
      return s.replace(
        /,\n    \/\/ \[v6\.8\.4\] 第 62 维度：诉诸无知 \/ 举证责任倒置（verify 级——需主张方\n    \/\/ 自己给出正面证据；单句也可能是案例分析\/谬误评述，rewrite 会误伤）。\n    'appeal_to_ignorance',(?=\n  \]\);)/,
        '');
    },
  },
];

// 控制组：原样副本必须四项全成立（否则注入结论不可信）
const controlRoot = makeCopy('control');
const control = evalInCopy(controlRoot);

let okCount = 0, failCount = 0;
const fails = [];

console.log('负例守卫 — 第 62 维度 appeal_to_ignorance 接线承重验证');
console.log('控制组（未注入副本）: ' + JSON.stringify(control));

if (control.dimHits === control.total && control.actionOk === control.total &&
    control.regOk === control.total) {
  okCount++;
  console.log('  控制组基线成立（未注入即全命中）');
} else {
  failCount++;
  fails.push('控制组基线不成立，注入结论不可信: ' + JSON.stringify(control));
}

for (const inj of INJECTIONS) {
  const root = makeCopy('inj');
  const idxPath = path.join(root, 'src', 'index.js');
  const src = fs.readFileSync(idxPath, 'utf8');
  const mutated = inj.mutate(src);
  if (mutated === src) {
    failCount++;
    fails.push(inj.name + ' — 注入未生效（锚点过期）');
    console.log('  x ' + inj.name + ' — 注入未生效（锚点过期）');
    try { fs.rmSync(root, { recursive: true, force: true }); } catch (_) {}
    continue;
  }
  fs.writeFileSync(idxPath, mutated);
  let red = false;
  let detail = '';
  try {
    const r = evalInCopy(root);
    red = inj.judge(r);
    detail = JSON.stringify(r);
  } catch (e) {
    red = true; // 崩溃也视为变红（守卫确实依赖该接点）
    detail = 'load-crash: ' + String(e.message).slice(0, 80);
  }
  if (red) { okCount++; console.log('  变红 ' + inj.name + ' (' + detail + ')'); }
  else { failCount++; fails.push(inj.name + ' — 未变红 (' + detail + ')'); console.log('  x 未变红 ' + inj.name + ' (' + detail + ')'); }
  try { fs.rmSync(root, { recursive: true, force: true }); } catch (_) {}
}

try { fs.rmSync(controlRoot, { recursive: true, force: true }); } catch (_) {}

console.log('─'.repeat(52));
console.log('结果: ' + okCount + ' 通过, ' + failCount + ' 失败');
if (failCount) {
  for (const f of fails) console.log('  x ' + f);
  process.exit(1);
}
console.log('全部接线点承重验证通过');
