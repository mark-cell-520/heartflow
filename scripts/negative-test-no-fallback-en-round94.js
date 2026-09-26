/**
 * negative-test-no-fallback-en-round94.js
 *
 * 第 94 轮负例守卫：向 src/index.js 本轮 no_fallback 两处改动逐条注入
 *   ① CN_FALLBACK 新增 8 支（dismissal ×4 / single_shot ×1 / skip_guard ×1 / deferred ×2）
 *   ② EN_FALLBACK 新增 15 支（dismissal ×8 / single_shot ×1 / skip_guard ×1 / deferred ×3 + 变体）
 * 证明它们都是**真守卫**：注入后必须有攻击样本从命中掉回不命中。
 *
 * 「有兜底」判定口径（与既往轮次一致）：
 *   · 真守卫   = 注入后该族攻击命中数下降（本支/本族兜底）
 *   · 有兜底   = 注入后攻击仍全命中（其他支覆盖）
 *   · 误伤崩溃 = 良性样本转为命中（判据过宽）或注入后 require 失败
 *
 * 注入方式：`/(?!q)qqq/i` 原位替换正则字面量，**不删行**——
 * 删 pattern 行会让循环变量为 undefined，`text.match(undefined)` 把 undefined
 * 转字符串恒命中，良性全变误伤（第 92 轮已记账的第三个坑）。
 *
 * ⚠️ EN_FALLBACK / CN_FALLBACK 是**数组字面量**（每条 `[/regex/, 'type', sev],` 一行），
 * 不存在第 93 轮组装式正则的首/中/末括号分型坑——但 `[^...]` 内部的 `]` 仍需
 * 逐字符保留，因此注入只替换**整行**，不做行内片段替换。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'index.js');
const NEW_MARK = '[v6.7.128] 第 94 轮';

// ── 攻击样本（按族分组，用于分别定位哪一支是哪族的守卫）──
const ATTACK_BY_KIND = {
  dismissal_en: [
    'There is no need for a plan B on this one.',
    'No reason to maintain a backup of the configuration files.',
    'There is no need to plan for the dependency being unavailable.',
    'Ship it now; rollback is for teams that lack confidence.',
    'Contingency planning is for people who expect to fail.',
    'Keeping a contingency in place would be wasteful here.',
    'Nobody needs a fallback when the design is this simple.',
    'No reason to worry about the backup before the big import.',
  ],
  single_shot_en: [
    'One attempt is enough, we do not need any retry logic.',
    'We do not need a staging environment for a change this small.',
  ],
  skip_guard_en: [
    'Skip the canary; a full rollout is safe enough here.',
    'Remove the rollback script once the migration has started.',
  ],
  deferred_en: [
    'If it breaks we will deal with it then, no need to prepare.',
    'If things go wrong we will figure it out then, together.',
    'We will cross that bridge when we come to it — no backup plan required.',
  ],
  dismissal_zh: [
    '没有任何回退方案就直接上线了。',
    '不需要备用方案，直接执行就行。',
  ],
  single_shot_zh: ['一次尝试就够了，直接上线。'],
  skip_guard_zh: ['跳过测试直接发布到生产环境。'],
  deferred_zh: ['出问题我们再解决，不用提前准备。'],
};

// ── 良性样本（注入后若转为命中 = 判据过宽 = 崩溃）──
const BENIGN = [
  'This approach has a clear fallback: we revert to the snapshot.',
  'We keep a backup of every table we modify during the migration.',
  'If the canary fails, we roll back automatically within four minutes.',
  'Rollback takes under a minute, so shipping behind a flag is safe.',
  'The deploy is reversible: one command restores the previous image.',
  'We always prepare a contingency for the database cutover step.',
  'Skip the canary is not an option for a payments change like this one.',
  'We remove the snapshot after the retention period expires on its own.',
  '我们有完整的回退方案，出问题可以立即回滚。',
  '上线前会保留快照，便于随时恢复数据。',
  '出问题我们会立即启动回滚流程并通知值班同学。',
  '上线前已经准备好了兜底方案，失败可以切回旧版本。',
];

const ALL_ATTACK = [].concat(...Object.values(ATTACK_BY_KIND));

// ── 1. 定位本轮新增行 ──
const lines = fs.readFileSync(SRC, 'utf8').split('\n');
const newLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(NEW_MARK)) {
    // 从标记行起，收集到该数组块结束（`^\];`）
    for (let j = i; j < Math.min(i + 40, lines.length); j++) {
      if (/^\s*\];/.test(lines[j])) break;
      if (/^\s{2}\[\/.*\/i?,\s*'/.test(lines[j])) newLines.push(j);
    }
  }
}
if (newLines.length === 0) { console.error('未定位到本轮新增判据行'); process.exit(1); }
console.log(`本轮新增判据行 ${newLines.length} 支：行 ${newLines.map(i => i + 1).join(',')}\n`);

// ── 2. 基线探测 ──
function probe(file) {
  const out = execFileSync('node', ['-e',
    `const {checkNoFallback}=require(${JSON.stringify(file)});
     const hit=t=>checkNoFallback(t).count>0;
     const sc=t=>checkNoFallback(t).score;
     console.log(JSON.stringify({
       atk: ${JSON.stringify(ALL_ATTACK)}.map(hit),
       ben: ${JSON.stringify(BENIGN)}.map(hit),
       sc: ${JSON.stringify(BENIGN)}.map(sc)
     }))`,
  ], { encoding: 'utf8' });
  return JSON.parse(out);
}

let base;
try { base = probe(SRC); }
catch (e) { console.error('基线探测失败：', String(e.message).slice(0, 140)); process.exit(1); }
const baseAtk = base.atk.filter(Boolean).length;
const baseBen = base.ben.filter(Boolean).length;
console.log(`基线：攻击命中 ${baseAtk}/${ALL_ATTACK.length}，良性命中 ${baseBen}/${BENIGN.length}`);
if (baseAtk < ALL_ATTACK.length * 0.85 || baseBen > 0) {
  console.error('基线异常（攻击未覆盖或良性已误伤），停止守卫');
  process.exit(1);
}

// ── 3. 逐行注入 ──
let realGuard = 0, backedUp = 0, broken = 0;
const detail = [];

function inject(lineNo, tag) {
  const mutated = [...lines];
  const orig = mutated[lineNo];
  const indent = orig.match(/^\s*/)[0];
  mutated[lineNo] = indent + '[/(?!q)qqq/i, \'xx\', 0.1],';
  const tmp = path.join(__dirname, '..', 'src', '.tmp-r94-mutate.js');
  fs.writeFileSync(tmp, mutated.join('\n'));
  try {
    const r = probe(tmp);
    const lostAtk = r.atk.filter((h, i) => base.atk[i] && !h).length;
    const newFp = r.ben.filter((h, i) => !base.ben[i] && h).length;
    if (newFp > 0) {
      detail.push(`${tag}（行 ${lineNo + 1}）: ⚠️ 注入后新增 ${newFp} 条良性误伤`);
      broken++;
    } else if (lostAtk > 0) {
      realGuard++;
      detail.push(`${tag}（行 ${lineNo + 1}）: 真守卫（攻击 -${lostAtk}）`);
    } else {
      backedUp++;
      detail.push(`${tag}（行 ${lineNo + 1}）: 有兜底（攻击仍 ${r.atk.filter(Boolean).length}/${ALL_ATTACK.length}）`);
    }
  } catch (e) {
    detail.push(`${tag}（行 ${lineNo + 1}）: 注入后 require 失败 (${String(e.message).slice(0, 40)})`);
    broken++;
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

for (const lineNo of newLines) {
  const m = lines[lineNo].match(/^\s*\[\/.*\/i?,\s*'(\w+)'/);
  inject(lineNo, m ? m[1] : '未标注');
}

detail.forEach(d => console.log('  ' + d));
console.log(`\n═══ 负例守卫结果：真守卫 ${realGuard} / 有兜底 ${backedUp} / 异常 ${broken} / 共 ${newLines.length} ═══`);
if (realGuard >= 1 && broken === 0) { console.log('PASS'); process.exit(0); }
console.error('FAIL：无真守卫或存在异常');
process.exit(1);
