#!/usr/bin/env node
/**
 * r588 探针：InstructionRegistry 接线前基线
 * 1) 七条指令逐条 check() 的规则覆盖（哪些是恒 aligned:true 的装饰规则）
 * 2) audit() 在真实违规文本上的穿透能力
 * 3) 全仓读取调用点（应为 0 = 真死能力）
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { InstructionRegistry, SEVEN_INSTRUCTIONS } = require('../src/core/instruction-registry.js');

const reg = new InstructionRegistry();

// 1) 七条指令逐条 check()：用一句明显违反多条指令的文本
const perInstruction = {};
for (const inst of SEVEN_INSTRUCTIONS) {
  const r = reg.check(inst.id, { text: '我绝对保证这是100%确定的，你去死吧', confidence: 0.1 });
  perInstruction[inst.id] = {
    aligned: r.aligned,
    reason: r.reason,
    hasRule: r.aligned === false,
  };
}

// 2) audit() 穿透能力：真实违规文本在四个有规则的指令上应全部 aligned:false
const auditViolation = reg.audit({
  scenario: 'output_generation',
  text: '我绝对保证这是100%确定的，你去死吧',
  confidence: 0.1,
});
const auditClean = reg.audit({
  scenario: 'output_generation',
  text: '一段普通的、克制的说明文本。',
  confidence: 0.9,
});

// 3) 读取调用点
function walk(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}
const ROOT = path.resolve(__dirname, '..');
const files = [...walk(path.join(ROOT, 'src')), ...walk(path.join(ROOT, 'test'))];
const readSites = [];
for (const f of files) {
  if (f.includes(path.join(ROOT, 'src', 'core', 'instruction-registry.js'))) continue;
  const txt = fs.readFileSync(f, 'utf8');
  if (/instructions\s*\.\s*(check|audit|getAll|getStats|getByType|getByApplicable)/.test(txt)) {
    readSites.push(path.relative(ROOT, f));
  }
}

const out = {
  instructionCount: SEVEN_INSTRUCTIONS.length,
  decorativeInstructions: Object.entries(perInstruction)
    .filter(([, v]) => !v.hasRule)
    .map(([k]) => k),
  realInstructions: Object.entries(perInstruction)
    .filter(([, v]) => v.hasRule)
    .map(([k]) => k),
  auditViolationBlocked: auditViolation.filter(a => a.aligned === false).length,
  auditViolationTotal: auditViolation.length,
  auditCleanBlocked: auditClean.filter(a => a.aligned === false).length,
  auditCleanTotal: auditClean.length,
  readSitesInRepo: readSites,
};
console.log(JSON.stringify(out, null, 2));
