#!/usr/bin/env node
/** test/knowledge-ontology.test.js */
const fs = require('fs');
const path = require('path');
const { KnowledgeOntology } = require('../src/knowledge/knowledge-ontology.js');
const { KnowledgeGraphAdapter } = require('../src/knowledge/knowledge-graph-adapter.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== KnowledgeOntology 单元测试 ===\n');

const domainsPath = path.join(__dirname, '..', 'formulas', 'ontology', 'domains.json');
// [v6.7.96] formulas/ 是 5.4M 的按需下载数据，.npmignore 明确列为
// "Heavy data - download on demand via upgrade.js" —— npm 包里刻意不含它。
// 第 74 轮在独立安装的 node_modules 里跑 run-all，这个测试 FAIL 了
// （domains 非空: 0）。那是**预期**不是缺陷：代码没坏，是数据没随包走。
// 但用 FAIL 表达"数据没带"会骗人（用户以为代码坏了），所以显式 SKIP。
if (!fs.existsSync(domainsPath)) {
  // 注意：这里**不能**输出「0 通过, 0 失败, 共 0 个」——第 48 轮铁律把
  // 0/0 计为失败（逼测试至少注册一个用例）。只吐 SKIP 行，让 run-all 走
  // 第 142 行的「PASS/SKIP 单行」分支：SKIP 不计失败、打出来说明原因。
  console.log(`SKIP knowledge-ontology (formulas/ontology/domains.json 未随 npm 包发布)`);
  console.log(`     说明：formulas/ 是 .npmignore 标注的按需下载数据（5.4M），包里刻意不含`);
  console.log(`     数据下载后重跑即可；这表示"数据没带"，不表示代码坏了`);
  process.exit(0);
}

const adapter = new KnowledgeGraphAdapter({ dataDir: '/tmp/hf-test-ontology' });
const ontology = new KnowledgeOntology({
  domainsPath,
  graphAdapter: adapter,
});

assert(ontology, 'KnowledgeOntology 实例化');
assert(Array.isArray(ontology.domains), 'domains 是数组');
assert(ontology.domains.length > 0, 'domains 非空: ' + ontology.domains.length);

const top = ontology.getTopLevelDomains();
assert(Array.isArray(top), 'getTopLevelDomains 返回数组');
assert(top[0] && top[0].id, '顶级领域含 id');

const domain = ontology.getDomain(top[0].id);
assert(domain, 'getDomain 可查: ' + top[0].id);

const children = ontology.getChildren(top[0].id);
assert(Array.isArray(children), 'getChildren 返回数组');

const seeds = ontology.getAnalogySeeds(top[0].id);
assert(Array.isArray(seeds), 'getAnalogySeeds 返回数组');

const causal = ontology.getCausalSeeds(top[0].id);
assert(Array.isArray(causal), 'getCausalSeeds 返回数组');

const stats = ontology.getStats();
assert(stats && typeof stats.topLevelCount === 'number', 'getStats 含 topLevelCount');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
