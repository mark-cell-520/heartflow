/**
 * [round 593] findPath 缺陷复现：BFS 到达目标时只 push 到临时 path，
 * 没有任何结果收集，函数末尾硬编码 return [] —— 怀疑恒返空。
 */
const { KnowledgeGraph } = require('../src/memory/knowledge-graph.js');
const kg = new KnowledgeGraph({ silent: true });

const S = 'alpha-node', M = 'beta-node', O = 'gamma-node';
kg.addEdge(S, 'links_to', M, 0.9);
kg.addEdge(M, 'links_to', O, 0.9);

console.log('已写入 2 条边:', S, '->', M, '->', O);
console.log('query(subject=S):', JSON.stringify(kg.query({ subject: S, fuzzy: false })));
console.log('findPath(S, M):', JSON.stringify(kg.findPath(S, M)));
console.log('findPath(S, O):', JSON.stringify(kg.findPath(S, O, 4)));
console.log('findPath(O, S):', JSON.stringify(kg.findPath(O, S, 4)), '(反向无边，预期 [])');
console.log('findPath(S, S):', JSON.stringify(kg.findPath(S, S)), '(自身，预期 [])');
process.exit(0);
