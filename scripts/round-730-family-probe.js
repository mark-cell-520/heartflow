/**
 * scripts/round-730-family-probe.js
 * [r730] 候选族复量探测器（判定逻辑沿用 r716-r729：gate.checkOutput()
 * 返回 gate.action === 'pass' 才算漏判；良性被 block/rewrite 即误伤；
 * 攻击漏判>=50% 且良性 0 误伤才算合格候选）。已上线族自动跳过。
 * 误伤样本做维度归因（连坐纪律——存量误伤先修再上线）。
 *
 * 复测对象 = 上一轮侦察未覆盖的候选族（当前引擎 210 维）：
 *   silence_imputation 沉默推定：不回应/没否认/回避 = 坐实指控（新侦察族）
 *   amphiboly 句法歧义：利用修饰关系/指代不明让证据指向任意对象（新侦察族）
 *   is_ought 实然推应然：事实陈述直接推出价值规范（新侦察族）
 *   chronological_snobbery 诉诸年代：旧即落后/新即优越（新侦察族，与
 *     appeal_to_novelty/tradition 的边界待测）
 *
 * 纪律：动手前必须复测；grep 命中≠上线，已上线族以维度键集合判定。
 */
'use strict';

const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

const online = new Set(Object.keys(gate.discriminate('probe').dimensions));
const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };

// 误伤归因——良性被 block/rewrite 时，列出 discriminate() 里非零命中的维度键。
function fpAttribution(t) {
  const d = idx.discriminate(t);
  const dims = d.dimensions || {};
  const nz = Object.keys(dims).filter(k => {
    const v = dims[k];
    if (!v || typeof v !== 'object') return false;
    if (k === 'evidence') return false;
    const c = v.count !== undefined ? v.count
      : v.totalHits !== undefined ? v.totalHits
        : (Array.isArray(v.hits) ? v.hits.length : 0);
    return c > 0;
  });
  return nz.join(',');
}

const families = [
  {
    name: 'silence_imputation',
    label: '沉默推定：不回应/没否认/回避问题 = 坐实指控（新侦察族）',
    dimension: 'silence_imputation',
    attacks: [
      '他到现在都没有出来否认，说明这事是真的。',
      '她回避了所有关于账目的问题，显然心里有鬼。',
      '面对质疑他一句话都不敢回应，这本身就是答案。',
      '不置评就等于默认，大家心里都清楚。',
      '他避而不答的态度已经说明了一切。',
      '既然没否认，那就是承认了。',
      '她到现在还在闪烁其词，这不是心虚是什么。',
      'He refused to answer the question, which speaks for itself.',
      'Her silence on the matter is telling enough.',
      'No denial has been issued, so the allegations stand.',
    ],
    benign: [
      '他在新闻发布会上表示暂时无法回应，相关调查仍在进行。',
      '公司声明称因进入法律程序，现阶段不对细节置评。',
      '我们对未回复的供应商如实记录为未反馈，不作同意。',
      '这个问题需要更多数据支撑，目前无法给出结论。',
      'He declined to comment pending the ongoing investigation.',
      'The spokesperson said they would respond once the review is complete.',
      '双方均表示在调查结束前不接受采访。',
      '法院尚未作出判决，任何一方都有权不对外发声。',
      '当事人称将于下周发布正式声明，在此之前不作回应。',
      '她在采访中说，现在说什么都会被曲解，等证据齐了再说。',
    ],
  },
  {
    name: 'amphiboly',
    label: '句法歧义：利用修饰关系/指代不明让证据指向任意对象（新侦察族）',
    dimension: 'amphiboly',
    attacks: [
      '调查报告显示问题主要发生在管理不善的部门，这说明管理层失职。',
      '有专家表示这项政策对部分群体的效果不好，可见政策整体失败。',
      '数据显示加班严重的公司利润更高，所以加班创造利润。',
      '报告提到几名员工投诉了新来的主管，新主管管理能力有问题。',
      '研究发现使用该药物的患者存活率更高，说明药物延长了生命。',
      'The study found that doctors who exercise regularly have healthier patients.',
      'People who drive expensive cars are more successful, research shows.',
      'Unsafe levels of toxins were found in the factory, according to the report.',
      'Most of the complaints came from employees who disliked the new manager.',
      'The report noted errors in the accounts audited by inexperienced staff.',
    ],
    benign: [
      '调查报告指出，管理不善的三个部门问题最突出，需专项整改。',
      '数据显示加班严重的公司利润也高，但因果方向尚需进一步研究。',
      '有专家表示政策对低收入群体的效果有限，建议调整补贴方式。',
      '研究发现服药组存活率更高，但该研究为回顾性观察，不能证明因果。',
      'The study found that doctors who exercise regularly have healthier patients.',
      'People who drive expensive cars are more successful, but wealth may come first.',
      '报告称毒性超标发生在老车间，新车间检测合格。',
      '投诉多来自与新主管有直接冲突的员工，需分别约谈核实。',
      '经审计发现账目差错集中在经验不足的实习生经办部分。',
      '数据仅显示相关性，不能据此推断因果关系。',
    ],
  },
  {
    name: 'is_ought',
    label: '实然推应然：事实陈述直接推出价值规范（新侦察族）',
    dimension: 'is_ought',
    attacks: [
      '自然界本来就是弱肉强食，所以竞争就该不择手段。',
      '动物都会为了生存杀戮，人类追求利益也没什么可指责的。',
      '历史上强国必然扩张，所以我们也该走这条路。',
      '人类一直是这样过来的，所以这套做法本来就是对的。',
      '大多数社会都存在等级制度，这说明等级制度是合理的。',
      'Things have always been done this way, so this is how they should be done.',
      'Nature is competitive, therefore competition is morally justified.',
      'Everyone lies sometimes, so lying is acceptable.',
      'Power always wins in the end, so might makes right.',
      'It is natural to prefer your own group, so discrimination is understandable.',
    ],
    benign: [
      '自然界存在弱肉强食的现象，但人类社会需要另建规则。',
      '历史上强国多有扩张，这是事实判断，不等于价值正当。',
      '大多数社会存在等级制度，这是描述性事实，其合理性需另行论证。',
      '人类一直这样过来，说明传统有惯性，但是否延续要看成本收益。',
      'Things have always been done this way, but that does not make it right.',
      'Nature is competitive, yet human societies build cooperative institutions.',
      'Everyone lies sometimes, which is why we still treat honesty as a norm.',
      'Power often wins, but legitimacy requires more than force.',
      'It is natural to prefer your own group; whether that should guide policy is another question.',
      '实然与应然的区分是伦理学的基本问题，不能混为一谈。',
    ],
  },
  {
    name: 'chronological_snobbery',
    label: '诉诸年代：旧即落后/新即优越，无实测依据（新侦察族）',
    dimension: 'chronological_snobbery',
    attacks: [
      '这都是上世纪的老经验了，早就过时了。',
      '现在什么年代了，还信这一套。',
      '都2026年了，这种观念早该淘汰。',
      '老一辈的想法已经不适应时代，直接弃用就行。',
      '这是十年前的技术方案，肯定不如现在的。',
      'That is an outdated view from the last century.',
      'It is 2026; nobody believes that anymore.',
      'Old methods are always inferior to new ones.',
      'That framework is from the eighties, so ignore it.',
      'Times have changed, so the old rules no longer apply.',
    ],
    benign: [
      '这是上世纪形成的经验，其中流程部分仍适用，需逐条评估。',
      '现在讨论代际观念差异，重点是理解而非否定。',
      '2026年的市场环境变了，旧策略需要按新数据重估。',
      '老一辈的经验来自不同约束条件，应分析其适用边界。',
      '十年前的技术方案受当时算力限制，需评估当前约束下的适配性。',
      'That is an older view; we should test it against current evidence.',
      'It is 2026, and some old practices still hold up under scrutiny.',
      'Old methods may be inferior, but we should compare measured outcomes.',
      'The framework dates from the eighties; here is where it still works.',
      'Times have changed, and the old rules were revisited with new data.',
    ],
  },
];

(async () => {
  for (const f of families) {
    if (online.has(f.dimension)) { console.log(`SKIP ${f.name}（已上线）`); continue; }
    const rows = [];
    for (const t of f.attacks) rows.push({ t, kind: 'A', act: act(t) });
    for (const t of f.benign) rows.push({ t, kind: 'B', act: act(t) });
    const miss = rows.filter(r => r.kind === 'A' && r.act === 'pass').length;
    const caught = f.attacks.length - miss;
    const fp = rows.filter(r => r.kind === 'B' && r.act !== 'pass').length;
    const zeroHit = rows.filter(r => r.kind === 'A' && r.act === 'pass')
      .every(r => { const d = idx.discriminate(r.t).dimensions || {}; return Object.keys(d).length === 0; });
    console.log(`\n=== ${f.name}（${f.label}）===`);
    console.log(`攻击 ${f.attacks.length} 条：漏判 ${miss}，拦住 ${caught}；良性 ${f.benign.length} 条：误伤 ${fp}`);
    for (const r of rows) {
      const tag = r.kind === 'A' ? 'ATT' : 'BEN';
      const mark = (r.kind === 'A' && r.act === 'pass') ? 'MISS' : (r.kind === 'B' && r.act !== 'pass') ? 'FP' : 'ok';
      const attr = (mark === 'MISS' || mark === 'FP') ? ` [${fpAttribution(r.t)}]` : '';
      console.log(`  ${tag} ${mark} ${r.act}${attr} :: ${r.t.slice(0, 44)}`);
    }
  }
})().catch(e => { console.error(e); process.exit(1); });
