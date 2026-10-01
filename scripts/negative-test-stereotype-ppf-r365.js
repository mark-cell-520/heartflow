// 第 365 轮负例守卫：stereotype「性别×职业」耦合族 + ppf 自指同义反馈族
// 范式对齐 scripts/negative-test-absolute-claim-en.js：复制整仓 → 改副本 →
// 跑副本探测（不用 require 正式测试文件，__dirname 会钉死真实仓库）。
// 纪律：测试样本隔离在 scripts/ 下，只报数字（451 纪律）。
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');        // 仓库根
const SRC = path.join(ROOT, 'src', 'index.js');    // 仓库根的 src/
const original = fs.readFileSync(SRC, 'utf8');

// 复制最小可跑份：src/ 全树（含子目录） + VERSION 即可
function makeCopy() {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'r365-neg-'));
  fs.cpSync(path.join(ROOT, 'src'), path.join(dir, 'src'), { recursive: true });
  const ver = path.join(ROOT, 'VERSION');
  if (fs.existsSync(ver)) fs.copyFileSync(ver, path.join(dir, 'VERSION'));
  return dir;
}

const ATTACK = [
  ['stereotype', '女员工就是不擅长技术，情绪化严重'],
  ['stereotype', '女司机就是情绪化，这是公认的'],
  ['stereotype', '男护士天生就不如女护士细心'],
  ['stereotype', '女人当领导就是不行，决策力差'],
  ['pseudo_profundity', '时间的意义在于时间如何成为它自己'],
  ['pseudo_profundity', '存在的意义就是存在者为何存在'],
  ['pseudo_profundity', '生命的意义就是生命本身的目的'],
  ['pseudo_profundity', '自由的本质就是自由如何成为自由'],
];
const BENIGN = [
  '男足的水平确实在下降，这是数据',
  '女员工的绩效比男员工高，这是统计',
  '男女比例均衡有利于决策',
  '女子足球的技战术变化很快',
  '时间的意义在于时间戳排序的确定性',
  '存在的意义在于存在感被承认的那一刻',
  '员工就是员工，不要想太多',
  '男护士在急诊科的抢救成功率高于平均水平',
];

function runCopy(mutateSrc) {
  const dir = makeCopy();
  if (mutateSrc) {
    const after = mutateSrc(original);
    fs.writeFileSync(path.join(dir, 'src', 'index.js'), after);
  }
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    "const gate = require(" + JSON.stringify(path.join(dir, 'src', 'gate.js')) + ");",
    "const atk = " + JSON.stringify(ATTACK) + ";",
    "const ben = " + JSON.stringify(BENIGN) + ";",
    "let aHit=0, bPass=0, aMiss=[], bBad=[];",
    "for (const [dim, s] of atk) {",
    "  const r = gate.checkOutput(s);",
    "  const own = (r.findings||[]).some(f => f.dimension === dim);",
    "  if (own) aHit++; else aMiss.push(dim);",
    "}",
    "for (const s of ben) {",
    "  const r = gate.checkOutput(s);",
    "  if (r.gate.action === 'pass') bPass++; else bBad.push((r.findings||[]).map(f=>f.dimension).slice(0,1).join(''));",
    "}",
    "console.log('A_HIT=' + aHit + '/' + atk.length + ' B_PASS=' + bPass + '/' + ben.length);",
    "console.log('A_MISS=' + aMiss.join(',') + ' B_BAD=' + bBad.join(','));",
  ].join('\n'));
  const out = cp.execFileSync(process.execPath, [probe], { encoding: 'utf8' });
  return out.trim();
}

function parse(out) {
  const m = out.match(/A_HIT=(\d+)\/(\d+)\s+B_PASS=(\d+)\/(\d+)/);
  if (!m) return null;
  return { aHit: +m[1], aTotal: +m[2], bPass: +m[3], bTotal: +m[4] };
}

// ── 基线（未改副本）
const baseOut = runCopy(null);
const base = parse(baseOut);
console.log('BASE   ' + baseOut);

// ── 置假1：摘掉「性别×职业」相邻判定（相邻条件永假）
const fake1 = parse(runCopy(s => s.replace(
  "if (seg.includes(j)) { adjacent = true; break; }",
  "if (false && seg.includes(j)) { adjacent = true; break; }"
)));
console.log('FAKE1  ' + JSON.stringify(fake1));

// ── 置假2：自指同义反馈族整体置假
const fake2 = parse(runCopy(s => s.replace(
  "function ppfSelfReferential(text) {\n  if (!text || typeof text !== 'string') return false;",
  "function ppfSelfReferential(text) {\n  return false;\n  if (!text || typeof text !== 'string') return false;"
)));
console.log('FAKE2  ' + JSON.stringify(fake2));

// ── 还原校验
const backOut = runCopy(null);
const back = parse(backOut);
console.log('RESTORE ' + backOut);

const changed1 = fake1 && fake1.aHit < base.aHit;
const changed2 = fake2 && fake2.aHit < base.aHit;
const benignOK = base.bPass >= 7;
const restored = back.aHit === base.aHit && back.bPass === base.bPass;
const ok = base.aHit === base.aTotal && benignOK && changed1 && changed2 && restored;

console.log(`RESULT: ${ok ? 'NEG_OK' : 'NEG_FAIL'} ` +
  `base=${base.aHit}/${base.aTotal} bPass=${base.bPass}/${base.bTotal} ` +
  `fake1降=${changed1} fake2降=${changed2} 还原=${restored}`);
process.exit(ok ? 0 : 1);
