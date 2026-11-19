/**
 * test/round-417-tu-quoque-common-practice.test.js
 *
 * [r417] 第 141 维度 tu_quoque（诉诸伪善）新增「诉诸共惯」措辞家族
 * （appeal to common practice，比烂正当化）轮测。
 *
 * 背景：r415 交接留库 + r417 同池探针定拨。池化探针
 * coordination/agent4/probes/r417-probe-pool.js（HEAD 6.8.208，四
 * 家族同池）实测：F7 tu_quoque 诉诸共惯族攻击穿透 11/11（全池最
 * 高：F1 genetic 考证式 10/11、F5 special_pleading EN 代词回指
 * 9/10、F6 straw_man 存在必要性否定 10/12）、模块层真零命中
 * 0/11、良性 0/11 本族误伤（唯一 gate 层非 pass 属存量 vagueness
 * 代拦，与本族无关）。真升级②：既有维度的全新措辞家族，维度计数
 * 不变、src/index.js 零改动、VERSION 不 bump（同 r406-r415 扩族
 * 先例）。
 *
 * 新路由③判据（双腿共现，缺一不判，命中即 verify 级，score 0.5）：
 *   腿① PREVALENCE 普遍违规宣告 = 普遍性标记（人人都/满大街/整
 *       个行业/当官的；EN everyone/most people/all my friends）×
 *       明确失范行为词（作弊/插队/躺平/摸鱼/贪污/造假/迟到/闯红
 *       灯/抄…；EN cheat/speed/fudge/pad…）。失范表刻意不收「加
 *       班/努力/犯错」类可能正当或泛化的词。
 *   腿② NORMALIZE 自我正当化推论 = 第一人称 + 正当化标记（算什
 *       么/怎么了/凭什么不能/有什么用/不吃亏/亏了；EN so why
 *       can't I / why should I follow / I might as well）。
 *   反谬误对冲 NORM_HEDGE：明确指出「普遍≠正确」的句子（普遍不
 *       等于正确/并不代表这样做是对的/does not make it right）
 *       只有腿①＋对冲，是反谬误陈述不是运用，不判。
 *   与路由①②（MIRROR 你-based 同样过错）正交：本族无 你-based
 *       主语，据以「同样」的是普遍大众。
 *
 * 与既有维度分工（探针实测归属）：
 *   · whataboutism（第 20 维）管转移话题（那 XX 呢/你怎么不说
 *     YZ）——不指向自身行为正当化；
 *   · false_balance 管各打五十大板（双方都有责任/一个巴掌拍不
 *     响）——引用对方具体过错而非普遍性；
 *   · normalization_of_deviance 管违规重复后被视作常态的过程记
 *     述——无「我…算什么」式正当化推论。
 */
'use strict';

const path = require('path');
const gate = require(path.resolve(__dirname, '../src/gate.js'));
const tuqMod = require(path.resolve(__dirname, '../src/tu-quoque.js'));
const { checkTuQuoque } = tuqMod;

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

function dim(text, inject) { return checkTuQuoque(text, inject); }
function gateAction(text) {
  const r = gate.checkOutput(text);
  return r && r.gate && r.gate.action ? r.gate.action : (r && r.action ? r.action : 'ERR');
}
function gateDims(text) {
  const r = gate.checkOutput(text);
  return (r && r.findings || []).map((f) => f.dimension);
}
const NEVER = /(?!x)x/;

// ─── A 组：攻击承重（模块层 detail 含「诉诸共惯」）────────────────
// 腿标注：P=PREVALENCE 命中｜N=NORMALIZE 命中｜H=NORM_HEDGE 不命中
const A_ATTACKS = [
  // 中文：P 人人都+作弊｜N 我…算什么
  ['人人都作弊，我作弊算什么', 'zh'],
  // P 满大街+插队｜N 我…怎么了
  ['满大街都是插队的，我插一次队怎么了', 'zh'],
  // P 别人都+躺平｜N 我凭什么不能
  ['别人都躺平，我凭什么不能躺', 'zh'],
  // P 谁都+迟到｜N 光抓我（c 支）
  ['谁都迟到，光抓我什么意思', 'zh'],
  // P 全世界都在+污染｜N 我一个人…有什么用（d 支）
  ['全世界都在污染，我一个人减排有什么用', 'zh'],
  // P 人人都在+摸鱼｜N 我…怎么了
  ['人人都在摸鱼，我摸一会儿怎么了', 'zh'],
  // P 贪污+的那么多（b 支）｜N 我…算什么
  ['贪污的那么多，我这点算什么', 'zh'],
  // P 整个行业都在+造假｜N 我们…吃亏（e 支）
  ['整个行业都在数据造假，我们不做就吃亏', 'zh'],
  // P 全国都在+闯红灯｜N 我…怎么了
  ['全国都在闯红灯，我闯一次怎么了', 'zh'],
  // P 别人都在+抄｜N 我…亏了
  ['别人都在抄，我不抄就亏了', 'zh'],
  // P 当官的都+贪｜N 我…才傻
  ['当官的都贪，我不贪点才傻', 'zh'],
  // P 现在谁不+造假｜N 我…怎么了
  ['现在谁不造假，我造一点怎么了', 'zh'],
  // P 人人都+迟到｜N 我…不算过分
  ['人人都迟到，我迟到一次不算过分', 'zh'],
  // P 大多数人都在+逃税｜N 我…有什么关系
  ['大多数人都在逃税，我逃一点有什么关系', 'zh'],
  // 比烂格言裸形（f 支）：P 大家+作假｜N 大哥别说二哥
  ['大家都在作假，大哥别说二哥', 'zh'],
  // 英文：P Everyone+cheats｜N so why can't I
  ["Everyone cheats on taxes, so why can't I?", 'en'],
  // P All my friends+speed｜N why should I follow
  ['All my friends speed; why should I follow the limit?', 'en'],
  // P Most people+fudge｜N I might as well
  ["Most people fudge their timesheets, so I might as well join in.", 'en'],
  // P Everyone else+pads｜N so why can't I
  ["Everyone else pads their expense reports, so why can't I?", 'en'],
  // P 失范现象 is so widespread（b 支）｜N so what if I
  ['Bribery is so widespread in this industry, so what if I pay one facilitation fee?', 'en'],
];

test('A: 攻击承重——模块层 21/21 命中且 detail 含「诉诸共惯」', () => {
  let hit = 0;
  for (const [t, lang] of A_ATTACKS) {
    const r = dim(t);
    if (r.hit) hit++;
    else console.log('    [A-MISS] ' + t);
    if (r.hit) {
      const marker = lang === 'zh' ? '诉诸共惯' : 'appeal-to-common-practice';
      assert(r.detail.indexOf(marker) !== -1, 'detail 缺新路由标记: ' + r.detail);
      assert(r.detail.indexOf(lang === 'zh' ? '(zh)' : '(en)') !== -1, 'detail 语言标记错: ' + r.detail);
      assertEqual(r.score, 0.5, 'score 应为 0.5');
    }
  }
  assertEqual(hit, A_ATTACKS.length, '模块层承重数不符');
});

// ─── B 组：gate 层——攻击非 pass 且 findings 挂 tu_quoque ──────────
test('B: gate 层 21/21 非 pass 且 tu_quoque 在场', () => {
  let ok = 0;
  for (const [t] of A_ATTACKS) {
    const action = gateAction(t);
    const dims = gateDims(t);
    if (action !== 'pass' && dims.indexOf('tu_quoque') !== -1) ok++;
    else console.log('    [B-FAIL] ' + action + ' (' + dims.join(',') + ') ' + t);
  }
  assertEqual(ok, A_ATTACKS.length, 'gate 层承重数不符');
});

// ─── C 组：良性——模块层零命中 + gate pass ────────────────────────
// 注：MIRROR 结构存量攻击句（你说我熬夜不好…）不在本组，归 E 组存量回归。
const C_BENIGN = [
  // 事实陈述：普遍性在但无失范词/无正当化推论
  '这种现象很普遍，但普遍不等于正确',
  '大家都在努力，我也不能落后',
  '别人加班叫奉献，我加班也叫奉献，标准一致',
  '这条路上大多数人都守规矩，我也一样',
  '舞弊现象确实存在，公司正在加强审计',
  '虽然很多人这样做，并不代表这样做是对的',
  '守住自己的节奏，不用管别人怎么做',
  '大家都在加班，我加会儿班也正常',
  '虽然很多人插队，但插队总归是不对的',
  '迟到现象很普遍，但这不代表迟到是可以的',
  '全国都在推进疫苗接种，这是好事',
  ' Many people break this rule, which is why enforcement is being tightened.',
  'Everyone makes mistakes; we learn from them and move on.',
  'Many people break this rule, but that does not make it right.',
  'All my colleagues work hard; I should keep up with them.',
  'Cheating is widespread, so the exam board added proctors.',
  'Most people on this team stay late when the release demands it.',
];

test('C: 良性 17/17 模块层零命中', () => {
  let clean = 0;
  for (const t of C_BENIGN) {
    const r = dim(t);
    if (!r.hit) clean++;
    else console.log('    [C-FP] ' + t + ' | ' + r.detail);
  }
  assertEqual(clean, C_BENIGN.length, '模块层良性命中数不符');
});

test('C2: 良性 gate 层——新族零命中（所有良性 findings 不含 tu_quoque）', () => {
  let clean = 0; const stockCarried = [];
  for (const t of C_BENIGN) {
    const dims = gateDims(t);
    if (dims.indexOf('tu_quoque') === -1) clean++;
    else console.log('    [C2-FAMILY-HIT] ' + t + ' → ' + dims.join(','));
    if (gateAction(t) !== 'pass' && dims.indexOf('tu_quoque') === -1) {
      stockCarried.push(t.trim().slice(0, 46) + ' [' + dims.join(',') + ']');
    }
  }
  assertEqual(clean, C_BENIGN.length, '新族在良性样本上的 gate 命中数不为零');
  for (const s of stockCarried) console.log('    [存量代拦] ' + s);
});

// ─── D 组：删条注入（负例）——逐腿删掉，守卫必须变红 ───────────────
const D_INJECT = [
  // [腿常量, 专属样本, 说明]
  ['PREVALENCE_ZH', '人人都作弊，我作弊算什么', '腿①中文'],
  ['NORMALIZE_ZH', '人人都作弊，我作弊算什么', '腿②中文'],
  ['PREVALENCE_EN', "Everyone cheats on taxes, so why can't I?", '腿①英文'],
  ['NORMALIZE_EN', "Everyone cheats on taxes, so why can't I?", '腿②英文'],
  ['NORM_HEDGE_ZH', '这么多人都在托关系，我托一次也不算过分，但普遍不等于正当', '对冲中文（删后 exempt→hit）'],
  ['NORM_HEDGE_EN', "Cheating is so common, so why can't I — but that does not make it right.", '对冲英文（删后 exempt→hit）'],
];

test('D: 删条注入 6/6 变红', () => {
  let red = 0, notRed = 0;
  for (const [key, sample, note] of D_INJECT) {
    const base = dim(sample);
    const isHedge = key.indexOf('HEDGE') !== -1;
    if (isHedge) {
      // 对冲腿：基线应被豁免（不命中），删除后应命中
      if (base.hit) { console.log('    [D-BASELINE-HIT] ' + key + ' | ' + sample); notRed++; continue; }
      const after = dim(sample, { [key]: NEVER });
      if (after.hit) { red++; }
      else { notRed++; console.log('    [D-NOT-RED] ' + key + ' → 仍豁免 | ' + sample); }
    } else {
      // 攻击腿：基线应命中，删除后应停命中
      if (!base.hit) { console.log('    [D-BASELINE-MISS] ' + key + ' | ' + sample); notRed++; continue; }
      const after = dim(sample, { [key]: NEVER });
      if (!after.hit) { red++; }
      else { notRed++; console.log('    [D-NOT-RED] ' + key + ' → 仍命中(detail=' + after.detail + ') | ' + sample); }
    }
  }
  assertEqual(notRed, 0, '未变红条数: ' + notRed);
  assertEqual(red, D_INJECT.length, '变红条数: ' + red);
});

// ─── E 组：存量路由①②不回归（MIRROR 你-based 结构照旧承重）───────
const E_STOCK = [
  '你说我熬夜不好，你自己不也天天凌晨睡',
  '你也曾经撒过谎，没资格讲诚信',
  '你自己都做不到，凭什么要求我',
  'You criticize me for smoking, but you drink every day.',
];
test('E: 存量路由①② 4/4 不回归', () => {
  let hit = 0;
  for (const t of E_STOCK) {
    const r = dim(t);
    if (r.hit) hit++;
    else console.log('    [E-MISS] ' + t);
    if (r.hit) assert(r.detail.indexOf('诉诸共惯') === -1, '存量样本不应走新路由: ' + r.detail);
  }
  assertEqual(hit, E_STOCK.length, '存量路由承重数不符');
});

// ─── F 组：边界锁 ─────────────────────────────────────────────
test('F1: 单腿不判——只有 PREVALENCE（无正当化推论）', () => {
  assertEqual(dim('人人都作弊，这是社会现象').hit, false, '单腿①不应判');
  assertEqual(dim('整个行业都在数据造假').hit, false, '单腿①不应判');
  assertEqual(dim('Everyone cheats on their taxes in this country.').hit, false, '单腿①(en)不应判');
});
test('F2: 单腿不判——只有 NORMALIZE（无普遍性宣告）', () => {
  assertEqual(dim('我作弊算什么，就我一个').hit, false, '单腿②不应判');
  assertEqual(dim('我一个人减排有什么用').hit, false, '单腿②不应判');
  assertEqual(dim("So why can't I do the same thing?").hit, false, '单腿②(en)不应判');
});
test('F3: 第三人称转述不判（无第一人称正当化）', () => {
  assertEqual(dim('他们都在作弊，他也跟着作弊').hit, false, '第三人称不应判');
  assertEqual(dim('别人都躺平了，团队也散了').hit, false, '第三人称不应判');
});
test('F4: 反谬误对冲豁免（非注入路径）', () => {
  assertEqual(dim('这么多人都在托关系，我托一次也不算过分，但普遍不等于正当').hit, false, '对冲句应豁免');
  assertEqual(dim('这种现象很普遍，但普遍不等于正确').hit, false, '对冲句应豁免');
  assertEqual(dim('虽然很多人这样做，并不代表这样做是对的').hit, false, '对冲句应豁免');
  assertEqual(dim('Many people break this rule, but that does not make it right.').hit, false, '对冲句(en)应豁免');
});
test('F5: 概念分析/元话语豁免', () => {
  assertEqual(dim('诉诸伪善是一种常见的逻辑谬误').hit, false, '概念分析应豁免');
  assertEqual(dim('Tu quoque is a logical fallacy.').hit, false, '概念分析(en)应豁免');
});
test('F6: 失范表不收泛化词——加班/努力/犯错不判', () => {
  assertEqual(dim('大家都在加班，我加一会儿怎么了').hit, false, '加班不是失范');
  assertEqual(dim('人人都犯过错，我犯一次算什么').hit, false, '犯错太泛不入表');
  assertEqual(dim('所有人都在努力，我努力一点算什么').hit, false, '努力不是失范');
});
test('F7: gate 层攻击样本 verify 级（不是 rewrite/block）', () => {
  assertEqual(gateAction('人人都作弊，我作弊算什么'), 'verify', '应为 verify');
  assertEqual(gateAction("Everyone cheats on taxes, so why can't I?"), 'verify', '应为 verify(en)');
});

// ─── G 组：接线与形状 ────────────────────────────────────────
test('G1: __internals 暴露新常量（负例注入面）', () => {
  const I = tuqMod.__internals();
  for (const k of ['PREVALENCE_ZH', 'PREVALENCE_EN', 'NORMALIZE_ZH', 'NORMALIZE_EN', 'NORM_HEDGE_ZH', 'NORM_HEDGE_EN']) {
    assert(I[k] instanceof RegExp, '缺常量导出: ' + k);
  }
  assert(I.PREVALENCE_ZH.source.indexOf('作弊') !== -1, 'PREVALENCE_ZH 内容异常');
  assert(I.NORMALIZE_ZH.source.indexOf('算什么') !== -1, 'NORMALIZE_ZH 内容异常');
});
test('G2: 运行时接线——dimensions.tu_quoque 键在、count>0、dimMap 静态登记不变', () => {
  const d = gate.discriminate('人人都作弊，我作弊算什么');
  assert(d.dimensions && d.dimensions.tu_quoque, 'dimensions 缺 tu_quoque 键');
  assert(d.dimensions.tu_quoque.count > 0, 'tu_quoque count 应为正');
  const fs = require('fs');
  const src = fs.readFileSync(path.resolve(__dirname, '../src/index.js'), 'utf8');
  assert(src.indexOf('tu_quoque: tuq,') !== -1, '缺 dimMap 登记');
  assert(src.split('tu_quoque: tuq,').length - 1 === 2, 'dimMap/dimensions 两处登记应各出现一次');
  assert(src.indexOf("'tu_quoque',") !== -1, '缺 VERIFY_DIMS 登记');
  assert(src.indexOf("'tu_quoque': \"不得用") !== -1, '缺 DIM_GUIDANCE 条目');
});
test('G3: 全角/半角归一化不逃逸（_dual 双喂）', () => {
  const r = gate.checkOutput('人人都作弊，我作弊算什么');
  assert(r.gate.action !== 'pass', '归一化文本应拦下');
  const r2 = gate.checkOutput('人人都作弊！我作弊算什么？');
  assert(r2.gate.action !== 'pass', '带标点变体应拦下');
});

// ─── 汇总（run-all 可解析格式）────────────────────────────────
const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  console.log((r.ok ? '  ✅ ' : '  ❌ ') + r.name + (r.ok ? '' : ' — ' + r.err));
}
console.log(pass + ' passed / ' + fail + ' failed');
process.exitCode = fail === 0 ? 0 : 1;
