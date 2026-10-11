'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(HF, 'src', 'index.js');
const TEST = path.join(HF, 'test', 'round-680-medical-coercion.js');

const md5 = (p) => crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');

function runTest() {
  try {
    execFileSync(process.execPath, [TEST], { cwd: HF, stdio: 'pipe' });
    return { exit: 0, out: '' };
  } catch (e) {
    return { exit: e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

// kind: 'sub' 全文唯一子串替换 / 'dim4' 4 空格缩进整行 / 'dim6' 6 空格缩进整行
const INJECTIONS = [
  {
    name: '计算点置空（mdc 恒 miss）', kind: 'sub',
    needle: 'const mdc = _applyPedagogyRelaxation(checkMedicalCoercion(_normText), "medical_coercion", pedagogyRelaxation);',
    replace: 'const mdc = { hit: false, score: 0, count: 0, detail: "" };',
  },
  {
    name: 'allDims 摘除（score 恒 0，findings 推不进）', kind: 'sub',
    needle: "{score: mdc.score, name:'medical_coercion'},",
    replace: "{score: 0, name:'medical_coercion'},",
  },
  {
    name: 'dimMap 登记摘除', kind: 'dim4',
    needle: 'medical_coercion: mdc,',
    replace: '    medical_coercion: { hit: false, score: 0, count: 0 },',
  },
  {
    name: 'dimensions 补登记摘除', kind: 'dim6',
    needle: 'medical_coercion: mdc,',
    replace: '      medical_coercion: { hit: false, score: 0, count: 0 },',
  },
  {
    name: 'DIM_GUIDANCE 键摘除', kind: 'sub',
    needle: "'medical_coercion': \"不得用",
    replace: "'__negative_probe_guidance': \"不得用",
  },
  {
    name: 'VERIFY_DIMS 登记摘除', kind: 'sub',
    needle: "    'medical_coercion',",
    replace: "    '__negative_probe_verify_dims',",
  },
  {
    name: 'summary 文案摘除', kind: 'sub',
    needle: "      mdc.count ? mdc.count + ' 处医疗自主胁迫' : '',",
    replace: "      '',",
  },
  {
    name: 'module.exports 导出摘除', kind: 'sub',
    needle: '  checkMedicalCoercion,',
    replace: '  __negativeProbeNotExported,',
  },
];

function applyInjection(inj) {
  const lines = fs.readFileSync(SRC, 'utf8').split('\n');
  if (inj.kind === 'sub') {
    const n = lines.join('\n').split(inj.needle).length - 1;
    if (n !== 1) { console.error(`注入失败：子串命中 ${n} 次（要求 1 次）: ${inj.needle.slice(0, 60)}`); process.exit(2); }
    fs.writeFileSync(SRC, lines.join('\n').replace(inj.needle, inj.replace));
    return;
  }
  const indent = inj.kind === 'dim4' ? 4 : 6;
  const hits = [];
  lines.forEach((l, i) => {
    if (l.trim() === inj.needle && l.length - l.trimStart().length === indent) hits.push(i);
  });
  if (hits.length !== 1) { console.error(`注入失败：${indent} 空格整行命中 ${hits.length} 次（要求 1 次）: ${inj.needle.slice(0, 60)}`); process.exit(2); }
  lines[hits[0]] = inj.replace;
  fs.writeFileSync(SRC, lines.join('\n'));
}

const original = fs.readFileSync(SRC);
const originalMd5 = md5(SRC);

// 0) 对照基线：无注入必须 exit 0
const base = runTest();
if (base.exit !== 0) {
  console.error('基线就不是绿的，负例验证无效（先修测试再谈负例）');
  process.exit(2);
}
console.log('基线（无注入）: exit 0 ✅');

let allRed = true;
for (const inj of INJECTIONS) {
  applyInjection(inj);
  const r = runTest();
  fs.writeFileSync(SRC, original);
  if (md5(SRC) !== originalMd5) {
    console.error(`还原失败（md5 不符）: ${inj.name}`);
    fs.writeFileSync(SRC, original);
    process.exit(2);
  }
  const red = r.exit !== 0;
  if (!red) allRed = false;
  console.log(`${red ? '✅ 变红' : '❌ 未变红（假阴性）'} — ${inj.name} (exit ${r.exit})`);
  if (!red) console.log('  测试输出尾部: ' + r.out.split('\n').slice(-3).join(' / '));
}

console.log(allRed ? `结果: ${INJECTIONS.length} 处注入全部变红，守卫有效` : '结果: 存在未变红注入，守卫有盲区');
process.exit(allRed ? 0 : 1);
