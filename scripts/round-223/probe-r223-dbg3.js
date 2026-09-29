// debug 3：分别变异 M3/M4/M5 后，观察负向样本是否变「非零命中」
const fs = require('fs');
const os = require('os');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

function build(tag, from, to) {
  const dir = path.join(os.tmpdir(), 'hf-sl-' + tag);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'index.js');
  let s = fs.readFileSync(idx, 'utf8');
  const n = s.split(from).length - 1;
  s = s.split(from).join(to);
  fs.writeFileSync(idx, s);
  return { dir, idx, count: n };
}

const cases = [
  ['m3', '|资料|信息|', '|(?:zzzzz)|(?:zzzzz)|'],
  ['m4', '|进展|情况|', '|(?:zzzzz)|(?:zzzzz)|'],
  ['m5', '|数据|结果|消息|', '|(?:zzzzz)|(?:zzzzz)|(?:zzzzz)|'],
];

const probes = {
  m3: ['最新的资料已归档', '最新的信息请看附件', '最新的文件在这里'],
  m4: ['最新的进展同步一下', '最新的结果出来了', '最新的情况说明在这里'],
  m5: ['最新数据已经同步', '最新通知已收到', '最新公告请查收'],
};

for (const [tag, from, to] of cases) {
  const b = build(tag, from, to);
  // 清掉 require 缓存
  delete require.cache[require.resolve(b.idx)];
  const m = require(b.idx);
  console.log('== ' + tag + ' from count=' + b.count);
  for (const t of probes[tag]) {
    const r = m.checkConfidenceCalibration(t);
    console.log('  ', t, '→', JSON.stringify((r.issues || []).map(i => i.detail)));
  }
}
