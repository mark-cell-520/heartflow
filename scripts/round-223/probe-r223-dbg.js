// debug：M3 删除后，「最新的资料已归档」到底命中什么
const fs = require('fs');
const os = require('os');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const dir = path.join(os.tmpdir(), 'hf-sl-dbg');
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
const idx = path.join(dir, 'src', 'index.js');
let s = fs.readFileSync(idx, 'utf8');
const from = '|资料|信息|';
console.log('from 出现次数:', s.split(from).length - 1);
s = s.split(from).join('|(?:zzzzz)|(?:zzzzz)|');
fs.writeFileSync(idx, s);

const m = require(idx);
for (const t of ['最新的资料已归档', '最新的信息请看附件', '最新的文件在这里', '最新的进展同步一下', '最新一期报告', '最新数据已经同步']) {
  const r = m.checkConfidenceCalibration(t);
  console.log(JSON.stringify(t), '→', JSON.stringify((r.issues || []).map(i => i.detail)));
}
