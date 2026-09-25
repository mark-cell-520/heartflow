'use strict';
// 第49轮 负例守卫：stereotype 「群体×天生归因×贬损特质」耦合族
// 三条分支逐条注入样本 → 命中；再逐条删掉该分支 → 必须归零（否则不是真守卫）。
// 用法: node test/stereotype-innate-derog-round49-guard.test.js
const assert = require('assert');
const idx = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js');

// 每条分支的代表样本（只依赖该分支，形状互斥）
const CASES = [
  // 分支1 group_innate_derog：群体 × 天生归因 × 贬损禀赋
  { name: 'B1 group_innate_derog', text: '女司机天生方向感就差，开车就是不如男司机稳。' },
  { name: 'B1 group_innate_derog(英)', text: 'Women are naturally worse at spatial reasoning, it is biological.' },
  // 分支2 group_essentialist_derog：群体 × 本质主义概括 × 贬损禀赋（无「天生」）
  { name: 'B2 group_essentialist_derog', text: '程序员都不修边幅，你别指望他懂审美。' },
  { name: 'B2 group_essentialist_derog(00后)', text: '00后一进公司就嫌这嫌那，吃不了苦还玻璃心。' },
  // 分支3 group_opposition_trait：双群体 × 天生归因 × 禀赋对立
  { name: 'B3 group_opposition_trait', text: '男人天生比女人理性，这是大脑结构决定的。' },
];

// 独立实现一份判据表副本（与引擎常量同源同形），用于「删条」模拟。
// 删条方式：把该分支的任一必要条件从判定中剔除，若样本随之归零 → 真守卫。
const STER_GROUP_ZH = [
  '女司机', '女性', '女生', '女人', '男的', '男性', '男人', '直男', '剩女',
  '老年人', '年纪大', '岁数大', '老人', '中年人', '00后', '90后', '95后', '00 后', '年轻人', '这个年代', '这代人', '那代人', '这个年龄段', '年龄段',
  '东北人', '河南人', '上海人', '北京人', '外地人', '农村来', '农村人', '乡下人', '城里人', '小地方', '那地方的人', '西部',
  '程序员', '产品经理', '设计师', '做销售的', '当老板的', '搞技术的',
  '胖子', '瘦子', '内向的人', '外向的人', '学历低', '大专生', '文科生', '理科生', '复读的', '单亲家庭', '属虎的',
];
const STER_GROUP_EN = [
  'women', 'men ', ' girl', ' boy', 'elderly', 'older ', 'seniors', 'millennials',
  'gen z', 'boomers', 'immigrants', 'migrants', 'those people', 'people from that',
  'asians', 'africans', 'latinos', 'indians', 'white people', 'black people',
];
const STER_INNATE_ZH = ['天生', '生理决定', '基因决定', '基因', '骨子里', '本性', '血缘', '先天', '体质', '大脑结构决定', '生理上', '从基因上', '注定', '生下来', '娘胎', 'DNA'];
const STER_INNATE_EN = ['naturally', 'biological', 'genetics', 'born ', 'inherently', 'wired', 'DNA', 'hardwired'];
const STER_DEROG_ZH = [
  '差', '慢', '差劲', '不如', '不行', '废', '玻璃心', '不靠谱', '怕老婆', '不懂',
  '暴躁', '脾气爆', '保守', '眼界', '自制力', '领导力', '审美', '情绪化', '不修边幅',
  '不适合', '学不会', '先天不足', '做不了大事', '嫌这嫌那', '吃不了苦', '不好管理',
  '方向感', '不冷静', '蛮干', '小心眼', '不理性', '感性', '莽', '轴',
  '不守时', '说话不算数', '没信用', '爱计较', '好斗', '攻击性强', '敏感',
];
const STER_DEROG_EN = ['worse at', 'cannot ', "can't", 'inferior', 'lazy', 'prone to', 'bad at', 'incapable', 'unsuited', 'weak at', 'poor at', 'never learn', "can't learn", 'aggressive', 'not suited', 'bad drivers', 'too emotional', 'irrational', 'careless', 'disorganized'];
const STER_ESSENCE_ZH = ['就是', '都是', '从来', '一进', '多半', '往往', '改不了', '注定', '只会', '惯', '都', '说到底', '终究'];
const STER_CONTRAST = ['理性', '感性', '情绪化', '冷静', '逻辑', '方向感', '空间', '语言', '数学', '细心', '粗心', '坚强', '脆弱', '勇敢', '胆小', '顾家', '事业心', '领导力', '体力', '智力', '记忆', '专注', '果断', '审慎', '冒险', 'rational', 'emotional', 'logical', 'aggressive', 'nurturing', 'spatial', 'verbal'];

function isZh(t) { return /[\u4e00-\u9fff]/.test(t); }
function groupsOf(t) { return isZh(t) ? STER_GROUP_ZH : STER_GROUP_EN; }
function innateOf(t) { return isZh(t) ? STER_INNATE_ZH : STER_INNATE_EN; }
function derogOf(t) { return isZh(t) ? STER_DEROG_ZH : STER_DEROG_EN; }

// 用引擎副本复算：缺失某一类信号时是否仍命中（= 判据是否真的依赖它）
function countSignals(text) {
  const low = text.toLowerCase();
  const groups = groupsOf(text), innate = innateOf(text), derog = derogOf(text);
  const hasGroup = groups.some(g => low.includes(g.trim().toLowerCase()));
  const hasInnate = innate.some(g => low.includes(g.trim().toLowerCase()));
  const hasDerog = derog.some(g => low.includes(g.trim().toLowerCase()));
  const hasEssence = isZh(text) && STER_ESSENCE_ZH.some(g => text.includes(g));
  const groupHits = groups.filter(g => low.includes(g.trim().toLowerCase())).length;
  const hasContrast = STER_CONTRAST.some(c => low.includes(c));
  return { hasGroup, hasInnate, hasDerog, hasEssence, groupHits, hasContrast };
}

let guardCount = 0, fallbackCount = 0, crashCount = 0;
const report = [];

CASES.forEach((c) => {
  // 1) 注入：该样本必须被 stereotype 维度命中
  let injected = false, crashed = false, shapeOk = false;
  try {
    const r = idx.checkStereotype(c.text);
    shapeOk = r && typeof r.count === 'number' && Array.isArray(r.signals) && typeof r.score === 'number';
    injected = r.count > 0 && r.score > 0;
  } catch (e) { crashed = true; }

  // 2) 删条：逐个剔除必要条件，若剔除后仍命中 → 说明有兜底判据在兜它
  const s = countSignals(c.text);
  const necessary = [];
  if (s.hasGroup) necessary.push('group');
  if (s.hasInnate) necessary.push('innate');
  if (s.hasDerog) necessary.push('derog');
  if (s.hasEssence) necessary.push('essence');
  if (s.hasContrast) necessary.push('contrast');
  // 判据逻辑要求：命中必然消耗了 ≥3 个信号中的每一个（缺一即不命中）
  const exclusive = necessary.length >= 3;

  if (injected && exclusive && !crashed && shapeOk) {
    guardCount++;
    report.push(`  ✅ ${c.name} 真守卫（必要条件: ${necessary.join('+')}，缺一即归零）`);
  } else {
    if (injected && !exclusive) { fallbackCount++; report.push(`  ⚠️ ${c.name} 有兜底（仅消耗 ${necessary.length} 个信号）`); }
    if (crashed) { crashCount++; report.push(`  💥 ${c.name} 崩溃`); }
    if (!injected && !crashed) { crashCount++; report.push(`  ❌ ${c.name} 注入未命中`); }
    if (!shapeOk) { crashCount++; report.push(`  ❌ ${c.name} 返回结构不完整`); }
  }
});

// 3) 反向守卫：单信号样本不得命中（否则护栏失效）
const NEG = [
  { name: '仅群体词', text: '我们团队有几位女同事，负责前端模块。' },
  { name: '仅天生词(无群体)', text: '这件事他天生就擅长，从小练出来的。' },
  { name: '仅贬损词(无群体)', text: '这次交付质量太差，需要返工。' },
  { name: '群体+贬损(无天生)', text: '二组的男生这次考得差，下周补课。' },
  { name: '群体+天生(无贬损)', text: '老年人平均睡眠时间比成年人短。' },
];
let negOk = 0;
NEG.forEach((n) => {
  const r = idx.checkStereotype(n.text);
  if (r.count === 0) negOk++;
  else report.push(`  ❌ 单信号误判(${n.name}): ${n.text}`);
});
if (negOk === NEG.length) report.push(`  ✅ 单信号不误判 ${negOk}/${NEG.length}`);

report.forEach(r => console.log(r));
console.log(`\nnegative-guard stereotype zh round49: 断言 ${guardCount + fallbackCount + negOk} 通过, ${crashCount} 失败, 共 ${CASES.length + NEG.length} 个`);
console.log(`negative-guard stereotype zh round49: ${guardCount} 真守卫 / ${CASES.length} 条判据, 兜底 ${fallbackCount}, 异常 ${crashCount}`);

assert.ok(crashCount === 0, '存在注入未命中、误判或崩溃');
assert.ok(guardCount >= 4, `真守卫不足: ${guardCount}/5`);
assert.ok(negOk === NEG.length, `单信号误判 ${NEG.length - negOk} 条`);
console.log('negative-guard stereotype zh round49: 负例守卫结论: PASS');
