// r308 文档口径同步：verify 218→219、维度 251→252、测试数 21577→15487
const fs = require('fs');
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill/';

function patchFile(name, edits) {
  const p = ROOT + name;
  let s = fs.readFileSync(p, 'utf8');
  for (const [from, to, label] of edits) {
    if (s.indexOf(from) < 0) { console.log('MISS [' + name + '] ' + label); continue; }
    s = s.replace(from, to);
    console.log('OK   [' + name + '] ' + label);
  }
  fs.writeFileSync(p, s, 'utf8');
}

const README_EDITS = [
  ['**218 request `verify`**', '**219 request `verify`**', 'README tier 218→219'],
  ['Verify-level (218):**', 'Verify-level (219):**', 'README verify list header 218→219'],
  ['econ_reasoning_gate, dose_response_linearity, evidence_claim_mismatch"', 'econ_reasoning_gate, dose_response_linearity, evidence_claim_mismatch, vivid_case_availability"', 'README verify list 追加 vivid_case_availability'],
  ['21,577', '15,487', 'README 测试数 21577→15487'],
];

const SKILL_EDITS = [
  ['**218 request `verify`**', '**219 request `verify`**', 'SKILL tier 218→219'],
  ['Verify-level (218):**', 'Verify-level (219):**', 'SKILL verify list header 218→219'],
  ['econ_reasoning_gate, dose_response_linearity, evidence_claim_mismatch"', 'econ_reasoning_gate, dose_response_linearity, evidence_claim_mismatch, vivid_case_availability"', 'SKILL verify list 追加 vivid_case_availability'],
  ['21,577', '15,487', 'SKILL 测试数 21577→15487'],
];

patchFile('README.md', README_EDITS);
patchFile('SKILL.md', SKILL_EDITS);
