// 轮测 harness 包装：测试为 module.exports = function({test}) 格式，需包装调用
const suite = require('/root/hermes1/skills/ai/mark-heartflow-skill/test/round-490-curse-of-knowledge-consensus-omission.test.js');
const tests = [];
suite({ test: (n, f) => { tests.push([n, f]); } });
let pass = 0, fail = 0;
for (const [n, f] of tests) {
  try { f(); console.log('PASS ' + n); pass++; }
  catch (e) { console.log('FAIL ' + n + ' => ' + e.message); fail++; }
}
console.log('--- ' + pass + ' pass / ' + fail + ' fail');
