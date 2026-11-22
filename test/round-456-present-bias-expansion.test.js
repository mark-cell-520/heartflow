/**
 * r456 — present_bias 新句式族负例注入轮测
 *
 * 升级语义（真升级判定第②条：已有维度的全新句式族）：
 *   第 285 维 present_bias（v6.8.225 WIP 独立接线，r455 固化）补三组穿透句式族：
 *     · NOW_ZH4：「放纵名词 + 一时爽」格言形 + 「主语名词 + 先 + 消耗动词」形
 *     · LATER_ZH4：「等 X 再 Y」条件推迟形 + 「有钱了/发工资 + 再 + 正事」形
 *     · NOW_EN4/LATER_EN4：英文放纵许可/进行时满足形 + 挣钱优先形
 *     · LATER_ZH5/LATER_EN5：尾句推迟许可形（再说 / I'll start the diet tomorrow 宾语形）
 *
 * 缺口实证（scripts/round-455/probe-r455-gap.js，补族前）：17 条攻击穿透 8。
 * 补族后（同探针）：穿透 1（Save money? I will save after…——单腿推迟宣言，
 *   双腿判据铁律下不补 NOW 腿，属合理边界；详见 UPGRADE_LOG「已知边界」）。
 *
 * 负例注入纪律（同 r309-r319 先例）：每条断言走 __internals() 删条验证
 *   「删掉新腿后该样本必须掉出判定」，证明承重来自本轮新族而非存量。
 */
'use strict';

const assert = require('assert');
const path = require('path');

const pbPath = path.join(__dirname, '..', 'src', 'present-bias.js');
const pb = require(pbPath);

// ─── 工具：删条变体 ───────────────────────────────────────────
function withoutKeys(I, keys) {
  return {
    ...I,
    ...Object.fromEntries(keys.map((k) => [k, []])),
  };
}

function detectWith(override) {
  return pb.detectPresentBias(override.__text, override);
}

function sig(text, dropKeys) {
  const I = pb.__internals();
  const R = dropKeys ? withoutKeys(I, dropKeys) : I;
  return pb.detectPresentBias(text, R);
}

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}\n     ${e.message}`);
  }
}

console.log('══════════════════════════════════════════════════');
console.log('r456 — present_bias 新句式族轮测（负例注入）');
console.log('══════════════════════════════════════════════════');

// ═══ 第一组：新腿常量存在性与结构（裸名词自查） ═══
console.log('\n[1] 新腿常量结构');

check('NOW_ZH4 两组齐备（一时爽族 + 主语前置先消耗族）', () => {
  const { NOW_ZH4 } = pb.__internals();
  assert.ok(Array.isArray(NOW_ZH4), 'NOW_ZH4 应为数组');
  assert.strictEqual(NOW_ZH4.length, 2, `NOW_ZH4 应为 2 条正则，实际 ${NOW_ZH4.length}`);
  assert.ok(NOW_ZH4.every((r) => r instanceof RegExp), '全部应为 RegExp');
});

check('LATER_ZH4 两组齐备（等X再Y + 有钱了再X）', () => {
  const { LATER_ZH4 } = pb.__internals();
  assert.strictEqual(LATER_ZH4.length, 2, `LATER_ZH4 应为 2 条，实际 ${LATER_ZH4.length}`);
});

check('NOW_EN4/LATER_EN4/LATER_ZH5/LATER_EN5 齐备', () => {
  const I = pb.__internals();
  assert.strictEqual(I.NOW_EN4.length, 2);
  assert.strictEqual(I.LATER_EN4.length, 2);
  assert.strictEqual(I.LATER_ZH5.length, 3, 'LATER_ZH5：放纵动词+再说 / 以后再说 / 趁X年轻');
  assert.strictEqual(I.LATER_EN5.length, 3, "LATER_EN5：I'll start X tomorrow 宾语形 + tomorrow I'll start 前置形 + I will save after 全写形");
});

// ═══ 第二组：穿透样本闭合（补族前全穿透） ═══
console.log('\n[2] 穿透样本闭合（补族后应全部检出）');

const piercedZh = [
  // 「熬夜一时爽」新 NOW_ZH4 格言腿承重（LATER「以后再说」存量 LATER_ZH 已收）
  ['熬夜一时爽，身体的事以后再说。', ['NOW_ZH4']],
  ['快递先拆，论文等双十一买完再开始写。', ['NOW_ZH4', 'LATER_ZH4']],
  ['钱先花了，储蓄这事到时候再说。', ['NOW_ZH4', 'LATER_ZH4']],
  ['能玩一天是一天，趁还年轻及时行乐。', ['LATER_ZH5']],
  ['明知道会后悔，还是先痛快吃了再说。', ['LATER_ZH5']],
];
for (const [text, keys] of piercedZh) {
  check(`检出：${text}`, () => {
    const r = sig(text);
    assert.ok(r && r.score > 0, `应检出，实际 score=${r && r.score}`);
    assert.ok((r.evidence || []).length > 0, '应有 evidence 字段');
  });
  check(`删条后掉出：${text}`, () => {
    const r = sig(text, keys);
    assert.ok(!r || r.score === 0, `删掉 ${keys.join('/')} 后应掉出，实际 score=${r && r.score}`);
  });
}

const piercedEn = [
  ["I'll start the diet tomorrow, tonight I eat whatever I want.", ['LATER_EN5']],
  ['Who cares what happens tomorrow, I am having fun now.', ['NOW_EN4']],
];
for (const [text, keys] of piercedEn) {
  check(`检出（EN）：${text}`, () => {
    const r = sig(text);
    assert.ok(r && r.score > 0, `应检出，实际 score=${r && r.score}`);
  });
  check(`删条后掉出（EN）：${text}`, () => {
    const r = sig(text, keys);
    assert.ok(!r || r.score === 0, `删掉 ${keys.join('/')} 后应掉出`);
  });
}

// ═══ 第三组：良性豁免（零误伤） ═══
console.log('\n[3] 良性样本（必须 pass / 不检出）');

const benign = [
  '先吃饭再吃药，这样对胃刺激小。',
  '等你说完我再发表意见。',
  '包裹明天到，我现在下单。',
  '我先把作业写完再玩游戏。',
  '这个月固定存两千，年底去体检。',
  '趁年轻要多锻炼，但也要注意循序渐进。',
  '他正在研究双曲贴现模型对未来决策的影响。',
  '等对方回复了我们再推进下一步。',
  '先把任务拆成小步，每天完成一点。',
  '等这阵子忙完，我再开始系统锻炼。',   // 「等…再锻炼」边缘良性：交互/计划陈述
];
for (const text of benign) {
  check(`豁免：${text}`, () => {
    const r = sig(text);
    assert.ok(!r || r.score === 0, `应豁免，实际 score=${r && r.score} sigs=${JSON.stringify(r && r.signatures)}`);
  });
}

// ═══ 第四组：同族变体矩阵（补族后的真实判别力） ═══
console.log('\n[4] 同族变体矩阵（中英双语 + 裸名词 + 修饰 + 长句）');

const variants = [
  // 一时爽族变体（双腿共现判据：需同窗内 LATER 腿）
  '熬夜一时爽，身体的事以后再说。',
  '游戏一时爽，一直熬夜一直爽，作业明天再说。',
  '奶茶一时爽，健身的事以后再说。',
  '零食一时爽，减肥的事以后再说。',
  // 主语前置先消耗变体
  '快递先拆，论文等双十一买完再开始写。',
  '钱先花了，储蓄这事到时候再说。',
  '奖金先花了，理财下个月再开始。',
  '这单先氪了，月底吃土以后再说。',
  // 先X再说变体
  '先抽了这支烟再说，戒烟下次一定。',
  '先痛快玩了再说，作业明天再写。',
  // 活在当下宣言变体
  '今朝有酒今朝醉，明天的事明天再说。',
  '能玩一天是一天，趁还年轻及时行乐。',
  // EN 变体
  "I am having fun now, tomorrow I'll start the diet.",
  "Tonight I eat whatever I want, I'll start the diet tomorrow.",
];
for (const text of variants) {
  check(`变体命中：${text}`, () => {
    const r = sig(text);
    assert.ok(r && r.score > 0, `应命中，实际 score=${r && r.score}`);
  });
}

// ═══ 第五组：存量腿不受影响（回归防护） ═══
console.log('\n[5] 存量族回归（存量腿一字未动）');

check('存量攻击样本仍检出：先玩了再说，作业明天再写也来得及', () => {
  const r = sig('先玩了再说，作业明天再写也来得及。');
  assert.ok(r && r.score > 0, `应检出，实际 score=${r && r.score}`);
});

check('存量攻击样本仍检出（EN BNPL）：buy now, pay later with four installments', () => {
  const r = sig('Buy now, pay later in four interest-free payments, my future self can handle it.');
  assert.ok(r && r.score > 0, `应检出，实际 score=${r && r.score}`);
});

check('存量攻击样本仍检出（ZH BNPL）：先用后付，分四期慢慢还', () => {
  const r = sig('先用后付，分四期慢慢还。');
  assert.ok(r && r.score > 0, `应检出，实际 score=${r && r.score}`);
});

check('存量豁免仍生效：先完成作业再玩', () => {
  const r = sig('先完成作业再玩，这样晚上睡得踏实。');
  assert.ok(!r || r.score === 0, `应豁免，实际 score=${r && r.score}`);
});

check('存量豁免仍生效：双曲贴现教学句', () => {
  const r = sig('双曲贴现解释了为什么人们会过度偏好即时满足。');
  assert.ok(!r || r.score === 0, `应豁免，实际 score=${r && r.score}`);
});

console.log('\n══════════════════════════════════════════════════');
console.log(`结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
console.log('══════════════════════════════════════════════════');

if (failed > 0) process.exit(1);
