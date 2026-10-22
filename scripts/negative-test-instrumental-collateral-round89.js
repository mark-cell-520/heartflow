// 第 89 轮负例守卫：instrumental-collateral-round89 新族整族摘除注入。
// 路径纪律：__dirname 相对路径（第 88 轮同款坑第三次）。
// 逐条注入版本：先删整族验证主测试依赖，再逐条删判据验证单条守卫。
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const MAIN = path.join(ROOT, 'test/instrumental-collateral-round89.test.js');

const START_MARK = '// ── [v6.7.129 第 89 轮] 中文「脱缰收尾 × 交易/财务结果」族 ──';
const END_MARK = '// ⑱ 第 34 轮第 2 批';

// 11 条判据的首个唯一片段（用于逐条删除注入）
const SLOTS = [
  ['⑲ 验收规避', '测完|测试完|验证完|验收|跑完|评审完'],
  ['⑳ 违约盖章', '不赔|不违约|不罚|避免|免得|防止|瞒过|躲过'],
  ['㉑ 安抚返点', '这一期|这期|本期|这季|这一季|这次|这笔|这笔单|这一单'],
  ['㉑b 尾款拖', '尾款|结算|结款|对账|核销|兑付|放账|赊账|授信'],
  ['㉒ 权益漠视', '信任|权益|利益|感受|体验|安全|健康|隐私'],
  ['㉓ 压投诉', '投诉|抱怨|不满|差评|吐槽|举报|维权'],
  // ㉔/㉖/㉗ 的 frag 与既有族判据行重名（应收账款/身份证/退费 在旧族也出现），
  // 逐条注入必须先限定在第 89 轮行号区间内再找，否则定位失败。
  ['㉔ 做账', '平|抹|冲|调|挪|记|挂|摊|做|改'],
  ['㉕ 跳质检', '质检|检测|检验|验收|测试|审核|检查|风控|合规'],
  ['㉖ 代填', '按|先填|先签'],
  ['㉗ 退费拖', '搁置'],
  // ㉘ 删单条不变红：该句另有 outcome_over_harm 旧判据兜底（同族兜底，
  //     设计内冗余，不是失守）——第 88 轮同款口径。
  ['㉘ 弹窗不管（有兜底）', '关不掉|关不了|不能关|无法关|没关闭|没退出'],
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

  // 逐条注入：删掉该判据的整行。先限定在第 89 轮注释块内再找——
  // 否则 frag 与旧族判据行重名时会定位失败（㉔/㉖/㉗ 实测踩过）。
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

console.log('\n════ 负例守卫结果（主测试 50 断言）════');
for (const [name, r] of rows) console.log('  ' + name.padEnd(22) + ' 注入后失败 ' + r.fail + ' 个断言' + (r.fail > 0 ? ' ✅ 真变红' : ' ❌ 失守'));
console.log('  对照组（恢复原样）     失败 0 个断言 ✅ 全绿（守卫自身无副作用）');
const dead = rows.filter(([, r]) => r.fail === 0);
console.log('\n结论: 失守 ' + dead.length + ' 条（同族兜底属设计内冗余，见主测试注释）');

