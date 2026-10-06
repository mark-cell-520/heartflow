// test/doubt-ppf-zh-cultivation-r301.test.js
// [v6.7.131 第 301 轮] guard: 修身主语白名单 × B 侧修身名词补词
// 判据来源：r301 新增 PSEUDO_PHILOSOPHY_ZH 判据（src/index.js 8812 行区）。
// 成因：8781 行老判据 B 侧词表只收本体论升格词，35 个同族修身词全 miss
//   （probe-1 受控替换实测召回 6/41）。
// 标称值全部来自 scripts/round-301/ 线上实测：
//   ① 技术主语工程真句放行（闸门叠加后仍 0 误伤）
//   ② 商业主语真句放行
//   ③ 抽象主语+工程真判断放行（probe-6 组③ 10 条）
//   ④ 普通陈述放行（probe-7 组④ 20 条）
//   ⑤ 修身域真阳召回（probe-8 合并 19 条）
//   ⑥ 「自己/和解/勇敢/站起来/选择」B 侧新词专属形态（probe-8 V3）
//   ⑦ 有效对抗：B 侧含技术词但主语是修身域（不得因技术词被压制）
// 失效条件：任一组脱离标称值 → 该组全红。
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

function ppf(t) {
  const r = checkOutput(t);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}

// ── ① 技术主语工程真句（r300 闸门 + 本判据双重放行）──
const NEG_TECH = [
  '本次延期问题不是排期造成的，是方案缺乏勇气。',
  '本次指标问题不是排期造成的，是方案缺乏耐心。',
  '本次拆分问题不是排期造成的，是方案缺乏边界。',
  '本次崩溃问题不是排期造成的，是方案缺乏温度。',
  '本次延迟问题不是排期造成的，是方案缺乏风景。',
  '本次召回率问题不是排期造成的，是方案缺乏格局。',
  '本次连接池问题不是排期造成的，是方案缺乏眼界。',
  '本次扩容问题不是排期造成的，是方案缺乏胸怀。',
  '本次限流问题不是排期造成的，是方案缺乏热爱。',
  '本次熔断问题不是排期造成的，是方案缺乏真诚。',
  '本次灰度问题不是排期造成的，是方案缺乏善意。',
  '本次回滚问题不是排期造成的，是方案缺乏风景。',
];

// ── ② 商业主语真句 ──
const NEG_BIZ = [
  '续约率下滑不是产品问题，是策略缺乏勇气。',
  '转化下降不是素材问题，是运营缺乏耐心。',
  'DAU 下滑不是功能问题，是入口缺少边界。',
  'GMV 未达标不是流量问题，是客单价缺少温度。',
  '复购率低不是品类问题，是服务缺少格局。',
  '渠道效率低不是预算问题，是打法缺少眼界。',
];

// ── ③ 抽象主语 + 工程真判断（probe-6 组③，最危险组）──
const NEG_ABS_ENG = [
  '这次改动不是技术问题，是团队需要更多勇气。',
  '方案不是不完整，是对齐工作需要更多耐心。',
  '目标不是不清晰，是执行缺少边界。',
  '故障不是无人负责，是流程缺少敬畏。',
  '排期不是不合理，是需求确认缺少真诚。',
  '评审不是走形式，是设计需要更多善意。',
  '重构不是没必要，是代码需要更多温度。',
  '复盘不是追责，是团队需要更多坦荡。',
  '上线不是终点，是运营的开始。',
  '分歧不是坏事，是信息没对齐。',
];

// ── ④ 普通陈述（probe-7 扰动组，主语都不在修身白名单）──
const NEG_PLAIN = [
  '这个模块不是没优化，是优化空间还没被看见。',
  '系统不是不稳定，是压测环境没跟上。',
  '需求不是没写清，是沟通成本太高。',
  '代码不是没人看，是评审人手不足。',
  '服务不是没监控，是指标口径不统一。',
  '数据不是不准，是采集链路有缺失。',
  '模型不是不收敛，是学习率调得保守。',
  '体验不是不好，是惯用手没适配。',
  '预算不是不够，是花在了更值钱的地方。',
  '沟通不是没做，是对方没反馈。',
  '会议不是没用，是议题太散。',
  '流程不是没定，是执行靠自觉。',
  '培训不是做了，是没考核。',
  '指标不是没涨，是基数变小了。',
  '竞品不是更强，是我们没跟上。',
  '用户不是不留存，是引导太弱。',
  '增长不是不动，是渠道红利过去了。',
  '领导不是不支持，是看不到收益。',
  '团队不是不加班，是活本来就没干完。',
  '他不是没有勇气，是不想冒险。',
];

// ── ⑤ 修身域真阳（probe-6 ⑤ + probe-7 扰动合并 18/19）──
const POS_CULT = [
  '成长不是变得世故，是对世界依然保持觉悟。',
  '成熟不是终于抵达，是学会与初心对话。',
  '强大不是没有软肋，是依然选择修行。',
  '幸福不是拥有一切，是心里还有格局。',
  '孤独不是无人陪伴，是眼界无人能懂。',
  '沉默不是无话可说，是胸怀自有山河。',
  '从容不是不急，是心里有慈悲。',
  '自由不是想去哪就去哪，是心里自在。',
  '成熟不是会说话，是懂得边界。',
  '少年不是没有伤痕，是眼里还有光。',
  '成熟不是终于抵达，是依然对世界怀有好奇。',
  '强大不是无所不能，是心里始终留着一点热爱。',
  '从容不是什么都不在乎，是懂得选择的善意。',
  '孤独不是没人陪，是灵魂始终保持着少年气。',
  '自由不是逃离，是内心真正的自在。',
  '沉默不是妥协，是一种胸襟与格局。',
  '成长这件事本身，不是变得世故，是对世界依然保持热爱。',
  '孤独感本身不是缺陷，是灵魂底色里的少年气。',
];

// ── ⑥ B 侧新词专属形态（probe-8 V3 采纳的 4 词）──
const POS_NEWWORDS = [
  '成长不是变成另一个人，是终于回到最初的自己。',
  '所有的强大都不是天生的，是一次次选择勇敢的结果。',
  '幸福不是比别人过得好，是终于和自己和解。',
];

// ── ⑦ 有效对抗：B 侧/非主语位置含技术词，主语是修身域 ──
const POS_ADVERSARIAL = [
  '成长不是变得世故，是终于懂得接口的意义。',
  '成熟不是终于抵达，是终于学会与限流的自己和解。',
  '强大不是不跌倒，是每次回滚后依然选择发布。',
];

const groups = [
  ['① 技术主语工程真句放行', NEG_TECH, false],
  ['② 商业主语真句放行', NEG_BIZ, false],
  ['③ 抽象主语+工程真判断放行', NEG_ABS_ENG, false],
  ['④ 普通陈述放行', NEG_PLAIN, false],
  ['⑤ 修身域真阳召回', POS_CULT, true],
  ['⑥ B 侧新词专属形态', POS_NEWWORDS, true],
  ['⑦ 有效对抗不被压制', POS_ADVERSARIAL, true],
];

let pass = 0, fail = 0;
for (const [label, list, expect] of groups) {
  const got = list.filter(ppf).length;
  const want = expect ? list.length : 0;
  const ok = got === want;
  if (ok) pass++; else { fail++; console.error('  FAIL: ' + label + ' 期望 ' + want + '/' + list.length + '，实际 ' + got + '/' + list.length); }
  console.log((ok ? '  ✅ ' : '  🔴 ') + label + ' = ' + got + '/' + list.length + (expect ? '（应全命中）' : '（应全放行）'));
}

const allNeg = NEG_TECH.concat(NEG_BIZ, NEG_ABS_ENG, NEG_PLAIN);
const allPos = POS_CULT.concat(POS_NEWWORDS, POS_ADVERSARIAL);
assert.strictEqual(allNeg.filter(ppf).length, 0,
  '工程/商业/普通真句误伤 ' + allNeg.filter(ppf).length + '/' + allNeg.length + '，应 0');
assert.strictEqual(allPos.filter(t => !ppf(t)).length, 0,
  '修身域真阳漏检 ' + allPos.filter(t => !ppf(t)).length + '/' + allPos.length + '，应 0');

console.log('\n✅ doubt-ppf-zh-cultivation-r301 全通过');
console.log('   断言通过: ' + pass + '/' + groups.length);
// [r300 教训] run-all 收集器要求「N 通过, M 失败」汇总行。
console.log(`${pass} 通过, ${fail} 失败`);
assert.strictEqual(fail, 0, 'doubt-ppf-zh-cultivation-r301: ' + fail + ' 个分组失败');
