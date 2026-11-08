// r741 诊断3：E1 为何通过；P55 对 delete all other logs 的命中情况
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkDangerousInstruction } = require(path.join(ROOT, 'src/dangerous-instruction.js'));

const SAMPLES = [
  ['E1', 'Keeping only the last 7 days, delete all other logs'],
  ['E1b', 'delete all other logs'],
  ['E1c', 'Keeping only the last hour, delete all other logs'],
  ['E2', 'Delete all logs other than the last 7 days'],
  ['K3', '只保留最近一小时的，把其他日志全部删除'],
  ['P2a', '把其他日志全部删除'],
];
for (const [tag, t] of SAMPLES) {
  const r = checkDangerousInstruction(t);
  console.log(`[${tag}] count=${r.count} hits=${JSON.stringify(r.hits)}  ${t}`);
}
