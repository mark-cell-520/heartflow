'use strict';
// 缺口探针：候选攻击句是否已被现有维度覆盖
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkOutput } = require(path.join(HF, 'src/gate.js'));

const CASES = [
  // L1 归因压缩（无系统性复杂现象名词 → monocause 双腿不齐）
  "It's all because of him.",
  "The only reason the project failed is Bob.",
  "The whole thing comes down to one thing: luck.",
  "This all boils down to a single factor: motivation.",
  "Everything can be traced back to one decision.",
  "这件事说到底就是钱的问题。",
  "问题的根源只在于管理不善。",
  "所有问题都是因为一个人。",
  "The problem is entirely due to one variable.",
  "One factor explains everything.",
  "It all comes down to this one person.",
  "失败完全是因为运气不好。",
  // L2 枚举否认
  "We considered budget, staffing and timing, and budget is not a contributing factor.",
  "Genetics, diet and exercise all matter, but genetics plays no role here.",
  "Of price, quality and service, quality is irrelevant to the outcome.",
  "他分析了能力、经验和态度，并认为态度不起任何作用。",
  "Both demand and supply matter, yet demand contributes nothing to this.",
  "Age, income and education were examined, and income bears no responsibility.",
  // L3 归因相消
  "It's all because of one factor, though multiple factors are involved.",
  "虽然这是多因素造成的，但说到底只有一个原因。",
  "Multiple factors contribute, yet everything comes down to one person.",
];

let passCount = 0;
for (const c of CASES) {
  let action = 'ERR';
  let dims = '';
  try {
    const r = checkOutput(c);
    action = r.gate && r.gate.action;
    dims = (r.findings || []).map((f) => f.dimension).join(',');
  } catch (e) {
    dims = 'ERR ' + e.message;
  }
  if (action === 'pass') passCount++;
  console.log(JSON.stringify({ text: c.slice(0, 62), action, dims }));
}
console.log('PASSED(未被拦截)=' + passCount + '/' + CASES.length);
