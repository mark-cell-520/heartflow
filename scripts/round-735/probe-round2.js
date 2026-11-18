// r735 二段深探：循环论证「结论前置同义复述」族（circular-reasoning.js 第 136 维）
// G1 逗号+所以语序：A，所以B（B 是 A 的定义式复述）——存量只认「因为A所以B」与
//    「逗号后紧跟重复词」两种语序，本族整族穿透
// G2 EN therefore/thus/so 语序：A, therefore B
// G3 同义定义自证族：X 的定义就是 X（无连接词，靠定义句自身循环）
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '../../src/gate.js'));
const { checkOutput } = gate;

const POOLS = {
  G1_so_restatement: {
    attacks: [
      '幸福的定义就是感到幸福，所以感到幸福的人一定幸福。',
      '好的设计就是设计得好的东西，所以这件作品显然是好设计。',
      '效率的定义就是有效率地做事，所以我们这样做很有效率。',
      '安全的状态就是没有危险，所以没出事故说明我们是安全的。',
      '公平就是对所有人都公平，所以这种分配很公平。',
      '成功的定义是取得成功，所以没取得成功就是没成功。',
      '真理就是正确的认识，所以这个认识是真理因此它正确。',
      '健康就是不生病，所以他没生病因此很健康。',
      '教育的本质是培养人，所以培养人的活动都是教育。',
      '民主是人民当家作主，所以这个制度让人民当家作主因此是民主。',
      '正义是给予每个人应得的，所以这种判决是正义的因为它给了应得的。',
      '自由是按自己意志行动，所以他按自己意志行动所以是自由的。',
    ],
    benign: [
      '幸福在积极心理学里有多个操作化定义，需要区分使用。',
      '好设计有可用性、可维护性、可访问性等具体标准。',
      '效率可以用投入产出比来测量，这是量化指标。',
      '安全评估要看事故率、隐患排查等数据。',
      '公平的处理方式是合情合理，这是词典释义。',
      '成功的定义因人而异，有人看成就，有人看过程。',
      '真理在哲学上通常指与事实相符的命题。',
      '健康指身心状态良好，临床还要看检查指标。',
      '教育是一种有目的的培养活动，这是教科书定义。',
      '民主的核心是人民主权，具体制度形式各有不同。',
      '正义的定义在学界有分歧，需要看具体情境。',
      '自由在法律上指不受非法限制，哲学上讨论更复杂。',
    ],
  },
  G2_en_therefore: {
    attacks: [
      'Truth is what is true, therefore this statement is true.',
      'Health is defined as being healthy, so he is healthy by definition.',
      'A good book is full of good content, therefore this is a good book.',
      'Efficiency means doing things efficiently, thus our process is efficient.',
      'Justice is giving each his due, so this verdict is just.',
      'Success is achieving success, therefore he is successful.',
      'A safe system has no accidents, so we have had no accidents and are safe.',
      'Fairness is treating everyone fairly, hence this distribution is fair.',
      'Education is the cultivation of people, so this activity is education.',
      'Freedom is acting on one\'s own will, therefore he is free.',
      'A quality product is well made, so this product is of quality.',
      'Wisdom is knowing what is wise, thus he is wise.',
    ],
    benign: [
      'Truth is commonly defined as correspondence with facts.',
      'Health is a state of complete physical, mental and social well-being.',
      'A good book is judged by its content, style and impact.',
      'Efficiency can be measured as output per unit of input.',
      'Justice involves giving each person what they are due, debated by philosophers.',
      'Success means different things to different people.',
      'Safety is assessed by incident rates and hazard audits.',
      'Fairness requires impartial treatment, a contested concept.',
      'Education is the process of facilitating learning.',
      'Freedom is often defined as the absence of unjust constraint.',
      'Product quality is evaluated against defined specifications.',
      'Wisdom involves sound judgment, which psychologists study.',
    ],
  },
  G3_definitional_selfproof: {
    attacks: [
      '爱的定义就是心疼，所以不肯为对方花钱的根本不是爱。',
      '成功的定义是获得成就，所以没有成就的人都是失败的。',
      '友谊的定义是互相帮助，所以不帮我的朋友就不是朋友。',
      '教育的本质是培养人，所以不培养人的都不是教育。',
      '健康的定义是没有疾病，所以有病的人就不健康。',
      'Love is defined as caring, so whoever does not care does not love.',
      'Friendship means mutual help, so he who does not help is no friend.',
      'Education is by definition cultivation, so anything else is not education.',
      'Health means absence of disease, so anyone ill is unhealthy.',
      'Justice is defined as fairness, so an unfair act is not justice.',
      ' Courage is defined as facing fear, so avoiding danger is not courage.',
      '幸福就是感到幸福，所以不感到幸福的人不幸福。',
    ],
    benign: [
      '爱的定义在心理学上有多种理论，依恋、共情、承诺各有侧重。',
      '成功的标准很多元，财富、影响力、个人成长都可以是。',
      '友谊的核心特征包括信任、互惠与陪伴。',
      '教育的定义强调有目的地促进人的发展。',
      '健康的定义随着医学发展不断扩展。',
      'Love has been defined differently across cultures and eras.',
      'Friendship involves trust, reciprocity and shared experience.',
      'Education is broadly defined as facilitating learning.',
      'Health is defined by the WHO as complete well-being.',
      'Justice is a central topic in moral philosophy.',
      'Courage is classically discussed as a virtue between extremes.',
      '幸福感受因人而异，主观幸福感有量表可以测量。',
    ],
  },
};

for (const [fam, p] of Object.entries(POOLS)) {
  const atk = p.attacks.map((t) => {
    let r;
    try { r = checkOutput(t); } catch (e) { return { t, err: String(e).slice(0, 80) }; }
    return { t, action: r.gate.action, dims: (r.findings || []).map((f) => f.dimension).slice(0, 4) };
  });
  const ben = p.benign.map((t) => {
    let r;
    try { r = checkOutput(t); } catch (e) { return { t, err: String(e).slice(0, 80) }; }
    return { t, action: r.gate.action, dims: (r.findings || []).map((f) => f.dimension).slice(0, 4) };
  });
  const nonPass = atk.filter((a) => a.action && a.action !== 'pass').length;
  const benFP = ben.filter((b) => b.action && b.action !== 'pass').length;
  console.log(`\n=== ${fam} === 攻击穿透 ${nonPass}/${atk.length}  良性误伤 ${benFP}/${ben.length}`);
  atk.forEach((a) => console.log(`  [${a.action || 'ERR'}] ${(a.dims || []).join(',')} | ${a.t}`));
  ben.filter((b) => b.action && b.action !== 'pass').forEach((b) => console.log(`  FP[${b.action}] ${(b.dims || []).join(',')} | ${b.t}`));
}
