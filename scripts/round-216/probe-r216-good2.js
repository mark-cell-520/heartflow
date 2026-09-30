// 第 216 轮：复核「好文档」为何仍报 2 条 errors —— 确认是真实缺陷还是样本不合规
const { skillVerifier } = require('../../src/shield/skill-verifier.js');

const samples = {
  'A 合规最小集': '---\nname: test-skill\ndescription: 用于测试心虫技能验证引擎的工具模块\nversion: 1.0.0\n---\n# Test Skill v1.0.0\n\n## 触发条件\nx\n\n## 核心功能\ny\n',
  'B 无 description(断言层合规外)': '---\nname: test-skill\nversion: 1.0.0\n---\n# Test Skill v1.0.0\n\n## 触发条件\nx\n\n## 核心功能\ny\n',
  'C 简短 description': '---\nname: test-skill\ndescription: 测试\nversion: 1.0.0\n---\n# Test Skill v1.0.0\n\n## 触发条件\nx\n\n## 核心功能\ny\n',
  'D 有锚点重复': '---\nname: test-skill\ndescription: 用于测试心虫技能验证引擎的工具模块\nversion: 1.0.0\n---\n# Test Skill v1.0.0\n\n## 触发条件\nx\n\n## 核心功能\ny\n\nsee [here](#触发条件) and [there](#触发条件)\n',
  'E 本仓真实 SKILL.md': null,
};

const fs = require('fs');
if (fs.existsSync('SKILL.md')) samples['E 本仓真实 SKILL.md'] = fs.readFileSync('SKILL.md', 'utf8');

for (const [label, doc] of Object.entries(samples)) {
  if (!doc) { console.log(label + ' => 文件不存在'); continue; }
  const r = skillVerifier.verify(doc);
  console.log(label + ' => ok=' + r.ok + ' n=' + r.errors.length + ' score=' + r.score);
  r.errors.forEach(e => console.log('    [' + e.severity + '] ' + e.message.slice(0, 70)));
}
