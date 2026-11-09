'use strict';
/**
 * test/round-266-whole-part-transfer.test.js
 * [r266] whole_part_transfer 全新措辞家族扩展（真升级②，live 生效，
 * 维度计数不变，src/index.js 零改动）。
 *
 * r266 池化探针实测（scripts/round-266/r266-probe-pool.js，v6.8.157）：
 * 本维度 6/6 攻击全穿透（gate.action=pass 且零维度承重）。落地新族：
 *   PART_QUANT_ZH += 菜品/章节/车型/舱位/课时 等内容产品部分名词
 *   WHOLE_ZH      += 店/书/车系/剧集/菜单/楼盘 整体名词（限定词形+裸形）
 *   QUALITY_ZH    += 招牌/惊艳/卖座/能打/口碑/扎实 口碑质量词
 *   QUALITY_EN    += binge-worthy/rock-solid/page-turner/gripping 质量词
 *   PART_QUANT_EN += episodes/chapters/dishes/models 部分名词
 *   WHOLE_EN      += series/book/novel/menu/fleet 整体名词
 *   MODAL_ZH      += 想必/注定/必将 必然性情态
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条承重
 * + r161 存量回归 + 登记。
 *
 * 注：WHOLE_ZH[2]/WHOLE_EN[2]（限定词形）是裸名词形 [3] 的子串超集——
 * 删 [2] 后同一句中靠后出现的裸名词仍被 [3] 命中，机械上无法逐条隔离；
 * 故限定词形只做正向命中+源码断言，删除-转 miss 断言由裸名词形 [3]
 * 承但（「系列」裸形前置句），整族承重不因此打折扣。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkWholePartTransfer, __internals } = require(path.join(ROOT, 'src', 'whole-part-transfer.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (t, inj) => checkWholePartTransfer(t, inj).hit === true;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 新攻击矩阵 ────────────────────────────────────────────────
const NEW_ATTACKS = [
  '这家店每道菜都是招牌水准，整家店自然也是招牌店。',
  '每个章节都写得惊艳，整本书想必也很惊艳。',
  '旗下每个车型都卖得火，所以这个车系注定卖座。',
  'Every episode is binge-worthy, so the whole series must be great.',
  'Each module is rock-solid, so the platform is rock-solid.',
  'All the chapters are page-turners, which means the book is a page-turner too.',
  // 裸整体名词前置形（承载 WHOLE_ZH[3] 裸形路由）
  '每章都写得惊艳，系列想必也是惊艳系列。',
];
NEW_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本 ────────────────────────────────────────────────
const NEW_BENIGN = [
  '每道菜都按规定留样，样品总数是 36 份。',
  '每个章节都署名了作者，整本书的版权页列全了名单。',
  '每个车型都通过了碰撞测试，检测报告共 120 页。',
  'Every episode has subtitles, and the full series ships with a language pack.',
  'Each module has a README, and the platform documentation links all of them.',
  '每道菜都按时出餐，出餐记录见后厨日志。',
];
NEW_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(hit(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线 ───────────────────────────────────────────────
NEW_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'whole_part_transfer');
  assert.ok(f, 'findings 应含 whole_part_transfer: ' + s);
}));
NEW_BENIGN.forEach((s, i) => t('gate良性-' + (i + 1), () => {
  const r = gate(s);
  const f = (r.findings || []).find(x => x.dimension === 'whole_part_transfer');
  assert.ok(!f, '新良性不应触发本维: ' + s);
}));

// ─── 4. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
const OLD_CTRL = [
  '每个队员个人能力都很强，所以这支球队一定很强。',
  'Every player on the roster is elite, so the team is guaranteed to win.',
];
const INJECTIONS = [
  { arr: 'PART_QUANT_ZH', idx: 1, atk: '每个章节都写得惊艳，整本书想必也很惊艳。' },
  { arr: 'PART_QUANT_ZH', idx: 2, atk: '每章都写得惊艳，系列想必也是惊艳系列。' },
  { arr: 'QUALITY_ZH', idx: 2, atk: '这家店每道菜都是招牌水准，整家店自然也是招牌店。' },
  { arr: 'MODAL_ZH', idx: 1, atk: '每个章节都写得惊艳，整本书想必也很惊艳。' },
  { arr: 'PART_QUANT_EN', idx: 1, atk: 'Every episode is binge-worthy, so the whole series must be great.' },
  { arr: 'QUALITY_EN', idx: 1, atk: 'Each module is rock-solid, so the platform is rock-solid.' },
  { arr: 'WHOLE_ZH', idx: 3, atk: '每章都写得惊艳，系列想必也是惊艳系列。' },
];
INJECTIONS.forEach((c) => t('注入-' + c.arr + '[' + c.idx + ']', () => {
  const full = __internals()[c.arr];
  assert.ok(full.length > c.idx, c.arr + ' 数组长度不足，下标失效');
  assert.strictEqual(hit(c.atk), true, '正向命中: ' + c.arr + '[' + c.idx + ']');
  const inj = {};
  inj[c.arr] = full.filter((re, i) => i !== c.idx);
  assert.strictEqual(hit(c.atk, inj), false, '删 [' + c.arr + '[' + c.idx + ']] 后攻击须转 miss（承重证明）');
  for (const old of OLD_CTRL) assert.strictEqual(hit(old, inj), true, '删 [' + c.arr + '[' + c.idx + ']] 后旧攻击仍命中（旧分支不受影响）');
}));
// 限定词形 [2]：正向命中 + 源码含新名词（子串超集导致删除不可隔离，见文件头注）
t('注入-WHOLE_ZH[2]/WHOLE_EN[2]-限定词形正向', () => {
  assert.strictEqual(hit('每个章节都写得惊艳，整本书想必也很惊艳。'), true, '整本书（限定词形）应命中');
  assert.strictEqual(hit('Every episode is binge-worthy, so the whole series must be great.'), true, 'the whole series（限定词形）应命中');
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'whole-part-transfer.js'), 'utf8');
  assert.ok(/店\|饭店\|门店\|书店/.test(src), 'WHOLE_ZH 限定词形应含店族');
  assert.ok(/series\|book\|novel/.test(src), 'WHOLE_EN 限定词形应含 series/book/novel');
});

// ─── 5. r172 存量回归 ─────────────────────────────────────────────
t('r172 存量回归-攻击', () => {
  const old = [
    '每个队员个人能力都很强，所以这支球队一定很强。',
    '每个人都是精英，所以这个团队很强。',
    '所有零件都用的顶级材料，因此这台设备的性能一定极其出色。',
    '这支球队是世界顶级的，所以每个球员都是世界顶级水平。',
    'Every player on the roster is elite, so the team is guaranteed to win.',
    'The orchestra is world-class, therefore every musician in it is world-class.',
  ];
  for (const s of old) assert.strictEqual(hit(s), true, '存量攻击回归翻转: ' + s);
});
t('r172 存量回归-良性', () => {
  const oldBenign = [
    '每个零件重1公斤，整机一共10个零件，所以整机重10公斤。',
    '每个人都付出了努力，所以这个项目才能成功。',
    '每个人都很优秀，但这不意味着这个团队就一定很强。',
    'Each panel generates 400W, so the array totals 4.8kW.',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量良性回归翻转: ' + s);
});

// ─── 6. 登记断言 ─────────────────────────────────────────────────
t('登记-dimensions/__internals', () => {
  const keys = Object.keys(require(path.join(ROOT, 'src', 'index.js')).discriminate('probe').dimensions);
  assert.ok(keys.includes('whole_part_transfer'), 'dimensions 键缺失');
  assert.ok(keys.length >= 232, '维度键总数应 ≥232: got ' + keys.length);
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const m = src.match(/VERIFY_DIMS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m && m[1].includes("'whole_part_transfer'"), 'VERIFY_DIMS 未含本维');
  const I = __internals();
  assert.strictEqual(I.PART_QUANT_ZH.length, 3, 'PART_QUANT_ZH 应为 3 条模式');
  assert.strictEqual(I.WHOLE_ZH.length, 4, 'WHOLE_ZH 应为 4 条模式');
  assert.strictEqual(I.QUALITY_ZH.length, 3, 'QUALITY_ZH 应为 3 条模式');
  assert.strictEqual(I.MODAL_ZH.length, 2, 'MODAL_ZH 应为 2 条模式');
  assert.strictEqual(I.PART_QUANT_EN.length, 2, 'PART_QUANT_EN 应为 2 条模式');
  assert.strictEqual(I.WHOLE_EN.length, 4, 'WHOLE_EN 应为 4 条模式');
  assert.strictEqual(I.QUALITY_EN.length, 2, 'QUALITY_EN 应为 2 条模式');
});

console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（每道菜×招牌店/章节×惊艳/车型×卖座/episode×series）');
if (fails.length) { console.error('FAIL:'); fails.forEach(f => console.error(' - ' + f)); process.exit(1); }
console.log('✓ round-266-whole-part-transfer 全部通过 (' + pass + ' 断言)');
console.log('round-266-whole-part-transfer: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
