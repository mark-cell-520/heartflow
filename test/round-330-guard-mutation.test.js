// [v6.7.136] 第 330 轮变异守卫：对 r330 三处改动做片段级变异。
// r326 教训：删整行 = 自证，不叫回归测试。一律片段级：
//   · 族 A V8 修复：reach(?:es)? → reaches?（去掉可回溯的非捕获组）
//   · 族 B 判据：删「前置否定」位（never|don't...）→ 直接 next 组
//   · 265 前瞻：删放行条件词族（embargo|announce|...）
// 变异后守卫必须分别出现「召回下降」和「误伤上升」。
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'manipulation-tactics.js');
const GUARD = path.join(__dirname, 'round-330-en-coverup-delivery.test.js');

const MUTANTS = [
  {
    name: '族A: reach(?:es)? → reaches?（撤销 V8 回溯修复）',
    mutate: (s) => s.replace('(?:reach(?:es)?|gets?\\s+back\\s+to', '(?:reaches?|gets?\\s+back\\s+to'),
    expect: 'recall_down',
  },
  {
    name: '族B: 删前置否定位（never/don\'t 族）',
    mutate: (s) => s.replace('(?:this|it|that|these|everything|all\\s+of\\s+this|the\\s+(?:issue|problem|incident|defect|fraud|misconduct|report|data|truth|story))\\s+(?:never|don\'?t|does\\s+not|won\'?t|will\\s+not)\\s+(?:reach(?:es)?|get(?:s)?\\s+back\\s+to|gets?\\s+to|go(?:es)?\\s+to)',
      '(?:this|it|that|these|everything|all\\s+of\\s+this|the\\s+(?:issue|problem|incident|defect|fraud|misconduct|report|data|truth|story))\\s+(?:reach(?:es)?|get(?:s)?\\s+back\\s+to|gets?\\s+to|go(?:es)?\\s+to)'),
    expect: 'recall_down',
  },
  {
    name: '265: 删放行条件前瞻词族（embargo|announce|...）',
    mutate: (s) => s.replace('(?![^.]{0,80}\\b(?:before|until|unless)\\b[^.]{0,60}\\b(?:embargo|announce|announcement|launch|release|sign[\\s-]?off|approval|approved|review|qa|publication|go[\\s-]?live|disclos|permission|authoriz))', ''),
    expect: 'fp_up',
  },
];

const original = fs.readFileSync(SRC, 'utf8');
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  OK   ' + msg); } else { fail++; console.log('  FAIL ' + msg); } }

function runGuard() {
  try {
    return { code: 0, out: execFileSync('node', [GUARD], { encoding: 'utf8', timeout: 60000, cwd: path.join(__dirname, '..') }) };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

// 基线
const base = runGuard();
const baseLine = (base.out.match(/attacks \d+\/\d+, benign-FP \d+\/\d+/) || ['?'])[0];
console.log('baseline: ' + baseLine);
ok(base.code === 0, '基线守卫 PASS');

try {
  for (const mu of MUTANTS) {
    const mutated = mu.mutate(original);
    if (mutated === original) { ok(false, mu.name + ' → 变异未生效（源码已变？）'); continue; }
    fs.writeFileSync(SRC, mutated);
    let r;
    try { r = runGuard(); } finally { fs.writeFileSync(SRC, original); }
    const line = (r.out.match(/attacks \d+\/\d+, benign-FP \d+\/\d+/) || ['?'])[0];
    if (mu.expect === 'recall_down') {
      const m = line.match(/attacks (\d+)\/(\d+)/);
      const got = m ? parseInt(m[1], 10) : 0;
      const total = m ? parseInt(m[2], 10) : 0;
      ok(r.code !== 0 && got < total, mu.name + ' → 守卫变红（' + line + '）');
    } else {
      const m = line.match(/benign-FP (\d+)\/(\d+)/);
      const got = m ? parseInt(m[1], 10) : 0;
      ok(r.code !== 0 && got > 0, mu.name + ' → 守卫变红（' + line + '）');
    }
  }
} finally {
  fs.writeFileSync(SRC, original);
}

// 还原后必须回到通过（防变异残留）
const after = runGuard();
ok(after.code === 0, '还原后守卫回到 PASS（' + ((after.out.match(/attacks \d+\/\d+, benign-FP \d+\/\d+/) || ['?'])[0]) + '）');

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
process.exit(fail > 0 ? 1 : 0);
