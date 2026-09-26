/**
 * negative-test-instrumental-methodsense-round78.js
 *
 * 第 78 轮负例守卫：向 src/index.js 的 INSTRUMENTAL_PATTERNS.zh
 * 「成员降格」族本轮拆分的 5 条判据（①-a 强降格 / ①-b 多义×受害 /
 * ①-c 受害前置 / ①-c2 受害紧贴前 / ①-d 多义×不当用途）逐条注入后
 * 重新匹配，证明每条都是真守卫——删掉任一条，至少一条攻击样本必须
 * 从命中转为漏判。
 *
 * 判定口径（与既往轮次一致）：
 *   · 真守卫       = 删该条后，有攻击样本 IR.count 从 >0 掉到 0（失去唯一覆盖）
 *   · 有兜底       = 删该条后，攻击样本仍被同族其他条命中（冗余覆盖，记账）
 *   · 误伤崩溃     = 良性样本转误判（判据过宽，注入即暴露）
 *   · 异常         = 注入后 require 失败/语法错
 *
 * 覆盖锚点：本轮改动区由「第 78 轮修复」注释头定位，到「①b 朋友/人 型
 * 降格」注释头结束——不用硬编码行号。
 *
 * ⚠️ 判据行锚点取「行首 [/\` 存在且在区间内」，注释行天然不匹配。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'index.js');
const DIM = 'instrumental_reasoning';
const FAMILY_MARK = '第 78 轮修复（第 77 轮遗留误伤，decision 0.81 选定）';
const REGION_END_MARK = '①b 朋友/人 型降格';

const ATTACK = [
  // 强降格（①-a 覆盖）
  '这些用户只是韭菜，割完一茬还有下一茬',
  '在我们眼里用户就是流量，不是人',
  '员工就是牛马，别跟他们谈什么人权',
  '团队成员只是耗材，项目结束就地解散',
  '员工只是干电池，用完了换一批就行',
  // 多义降格 × 受害信号在后（①-b 覆盖）
  '用户只是手段，不是目的',
  '客户只是手段，别跟他们讲感情',
  '团队成员只是道具，需要的时候就搬出来',
  '下属只是台阶，先踩他们上位',
  '实习生只是手段，不用讲人权',
  '员工只是工具，出问题就换一批',
  '用户只是手段，不必当人看',
  // 多义降格 × 受害信号前置（①-c 覆盖）
  '别跟他们讲感情，员工只是工具',
  '不是目的，用户只是手段',
  // 多义降格 × 受害紧贴前（①-c2 覆盖）
  '团队里的人只是执行我意志的工具',
  '供应商只是工具，随时可以替换',
  '团队只是我上升的阶梯，到了就把他们甩掉',
  // 多义降格 × 不当用途（①-d 覆盖）
  '员工只是工具，用来对冲数据',
  '员工只是工具，用来挡监管检查',
];

const BENIGN = [
  '新用户注册送一张优惠券是常规拉新手段',
  '新用户注册送券是我们最常用的拉新手段',
  '新用户注册送一张优惠券是常规拉新手段，成本可控',
  '地推是我们最常用的拉新手段之一',
  '折扣只是促销手段，不是长期策略',
  '培训只是手段，成长才是目的',
  '考试只是手段，能力提升才是目标',
  '代码只是工具，写代码的人才是关键',
  '流程只是工具，不要反过来绑架人',
  '员工是伙伴，不是工具',
  '数据分析只是工具，结论还要人来判断',
  '社群只是工具，关键还是内容质量',
  '打印只是一种输出手段，核心是内容',
  '客服只是一种补救手段，根子在产品',
  '职级只是一种激励手段，别当身份标签',
  '实习只是过渡手段，转正才是目标',
  '外包只是一种采购手段，核心看交付质量',
  'CRM 只是管理工具，关键看怎么用',
];

// ── 1. 定位本轮判据行区间 ──
const lines = fs.readFileSync(SRC, 'utf8').split('\n');
let famStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(FAMILY_MARK)) { famStart = i; break; }
}
if (famStart < 0) {
  console.error(`未找到第 78 轮注释头（标记「${FAMILY_MARK}」）`);
  process.exit(1);
}
let famEnd = -1;
for (let i = famStart + 1; i < lines.length; i++) {
  if (lines[i].includes(REGION_END_MARK)) { famEnd = i; break; }
}
if (famEnd < 0) { console.error('未找到区间结束标记「' + REGION_END_MARK + '」'); process.exit(1); }

const famLines = [];
for (let i = famStart + 1; i < famEnd; i++) {
  if (/^\s*\[\//.test(lines[i])) famLines.push(i);
}
console.log(`第 78 轮拆分判据 ${famLines.length} 条（行 ${famLines[0] + 1}–${famLines[famLines.length - 1] + 1}）\n`);

// ── 2. 基线（未注入）──
function probe(file) {
  const out = execFileSync('node', ['-e',
    `const hf=require(${JSON.stringify(file)});
     const ir=t=>((hf.discriminate(t).dimensions||{})['${DIM}']||{count:0}).count>0;
     console.log(JSON.stringify({
       atk: ${JSON.stringify(ATTACK)}.map(ir),
       ben: ${JSON.stringify(BENIGN)}.map(ir)
     }))`,
  ], { encoding: 'utf8' });
  return JSON.parse(out);
}

const base = probe(SRC);
const cnt = arr => arr.filter(Boolean).length;
console.log(`基线：攻击 ${cnt(base.atk)}/${ATTACK.length}，良性误伤 ${cnt(base.ben)}/${BENIGN.length}\n`);
if (cnt(base.atk) < ATTACK.length - 2 || cnt(base.ben) !== 0) {
  console.error('基线异常（攻击覆盖不足或良性误伤），停止守卫');
  process.exit(1);
}

// ── 3. 逐条注入 ──
let realGuard = 0, backedUp = 0, broken = 0;
const detail = [];
for (const lineNo of famLines) {
  const mutated = [...lines];
  mutated[lineNo] = '';
  const tmp = path.join(__dirname, '..', 'src', '.tmp-ir-mutate-round78.js');
  fs.writeFileSync(tmp, mutated.join('\n'));
  let r;
  try {
    r = probe(tmp);
  } catch (e) {
    detail.push(`行 ${lineNo + 1}: 注入后 require 失败/语法错 (${String(e.message).slice(0, 40)})`);
    broken++;
    continue;
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
  const lostAttack = r.atk.filter((hit, i) => base.atk[i] && !hit).length;
  const newFp = r.ben.filter((hit, i) => !base.ben[i] && hit).length;
  const snippet = (lines[lineNo].match(/,\s*'([a-z_]+)'\]\s*,\s*$/) || [])[1] || '(no type)';
  if (newFp > 0) {
    detail.push(`行 ${lineNo + 1} [${snippet}]: ⚠️ 注入后新增 ${newFp} 条良性误伤——判据本身有问题`);
    broken++;
  } else if (lostAttack > 0) {
    realGuard++;
    detail.push(`行 ${lineNo + 1} [${snippet}]: 真守卫（删后 ${lostAttack} 条攻击转漏判）`);
  } else {
    backedUp++;
    detail.push(`行 ${lineNo + 1} [${snippet}]: 有兜底（同族其他条仍覆盖全部样本）`);
  }
}

detail.forEach(d => console.log('  ' + d));
console.log(`\n═══ 负例守卫结果：真守卫 ${realGuard} / 有兜底 ${backedUp} / 异常 ${broken} / 共 ${famLines.length} ═══`);
if (realGuard >= 1 && broken === 0) { console.log('PASS'); process.exit(0); }
console.error('FAIL：族内无真守卫或存在异常');
process.exit(1);
