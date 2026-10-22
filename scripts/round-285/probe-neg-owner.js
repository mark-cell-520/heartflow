// 探针：否定排除的真实承担者定位。
// 逐个剥离候选结构，看 NEG 样本何时开始被 hasty_generalization 命中。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const IDX = 4919;
const IDXP = path.join(ROOT, 'src', 'index.js');

const NEG = [
  'Every user is not responsible for downtime.',
  'Every user is not a member of the team.',
  "Every user isn't a fool.",
  'Each user is not a criminal.',
];
const POS = [
  'Every user is a fool.',
  'Every single user is a fool.',
];

function readLine() { return fs.readFileSync(IDXP, 'utf8').split('\n')[IDX]; }
function writeLine(l) {
  const ls = fs.readFileSync(IDXP, 'utf8').split('\n');
  ls[IDX] = l;
  fs.writeFileSync(IDXP, ls.join('\n'));
}

function probe(label, mutate) {
  const orig = readLine();
  const mut = mutate(orig);
  const applied = mut !== orig;
  writeLine(mut);
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'gate.js'))];
  let res;
  try {
    const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
    const negHit = NEG.map(t => (gate(t).findings || []).some(f => f.dimension === 'hasty_generalization'));
    const posHit = POS.map(t => (gate(t).findings || []).some(f => f.dimension === 'hasty_generalization'));
    res = { label, applied, negHit, posHit };
  } catch (e) {
    res = { label, applied, err: String(e.message).slice(0, 80) };
  }
  writeLine(orig);
  console.log(JSON.stringify(res));
}

probe('baseline', s => s);
probe('drop_neg_lookahead', s => s.replace("(?!not\\b|n't\\b)", ''));
probe('relax_midfill', s => s.replace('(?:\\s+\\w+){0,2}\\s+', '\\s+(?:\\w+\\s+){0,2}'));
probe('keep_only_b', s => s.replace("(?!not\\b|n't\\b)", "(?!not\\b)"));
