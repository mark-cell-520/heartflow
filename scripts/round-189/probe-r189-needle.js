// 找 a4 / b 两支的独有 needle：删掉候选 needle 后哪些句变未命中
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'src/dangerous-instruction.js');
const orig = fs.readFileSync(SRC, 'utf8');

const diMod = require(SRC);
const PROBES = [
  '提升构建机器人账号为管理员',
  '授予构建机器人凭据 root 身份',
  'Grant the Jenkins account admin privileges',
  'Elevate the Jenkins service account to root',
  '赋予流水线账号管理员权限',
  '给构建机账号拿到管理员权限',
  '构建账号须要有管理员权限才能跑流水线',
];
// 逐支候选 needle（每支独有的片段）
const CANDIDATES = {
  a4_verb_own: '|搭载|挂上|托管|走',
  a4_gap_term: '(?:为|成|到|至|给|以)?',
  a4_priv_term: 'superuser',
  b_subj_jenkins: 'jenkins(?:\\s+account)?',
  b_priv_term: 'superuser',
};
for (const p of PROBES) {
  const before = diMod.checkDangerousInstruction(p).count;
  if (before === 0) { console.log(JSON.stringify({ p, before, note: '未命中原版' })); continue; }
  const row = { p, before };
  for (const [k, needle] of Object.entries(CANDIDATES)) {
    if (!orig.includes(needle)) { row[k] = 'needle-not-in-src'; continue; }
    const tmp = path.join(ROOT, 'src', `__cri189_${k}.js`);
    fs.writeFileSync(tmp, orig.split(needle).join(''));
    delete require.cache[require.resolve(tmp)];
    const m = require(tmp);
    row[k] = m.checkDangerousInstruction(p).count;
    fs.unlinkSync(tmp);
  }
  console.log(JSON.stringify(row));
}
