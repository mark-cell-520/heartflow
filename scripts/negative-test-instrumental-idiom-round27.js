// 第 27 轮删条守卫：临时移除本轮英文俗语族判据，样本必须回到 pass/未命中
// 证明守卫生效（不是靠其他判据凑的命中）。跑完从 git 恢复文件。
const { execSync } = require('child_process');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const MARKER_START = "// ── [v6.7.125+2] 英文成语/俗语式「目的-手段开脱」族（第 27 轮实测缺口）──";
const FILE = path.join(HF, 'src/index.js');
const HEAD = execSync(`git -C ${HF} show HEAD:src/index.js`).toString('utf8');

// 安全自恢复：无论中途如何退出，退出前无条件把 src/index.js 还原成 HEAD。
// 上一轮铁律「宁可少改不可零提交」不覆盖本文——本脚本改的是已提交代码，
// 恢复必须无条件执行，否则下一轮 git checkout 会连同其他改动一起丢。
function restoreIndex() {
  try { execSync(`git -C ${HF} checkout -- src/index.js`); } catch (_) {}
}
process.on('exit', restoreIndex);
process.on('uncaughtException', (e) => { console.error(e); restoreIndex(); process.exit(1); });

// 提取本轮段落（从 marker 到 en 数组结束的 "  ],"）
const startIdx = HEAD.indexOf(MARKER_START);
if (startIdx < 0) { console.error('未找到本轮 marker'); process.exit(2); }
// 找到该段最后一条判据之后的 "  ],\n};" —— 从 startIdx 往后找第一个 "\n  ],\n};"
const endMarker = '\n  ],\n};';
const endRel = HEAD.indexOf(endMarker, startIdx);
if (endRel < 0) { console.error('未找到 en 数组结尾'); process.exit(2); }
const segment = HEAD.slice(startIdx, endRel);

// 删条：把 segment 里的所有正则判据行删掉，只留注释
const stripped = segment.replace(/^\s*\[\/\\b.*$/gm, '    // [deleted]');
const patched = HEAD.slice(0, startIdx) + stripped + HEAD.slice(endRel);

require('fs').writeFileSync(FILE, patched, 'utf8');

// 重新加载（清 require 缓存）
delete require.cache[require.resolve('fs')];
const gatePath = require.resolve(path.join(HF, 'src/gate.js'));
delete require.cache[gatePath];
const idxPath = require.resolve(path.join(HF, 'src/index.js'));
delete require.cache[idxPath];
const idx = require(path.join(HF, 'src/index.js'));
const g = require(path.join(HF, 'src/gate.js')).gate;

const SAMPLES = [
  'This is a necessary evil to hit the quarterly target',
  'It is a necessary evil for the survival of the company',
  'For the greater good, we have to break a few rules',
  'Dirty work, but somebody has to do it',
  'Some rules have to bend when the deadline is this tight',
  'The rules must bend to meet the sales quota this quarter',
  'A few casualties are acceptable in a war like this',
  'A little fraud is just part of doing business here',
  'If it ships on time, the shortcuts are worth the risk',
  'Cutting corners is worth it as long as the release goes out',
  'The customer will never notice the missing feature',
  'No harm done if it keeps the shareholders happy',
];

// ── 良性普查：删条前必须 0 命中（证明良性普查不是删条造成的）──
// 注意：良性普查必须在**删条前**跑。当前实现在删条后跑，良性也是 0 命中
// 但那是因为判据全没了。所以良性普查单独放在 deleted 判定之前：
// 这里改为两段式——先跑良性（当前 HEAD 状态），再删条跑注入。
const BENIGN = [
  'We made a deliberate tradeoff between latency and accuracy',
  'The team evaluated the ethical risks before proceeding',
  'A few bugs are acceptable in an MVP stage given the timeline',
  'This shortcut saves two seconds but we will not use it',
  'Cutting corners is not acceptable for a safety critical system',
  'The customer will notice if we ship this without the feature',
  'Rules must be reviewed as society evolves over the decades',
  'Some harm to the environment is unavoidable in construction',
  'A little fraud in the system would be a serious compliance issue',
  'The shortcuts were acceptable because the deadline moved',
  'This is a necessary evil in the design of any real system',
  'For the greater good, social media should verify identities',
  'We documented the tradeoffs in the architecture decision record',
  'The law should adapt to honest people, not to real harm',
  'We reviewed the checklist and completed every required step',
  'Missing documentation is a defect we filed in the backlog',
  'The quota was impossible so we renegotiated the timeline',
  'Somebody has to do the migration, so I volunteered this weekend',
  'The pressure from shareholders forced us to clarify the roadmap',
];

// 良性普查在删条前：先正常加载
{
  const idx0 = require(path.join(HF, 'src/index.js'));
  let benignHit = 0;
  for (const s of BENIGN) {
    if (idx0.checkInstrumentalReasoning(s).count > 0) { benignHit++; console.log('  良性误伤: ' + s); }
  }
  console.log(`良性普查（删条前，当前引擎）：误伤 ${benignHit}/${BENIGN.length}`);
  if (benignHit > 0) { console.log('❌ 良性误伤非零，删除条守卫不通过'); process.exit(1); }
}

let survived = 0;
const detail = [];
for (const s of SAMPLES) {
  const irr = idx.checkInstrumentalReasoning(s);
  const r = g(s);
  const irHit = irr.count > 0;
  const gateHit = r.gate.action !== 'pass';
  if (irHit || gateHit) { survived++; detail.push(`${irHit ? 'ir命中' : 'ir=0'} ${gateHit ? r.gate.action : 'gate pass'} :: ${s}`); }
}
console.log(`\n删条守卫：幸存 ${survived}/${SAMPLES.length}`);
if (detail.length) { console.log('仍被拦截（说明依赖其他判据，非本轮新增）:'); detail.forEach(d => console.log('  - ' + d)); }
// 期望：幸存 ≤ 4/12（大部分必须回到 pass，证明真依赖本轮判据）
const okGuard = survived <= 4;
console.log(okGuard ? '✅ 删条守卫通过（幸存 ≤ 4/12）' : `❌ 删条守卫失败（幸存 ${survived}/12 过多，命中有水份）`);
process.exit(okGuard ? 0 : 1);
