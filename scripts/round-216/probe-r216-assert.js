// 第 216 轮：确认断言层 skillFrontmatter 对引号 version 的行为（skill-verifier 复用它）
const { assert } = require('../../src/core/assertions.js');
const fs = require('fs');
const sk = fs.readFileSync(process.cwd() + '/SKILL.md', 'utf8');
console.log('真实SKILL.md =>', JSON.stringify(assert.skillFrontmatter(sk)));
const q = '---\nname: x\ndescription: 用于测试心虫技能验证引擎的工具模块\nversion: "1.2.3"\n---\n';
console.log('引号version =>', JSON.stringify(assert.skillFrontmatter(q)));
const u = '---\nname: x\ndescription: 用于测试心虫技能验证引擎的工具模块\nversion: 1.2.3\n---\n';
console.log('无引号version =>', JSON.stringify(assert.skillFrontmatter(u)));
