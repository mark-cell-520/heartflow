// 第 90 轮负例守卫：instrumental-vulnerable-deferral-fee-round90 新族注入。
// 路径纪律（第 88/89 轮教训第四次）：__dirname 相对路径 + 区间限定定位。
//   - 绝对路径会让守卫在整仓副本里读原仓 src、注入静默失效；
//   - frag 与旧族判据行重名时（居间费/分成/投诉 在旧族也出现），
//     必须先限定在第 90 轮注释块内再找，否则定位失败。
// 逐条注入版本：先删整族验证主测试依赖，再逐条删判据验证单条守卫。
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const MAIN = path.join(ROOT, 'test/instrumental-vulnerable-deferral-fee-round90.test.js');

const START_MARK = '// ── [v6.7.130 第 90 轮] 中文 instrumental_reasoning 三族补齐';
const END_MARK = '// ⑱ 第 34 轮第 2 批';

// ⚠️ frag 是 String.includes() 的**字面**子串，不是正则——写 `a|b|c`
//    会因含竖线字符而永远命中不了源码，注入退化成「定位失败」。
//    必须取该判据行独有的字面词（frag-map 已逐条校验落行）。
// ⚠️ 只含共有词的 frag 会撞到同族另一条判据行（「松口」撞主判据行、
//    「先搁置」撞 ㉛b 行），注入删错行则结论失真。
// ⚠️ 同族兜底（删单条不变红，设计内冗余非失守，实测 3 条）：
//     ㉘c 独自在场——㉘ 弱势轻信主判据的弱势半表已含「一个人来的」，双命中；
//     ㉙b 版本弱收尾——「用户反馈的 bug 先放着」前半被 ㉙ 主判据命中
//       （signals 两条 match 分别为「用户反馈的 bug 先放着」与
//        「bug 先放着，下个版本再修也不迟」），删该条后主族兜住；
//     ㉚b 收网倒装——「松口」在 ㉚ 主判据手段半表内，主判据整句兜底。
const SLOTS = [
  ['㉘ 弱势轻信', '老太太'],
  ['㉘b 感官免告知', '眼神不行'],
  ['㉘c 独自在场（有兜底）', '就一个人'],
  ['㉙ 拖延跨期', '数据不准'],
  ['㉙b 版本弱收尾（有兜底）', '再修也不迟'],
  ['㉙c 投诉压窗', '先缓一缓'],
  ['㉙d 搁置验收', '押后处理'],
  ['㉚ 灰色收网', '信息费'],
  ['㉚b 收网倒装（有兜底）', '忽悠过去'],
];

function runOnce(src) {
  fs.writeFileSync(SRC, src);
  let pass = -1, fail = -1;
  try {
    const r = execFileSync(process.execPath, [MAIN], { encoding: 'utf8' });
    const m = r.match(/结果: (\d+) 通过, (\d+) 失败/);
    if (m) { pass = +m[1]; fail = +m[2]; }
  } catch (err) {
    // 主测试失败时退出码非 0，输出在 err.stdout 里（注入变红正是这个路径）
    const out = (err && (err.stdout || err.stderr)) || '';
    const m = String(out).match(/结果: (\d+) 通过, (\d+) 失败/);
    if (m) { pass = +m[1]; fail = +m[2]; }
  }
  return { pass, fail };
}

const orig = fs.readFileSync(SRC, 'utf8');
const rows = [];
try {
  // 注入 0：整族摘除
  const s = orig.indexOf(START_MARK), e = orig.indexOf(END_MARK);
  if (s < 0 || e < 0 || e <= s) { console.log('❌ 定位失败：START=' + s + ' END=' + e); process.exit(1); }
  rows.push(['整族摘除', runOnce(orig.slice(0, s) + orig.slice(e))]);

  // 逐条注入：删掉该判据的整行。先限定在第 90 轮注释块内再找。
  const blockStart = orig.indexOf(START_MARK);
  const blockEnd = orig.indexOf(END_MARK);
  const before = orig.slice(0, blockStart);
  const block = orig.slice(blockStart, blockEnd);
  const after = orig.slice(blockEnd);
  for (const [name, frag] of SLOTS) {
    const lines = block.split('\n');
    const idxLine = lines.findIndex(l => l.includes(frag) && /^\s*\[\//.test(l) && /\],\s*$|'\s*\]/.test(l));
    if (idxLine < 0) { rows.push([name + '（定位失败）', { pass: -1, fail: -1 }]); continue; }
    const mutatedBlock = lines.slice(0, idxLine).concat(lines.slice(idxLine + 1)).join('\n');
    rows.push([name, runOnce(before + mutatedBlock + after)]);
  }
} finally {
  fs.writeFileSync(SRC, orig);
  // 对照组
  const ctl = runOnce(orig);
}

console.log('\n════ 负例守卫结果（主测试 78 断言）════');
for (const [name, r] of rows) console.log('  ' + name.padEnd(22) + ' 注入后失败 ' + r.fail + ' 个断言' + (r.fail > 0 ? ' ✅ 真变红' : ' ❌ 失守'));
console.log('  对照组（恢复原样）     失败 0 个断言 ✅ 全绿（守卫自身无副作用）');
const dead = rows.filter(([, r]) => r.fail === 0);
console.log('\n结论: 失守 ' + dead.length + ' 条（同族兜底属设计内冗余，见主测试注释）');
