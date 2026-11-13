// r308 补丁：SKILL verify list 213→219、AGENTS 218→219，均追加 vivid_case_availability
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

const TAIL_OLD = 'econ_reasoning_gate, dose_response_linearity, evidence_claim_mismatch';
const TAIL_NEW = 'econ_reasoning_gate, dose_response_linearity, evidence_claim_mismatch, vivid_case_availability';

patchFile('SKILL.md', [
  ['**Verify-level (213):**', '**Verify-level (219):**', 'SKILL verify list header 213→219'],
  [TAIL_OLD, TAIL_NEW, 'SKILL verify list 追加 vivid_case_availability'],
]);

patchFile('AGENTS.md', [
  ['**Verify-level (218):**', '**Verify-level (219):**', 'AGENTS verify list header 218→219'],
  [TAIL_OLD, TAIL_NEW, 'AGENTS verify list 追加 vivid_case_availability'],
  ['**218 request `verify`**', '**219 request `verify`**', 'AGENTS tier 218→219'],
]);
