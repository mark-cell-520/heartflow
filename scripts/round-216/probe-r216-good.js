// 第 216 轮：定位好文档 2 条 errors 的具体内容 + description 字段需求
const { skillVerifier } = require('../../src/shield/skill-verifier.js');
const goodNoDesc = '---\nname: test-skill\nversion: 1.0.0\n---\n# Test Skill v1.0.0\n\n## 触发条件\nx\n\n## 核心功能\ny\n';
const goodWithDesc = '---\nname: test-skill\ndescription: 测试技能\nversion: 1.0.0\n---\n# Test Skill v1.0.0\n\n## 触发条件\nx\n\n## 核心功能\ny\n';
for (const [label, doc] of [['无 description', goodNoDesc], ['有 description', goodWithDesc]]) {
  const r = skillVerifier.verify(doc);
  console.log(label + ' ok=' + r.ok + ' n=' + r.errors.length);
  r.errors.forEach(e => console.log('   raw: ' + JSON.stringify(e).slice(0, 150)));
}
// 断言层在看什么
const assertions = require('../../src/core/assertions.js');
console.log('assert keys:', Object.keys(assertions).join(','));
const fm = assertions.skillFrontmatter(goodWithDesc);
console.log('withDesc frontmatter ok=' + fm.ok + (fm.error || ''));
const fm2 = assertions.skillFrontmatter(goodNoDesc);
console.log('noDesc frontmatter ok=' + fm2.ok + ' err=' + (fm2.error || ''));
