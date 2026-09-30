// 第 216 轮：skill-verifier _classifyResult 字符串展开 bug 量化探针
const { skillVerifier } = require('../../src/shield/skill-verifier.js');
const ve = require('../../src/core/verification-engine.js').verificationEngine;

// 有问题的文档（缺 name version、缺必需章节、有未标注大数字）
const bad = [
  '---',
  'name: Bad_Name!!',
  '---',
  '# Bad Name v1.0.0',
  '',
  '## 随便',
  '收入 $123456 未标注。',
  '这是猜测。',
  '/etc/passwd 绝对路径。',
  '[]()',
  '[x](#nope)',
].join('\n');

console.log('--- 1) skillVerifier.verify 直调（坏文档）---');
try {
  const r = skillVerifier.verify(bad);
  console.log('ok=' + r.ok + ' errors=' + r.errors.length + ' score=' + r.score);
  console.log('first error typeof=' + typeof r.errors[0] + ' keys=' + (r.errors[0] && typeof r.errors[0] === 'object' ? Object.keys(r.errors[0]).slice(0, 5).join(',') : 'string'));
} catch (e) {
  console.log('THROWS: ' + e.message);
}

console.log('--- 2) verificationEngine.verifySkill 直调（坏文档）---');
try {
  const r = ve.verifySkill(bad);
  console.log('ok=' + r.ok);
} catch (e) {
  console.log('THROWS: ' + e.message);
}

console.log('--- 3) 干净文档直调 ---');
const good = '---\nname: test-skill\nversion: 1.0.0\n---\n# Test Skill v1.0.0\n\n## 触发条件\nx\n\n## 核心功能\ny\n';
try {
  const r = ve.verifySkill(good);
  console.log('ok=' + r.ok + ' score=' + r.score);
} catch (e) {
  console.log('THROWS: ' + e.message);
}
