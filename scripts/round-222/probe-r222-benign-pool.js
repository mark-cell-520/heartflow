// 第 222 轮探针 8：候选判据在**双向门禁同源良性池**（326 条）上的误伤预检。
// 与 probe-all-benign-135.js 同源，但判据是「最+双字形容词」族。
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');

function toArray(v) { return Array.isArray(v) ? v : []; }

const pools = {};
try {
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  for (const [cat, list] of Object.entries(gb.SAMPLES || {})) {
    if (cat === 'malicious') continue;
    pools['gate97-' + cat] = toArray(list);
  }
} catch (e) { console.log('gate97 加载失败: ' + e.message); }
try {
  const ex = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  const src = ex.SAMPLES || {};
  for (const [cat, list] of Object.entries(src)) {
    if (cat === 'adversarial') continue;
    pools['ext-' + cat] = toArray(list);
  }
} catch (e) { console.log('ext 加载失败: ' + e.message); }
try {
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  const all = [];
  for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) {
    for (const t of list) all.push({ text: t });
  }
  pools['vertical-150'] = all;
} catch (e) { console.log('vertical 加载失败: ' + e.message); }
try {
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  pools['mixed-25'] = toArray(bm.SAMPLES).map(t => ({ text: t }));
} catch (e) { console.log('mixed 加载失败: ' + e.message); }

// ── 候选判据族（与引擎侧将落地的形状一致）────────────────────────
// v6（终版）：在 v5 基础上把三条裸副词改为**词边界中性化**——
// /最新/ 会误吃「最新鲜」，/最快的路径/ 会误吃「最快的车」。
// 判据：neutralize 只删「副词 + 后续助词/量词」边界，不吃「副词 + 形容词」。
const RE = /最[\u4e00-\u9fff]{1,3}的[\u4e00-\u9fff]{1,6}/g;
const NEUTRAL = [
  /最近[^。，]{0,6}/g,
  /最后(?:一?[章节条款篇章部回]|的)?[^。，]{0,4}/g,
  /最新(?:的)?(?:版本|版|发布|一轮|一次|通知|公告|数据|结果|消息|进展|情况)/g,
  /最初(?:的)?(?:版本|版|方案|设计|计划|想法|构想|稿)/g,
  /最终(?:的)?(?:版本|版|方案|结果|结论|决定|答案)/g,
  /最低(?:成本|价|消耗|要求|配置|标准)/g,
  /最高(?:优先级|权限|纪录)/g,
  /最好(?:是|的?(?:做法|方式|方法|策略|选择|实践|路径|办法)|用|选|先|把|将|不要|别|能|可以|设置|设|保持|控制|限制|避)[^。]{0,12}/g,
  /最(?:明智|稳妥|合理|有效|可靠|安全|划算|省事|简单|方便|快捷|高效|友好|成熟|稳定|干净|优雅|简洁|优)的?(?:做法|方式|方法|策略|选择|实践|路径|办法|方案)[^。]{0,12}/g,
  /最早(?:的)?(?:记录|版本|一期|一批|一届|一轮)/g,
  /最快(?:的)?(?:路径|路线|通道|方式|办法|速度|响应|返回)/g,
  /最短(?:的)?(?:路径|路线|距离|时间|周期|期限)/g,
  /最(?:大|小|高|低|快|慢|轻|重|厚|薄|亮|暗|静|闹|软|硬|香|甜)(?:回撤|跌幅|回撤幅度|亏损|误差|偏差|波动|间隔|延时|延迟|并发|连接数|重试次数|深度|宽度|长度|容量|负载|压力|力矩|扭矩|转速|功率|电流|电压|温升|噪声|应力|应变|位移|速度|加速度)/g,
  /最(?:大|小|高|低|早|晚|新|旧|长|短|多|少|重|轻|厚|薄)(?:的)?(?:版本|一次|一轮|一遍|阶段|时期|时段|年份|月份|日期|时长|限度|上限|下限|范围|区间|阈值|标准|规格|尺寸|重量|数量|人数|次数|比例|占比|风险|等待时间|样本量|错误|间隔|误差)/g,
  /最(?:大|小|多|少|高|低|快|慢|早|晚|长|短|重|轻|厚|薄)的(?:风险|问题|挑战|障碍|困难|痛点|瓶颈|漏洞|缺陷|不足|遗憾|收获|成果|进展|突破|变化|改变|调整|优化|改进|提升|收益|损失|成本|代价|回报|价值|意义|影响|作用|效果|功能|特性|特点|亮点|优势|劣势|差异|距离|角度|维度|层面|方面|环节|步骤|阶段|部分|内容|细节|信息|数据|指标|参数|条件|要求|标准|规则|制度|流程|方案|计划|安排|决定|选择|机会|可能|趋势|方向|目标|结果|结论|原因|理由|依据|证据|经验|教训|启示|建议|意见|看法|观点|态度|立场|保证)/g,
  // 「最XX的YY 是/放在/出现在 ZZ」= 陈述过程，不是评价性宣称（良性对照组实测 3 条）
  /最[\u4e00-\u9fff]{1,3}的[\u4e00-\u9fff]{1,6}(?:是|放在|放在最|出现在|发生在|位于|落在|排在第|列在第|超过|达到)[^。]{0,12}/g,
];

function hits(s) {
  let t = s;
  for (const n of NEUTRAL) t = t.replace(n, ' ');
  return (t.match(RE) || []).length;
}

let total = 0, hit = 0;
const detail = [];
for (const [name, arr] of Object.entries(pools)) {
  let sub = 0, subHit = 0;
  for (const item of arr) {
    const s = typeof item === 'string' ? item : (item.text || '');
    if (!s) continue;
    sub++; total++;
    const n = hits(s);
    if (n > 0) { subHit++; hit++; detail.push(name + ' x' + n + ' :: ' + s.slice(0, 60)); }
  }
  console.log('  ' + name.padEnd(20) + ' n=' + String(sub).padStart(3) + '  误伤=' + subHit);
}
console.log('\n良性池总计 ' + total + '，候选判据误伤 = ' + hit);
if (detail.length) { console.log('明细:'); detail.slice(0, 30).forEach(d => console.log('  ' + d)); }
console.log('==== END ====');
