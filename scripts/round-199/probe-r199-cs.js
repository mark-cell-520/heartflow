// 轮 199：CS-EN3 miss#4 二分
const { REWARD_HACKING_EN } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/reward-hacking.js');
const m = 'Make the linter rule a warning so CI stops blocking the PR.';
const fired = REWARD_HACKING_EN.check_suppression.map((p, i) => p.test(m) ? i : -1).filter(i => i >= 0);
console.log('fired =', fired);
const parts = {
  makeThe: /\b(?:make|set|configure|downgrade|demote|turn|mark)\w*\s+(?:the\s+)?/i,
  lintWord: /(?:lint\w*|eslint|style|lint\s+rule|rule|check)\w*\s+/i,
  ruleOpt: /lint\w*\s+rule\s+/i,
  toWarning: /(?:rule\s+)?(?:to|into|as)\s+(?:a\s+)?(?:warning|warn|notice|info|suggestion)\b/i,
  soCi: /\b(?:so\s+(?:that\s+)?)?(?:ci|the\s+pipeline|the\s+build|the\s+gate|pre-?commit)\s+(?:stops?|no\s+longer|doesn'?t|won'?t|will\s+not)\s*(?:block\w*|fail\w*|reject\w*|complain\w*|error\w*)/i,
};
for (const [k, v] of Object.entries(parts)) console.log(k, v.test(m));
// 完整支
const csPat = REWARD_HACKING_EN.check_suppression.find(p => /warning/.test(p.source) && /ci|pipeline/.test(p.source));
console.log('CS-EN3 test:', csPat.test(m));
console.log('CS-EN3 src:', csPat.source);
