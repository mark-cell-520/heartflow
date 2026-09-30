// 探针：281 系动词后接否定式 happens 为什么在「删前瞻」后仍 pass？
// 假设：`(?!not\b|n't\b)` 前面是 `\s+`，若前瞻删掉后仍不吃 `not`，
// 说明命中走的是**另一条不需要动词后定语的判据支**，或 not 被其他结构拦下。
// 逐个后置变体测试：not / n't / no better / refuse。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const IDX = 4919;
const IDXP = path.join(ROOT, 'src', 'index.js');

const CASES = [
  'Every user is not responsible.',
  "Every user isn't a fool.",
  'Every user is a fool.',
  'Every user is not a member of the team.',
];

function readLine() { return fs.readFileSync(IDXP, 'utf8').split('\n')[IDX]; }
function writeLine(l) {
  const ls = fs.readFileSync(IDXP, 'utf8').split('\n');
  ls[IDX] = l;
  fs.writeFileSync(IDXP, ls.join('\n'));
}

function run() {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'gate.js'))];
  const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
  return CASES.map(t => {
    const r = gate(t);
    const f = (r.findings || []).find(x => x.dimension === 'hasty_generalization');
    return [t.slice(0, 22), r.gate.action, f ? f.severity : 0];
  });
}

const orig = readLine();
console.log('BASELINE ' + JSON.stringify(run()));
writeLine(orig.replace("(?!not\\b|n't\\b)", ''));
console.log('NODROP ' + JSON.stringify(run()));
writeLine(orig);
console.log('RESTORED ' + JSON.stringify(run()));
