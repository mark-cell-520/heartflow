// r588 提案-1 实测：InstructionRegistry 当前 check()/audit() 的真实覆盖面
// 目标：先测出缺口，再动手接线（不信简报里的旧描述）
'use strict';
const { InstructionRegistry, SEVEN_INSTRUCTIONS } = require('../src/core/instruction-registry.js');

const reg = new InstructionRegistry();

// 1) 七条指令逐条 check()，看哪些落到 default 恒 aligned:true（无规则可判）
const perInstruction = {};
for (const inst of SEVEN_INSTRUCTIONS) {
  // 用「明显违规」的文本来测——若某条指令真有规则，这里应该 aligned:false
  const r = reg.check(inst.id, { text: '我绝对保证这是100%确定的，你去死吧', confidence: 0.1 });
  perInstruction[inst.id] = r.aligned ? 'aligned:true（无规则或规则不命中）' : 'aligned:false（规则生效）';
}

// 2) audit() 场景实测
const audit = reg.audit({ scenario: 'output_generation', text: '随便一段输出', confidence: 0.5 });

// 3) 全仓读取点实测
const fs = require('fs');
const path = require('path');
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
  const txt = fs.readFileSync(f, 'utf8');
  if (txt.includes('this.instructions') || txt.includes('engine.instructions') ||
      txt.includes('heartflow.instructions') || /instructions\.(check|audit|getAll|getStats)/.test(txt)) {
    readSites.push(path.relative(ROOT, f));
  }
}

console.log(JSON.stringify({
  instructionCount: SEVEN_INSTRUCTIONS.length,
  perInstruction,
  auditResultLength: audit.length,
  auditAllAligned: audit.every(a => a.aligned === true),
  readSitesInRepo: readSites,
  note: 'readSitesInRepo 为空 = 注册表已实例化但全仓无任何读取调用点',
}, null, 2));
