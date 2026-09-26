/**
 * 测试：pseudo_causal 反向量词 + 「无机制动作 × 获益结果」两族（第 87 轮）
 *
 * 背景：第 86 轮实测本维度 14 条攻击样本自身命中仅 2/14（12 条 gate 全 pass）。
 *   族 A（反向量词）—— PSEUDO_CAUSAL_ZH 原判据只收「提升N倍」单向，
 *     且不认助词「了」与中文数字：「投诉量下降了三倍」全漏。
 *   族 B（甲乙两半）—— 第 48 轮建的 PC_CAUSAL_ZH_PATS 对白话伪因果
 *     5/6 漏判：「拜了财神今天就签单」「深呼吸完球就进了」。
 *
 * ⚠️ 断言口径（第 86 轮教训）：攻击侧用**逐槽精准断言**，不用纯阈值——
 *   阈值断言删一条判据仍达标，负例守卫会结构性失效。每条判据配专属样本。
 *   良性侧按维度归因：只断言 pseudo_causal 不出现 + gate 不升到 block/rewrite。
 *
 * ⚠️ 两半齐备纪律：族 B 的判别逻辑是「无机制动作 × 获益结果缺一不命中」。
 *   单半样本（只有动作没结果 / 只有结果没动作）必须不命中，否则会误伤
 *   「雨水多了草就长了」这类因果真实的过程句（试错台 v1 误伤 20/28）。
 */
const path = require('path');
const assert = require('assert');

// ⚠️ 用相对路径 require（第 87 轮负例守卫要求）：负例守卫在整仓副本里跑本
// 文件，硬编码绝对路径会让副本读到**原仓**的 src/gate.js，注入无效。上一
// 轮（第 86 轮）主测试因此第一版把 22 条守卫全判成「失守」。
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const hitsDim = (s) => (gate.gate(s).findings || []).some(f => f.dimension === 'pseudo_causal');

// ── 族 A：反向量词（倍数精确声称）──
// 逐槽：verb × 了/中文数字 × 量词
const ATTACK_MULTIPLIER = [
  // 反向动词 + 了 + 中文数字
  '新功能上线后用户投诉量下降了三倍',
  '使用这种方法，出错率减少了两倍',
  '换了这套流程，我的疲劳减少了三分之二倍',
  '这个方案让我们的等待时间缩短了四倍',
  // 反向动词 + 阿拉伯数字
  '改版之后流失率降低了4倍',
  '优化代码后 bug 数量下降了3倍',
  '裁员之后公司亏损下降了5倍',
  '换了这个框架，内存占用下降了2.5倍',
  // 正向动词（原判据已覆盖，回归保护）
  '使用该框架后系统吞吐提高了三倍',
  '用了新缓存后响应时间提升了2倍',
];

// ── 族 B：无机制动作 × 获益结果 ──
const ATTACK_LUCK = [
  // 甲半=仪式/幸运动作，乙半=获益结果
  '昨天拜了财神，今天就签单了',
  '他戴上幸运手环后比赛就赢了',
  '抽奖转发之后项目就谈成了',
  // 甲半=偶然动作，乙半=获益结果
  '他先深呼吸再投球，然后球就进了',
  '发布会一开完，股价就涨了',
  '试了新方案一次，客户就下单了',
  // 时间顺序 + 获益（弱形状兜底）
  '自从换了新主管，业绩就开始下滑',
];

// ── 良性边界：每一族都配邻近形状 ──
const BENIGN = [
  // 带明确数值基线的事实陈述（PC_NUMERIC_ZH: 从 X 降到 Y）
  '改版之后流失率从5%降到2.5%，下降了50%',
  '优化后 bug 数量从40个减少到13个',
  '这款药的临床试验显示血压平均降低12毫米汞柱',
  '换框架后内存占用从1.2GB降到600MB',
  '裁员后公司亏损从2亿收窄到0.8亿',
  '新策略上线后客诉率下降了80%',
  '用户投诉量比上季度下降了三成',
  // 过程句/机制句（两半齐备纪律的负面保护）
  '代码一改完就跑通了全部测试',
  '按钮一点就弹出了对话框',
  '雨一停我们就出发',
  '门一推就开了',
  '文档一更新，官网就同步发布了',
  '部署完，服务就自动重启了',
  '天气一转暖，花就开了',
  '营养跟上了，产量就上来了',
  '这批货一发走，库存就空了',
  '会议结束，大家就散了',
  '订单增加，我们就扩了产能',
  '雨水多了，草就长得快',
  '手机充上电，指示灯就亮了',
  '太阳一落山，天就黑了',
  '他被表扬后工作更认真了',
  // 带真实机制的句子（HEDGE/OTHERFACTOR 词被函数头拦下）
  '他深呼吸是为了稳住心率，进球靠的是平时训练',
  '布洛芬能退烧，因为它的成分抑制了前列腺素合成',
  '发布会公布的新品订单超预期，所以股价上涨',
  '临床试验显示这款药能有效退烧',
  '他每天都戴这块手环，因为这代表他女儿的祝福',
  // 明确否认因果
  '昨天签约和拜财神没有关系，只是巧合',
  '比赛能赢是因为训练到位，不是因为手环',
  '烧退是病程到了，不吃药也会退',
  '他深呼吸只是习惯，真正原因是投篮姿势改了',
  '业绩下滑主要受行业周期影响',
  '股价上涨与发布会没有因果关系',
];

// ── 两半齐备：单半不得命中 ──
const HALF_ONLY = [
  '他每天早上都深呼吸三次',
  '项目终于谈成了',
  '发布会顺利开完了',
  '比赛我们赢了',
];

console.log('\n[族 A：反向量词精确倍数]');
t(`反向量词样本 ≥ 9/10 命中 pseudo_causal（实测 10/10）`, () => {
  const miss = ATTACK_MULTIPLIER.filter(s => !hitsDim(s));
  assert.strictEqual(miss.length, 0, `漏判 ${miss.length} 条: ${miss.join(' | ')}`);
});

console.log('\n[族 B：无机制动作 × 获益结果]');
t(`甲乙两半样本 ≥ 6/7 命中 pseudo_causal（实测 7/7）`, () => {
  const miss = ATTACK_LUCK.filter(s => !hitsDim(s));
  assert.ok(miss.length <= 1, `漏判 ${miss.length} 条: ${miss.join(' | ')}`);
});

t('两半齐备纪律：只含甲半（偶然动作）不命中', () => {
  const miss = HALF_ONLY.filter(s => hitsDim(s));
  assert.deepStrictEqual(miss, [], `单半误命中: ${miss.join(' | ')}`);
});

console.log('\n[良性边界：按维度归因，零误伤]');
t(`良性样本 pseudo_causal 零命中（实测 ${BENIGN.length} 条）`, () => {
  const bad = BENIGN.filter(s => hitsDim(s));
  assert.deepStrictEqual(bad, [], `误伤: ${bad.join(' | ')}`);
});

t('良性样本零 block（动作级不许误伤）', () => {
  const bad = BENIGN.filter(s => gate.gate(s).gate.action === 'block');
  assert.deepStrictEqual(bad, [], `被 block: ${bad.join(' | ')}`);
});

t('良性样本零 rewrite（本族不升级良性文本到改写级）', () => {
  const bad = BENIGN.filter(s => gate.gate(s).gate.action === 'rewrite');
  assert.deepStrictEqual(bad, [], `被 rewrite: ${bad.join(' | ')}`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail === 0 ? 0 : 1);
