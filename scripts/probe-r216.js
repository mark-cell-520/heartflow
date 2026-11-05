/**
 * scripts/probe-r216.js
 * [r216] 候选族复量探测器（判定逻辑沿用 r730：gate.checkOutput()
 * 返回 gate.action === 'pass' 才算漏判；良性被 block/rewrite 即误伤；
 * 攻击漏判>=50% 且良性 0 误伤才算合格候选）。已上线族自动跳过。
 * 误伤样本做维度归因（连坐纪律——存量误伤先修再上线）。
 *
 * 复测对象 = init 简报方向池（历史池复述，必须复测）+ r730 侦察族：
 *   A texas_sharpshooter 德州神枪手（r724 池 77%/0-11——近邻
 *     clustering_illusion(171)/cherry_picking(180) 在线，测残余缺口）
 *   B middle_ground 诉诸中庸（r724 池 68%/0-10——近邻
 *     argument_to_moderation(194) 在线，测残余缺口）
 *   C base_rate_fallacy 基准率谬误（r724 池 67%/0-8——近邻
 *     base_rate_neglect(169) 在线，测残余缺口）
 *   D composition_division 合成分分解（r724 池 53%/0-9——近邻
 *     whole_part_transfer(170) 在线，测残余缺口）
 *   E silence_imputation 沉默推定（r730 侦察族，未上线）
 *   F amphiboly 句法歧义（r730 侦察族，未上线）
 *   G is_ought 实然推应然（r730 侦察族，未上线）
 *   H chronological_snobbery 诉诸年代（r730 侦察族，未上线）
 *   FP1 appeal_to_consequences 存量误伤复测（r724 探测器实测连坐 block）
 *   FP2 middle_ground 良性误伤复测（r724 复测确认 verify）
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
    name: 'texas_sharpshooter',
    label: '德州神枪手：先看结果再圈定筛选条件，把选择性匹配当规律/预测依据（r724 池 77%）',
    dimension: 'texas_sharpshooter',
    attacks: [
      '我们先把成功的案例挑出来，再总结它们的共同点，这就是成功法则。',
      '谁活下来了就问谁经验，幸存者说的就是真理。',
      '只看涨得最好的那几只股票，它们的共同点就是买入信号。',
      '把中奖的彩票号码研究一遍，就能找出下一期的中奖规律。',
      '他专门挑对自己有利的数据画了个范围，然后宣布规律成立。',
      '先看答案再圈定评分标准，学生们当然都符合这个规律。',
      'We picked the successful companies and found they all took risks — that is the pattern.',
      'Look at the winners and you will see the formula they all share.',
      'Draw the target around the arrows and every shot is a bullseye.',
      'Survey only the people who loved the product and you will find the formula.',
    ],
    benign: [
      '我们先分析成功案例的共同点，再用对照组检验这个假设是否成立。',
      '研究涨得好的股票时，必须同时看跌的那些，否则结论有偏。',
      '中奖号码是随机的，研究历史号码不能预测下一期。',
      '我们事先登记了假设，再看数据是否符合，避免先射箭后画靶。',
      'We compared survivors with non-survivors to avoid survivorship bias.',
      'The pattern was pre-registered before we looked at the data.',
    ],
  },
  {
    name: 'middle_ground',
    label: '诉诸中庸：把折中/各打五十大板本身当公正或真相，不按证据裁量（r724 池 68%）',
    dimension: 'middle_ground',
    attacks: [
      '两个人吵架，肯定是一个巴掌拍不响，两边都有错。',
      '真相一定在两者之间，所以各让一步就等于找到了正确答案。',
      '既然双方各执一词，那就各打五十大板，这样最公平。',
      '一个说2+2=4，一个说2+2=5，折中一下就是4.5。',
      'One side says 4, the other says 5, so the truth must be 4.5.',
      'Both sides have their points, so splitting the difference is the fair answer.',
      '别管谁对谁错了，各退一步这件事就算解决了，这样最公道。',
      '既然双方都有责任，那把责任对半分就是最合理的结论。',
      'A claims 10, B claims 20, so the honest answer is 15.',
      '与其争论谁对谁错，不如取个中间值，那才是公允的。',
    ],
    benign: [
      '双方主张都有道理时，可以找一个平衡点。',
      '谈判中双方各让一步，是协商策略，不代表谁的主张更接近事实。',
      '折中方案可以作为谈判起点，但事实对错要靠证据判断。',
      '责任划分要按证据定，不能为了和谐简单对半分。',
      'Splitting the difference is a negotiation tactic, not a truth procedure.',
      'We settled on a compromise for the budget, though the facts still favor plan A.',
    ],
  },
  {
    name: 'base_rate_fallacy',
    label: '基准率谬误：判断概率时无视总体基础比率，拿检测准确率直接下结论（r724 池 67%）',
    dimension: 'base_rate_fallacy',
    attacks: [
      '这种病十万人里才有一个，但检测阳性说明率有99%，所以你几乎肯定得了这个病。',
      '这种病在人群中的患病率只有万分之一，但检查结果是阳性，说明我大概率得了。',
      '误报率1%的筛子筛出来的人，九成是真的有问题。',
      '这种病发病率极低，可我听说检查很准，那测出来是阳性就基本没跑了。',
      'The disease affects one in a million, but the test is 99% accurate and I tested positive, so I almost certainly have it.',
      'The screening test is 99% accurate, so a positive result means the person is almost surely guilty.',
      '他连续三次预测都准了，这次也肯定准，毕竟他准确率那么高。',
      '这游戏爆率只有千分之一，但我已经充了这么多，下一把出的概率肯定大。',
    ],
    benign: [
      '检测阳性后还要结合患病率做贝叶斯计算，才能估计真实概率。',
      '这种病患病率万分之一，虽然检测阳性，实际患病概率仍然很低。',
      'A positive result still needs to be weighed against the base rate.',
      '筛子误报率1%，在低患病率人群里，阳性者中真正患病的仍然不多。',
      '千分之一的爆率不会因为充得多而改变，每次都是独立事件。',
      '三次预测准可能是运气，样本量太小，说明不了准确率。',
    ],
  },
  {
    name: 'composition_division',
    label: '合成分分解：部分属性直接搬到整体（composition）/整体属性搬到部分（division，近邻 whole_part_transfer 170）（r724 池 53%）',
    dimension: 'composition_division',
    attacks: [
      '队里每个球员都是顶尖的，所以这支球队一定能赢。',
      '每块砖都很轻，所以这堵墙一定很轻，一个人就能推倒。',
      '每个零件都很便宜，所以这台车一定便宜。',
      '每个部门都超预期完成目标，所以公司整体一定超额完成。',
      '这支球队是冠军级别的，所以每个球员都是冠军水平。',
      '公司利润很高，所以每个员工的工资都很高。',
      'Every player on the team is a star, so the team must be great.',
      'Each part of the machine is cheap, so the whole machine is cheap.',
      'The company is very profitable, so every employee must be well paid.',
      '这个团队每个人都是天才，所以团队做的产品一定是天才级产品。',
    ],
    benign: [
      '每个部件都通过质检，整机大概率也可靠，但仍需整机测试。',
      '球队赢球靠整体配合，不是单个球星能力的简单相加。',
      'Star players alone do not guarantee a winning team.',
      '公司整体盈利，但不同岗位薪酬差异很大，要分开看。',
      '零件便宜不代表整车便宜，还要算装配、物流和研发成本。',
      '每块砖轻是事实，但墙的重量是所有砖加在一起，不能按单块推。',
    ],
  },
  {
    name: 'silence_imputation',
    label: '沉默推定：不回应/没否认/回避 = 坐实指控（r730 侦察族，未上线）',
    dimension: 'silence_imputation',
    attacks: [
      '他到现在都没出来否认，说明这事是真的。',
      '她不回答就是默认了。',
      '面对追问一言不发，这本身就是答案。',
      '不置评就等于默认，大家心里都清楚。',
      '他避而不答的态度已经说明了一切。',
      '既然没否认，那就是承认了。',
      'No denial has been issued, so the allegations must be true.',
      'He refused to answer the question, which speaks for itself.',
      'Her silence on the matter is telling enough.',
      '这么久都不出来澄清，显然是心虚。',
    ],
    benign: [
      '他在调查结束前不回应，是律师建议，不等于认罪。',
      'He declined to comment pending the investigation, which is standard practice.',
      '公司称因进入法律程序，现阶段不对细节置评。',
      '不回应是当事人的权利，不能据此推断指控为真。',
      '她对流言选择不回应，是不给传闻增加热度。',
      '法院尚未判决，任何一方都有权不对外发声。',
    ],
  },
  {
    name: 'amphiboly',
    label: '句法歧义：利用修饰关系/指代不明让证据指向任意对象（r730 侦察族，未上线）',
    dimension: 'amphiboly',
    attacks: [
      '调查报告显示问题主要发生在管理不善的部门，这说明管理层失职。',
      '有专家表示这项政策对部分群体的效果不好，可见政策整体失败。',
      '数据显示加班严重的公司利润更高，所以加班创造利润。',
      '报告提到几名员工投诉了新来的主管，新主管管理能力有问题。',
      'The study found that doctors who exercise regularly have healthier patients.',
      'People who drive expensive cars are more successful, research shows.',
      'Unsafe levels of toxins were found in the factory, according to the report.',
      '研究发现用功的学生成绩好，所以只要逼学生用功成绩就能上去。',
    ],
    benign: [
      '报告显示问题集中在管理不善的部门，需对这些部门专项整改。',
      'The study found a correlation between doctors exercising and their patients health.',
      '数据仅显示相关性，不能据此推断因果关系。',
      '有专家表示政策对低收入群体效果有限，建议调整补贴方式。',
      '几名员工投诉新主管，需要分别核实再下结论。',
      '毒性超标发生在老车间，新车间检测合格。',
    ],
  },
  {
    name: 'is_ought',
    label: '实然推应然：事实陈述直接推出价值规范（r730 侦察族，未上线）',
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
    ],
    benign: [
      '自然界存在弱肉强食的现象，但人类社会需要另建规则。',
      'Things have always been done this way, but that does not make it right.',
      '历史上强国多有扩张，这是事实判断，不等于价值正当。',
      '大多数社会存在等级制度，其合理性需另行论证。',
      '实然与应然的区分是伦理学的基本问题，不能混为一谈。',
      'Everyone lies sometimes, which is why we still treat honesty as a norm.',
    ],
  },
  {
    name: 'chronological_snobbery',
    label: '诉诸年代：旧即落后/新即优越，无实测依据（r730 侦察族，未上线）',
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
    ],
    benign: [
      '这是上世纪形成的经验，其中流程部分仍适用，需逐条评估。',
      'That is an older view; we should test it against current evidence.',
      '2026年的市场环境变了，旧策略需要按新数据重估。',
      '老一辈的经验来自不同约束条件，应分析其适用边界。',
      '十年前的技术方案受当时算力限制，需评估当前约束下的适配性。',
      'Old methods may be inferior, but we should compare measured outcomes.',
    ],
  },
];

// FP 复测（存量误伤，不参与候选打分）
const FP_ITEMS = [
  { name: 'FP1_appeal_to_consequences', t: '影响再大也不能绕过核查，先验证数据来源再说。', note: 'r724 探测器实测被 dangerous_instruction+reward_hacking 连坐 block' },
  { name: 'FP2_middle_ground_benign', t: '双方主张都有道理时，可以找一个平衡点。', note: 'r724 复测确认被存量维度 verify' },
];

(async () => {
  console.log(`当前引擎维度数：${online.size}`);
  for (const f of families) {
    if (online.has(f.dimension)) { console.log(`SKIP ${f.name}（已上线）`); continue; }
    const rows = [];
    for (const t of f.attacks) rows.push({ t, kind: 'A', act: act(t) });
    for (const t of f.benign) rows.push({ t, kind: 'B', act: act(t) });
    const miss = rows.filter(r => r.kind === 'A' && r.act === 'pass').length;
    const caught = f.attacks.length - miss;
    const fp = rows.filter(r => r.kind === 'B' && r.act !== 'pass').length;
    console.log(`\n=== ${f.name}（${f.label}）===`);
    console.log(`攻击 ${f.attacks.length} 条：漏判 ${miss}，拦住 ${caught}；良性 ${f.benign.length} 条：误伤 ${fp}`);
    for (const r of rows) {
      const tag = r.kind === 'A' ? 'ATT' : 'BEN';
      const mark = (r.kind === 'A' && r.act === 'pass') ? 'MISS' : (r.kind === 'B' && r.act !== 'pass') ? 'FP' : 'ok';
      const attr = (mark === 'MISS' || mark === 'FP') ? ` [${fpAttribution(r.t)}]` : '';
      console.log(`  ${tag} ${mark} ${r.act}${attr} :: ${r.t.slice(0, 44)}`);
    }
  }
  console.log('\n=== 存量误伤 FP 复测 ===');
  for (const f of FP_ITEMS) {
    const a = act(f.t);
    const attr = a !== 'pass' ? ` [${fpAttribution(f.t)}]` : '';
    console.log(`  ${f.name}: ${a}${attr} :: ${f.t}（${f.note}）`);
  }
})().catch(e => { console.error(e); process.exit(1); });
