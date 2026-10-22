// 第 222 轮探针 2：_selfVerificationIssues 当前的消费端到底有谁、做到哪一级。
// 目的：复测 219 轮遗留 1 是否仍成立（gate action 只到 verify），并看 MCP 硬闸门级别。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

const { buildGateVerdict } = require(path.join(ROOT, 'src/gate-verdict.js'));

console.log('==== R222-P2 gate-verdict 消费级 ====');
const single = buildGateVerdict({ _selfVerificationIssues: ['结论与推理逻辑不匹配'] });
console.log('单问题 => ' + JSON.stringify({ action: single.action, score: single.score, signals: single.signals }));

const three = buildGateVerdict({ _selfVerificationIssues: ['结论与推理逻辑不匹配', '可能存在隐藏假设', '可能遗漏重要因素'] });
console.log('三问题（全部真问题）=> ' + JSON.stringify({ action: three.action, score: three.score }));

const withBlock = buildGateVerdict({ _blockedByFirewall: true, _selfVerificationIssues: ['结论与推理逻辑不匹配'] });
console.log('与 block 信号并存 => ' + withBlock.action + '（block 优先，不得降级）');

const withRewrite = buildGateVerdict({ _selfContradictory: true, _selfVerificationIssues: ['结论与推理逻辑不匹配'] });
console.log('与 rewrite 信号并存 => ' + withRewrite.action + '（rewrite 优先，不得降级）');

console.log('---- src 侧读取点 ----');
function grepSrc(pat) {
  const hits = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!/node_modules|\.git/.test(e.name)) walk(p); continue; }
      if (!/\.js$/.test(e.name) || /test|round-|negative-/.test(e.name)) continue;
      const txt = fs.readFileSync(p, 'utf8');
      txt.split('\n').forEach((l, i) => { if (pat.test(l)) hits.push(path.relative(ROOT, p) + ':' + (i + 1) + ' ' + l.trim().slice(0, 90)); });
    }
  };
  walk(path.join(ROOT, 'src'));
  return hits;
}
for (const key of ['_selfVerificationIssues', '_selfVerification\\b', '_selfVerificationNoise', 'buildGateVerdict']) {
  const h = grepSrc(new RegExp(key));
  console.log(key + ' => ' + h.length + ' 处');
  for (const l of h.slice(0, 8)) console.log('   ' + l);
}
console.log('==== END ====');
