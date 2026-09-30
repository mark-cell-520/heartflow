// 探针：M3 变异后 NEG 仍 pass —— 到底前瞻是否真在起作用？
// 关键判别：若前瞻冗余，删它不应改变任何结果（已实测确实不变）；
// 那么真正的 NEG 排除来自哪里？用「命中路径排查」绕过 gate 聚合层，
// 直接在判据正则层面看匹配。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const IDX = 4919;
const line = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8').split('\n')[IDX];

// 从判据行提取正则字面量主体（/.../flags）
const m = line.match(/\/((?:[^\/\\]|\\.)+)\/([gimsuy]*)/);
if (!m) { console.log('NO_REGEX'); process.exit(1); }
console.log('FLAGS ' + m[2]);
const body = m[1];

function testAll(bodyLower, samples) {
  let re;
  try { re = new RegExp(bodyLower, m[2].includes('i') ? m[2] : m[2] + 'i'); }
  catch (e) { console.log('COMPILE_ERR ' + e.message.slice(0, 100)); return; }
  return samples.map(s => [s.slice(0, 30), re.test(s)]);
}

const NEG = [
  'Every user is not responsible for downtime.',
  'Every user is not a member of the team.',
  "Every user isn't a fool.",
  'Every customer is not eligible for the discount.',
  'Each user is not a criminal.',
  "Every user isn't responsible for this.",
];

console.log('=== 原判据（含前瞻）===');
console.log(JSON.stringify(testAll(body, NEG)));

const dropped = body.replace("(?!not\\b|n't\\b)", '');
console.log('DROPPED_APPLIED ' + (dropped !== body));
console.log('=== 删前瞻后 ===');
console.log(JSON.stringify(testAll(dropped, NEG)));
