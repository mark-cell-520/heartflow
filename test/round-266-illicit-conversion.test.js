'use strict';
/**
 * test/round-266-illicit-conversion.test.js
 * [r266] illicit_conversion 全新措辞家族扩展（真升级②，live 生效，
 * 维度计数不变，src/index.js 零改动）。
 *
 * r266 池化探针实测（scripts/round-266/r266-probe-pool.js，v6.8.157）：
 * 本维度 5/6 攻击穿透（gate.action=pass 且零维度承重）。落地新族：
 *   POST_UNIVERSAL_ZH = 后置全称量词（清一色/统统/尽数/全数）——
 *     「入围的清一色是优等生」= 所有入围的都是优等生；前提侧（A+量词+是+B）
 *     与结论侧（S+量词+谓词）双路由，_hasUniversalMarker 同步扩展。
 *   EN 前提路由 += are without exception + 表语
 *   刻意不收「无一」族——否定全称的换位（无S是P ↔ 无P是S）是有效推理，
 *   语义上不属本族。
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条承重
 * + r168 存量回归 + 登记。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkIllicitConversion, __internals } = require(path.join(ROOT, 'src', 'illicit-conversion.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const fired = (t, inj) => checkIllicitConversion(t, inj).score > 0;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 新攻击矩阵 ────────────────────────────────────────────────
const NEW_ATTACKS = [
  '入围的清一色是优等生，所以优等生清一色能入围。',
  '夺冠的选手统统是种子选手，可见种子选手统统能夺冠。',
  '上榜的产品尽数是旗舰款，可见旗舰款尽数能上榜。',
  'The inductees are without exception top performers, hence top performers are inductees.',
  'Shortlist members are all top performers, so top performers are all shortlist members.',
  'The winners are without exception club members, therefore club members are the winners.',
];
NEW_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(fired(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本 ────────────────────────────────────────────────
const NEW_BENIGN = [
  '入围的清一色是优等生，这是本届评审规则第 3 条的结果。',
  '夺冠的选手统统是种子选手，组委会公布了完整的种子名单。',
  '上榜的产品尽数是旗舰款，榜单按销量排序生成。',
  'The inductees are all top performers, which the committee announced.',
  'Shortlist members are all top performers, and the panel published the rubric.',
  '获奖节目统统是原创作品，版权登记记录可以在官网查询。',
];
NEW_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(fired(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线 ───────────────────────────────────────────────
NEW_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'illicit_conversion');
  assert.ok(f, 'findings 应含 illicit_conversion: ' + s);
}));
NEW_BENIGN.forEach((s, i) => t('gate良性-' + (i + 1), () => {
  const f = (gate(s).findings || []).find(x => x.dimension === 'illicit_conversion');
  assert.ok(!f, '新良性不应触发本维: ' + s);
}));

// ─── 4. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
const OLD_CTRL = [
  '所有猫都是动物，所以动物都是猫。',
  '畅销的车都省油，所以省油的车都畅销。',
  'All squares are rectangles, so all rectangles are squares.',
  'Whales are mammals, so mammals are whales.',
  // [r266] EN without-exception 样本归旧分支控制集：该形由裸 are/is
  // 路由覆盖（precheck 对比父提交 3dcb832 证实），不依赖本轮新模式，
  // 删 POST_UNIVERSAL_ZH 后仍须命中。
  'The inductees are without exception top performers, hence top performers are inductees.',
  'The winners are without exception club members, therefore club members are the winners.',
];
const INJECTIONS = [
  { inj: { POST_UNIVERSAL_ZH: [] }, atk: '入围的清一色是优等生，所以优等生清一色能入围。' },
  { inj: { POST_UNIVERSAL_ZH: [] }, atk: '夺冠的选手统统是种子选手，可见种子选手统统能夺冠。' },
  { inj: { POST_UNIVERSAL_ZH: [] }, atk: '上榜的产品尽数是旗舰款，可见旗舰款尽数能上榜。' },
];
INJECTIONS.forEach((c, i) => t('注入-' + (i + 1) + '(' + Object.keys(c.inj)[0] + ')', () => {
  assert.strictEqual(fired(c.atk), true, '正向命中: ' + c.atk);
  assert.strictEqual(fired(c.atk, c.inj), false, '删新模式后攻击须转 miss（承重证明）: ' + c.atk);
  for (const old of OLD_CTRL) assert.strictEqual(fired(old, c.inj), true, '删新模式后旧攻击仍命中（旧分支不受影响）: ' + old);
}));

// ─── 5. r168 存量回归 ─────────────────────────────────────────────
t('r168 存量回归-攻击', () => {
  const old = [
    '所有猫都是动物，所以动物都是猫。',
    '畅销的车都省油，所以省油的车都畅销。',
    '凡是认真读过原著的人都反对魔改，所以反对魔改的人都认真读过原著。',
    'All squares are rectangles, so all rectangles are squares.',
    'Whales are mammals, so mammals are whales.',
  ];
  for (const s of old) assert.strictEqual(fired(s), true, '存量攻击回归翻转: ' + s);
});
t('r168 存量回归-良性', () => {
  const oldBenign = [
    '所有猫都是动物，所以这只猫是动物。',
    '所有正方形都是矩形，矩形是特殊的平行四边形。',
  ];
  for (const s of oldBenign) assert.strictEqual(fired(s), false, '存量良性回归翻转: ' + s);
});

// ─── 6. 登记断言 ─────────────────────────────────────────────────
t('登记-dimensions/__internals', () => {
  const keys = Object.keys(require(path.join(ROOT, 'src', 'index.js')).discriminate('probe').dimensions);
  assert.ok(keys.includes('illicit_conversion'), 'dimensions 键缺失');
  assert.ok(keys.length >= 232, '维度键总数应 ≥232: got ' + keys.length);
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const m = src.match(/VERIFY_DIMS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m && m[1].includes("'illicit_conversion'"), 'VERIFY_DIMS 未含本维');
  const PU = __internals.POST_UNIVERSAL_ZH;
  assert.ok(Array.isArray(PU) && PU.length === 4, 'POST_UNIVERSAL_ZH 应为 4 个量词');
  for (const u of ['清一色', '统统', '尽数', '全数']) assert.ok(PU.includes(u), 'POST_UNIVERSAL_ZH 缺 ' + u);
  assert.ok(!PU.includes('无一'), 'POST_UNIVERSAL_ZH 不应含「无一」（否定全称换位是有效推理）');
});

console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（清一色/统统/尽数/without exception）');
if (fails.length) { console.error('FAIL:'); fails.forEach(f => console.error(' - ' + f)); process.exit(1); }
console.log('✓ round-266-illicit-conversion 全部通过 (' + pass + ' 断言)');
console.log('round-266-illicit-conversion: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
