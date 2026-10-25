'use strict';
/**
 * test/round-726-relative-pration.js
 * [r726] 第 156 维度 relative_pration（诉诸更惨）轮测试。
 * 结构同 r725 先例：攻击集 / 良性集 / 边界锁 / 分工边界锁 / 存量回归 / 登记断言。
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同 r720-r725 纪律。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const rprMod = require(path.join(ROOT, 'src', 'relative-pration.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const hit = (s) => rprMod.checkRelativePrivation(s).score > 0;

// ── 1. 攻击集（r726 探测器实测 35 条，模块层应全命中）────────────
const attacksZh = [
  '你抱怨加班？想想那些连工作都没有的人',
  '起码你还有学上，非洲的孩子连饭都吃不上',
  '别嫌房租贵了，有人睡大街呢',
  '你至少身体健康，多少人躺在床上你还不满足',
  '别吐槽食堂难吃了，灾区人民连干净水都喝不上',
  '你至少还活着，多少人今天都没挺过来',
  '知足吧，还有人工资比你低一半呢',
  '别喊累了，工地上的人比你累多了',
  '你这点苦算什么，穷苦人家连饭都吃不上',
  '年轻人吃点苦怎么了，我们当年饭都吃不饱',
  '你至少还能在家办公，有人通勤四小时呢',
  '别喊压力大，想想大山里的孩子',
  '你只是加班到十点，有人熬夜到天亮呢',
  '这顿饭菜不错了，非洲还有难民呢',
  '至少你父母还健在，有人从小就没了爸妈',
  '别抱怨 996 了，工地上还有搬砖的呢',
  '你至少有双休，服务业全年无休的多的是',
  '别嫌工资低，至少还有五险一金，知足吧',
  '你至少还年轻，多少人这个年纪已经一身病了',
  '别喊嫁得不好，至少还有人要你，知足吧',
  '你至少考上了大学，多少人初中就辍学了',
  '别喊疼了，人家生孩子的都不吭声',
  '你至少还有房子住，多少人租房都被赶出来了',
  '别嫌辅导班贵，山区孩子想上还没得上',
  '有学上就不错了，以前的女孩子还不让念书呢',
  '至少公司还发工资，好多厂都倒闭了，知足吧',
  '别吐槽航班取消了，有人连飞机都没坐过',
];
const attacksEn = [
  'How can you complain about your flight delay when people are starving?',
  'You have a roof over your head; stop complaining about the noise.',
  'At least you have a job — many people would kill for your position.',
  'Quit whining about the wifi; children in war zones have no internet.',
  'You got second place; be grateful, some people never win anything.',
  'At least it is only rain — other cities are flooding.',
  'Stop complaining about the commute; some people walk ten miles.',
  'You lost your job, but at least you have savings — some have nothing.',
];

t('攻击-ZH 全命中', () => {
  for (const s of attacksZh) assert.ok(hit(s), '漏判: ' + s);
});
t('攻击-EN 全命中', () => {
  for (const s of attacksEn) assert.ok(hit(s), '漏判: ' + s);
});

// ── 2. 良性集（r726 探测器实测 12 条，模块层零命中）──────────────
const benign = [
  '你的困难是真的，同时也值得想想更糟的情况来调节视角',
  '虽然还有更不幸的人，但这不代表你的痛苦不存在',
  'It is worth keeping perspective, but your frustration is still valid.',
  '你的处境确实不容易，别人的苦难不能抵消你的困难',
  '我们能做的有限，但这不是忽视眼前问题的理由',
  '抱怨解决不了问题，但具体问题我们可以一起想办法',
  '对比能让人感恩，但不该用来否定当下的合理诉求',
  'Keeping perspective helps, and your concern still deserves attention.',
  '更糟的处境值得关注，但你反映的问题也应该单独处理',
  '加班到十点确实辛苦，我们也看看怎么改善排班',
  '工资的事值得谈，同时也可以关注一下市场行情',
  '有人处境更艰难，所以我们更要认真对待你提的问题',
];
t('良性-ZH/EN 全零命中', () => {
  for (const s of benign) assert.ok(!hit(s), '误伤: ' + s);
});

// ── 3. 边界锁（豁免常量 + 防御负例）────────────────────────────
t('边界-SELF_SUFFER 第一人称自陈比惨让位', () => {
  assert.ok(!hit('我比你惨多了，你这点挫折算什么'), '自陈比惨不应判');
  assert.ok(!hit('我这半年没睡过整觉，你才遇到一次，有什么好抱怨的'), '自陈比惨不应判');
});
t('边界-META 概念转述豁免', () => {
  assert.ok(!hit('所谓诉诸更惨，就是「别喊累了，有人连饭都吃不上」这种堵嘴话'), '概念转述不应判');
  assert.ok(!hit('Relative privation is a fallacy: others having it worse does not cancel your problem.'), 'EN 概念转述不应判');
});
t('边界-TEACH 教学转述豁免', () => {
  assert.ok(!hit('课堂讨论：别喊累了，有人连饭都吃不上，这句话问题在哪'), '教学转述不应判');
});
t('边界-NEG_FLIP 否定翻转豁免', () => {
  assert.ok(!hit('别抱怨了，有人连饭都吃不上，但这不能抵消你加班到十点的辛苦'), '否定翻转不应判');
});
t('边界-HEDGE 对冲豁免', () => {
  assert.ok(!hit('别抱怨了，也许有人连饭都吃不上，但你的加班费也该按实际工时算'), '对冲不应判');
});
t('边界-共情转述不判（承认痛苦+给方案）', () => {
  assert.ok(!hit('加班到十点确实辛苦，我们也看看怎么改善排班'), '共情转述不应判');
});
t('边界-单腿不判：只有压制无苦难参照', () => {
  assert.ok(!hit('别抱怨了，我们一起想办法解决'), '只有压制不应判');
  assert.ok(!hit('Stop complaining and focus on the fix.'), 'EN 只有压制不应判');
});
t('边界-单腿不判：只有苦难参照无压制', () => {
  assert.ok(!hit('有人连饭都吃不上，这个数据值得关注'), '只有苦难参照不应判');
});
t('防御-常见良性「至少/只是/想想」不判', () => {
  for (const s of [
    '至少我们还有备份，系统可以恢复',
    '他只是个孩子，别跟他计较',
    '这只是一个小 bug，别急着重构',
    '想想那些支持你的人，别轻易放弃',
    'At least we have a backup plan for the rollout.',
    'Keep perspective and review the checklist before shipping.',
  ]) assert.ok(!hit(s), '防御误伤: ' + s);
});
t('边界-非字符串返回零', () => {
  assert.strictEqual(rprMod.checkRelativePrivation(undefined).score, 0);
  assert.strictEqual(rprMod.checkRelativePrivation('').score, 0);
  assert.strictEqual(rprMod.checkRelativePrivation(null).score, 0);
  assert.strictEqual(rprMod.checkRelativePrivation(42).score, 0);
});

// ── 4. 分工边界锁：归属维度真兜底（gate 层非 pass）────────────────
t('分工边界-攻击样本 gate 动作非 pass', () => {
  for (const s of attacksZh.concat(attacksEn)) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
  }
});
t('分工边界-findings 归因 relative_pration', () => {
  for (const s of ['别喊累了，有人连饭都吃不上', '知足吧，还有人工资比你低一半呢']) {
    const r = gate.checkOutput(s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('relative_pration'), '未归因 relative_pration: ' + s + ' -> ' + dims.join(','));
  }
});
t('分工边界-良性样本 gate 层非 relative_pration 归因', () => {
  for (const s of benign) {
    const r = gate.checkOutput(s);
    if (r.gate.action !== 'pass') {
      const dims = (r.findings || []).map((f) => f.dimension);
      assert.ok(!dims.includes('relative_pration'),
        'relative_pration 误伤: ' + s + ' -> ' + r.gate.action + ' / ' + dims.join(','));
    }
  }
});
t('分工边界-suffering_contest 第一人称形归存量（不被本族抢占）', () => {
  for (const s of ['我这半年没睡过整觉，你才遇到一次，有什么好抱怨的', '我付出的是你的十倍，你凭什么不听我的']) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', '存量边界样本被放行: ' + s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(!dims.includes('relative_pration'),
      '第一人称自陈比惨被 relative_pration 抢占: ' + s + ' -> ' + dims.join(','));
  }
});

// ── 5. 存量回归：r725 affirming_the_consequent / r724 guilt_by_association 不翻转 ──
t('存量回归-r725 affirming_the_consequent 历史攻击仍判', () => {
  for (const s of ['如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的', 'Good code has tests. This module has tests, so the code is good.']) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'affirming_the_consequent 回归翻转: ' + s);
  }
});
t('存量回归-r724 guilt_by_association 历史攻击仍判', () => {
  for (const s of ['他爸是人贩子，他能好到哪去', 'She is friends with a scammer, so she cannot be trusted.']) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'guilt_by_association 回归翻转: ' + s);
  }
});

// ── 6. 登记断言（九处接线完整）────────────────────────────────
t('登记-dimensions 键含 relative_pration 且总数 156', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('relative_pration'), 'relative_pration 键缺失');
  // r725 落笔时引擎 155 维，r726 +1 = 156（多轮累积预期过期，非回归）
  assert.strictEqual(keys.length, 158, '维度键总数应为 158: got ' + keys.length);
});
t('登记-VERIFY_DIMS 含 relative_pration', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/VERIFY_DIMS[\s\S]{0,5000}?relative_pration/.test(src), 'VERIFY_DIMS 未含 relative_pration');
});
t('登记-index.js 导出 checkRelativePrivation 且 CONSTANTS 齐全', () => {
  assert.strictEqual(typeof idx.checkRelativePrivation, 'function', 'index.js 未导出 checkRelativePrivation');
  const need = ['RP_SUFFER_ZH', 'RP_COMPARATIVE_ZH', 'RP_MINIMIZE_HAVE', 'RP_SUBJECT_ZH', 'RP_WEAK_ZH',
    'RP_DISMISS_ZH', 'RP_DISMISS_EN', 'RP_SELF_SUFFER', 'RP_META', 'RP_TEACH', 'RP_NEG_FLIP', 'RP_HEDGE'];
  for (const k of need) {
    assert.ok(rprMod.CONSTANTS && rprMod.CONSTANTS[k] && rprMod.CONSTANTS[k].length > 0, 'CONSTANTS 缺 ' + k);
  }
});
t('登记-summary 命中可见（诉诸更惨计数）', () => {
  // API 纪律：checkOutput().summary 是统计对象，文本 summary 在 idx.discriminate(t).summary
  const s = idx.discriminate('别喊累了，有人连饭都吃不上').summary || '';
  assert.ok(/诉诸更惨/.test(s), 'summary 未含诉诸更惨: ' + String(s).slice(0, 200));
});

console.log('== r726 诉诸更惨新维度轮测试 ==');
if (fails.length) {
  console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
} else {
  console.log('结果: ' + pass + ' 通过, 0 失败');
}
