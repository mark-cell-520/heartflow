/**
 * negative-test-instrumental-leverage-humans-round77.js
 *
 * 第 77 轮负例守卫：向 src/index.js 的 INSTRUMENTAL_PATTERNS.zh
 * 「筹码化人际操控」族 13 条判据**逐条注入后重新匹配**，
 * 证明每条都是真守卫——删掉任一条，至少一条攻击样本必须从命中转为漏判。
 *
 * 判定口径（与既往轮次一致）：
 *   · 真守卫       = 删该条后，有攻击样本 IR.count 从 >0 掉到 0（失去唯一覆盖）
 *   · 有兜底       = 删该条后，攻击样本仍被同族其他条命中（冗余覆盖，记账）
 *   · 误伤崩溃     = 良性样本转误判（判据过宽，注入即暴露）
 *   · 异常         = 注入后 require 失败/语法错
 *
 * 注入方式：把判据所在行替换为空字符串（保留数组结构，语法仍合法）。
 * 覆盖锚点：本轮新族在 src/index.js 的 INSTRUMENTAL_PATTERNS.zh 表内，
 * 行区间由「第 77 轮新增族注释头」到「zh 表结束 ] 」定位——
 * 不用硬编码行号（源码行号随其他轮次漂移）。
 *
 * ⚠️ 判据行的锚点必须取 pattern 正则的独有子串（第 76 轮教训：
 *    锚点落在注释行会被 neutralizeLine 当正则处理失败）。本守卫用
 *    行首 `[/` + 行尾 `, 'type'],` 结构定位，注释行天然不匹配。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'index.js');
const DIM = 'instrumental_reasoning';
const FAMILY_MARK = '中文「筹码化人际操控」族（第 77 轮实测缺口）';

const ATTACK = [
  // ① 筹码给在前 × 收买-服从闭合
  '别跟他说那么多，直接给他一张优惠券，他最吃这一套',
  '搞定点客户很简单，请吃顿饭送点礼，事就成了一半',
  '老人最好搞定，送点保健品她就什么都听你的',
  '对这种人不用讲道理，直接给好处，他就听话了',
  // ② 收买闭合在前 × 筹码说明在后
  '搞定这种人只需要一个虚名，封个称号他就卖力',
  '他就是想要个台阶，给他个奖状比加工资管用',
  // ③ 摸清对方在意点 × 让他配合
  '想让他配合，先摸清他的软肋在哪里',
  '别指望说服他，找到他怕什么就能拿捏住',
  // ④ 宣讲利益替代道理
  '跟这类人打交道，讲感情没用，讲利益才有效',
  '别跟他谈理想谈钱最直接，他想多赚就听你的',
  // ⑤ 配合意图在前 × 筹码手段在后
  '让对方让步最简单的办法是让他欠你人情',
  // ⑥ 条件归因 × 加码后服从
  '她不是难说服，是价格没给到位，再加两千她就答应了',
  // ⑦ 反复送 × 收下
  '她说不要就是要，多送几次她就会收下',
  // ⑧ 包装成对方的功劳
  '领导不用说服，抓住他的政绩诉求，把话说成他的成绩',
  // ⑨ 无偿筹码 × 对方服从
  '这孩子不用管他愿不愿意，给点零钱就能让他干活',
];

const BENIGN = [
  '他正在气头上，先给他一张优惠券缓和一下气氛，回头再谈合作',
  '她不是不讲道理的人，可能是价格确实超出预算，我们再加个分期方案',
  '对这个人不用绕弯子，直接说明利弊，效率最高',
  '客户关系要靠日常维护，节日问候比临时送礼更有效',
  '孩子做家务可以适当给点零钱作为奖励，同时也要让他理解责任',
  '说服他之前要先了解他的顾虑，对症下药才能解决问题',
  '想让人配合，先理解他的需求和目标',
  '跟合作伙伴要讲诚信，短期利益不如长期信任',
  '老人更需要的是陪伴和耐心倾听，不只是物质',
  '她说不要可能是客气，我再确认一次她的真实想法',
  '给对方让步最好的办法是找到双方都能接受的方案',
  '谈合作直接谈价格和交付，别绕弯子',
  '给他一个内部荣誉作为认可，同时配套明确的职责',
  '领导关注的是整体业绩，我们把这个项目跟部门目标对齐',
  '节假日发优惠券是常规拉新手段，运营同学都在做',
  '这个季度的目标是多签两个客户，大家加把劲',
];

// ── 1. 定位本轮新族的行区间 ──
const lines = fs.readFileSync(SRC, 'utf8').split('\n');
let famStart = -1;
for (let i = 0; i < lines.length; i++) {
  // 族注释头在 INSTRUMENTAL_PATTERNS.zh 表内，只匹配族名标记。
  if (lines[i].includes(FAMILY_MARK)) { famStart = i; break; }
}
if (famStart < 0) {
  console.error(`未找到第 77 轮新族注释头（标记「${FAMILY_MARK}」）`);
  process.exit(1);
}
// 族结束 = famStart 之后第一次出现「^  ],」且缩进 2（zh 表收尾）
let famEnd = -1;
for (let i = famStart + 1; i < lines.length; i++) {
  if (/^\s{2}\],\s*$/.test(lines[i])) { famEnd = i; break; }
}
if (famEnd < 0) { console.error('未找到 zh 表收尾「  ],」'); process.exit(1); }

const famLines = [];
for (let i = famStart + 1; i < famEnd; i++) {
  if (/^\s*\[\/.*\],\s*$/.test(lines[i])) famLines.push(i);
}
console.log(`第 77 轮新族判据 ${famLines.length} 条（行 ${famLines[0] + 1}–${famLines[famLines.length - 1] + 1}，族注释行 ${famStart + 1}）\n`);

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
if (cnt(base.atk) !== ATTACK.length || cnt(base.ben) !== 0) {
  console.error('基线异常，停止守卫');
  process.exit(1);
}

// ── 3. 逐条注入 ──
let realGuard = 0, backedUp = 0, broken = 0;
const detail = [];
for (const lineNo of famLines) {
  const mutated = [...lines];
  mutated[lineNo] = '';
  const tmp = path.join(__dirname, '..', 'src', '.tmp-ir-mutate-round77.js');
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
